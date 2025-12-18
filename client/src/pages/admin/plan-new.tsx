import { useLocation } from 'wouter'
import PlanEditor from '@/components/admin/PlanEditor'

export default function NewPlan() {
  const [, navigate] = useLocation()

  const handleSave = async (data: any) => {
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert('저장되었습니다!')
        navigate('/admin/plans')
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
      navigate('/admin/plans')
    }
  }

  return (
    <PlanEditor
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
