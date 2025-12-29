import { useLocation } from 'wouter'
import PlanEditor from '@/components/admin/PlanEditor'
import { useToast } from '@/hooks/use-toast'

export default function NewPlan() {
  const [, navigate] = useLocation()
  const { toast } = useToast()

  const handleSave = async (data: any) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast({
          title: "성공",
          description: "저장되었습니다!",
        })
        navigate('/admin/plans')
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "저장 실패",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive"
      })
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
