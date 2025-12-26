import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, RefreshCw, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'

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
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [stats, setStats] = useState<AutomationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<Map<string, GenerationResult>>(new Map())

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsAuthenticated(true)
      fetchData()
    } else {
      setLoading(false)
    }
  }, [])

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
        alert('잘못된 비밀번호입니다.')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken')

      const [keywordsRes, statsRes] = await Promise.all([
        fetch('/api/admin/keywords?status=pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/content-automation/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (keywordsRes.status === 401 || statsRes.status === 401) {
        localStorage.removeItem('adminToken')
        setIsAuthenticated(false)
        return
      }

      const [keywordsData, statsData] = await Promise.all([
        keywordsRes.json(),
        statsRes.json()
      ])

      setKeywords(keywordsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
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
        alert(`"${keyword}" 콘텐츠 생성이 시작되었습니다.`)
        // Refresh after a delay to show updated status
        setTimeout(() => {
          fetchData()
        }, 2000)
      } else {
        alert(`생성 실패: ${result.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('콘텐츠 생성 중 오류가 발생했습니다.')
    } finally {
      const newGenerating = new Set(generating)
      newGenerating.delete(keywordId)
      setGenerating(newGenerating)
    }
  }

  const handleBatchGenerate = async () => {
    if (keywords.length === 0) {
      alert('생성할 키워드가 없습니다.')
      return
    }

    if (!confirm(`${keywords.length}개의 키워드로 콘텐츠를 생성하시겠습니까?`)) return

    const keywordIds = keywords.map(k => k.id)

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
        alert(`일괄 생성이 시작되었습니다. (${result.scheduled_count}개 예약됨)`)
        fetchData()
      } else {
        alert(`일괄 생성 실패: ${result.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('Batch generation error:', error)
      alert('일괄 생성 중 오류가 발생했습니다.')
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
        alert('재시도가 시작되었습니다.')
        fetchData()
      } else {
        alert(`재시도 실패: ${result.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('Retry error:', error)
      alert('재시도 중 오류가 발생했습니다.')
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

        {/* Batch Actions */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">일괄 생성</h2>
              <p className="text-sm text-gray-600">
                대기 중인 {keywords.length}개 키워드를 한 번에 처리합니다.
              </p>
            </div>
            <Button
              onClick={handleBatchGenerate}
              disabled={keywords.length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              일괄 생성 시작
            </Button>
          </div>
        </Card>

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
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">대기 중인 키워드 ({keywords.length}개)</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                  <tr key={keyword.id}>
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
      </div>
    </div>
  )
}
