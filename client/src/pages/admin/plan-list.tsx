import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function AdminPlanList() {
  const [, navigate] = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsAuthenticated(true)
      fetchPlans()
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
        fetchPlans()
      } else {
        alert('비밀번호가 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/plans', {
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
      setPlans(data)
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 요금제를 삭제하시겠습니까?')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('삭제되었습니다.')
        fetchPlans()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    setPlans([])
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">어드민 로그인</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호를 입력하세요"
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">요금제 관리</h1>
            <p className="text-gray-600 mt-2">USIM 요금제를 관리합니다</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/blog')} variant="outline">
              블로그 관리
            </Button>
            <Button onClick={() => navigate('/admin/plans/new')}>
              새 요금제 추가
            </Button>
            <Button onClick={handleLogout} variant="outline">
              로그아웃
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : plans.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-4">등록된 요금제가 없습니다.</p>
            <Button onClick={() => navigate('/admin/plans/new')}>
              첫 요금제 추가하기
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      {plan.is_popular && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                          인기
                        </span>
                      )}
                      {!plan.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          비활성
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>통신사: {plan.carrier_name_ko} ({plan.carrier_name_en})</p>
                      <p>유형: {plan.plan_type} | 결제: {plan.payment_type}</p>
                      <p>
                        데이터: {plan.data_amount_gb ? `${plan.data_amount_gb}GB` : '무제한'} |
                        기간: {plan.validity_days}일 |
                        가격: {plan.price_krw.toLocaleString()}원
                      </p>
                      {plan.description && (
                        <p className="mt-2 text-gray-700">{plan.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      {plan.airport_pickup && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          공항픽업
                        </span>
                      )}
                      {plan.esim_support && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          eSIM
                        </span>
                      )}
                      {plan.physical_sim && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                          물리SIM
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => navigate(`/admin/plans/edit/${plan.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      수정
                    </Button>
                    <Button
                      onClick={() => handleDelete(plan.id)}
                      variant="destructive"
                      size="sm"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
