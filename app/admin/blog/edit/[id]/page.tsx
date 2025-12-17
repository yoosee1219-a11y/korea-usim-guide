'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isAdminAuthenticated } from '@/lib/auth'
import BlogEditor from '@/components/BlogEditor'

export default function EditBlogPost({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [postData, setPostData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/blog')
      return
    }

    setIsAuth(true)
    fetchPost()
  }, [params.id, router])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog?slug=${params.id}`)
      const data = await response.json()

      if (data.length > 0) {
        setPostData(data[0])
      } else {
        // Try fetching by ID
        const allResponse = await fetch('/api/admin/blog')
        const allPosts = await allResponse.json()
        const post = allPosts.find((p: any) => p.id === params.id)
        setPostData(post || null)
      }
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: any) => {
    try {
      const response = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: params.id })
      })

      if (response.ok) {
        alert('저장되었습니다!')
        router.push('/admin/blog')
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
      router.push('/admin/blog')
    }
  }

  if (!isAuth || loading) {
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
            onClick={() => router.push('/admin/blog')}
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
