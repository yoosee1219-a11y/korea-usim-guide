import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight, Globe, Trash2, Eye, EyeOff } from 'lucide-react'

interface Translation {
  id: string
  language: string
  title: string
  slug: string
  is_published: boolean
}

interface GroupedTip {
  id: string
  original: {
    id: string
    title: string
    slug: string
    is_published: boolean
    created_at: string
  }
  translations: Translation[]
  total_languages: number
  all_published: boolean
}

export default function TipsGroupedList() {
  const [, navigate] = useLocation()
  const [groups, setGroups] = useState<GroupedTip[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedTips, setSelectedTips] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsAuthenticated(true)
      fetchGroupedTips()
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
        fetchGroupedTips()
      } else {
        alert('잘못된 비밀번호입니다.')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

  const fetchGroupedTips = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/tips-grouped', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        setIsAuthenticated(false)
        return
      }

      const data = await response.json()
      setGroups(data)
    } catch (error) {
      console.error('Failed to fetch grouped tips:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleSelectTip = (tipId: string) => {
    const newSelected = new Set(selectedTips)
    if (newSelected.has(tipId)) {
      newSelected.delete(tipId)
    } else {
      newSelected.add(tipId)
    }
    setSelectedTips(newSelected)
  }

  const toggleSelectGroup = (group: GroupedTip) => {
    const allTipIds = [group.original.id, ...group.translations.map(t => t.id)]
    const allSelected = allTipIds.every(id => selectedTips.has(id))

    const newSelected = new Set(selectedTips)
    if (allSelected) {
      allTipIds.forEach(id => newSelected.delete(id))
    } else {
      allTipIds.forEach(id => newSelected.add(id))
    }
    setSelectedTips(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedTips.size === 0) {
      alert('삭제할 항목을 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedTips.size}개 항목을 삭제하시겠습니까?`)) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/tips-grouped/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tipIds: Array.from(selectedTips) })
      })

      if (response.ok) {
        setSelectedTips(new Set())
        fetchGroupedTips()
        alert('삭제되었습니다.')
      } else {
        alert('삭제 실패')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedTips.size === 0) {
      alert('발행 상태를 변경할 항목을 선택해주세요.')
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/tips-grouped/bulk-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tipIds: Array.from(selectedTips),
          isPublished: publish
        })
      })

      if (response.ok) {
        setSelectedTips(new Set())
        fetchGroupedTips()
        alert(publish ? '발행되었습니다.' : '발행 취소되었습니다.')
      } else {
        alert('상태 변경 실패')
      }
    } catch (error) {
      console.error('Bulk publish error:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    navigate('/')
  }

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      'ko': '한국어',
      'en': 'English',
      'vi': 'Tiếng Việt',
      'ru': 'Русский'
    }
    return names[code] || code
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
          <h1 className="text-3xl font-bold">다국어 콘텐츠 관리</h1>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">홈으로</Button>
            </Link>
            <Link href="/admin/keywords">
              <Button variant="outline">키워드 관리</Button>
            </Link>
            <Link href="/admin/content-automation">
              <Button variant="outline">콘텐츠 자동화</Button>
            </Link>
            <Button onClick={handleLogout} variant="outline">
              로그아웃
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTips.size > 0 && (
          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedTips.size}개 항목 선택됨
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkPublish(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  일괄 발행
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkPublish(false)}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  발행 취소
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  일괄 삭제
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && groups.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-600">아직 작성된 콘텐츠가 없습니다.</p>
          </Card>
        )}

        {/* Grouped Tips List */}
        {!loading && groups.length > 0 && (
          <div className="space-y-2">
            {groups.map(group => {
              const isExpanded = expandedGroups.has(group.id)
              const allTipIds = [group.original.id, ...group.translations.map(t => t.id)]
              const allSelected = allTipIds.every(id => selectedTips.has(id))
              const someSelected = allTipIds.some(id => selectedTips.has(id)) && !allSelected

              return (
                <Card key={group.id} className="overflow-hidden">
                  {/* Original (Korean) Row */}
                  <div className="flex items-center p-4 hover:bg-gray-50">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleSelectGroup(group)}
                      className={someSelected ? 'opacity-50' : ''}
                    />
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="ml-3 p-1 hover:bg-gray-200 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Globe className="w-5 h-5 ml-3 text-blue-500" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.original.title}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          한국어 (원본)
                        </span>
                        {group.original.is_published ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                            발행됨
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                            미발행
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        /tips/{group.original.slug}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {group.translations.length + 1} / {group.total_languages} 언어
                    </div>
                  </div>

                  {/* Translations (Collapsed) */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50">
                      {group.translations.map(translation => (
                        <div
                          key={translation.id}
                          className="flex items-center p-4 pl-16 hover:bg-gray-100 border-b last:border-b-0"
                        >
                          <Checkbox
                            checked={selectedTips.has(translation.id)}
                            onCheckedChange={() => toggleSelectTip(translation.id)}
                          />
                          <div className="ml-6 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{translation.title}</span>
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                                {getLanguageName(translation.language)}
                              </span>
                              {translation.is_published ? (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                                  발행됨
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                                  미발행
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
