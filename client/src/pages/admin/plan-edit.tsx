import { useState, useEffect } from 'react'
import { useLocation, useRoute } from 'wouter'
import PlanEditor from '@/components/admin/PlanEditor'
import { useToast } from '@/hooks/use-toast'

export default function EditPlan() {
  const [, navigate] = useLocation()
  const [, params] = useRoute('/admin/plans/edit/:id')
  const { toast } = useToast()
  const [planData, setPlanData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params?.id) {
      fetchPlan(params.id)
    }
  }, [params])

  const fetchPlan = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/plans/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setPlanData(data)
    } catch (error) {
      console.error('Failed to fetch plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: any) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/plans/${params?.id}`, {
        method: 'PUT',
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
    if (confirm('수정을 취소하시겠습니까?')) {
      navigate('/admin/plans')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!planData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">요금제를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/admin/plans')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <PlanEditor
      initialData={planData}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
