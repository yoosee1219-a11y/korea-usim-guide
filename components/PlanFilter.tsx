'use client'

import { useState, useEffect } from 'react'
import type { Carrier } from '@/types/database'

interface PlanFilterProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  carrier_id: string
  network_type: string
  plan_type: string
  min_price: string
  max_price: string
}

export default function PlanFilter({ onFilterChange }: PlanFilterProps) {
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [filters, setFilters] = useState<FilterState>({
    carrier_id: '',
    network_type: '',
    plan_type: '',
    min_price: '',
    max_price: '',
  })

  useEffect(() => {
    fetchCarriers()
  }, [])

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const fetchCarriers = async () => {
    try {
      const response = await fetch('/api/carriers')
      if (response.ok) {
        const data = await response.json()
        setCarriers(data)
      }
    } catch (error) {
      console.error('Failed to fetch carriers:', error)
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      carrier_id: '',
      network_type: '',
      plan_type: '',
      min_price: '',
      max_price: '',
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">필터</h2>
        <button
          onClick={resetFilters}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          초기화
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 통신사 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            통신사
          </label>
          <select
            value={filters.carrier_id}
            onChange={(e) => handleFilterChange('carrier_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">전체</option>
            {carriers.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.name}
              </option>
            ))}
          </select>
        </div>

        {/* 네트워크 타입 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            네트워크
          </label>
          <select
            value={filters.network_type}
            onChange={(e) => handleFilterChange('network_type', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">전체</option>
            <option value="5G">5G</option>
            <option value="LTE">LTE</option>
            <option value="LTE-A">LTE-A</option>
          </select>
        </div>

        {/* 요금제 타입 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            요금제 타입
          </label>
          <select
            value={filters.plan_type}
            onChange={(e) => handleFilterChange('plan_type', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="">전체</option>
            <option value="prepaid">선불</option>
            <option value="postpaid">후불</option>
            <option value="mou">MOU</option>
          </select>
        </div>

        {/* 최소 가격 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            최소 금액
          </label>
          <input
            type="number"
            value={filters.min_price}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
            placeholder="0"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
        </div>

        {/* 최대 가격 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            최대 금액
          </label>
          <input
            type="number"
            value={filters.max_price}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
            placeholder="100000"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    </div>
  )
}
