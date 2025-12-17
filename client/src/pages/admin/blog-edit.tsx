import { useState, useEffect } from 'react'
import { useLocation, useRoute } from 'wouter'
import BlogEditor from '@/components/admin/BlogEditor'

export default function EditBlogPost() {
  const [, navigate] = useLocation()
  const [, params] = useRoute('/admin/blog/edit/:id')
  const [postData, setPostData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params?.id) {
      fetchPost(params.id)
    }
  }, [params])

  const fetchPost = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/blog/${id}`)
      const data = await response.json()
      setPostData(data)
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: any) => {
    try {
      const response = await fetch(`/api/admin/blog/${params?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('저장되었습니다!')
        navigate('/admin/blog')
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      console.error('Save error:', error)
      throw error
    }
  }

  const handleCancel = () => {
    if (confirm('수정을 취소하시겠습니까?')) {
      navigate('/admin/blog')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!postData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">글을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/admin/blog')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <BlogEditor
      initialData={postData}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
