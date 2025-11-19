'use client'

import { useState, useEffect, useCallback } from 'react'
import PlanCard from '@/components/PlanCard'
import PlanFilter, { FilterState } from '@/components/PlanFilter'
import Toast from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import type { PlanWithCarrier } from '@/types/database'

export default function Home() {
  const [plans, setPlans] = useState<PlanWithCarrier[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    carrier_id: '',
    network_type: '',
    plan_type: '',
    min_price: '',
    max_price: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'price_low' | 'price_high' | 'data_high' | 'newest'>('price_low')
  const { toasts, hideToast, error, success } = useToast()

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.carrier_id) params.append('carrier_id', filters.carrier_id)
      if (filters.network_type) params.append('network_type', filters.network_type)
      if (filters.plan_type) params.append('plan_type', filters.plan_type)
      if (filters.min_price) params.append('min_price', filters.min_price)
      if (filters.max_price) params.append('max_price', filters.max_price)

      const response = await fetch(`/api/plans?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
        if (data.length === 0 && (filters.carrier_id || filters.network_type || filters.plan_type)) {
          error('해당 조건에 맞는 요금제가 없습니다')
        }
      } else {
        error('요금제를 불러오는데 실패했습니다')
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err)
      error('서버와의 연결에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [filters, error])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  // 검색 및 정렬 적용
  const filteredAndSortedPlans = plans
    .filter(plan => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        plan.name.toLowerCase().includes(query) ||
        plan.carrier.name.toLowerCase().includes(query) ||
        plan.data_amount.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      const priceA = a.discounted_fee || a.monthly_fee
      const priceB = b.discounted_fee || b.monthly_fee

      switch (sortBy) {
        case 'price_low':
          return priceA - priceB
        case 'price_high':
          return priceB - priceA
        case 'data_high':
          // 데이터 용량 비교 (숫자 추출)
          const dataA = parseInt(a.data_amount.match(/\d+/)?.[0] || '0')
          const dataB = parseInt(b.data_amount.match(/\d+/)?.[0] || '0')
          return dataB - dataA
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🇰🇷 한국 유심 요금제 비교
              </h1>
              <p className="text-gray-600 mt-2">
                최저가 요금제를 쉽고 빠르게 찾아보세요
              </p>
            </div>
            <a
              href="/blog"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              📝 블로그
            </a>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <PlanFilter onFilterChange={handleFilterChange} />

        {/* 검색 및 정렬 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* 검색창 */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="요금제명, 통신사, 데이터 용량으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 정렬 옵션 */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="price_low">낮은 가격순</option>
              <option value="price_high">높은 가격순</option>
              <option value="data_high">데이터 많은순</option>
              <option value="newest">최신 등록순</option>
            </select>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-600">
            총 <span className="font-bold text-primary">{filteredAndSortedPlans.length}</span>개의 요금제
            {searchQuery && (
              <span className="text-sm text-gray-500 ml-2">
                ('{searchQuery}' 검색 결과)
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredAndSortedPlans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">해당하는 요금제가 없습니다</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-primary hover:underline"
              >
                검색 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </main>

      {/* Toast 알림 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}
