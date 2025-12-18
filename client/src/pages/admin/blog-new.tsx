import { useLocation } from 'wouter'
import BlogEditor from '@/components/admin/BlogEditor'

export default function NewBlogPost() {
  const [, navigate] = useLocation()

  const handleSave = async (data: any) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
    if (confirm('작성을 취소하시겠습니까?')) {
      navigate('/admin/blog')
    }
  }

  return <BlogEditor onSave={handleSave} onCancel={handleCancel} />
}
