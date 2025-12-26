import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit, BarChart3, RefreshCw } from 'lucide-react'

interface Keyword {
  id: string
  keyword: string
  search_intent?: string
  cpc_krw?: number
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'generating' | 'published' | 'failed'
  related_keywords?: string[]
  tip_id?: string
  created_at: string
  generated_at?: string
  published_at?: string
  error_message?: string
}

interface KeywordStats {
  total: number
  pending: number
  generating: number
  published: number
  failed: number
}

export default function KeywordList() {
  const [, navigate] = useLocation()
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [stats, setStats] = useState<KeywordStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKeyword, setNewKeyword] = useState({
    keyword: '',
    search_intent: '',
    cpc_krw: '',
    priority: 'medium' as const,
    related_keywords: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsAuthenticated(true)
      fetchKeywords()
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [filter])

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
        fetchKeywords()
        fetchStats()
      } else {
        alert('잘못된 비밀번호입니다.')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

  const fetchKeywords = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const url = filter === 'all'
        ? '/api/admin/keywords'
        : `/api/admin/keywords?status=${filter}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        setIsAuthenticated(false)
        return
      }

      const data = await response.json()
      setKeywords(data)
    } catch (error) {
      console.error('Failed to fetch keywords:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/keywords/stats/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('adminToken')
      const relatedKeywords = newKeyword.related_keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k)

      const response = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keyword: newKeyword.keyword,
          search_intent: newKeyword.search_intent || undefined,
          cpc_krw: newKeyword.cpc_krw ? parseInt(newKeyword.cpc_krw) : undefined,
          priority: newKeyword.priority,
          related_keywords: relatedKeywords.length > 0 ? relatedKeywords : undefined
        })
      })

      if (response.ok) {
        setShowAddModal(false)
        setNewKeyword({
          keyword: '',
          search_intent: '',
          cpc_krw: '',
          priority: 'medium',
          related_keywords: ''
        })
        fetchKeywords()
        fetchStats()
        alert('키워드가 추가되었습니다.')
      } else {
        alert('키워드 추가 실패')
      }
    } catch (error) {
      console.error('Add keyword error:', error)
      alert('키워드 추가 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/keywords/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchKeywords()
        fetchStats()
        alert('삭제되었습니다.')
      } else {
        alert('삭제 실패')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    navigate('/')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: '대기 중' },
      generating: { variant: 'default', label: '생성 중' },
      published: { variant: 'default', label: '발행됨' },
      failed: { variant: 'destructive', label: '실패' }
    }

    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }

    const labels: Record<string, string> = {
      high: '높음',
      medium: '중간',
      low: '낮음'
    }

    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${colors[priority]}`}>
        {labels[priority]}
      </span>
    )
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
          <h1 className="text-3xl font-bold">키워드 관리</h1>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">홈으로</Button>
            </Link>
            <Link href="/admin/tips-grouped">
              <Button variant="outline">콘텐츠 관리</Button>
            </Link>
            <Link href="/admin/content-automation">
              <Button variant="outline">콘텐츠 자동화</Button>
            </Link>
            <Button onClick={handleLogout} variant="outline">
              로그아웃
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              키워드 추가
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-gray-600">전체</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">대기 중</div>
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">생성 중</div>
              <div className="text-2xl font-bold text-blue-600">{stats.generating}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">발행됨</div>
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">실패</div>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            대기 중
          </Button>
          <Button
            variant={filter === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('published')}
          >
            발행됨
          </Button>
          <Button
            variant={filter === 'failed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('failed')}
          >
            실패
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        )}

        {/* Keywords Table */}
        {!loading && (
          <Card>
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
                    CPC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    우선순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    생성일
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
                      <div className="text-sm font-medium text-gray-900">
                        {keyword.keyword}
                      </div>
                      {keyword.error_message && (
                        <div className="text-xs text-red-600 mt-1">
                          {keyword.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {keyword.search_intent || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {keyword.cpc_krw ? `${keyword.cpc_krw}원` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(keyword.priority)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(keyword.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(keyword.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {keyword.tip_id && (
                        <Link href={`/tips/${keyword.tip_id}`}>
                          <a className="text-blue-600 hover:text-blue-900 mr-4">보기</a>
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(keyword.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Add Keyword Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full p-6 m-4">
              <h2 className="text-2xl font-bold mb-4">키워드 추가</h2>
              <form onSubmit={handleAddKeyword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">키워드 *</label>
                  <input
                    type="text"
                    value={newKeyword.keyword}
                    onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="예: 한국 외국인 유심 카드"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">검색 의도</label>
                  <input
                    type="text"
                    value={newKeyword.search_intent}
                    onChange={(e) => setNewKeyword({ ...newKeyword, search_intent: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="예: 입국 직후 필수"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">예상 CPC (원)</label>
                  <input
                    type="number"
                    value={newKeyword.cpc_krw}
                    onChange={(e) => setNewKeyword({ ...newKeyword, cpc_krw: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="예: 2500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">우선순위</label>
                  <select
                    value={newKeyword.priority}
                    onChange={(e) => setNewKeyword({ ...newKeyword, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="high">높음</option>
                    <option value="medium">중간</option>
                    <option value="low">낮음</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">관련 키워드 (쉼표로 구분)</label>
                  <textarea
                    value={newKeyword.related_keywords}
                    onChange={(e) => setNewKeyword({ ...newKeyword, related_keywords: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="예: 외국인등록증 발급방법, LG U+ 외국인 유심 개통"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    취소
                  </Button>
                  <Button type="submit">추가</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
