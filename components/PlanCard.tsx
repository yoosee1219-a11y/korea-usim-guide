'use client'

import { useState } from 'react'
import type { PlanWithCarrier } from '@/types/database'
import PlanDetailModal from './PlanDetailModal'

interface PlanCardProps {
  plan: PlanWithCarrier
}

export default function PlanCard({ plan }: PlanCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* 통신사 로고 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{plan.carrier.name}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          plan.network_type === '5G' 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {plan.network_type}
        </span>
      </div>

      {/* 요금제명 */}
      <h4 className="text-xl font-semibold mb-4 text-gray-800">{plan.name}</h4>

      {/* 가격 정보 */}
      <div className="mb-4">
        {plan.discounted_fee && plan.discounted_fee < plan.monthly_fee ? (
          <div>
            <span className="text-gray-500 line-through text-sm">
              {plan.monthly_fee.toLocaleString()}원
            </span>
            <span className="text-3xl font-bold text-primary ml-2">
              {plan.discounted_fee.toLocaleString()}원
            </span>
            <span className="text-sm text-gray-600">/월</span>
          </div>
        ) : (
          <div>
            <span className="text-3xl font-bold text-primary">
              {plan.monthly_fee.toLocaleString()}원
            </span>
            <span className="text-sm text-gray-600">/월</span>
          </div>
        )}
      </div>

      {/* 데이터/통화/문자 정보 */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">데이터</span>
          <span className="font-medium">{plan.data_amount}</span>
        </div>
        {plan.voice_minutes && (
          <div className="flex justify-between">
            <span className="text-gray-600">음성통화</span>
            <span className="font-medium">{plan.voice_minutes}</span>
          </div>
        )}
        {plan.sms_count && (
          <div className="flex justify-between">
            <span className="text-gray-600">문자</span>
            <span className="font-medium">{plan.sms_count}</span>
          </div>
        )}
      </div>

      {/* 약정 기간 */}
      {plan.contract_period && (
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
            {plan.contract_period}개월 약정
          </span>
        </div>
      )}

      {/* 할인 조건 */}
      {plan.discount_conditions && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">할인 조건:</p>
          <p className="text-xs text-gray-700">{plan.discount_conditions}</p>
        </div>
      )}

      {/* 혜택 */}
      {plan.benefits && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-1">특별 혜택:</p>
          <p className="text-xs text-secondary">{plan.benefits}</p>
        </div>
      )}

      {/* 상세보기 버튼 */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
      >
        상세보기
      </button>

      {/* 상세보기 모달 */}
      <PlanDetailModal
        plan={plan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
    </>
  )
}
