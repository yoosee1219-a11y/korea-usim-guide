'use client'

import { useEffect } from 'react'
import type { PlanWithCarrier } from '@/types/database'

interface PlanDetailModalProps {
  plan: PlanWithCarrier
  isOpen: boolean
  onClose: () => void
}

export default function PlanDetailModal({ plan, isOpen, onClose }: PlanDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const planTypeLabels = {
    prepaid: '선불',
    postpaid: '후불',
    mou: 'MOU'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{plan.carrier.name}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                plan.network_type === '5G'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {plan.network_type}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {planTypeLabels[plan.plan_type]}
              </span>
            </div>
            <h3 className="text-xl text-gray-700">{plan.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 가격 정보 */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
            <h4 className="text-sm text-gray-600 mb-2">월 요금</h4>
            {plan.discounted_fee && plan.discounted_fee < plan.monthly_fee ? (
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-gray-500 line-through text-lg">
                    {plan.monthly_fee.toLocaleString()}원
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    {Math.round((1 - plan.discounted_fee / plan.monthly_fee) * 100)}% 할인
                  </span>
                </div>
                <div className="text-4xl font-bold text-primary">
                  {plan.discounted_fee.toLocaleString()}원
                  <span className="text-base text-gray-600 font-normal ml-2">/월</span>
                </div>
              </div>
            ) : (
              <div className="text-4xl font-bold text-primary">
                {plan.monthly_fee.toLocaleString()}원
                <span className="text-base text-gray-600 font-normal ml-2">/월</span>
              </div>
            )}
          </div>

          {/* 기본 정보 */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">기본 제공 내역</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">데이터</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{plan.data_amount}</span>
              </div>

              {plan.voice_minutes && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="text-gray-700">음성통화</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{plan.voice_minutes}</span>
                </div>
              )}

              {plan.sms_count && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <span className="text-gray-700">문자메시지</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{plan.sms_count}</span>
                </div>
              )}
            </div>
          </div>

          {/* 약정 기간 */}
          {plan.contract_period && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">약정 정보</h4>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-900">
                  <span className="font-bold">{plan.contract_period}개월</span> 약정 요금제입니다
                </p>
              </div>
            </div>
          )}

          {/* 할인 조건 */}
          {plan.discount_conditions && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">할인 조건</h4>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-900 whitespace-pre-line">{plan.discount_conditions}</p>
              </div>
            </div>
          )}

          {/* 특별 혜택 */}
          {plan.benefits && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">특별 혜택</h4>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-900 whitespace-pre-line">{plan.benefits}</p>
              </div>
            </div>
          )}

          {/* 통신사 정보 */}
          {(plan.carrier.website || plan.carrier.customer_service) && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">통신사 정보</h4>
              <div className="space-y-2">
                {plan.carrier.website && (
                  <a
                    href={plan.carrier.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    웹사이트 방문하기
                  </a>
                )}
                {plan.carrier.customer_service && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    고객센터: {plan.carrier.customer_service}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
