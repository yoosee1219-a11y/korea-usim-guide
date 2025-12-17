import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface BlogPost {
  id: string
  title_ko: string
  slug: string
  category: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export default function AdminBlogList() {
  const [, navigate] = useLocation()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Check if admin is authenticated
    const isAuth = localStorage.getItem('adminAuthenticated') === 'true'
    if (isAuth) {
      setIsAuthenticated(true)
      fetchPosts()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple password check
    if (password === 'admin123') { // TODO: Use environment variable
      localStorage.setItem('adminAuthenticated', 'true')
      setIsAuthenticated(true)
      fetchPosts()
    } else {
      alert('잘못된 비밀번호입니다.')
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/admin/blog')
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPosts()
      } else {
        alert('삭제 실패')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated')
    setIsAuthenticated(false)
    navigate('/')
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
          <h1 className="text-3xl font-bold">블로그 관리</h1>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">홈으로</Button>
            </Link>
            <Button onClick={handleLogout} variant="outline">
              로그아웃
            </Button>
            <Link href="/admin/blog/new">
              <Button>+ 새 글 작성</Button>
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-600 mb-4">아직 작성된 글이 없습니다.</p>
            <Link href="/admin/blog/new">
              <Button>첫 글 작성하기</Button>
            </Link>
          </Card>
        )}

        {/* Posts List */}
        {!loading && posts.length > 0 && (
          <Card>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    작성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map(post => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{post.title_ko}</div>
                      <div className="text-sm text-gray-500">/blog/{post.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {post.category || '없음'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.is_published ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          발행됨
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          임시저장
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/admin/blog/edit/${post.id}`}>
                        <a className="text-blue-600 hover:text-blue-900 mr-4">수정</a>
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
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
      </div>
    </div>
  )
}
