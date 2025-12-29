import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, RefreshCw, AlertCircle, CheckCircle, Clock, Zap, Settings, Calendar, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'

interface Keyword {
  id: string
  keyword: string
  search_intent?: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'generating' | 'published' | 'failed'
  error_message?: string
}

interface AutomationStats {
  total_keywords: number
  pending_count: number
  published_count: number
  failed_count: number
  success_rate: number
}

interface GenerationResult {
  status: string
  message: string
  keywordId?: string
  keyword?: string
  tipId?: string
  slug?: string
  error?: string
}

export default function ContentAutomation() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [stats, setStats] = useState<AutomationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<Map<string, GenerationResult>>(new Map())
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [schedulerSettings, setSchedulerSettings] = useState({
    enabled: false,
    interval: 24, // hours
    postsPerDay: 1
  })
  const [showSchedulerModal, setShowSchedulerModal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsAuthenticated(true)
      fetchData()
    } else {
      setLoading(false)
    }
  }, [])

  // 자동 새로고침 (5초마다) - 키워드가 있을 때만
  useEffect(() => {
    if (!isAuthenticated || keywords.length === 0) return

    const interval = setInterval(() => {
      fetchData()
    }, 5000) // 5초마다 상태 확인

    return () => clearInterval(interval)
  }, [isAuthenticated, keywords.length])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('adminToken', data.token)
        setIsAuthenticated(true)
        fetchData()
      } else {
        toast({
          title: "로그인 실패",
          description: "잘못된 비밀번호입니다.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "오류 발생",
        description: "로그인 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken')

      const [keywordsRes, statsRes, schedulerRes] = await Promise.all([
        fetch('/api/admin/keywords?status=pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/content-automation/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/content-automation/scheduler-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (keywordsRes.status === 401 || statsRes.status === 401) {
        localStorage.removeItem('adminToken')
        setIsAuthenticated(false)
        return
      }

      const [keywordsData, statsData, schedulerData] = await Promise.all([
        keywordsRes.json(),
        statsRes.json(),
        schedulerRes.json()
      ])

      setKeywords(keywordsData)
      setStats(statsData)
      if (schedulerData) {
        setSchedulerSettings(schedulerData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveScheduler = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/content-automation/scheduler-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(schedulerSettings)
      })

      if (response.ok) {
        toast({
          title: "성공",
          description: "스케줄러 설정이 저장되었습니다.",
        })
        setShowSchedulerModal(false)
        fetchData()
      } else {
        toast({
          title: "저장 실패",
          description: "스케줄러 설정 저장에 실패했습니다.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Save scheduler error:', error)
      toast({
        title: "오류 발생",
        description: "스케줄러 설정 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleGenerate = async (keywordId: string, keyword: string) => {
    const newGenerating = new Set(generating)
    newGenerating.add(keywordId)
    setGenerating(newGenerating)

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/content-automation/generate/${keywordId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      const newResults = new Map(results)
      newResults.set(keywordId, result)
      setResults(newResults)

      if (response.ok) {
        toast({
          title: "생성 시작",
          description: `"${keyword}" 콘텐츠 생성이 시작되었습니다.`,
        })
        // Refresh after a delay to show updated status
        setTimeout(() => {
          fetchData()
        }, 2000)
      } else {
        toast({
          title: "생성 실패",
          description: result.error || '알 수 없는 오류',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: "오류 발생",
        description: "콘텐츠 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      const newGenerating = new Set(generating)
      newGenerating.delete(keywordId)
      setGenerating(newGenerating)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKeywords(new Set(keywords.map(k => k.id)))
    } else {
      setSelectedKeywords(new Set())
    }
  }

  const handleSelectKeyword = (keywordId: string, checked: boolean) => {
    const newSelected = new Set(selectedKeywords)
    if (checked) {
      newSelected.add(keywordId)
    } else {
      newSelected.delete(keywordId)
    }
    setSelectedKeywords(newSelected)
  }

  const handleDeleteSelected = async () => {
    if (selectedKeywords.size === 0) {
      toast({
        title: "선택 없음",
        description: "삭제할 키워드를 선택해주세요.",
        variant: "destructive"
      })
      return
    }

    if (!confirm(`선택한 ${selectedKeywords.size}개의 키워드를 삭제하시겠습니까?`)) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/keywords/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keywordIds: Array.from(selectedKeywords)
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "삭제 완료",
          description: `${selectedKeywords.size}개의 키워드가 삭제되었습니다.`,
        })
        setSelectedKeywords(new Set())
        fetchData()
      } else {
        toast({
          title: "삭제 실패",
          description: result.error || '알 수 없는 오류',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "오류 발생",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleBatchGenerate = async () => {
    const targetKeywords = selectedKeywords.size > 0
      ? Array.from(selectedKeywords)
      : keywords.map(k => k.id)

    if (targetKeywords.length === 0) {
      toast({
        title: "키워드 없음",
        description: "생성할 키워드가 없습니다.",
        variant: "destructive"
      })
      return
    }

    const message = selectedKeywords.size > 0
      ? `선택한 ${targetKeywords.length}개의 키워드로 콘텐츠를 생성하시겠습니까?`
      : `${targetKeywords.length}개의 키워드로 콘텐츠를 생성하시겠습니까?`

    if (!confirm(message)) return

    const keywordIds = targetKeywords

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/content-automation/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keywordIds,
          maxConcurrent: 1 // Vercel Free plan limitation
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "일괄 생성 시작",
          description: `일괄 생성이 시작되었습니다. (${result.scheduled_count}개 예약됨)`,
        })
        fetchData()
      } else {
        toast({
          title: "일괄 생성 실패",
          description: result.error || '알 수 없는 오류',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Batch generation error:', error)
      toast({
        title: "오류 발생",
        description: "일괄 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleRetry = async (keywordId: string, keyword: string) => {
    if (!confirm(`"${keyword}" 키워드를 재시도하시겠습니까?`)) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/content-automation/retry/${keywordId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "재시도 시작",
          description: "재시도가 시작되었습니다.",
        })
        fetchData()
      } else {
        toast({
          title: "재시도 실패",
          description: result.error || '알 수 없는 오류',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Retry error:', error)
      toast({
        title: "오류 발생",
        description: "재시도 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    navigate('/')
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Zap className="w-4 h-4 text-red-500" />
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <Clock className="w-4 h-4 text-green-500" />
      default:
        return null
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">관리자 로그인</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="관리자 비밀번호 입력"
              />
            </div>
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">콘텐츠 자동화</h1>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">홈으로</Button>
            </Link>
            <Link href="/admin/keywords">
              <Button variant="outline">키워드 관리</Button>
            </Link>
            <Link href="/admin/tips-grouped">
              <Button variant="outline">콘텐츠 관리</Button>
            </Link>
            <Button onClick={handleLogout} variant="outline">
              로그아웃
            </Button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">전체 키워드</div>
                  <div className="text-3xl font-bold">{stats.total_keywords}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">대기 중</div>
                  <div className="text-3xl font-bold text-gray-600">{stats.pending_count}</div>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">발행 완료</div>
                  <div className="text-3xl font-bold text-green-600">{stats.published_count}</div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">성공률</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.success_rate?.toFixed(1) ?? 0}%
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Scheduler & Batch Actions */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">자동 발행 스케줄러</h2>
              </div>
              <Badge variant={schedulerSettings.enabled ? 'default' : 'secondary'}>
                {schedulerSettings.enabled ? '활성화' : '비활성화'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {schedulerSettings.enabled ? (
                <>하루에 <strong>{schedulerSettings.postsPerDay}개</strong> 자동 발행 중</>
              ) : (
                '스케줄러를 활성화하여 자동 발행 시작'
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSchedulerModal(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              설정 변경
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold mb-1">일괄 작업</h2>
                <p className="text-sm text-gray-600">
                  {selectedKeywords.size > 0 ? (
                    <>선택한 <strong>{selectedKeywords.size}개</strong> 키워드를 처리합니다.</>
                  ) : (
                    <>대기 중인 <strong>{keywords.length}개</strong> 키워드를 한 번에 처리합니다.</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBatchGenerate}
                disabled={keywords.length === 0}
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                {selectedKeywords.size > 0 ? '선택 항목 생성' : '일괄 생성'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={selectedKeywords.size === 0}
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                선택 삭제
              </Button>
            </div>
          </Card>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        )}

        {/* Pending Keywords List */}
        {!loading && keywords.length === 0 && (
          <Card className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">
              대기 중인 키워드가 없습니다.
            </p>
            <p className="text-gray-500 mt-2">모든 키워드가 처리되었습니다.</p>
          </Card>
        )}

        {!loading && keywords.length > 0 && (
          <Card>
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                대기 중인 키워드 ({keywords.length}개)
                {selectedKeywords.size > 0 && (
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    ({selectedKeywords.size}개 선택됨)
                  </span>
                )}
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={keywords.length > 0 && selectedKeywords.size === keywords.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    키워드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    검색 의도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    우선순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keywords.map(keyword => (
                  <tr key={keyword.id} className={selectedKeywords.has(keyword.id) ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedKeywords.has(keyword.id)}
                        onCheckedChange={(checked) => handleSelectKeyword(keyword.id, checked as boolean)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(keyword.priority)}
                        <span className="text-sm font-medium text-gray-900">
                          {keyword.keyword}
                        </span>
                      </div>
                      {keyword.error_message && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          {keyword.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {keyword.search_intent || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          keyword.priority === 'high'
                            ? 'destructive'
                            : keyword.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {keyword.priority === 'high'
                          ? '높음'
                          : keyword.priority === 'medium'
                          ? '중간'
                          : '낮음'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {keyword.status === 'failed' ? (
                        <Badge variant="destructive">실패</Badge>
                      ) : (
                        <Badge variant="secondary">대기 중</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {keyword.status === 'failed' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(keyword.id, keyword.keyword)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          재시도
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleGenerate(keyword.id, keyword.keyword)}
                          disabled={generating.has(keyword.id)}
                        >
                          {generating.has(keyword.id) ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              생성 중...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              생성
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Scheduler Settings Modal */}
        {showSchedulerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full p-6 m-4">
              <h2 className="text-2xl font-bold mb-4">자동 발행 스케줄러 설정</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">스케줄러 활성화</label>
                  <input
                    type="checkbox"
                    checked={schedulerSettings.enabled}
                    onChange={(e) => setSchedulerSettings({ ...schedulerSettings, enabled: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                </div>

                {schedulerSettings.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        발행 간격
                      </label>
                      <select
                        value={schedulerSettings.postsPerDay}
                        onChange={(e) => {
                          const postsPerDay = parseInt(e.target.value)
                          setSchedulerSettings({
                            ...schedulerSettings,
                            postsPerDay,
                            interval: 24 / postsPerDay
                          })
                        }}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="1">하루 1개 (24시간 간격)</option>
                        <option value="2">하루 2개 (12시간 간격)</option>
                        <option value="3">하루 3개 (8시간 간격)</option>
                        <option value="4">하루 4개 (6시간 간격)</option>
                        <option value="6">하루 6개 (4시간 간격)</option>
                        <option value="8">하루 8개 (3시간 간격)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        현재 설정: {schedulerSettings.interval}시간마다 1개씩 발행
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>💡 안내:</strong> 스케줄러가 활성화되면 대기 중인 키워드를 자동으로 처리합니다.
                        Vercel 무료 플랜은 10초 제한이 있어 복잡한 콘텐츠는 타임아웃될 수 있습니다.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowSchedulerModal(false)}
                >
                  취소
                </Button>
                <Button onClick={handleSaveScheduler}>
                  저장
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
