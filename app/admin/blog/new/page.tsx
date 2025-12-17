'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isAdminAuthenticated } from '@/lib/auth'
import BlogEditor from '@/components/BlogEditor'

export default function NewBlogPost() {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/blog')
    } else {
      setIsAuth(true)
    }
  }, [router])

  const handleSave = async (data: any) => {
    try {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
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
    if (confirm('작성을 취소하시겠습니까?')) {
      router.push('/admin/blog')
    }
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return <BlogEditor onSave={handleSave} onCancel={handleCancel} />
}
