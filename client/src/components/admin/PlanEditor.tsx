import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

interface PlanEditorProps {
  initialData?: {
    id?: string
    carrier_id?: string
    plan_type?: string
    payment_type?: string
    name?: string
    description?: string
    description_en?: string
    description_vi?: string
    description_th?: string
    data_amount_gb?: number | null
    validity_days?: number
    voice_minutes?: number | null
    sms_count?: number | null
    price_krw?: number
    features?: string[]
    features_en?: string[]
    features_vi?: string[]
    features_th?: string[]
    airport_pickup?: boolean
    esim_support?: boolean
    physical_sim?: boolean
    is_popular?: boolean
    is_active?: boolean
  }
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export default function PlanEditor({ initialData, onSave, onCancel }: PlanEditorProps) {
  const [carriers, setCarriers] = useState<any[]>([])
  const [carrierId, setCarrierId] = useState(initialData?.carrier_id || '')
  const [planType, setPlanType] = useState(initialData?.plan_type || 'data')
  const [paymentType, setPaymentType] = useState(initialData?.payment_type || 'prepaid')
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [descriptionEn, setDescriptionEn] = useState(initialData?.description_en || '')
  const [descriptionVi, setDescriptionVi] = useState(initialData?.description_vi || '')
  const [descriptionTh, setDescriptionTh] = useState(initialData?.description_th || '')
  const [dataAmountGb, setDataAmountGb] = useState(initialData?.data_amount_gb?.toString() || '')
  const [validityDays, setValidityDays] = useState(initialData?.validity_days?.toString() || '30')
  const [voiceMinutes, setVoiceMinutes] = useState(initialData?.voice_minutes?.toString() || '')
  const [smsCount, setSmsCount] = useState(initialData?.sms_count?.toString() || '')
  const [priceKrw, setPriceKrw] = useState(initialData?.price_krw?.toString() || '')

  const [features, setFeatures] = useState<string[]>(initialData?.features || [])
  const [featuresEn, setFeaturesEn] = useState<string[]>(initialData?.features_en || [])
  const [featuresVi, setFeaturesVi] = useState<string[]>(initialData?.features_vi || [])
  const [featuresTh, setFeaturesTh] = useState<string[]>(initialData?.features_th || [])

  const [featureInput, setFeatureInput] = useState('')
  const [featureInputEn, setFeatureInputEn] = useState('')
  const [featureInputVi, setFeatureInputVi] = useState('')
  const [featureInputTh, setFeatureInputTh] = useState('')

  const [airportPickup, setAirportPickup] = useState(initialData?.airport_pickup || false)
  const [esimSupport, setEsimSupport] = useState(initialData?.esim_support || false)
  const [physicalSim, setPhysicalSim] = useState(initialData?.physical_sim !== undefined ? initialData.physical_sim : true)
  const [isPopular, setIsPopular] = useState(initialData?.is_popular || false)
  const [isActive, setIsActive] = useState(initialData?.is_active !== undefined ? initialData.is_active : true)

  const [isSaving, setIsSaving] = useState(false)

  // Fetch carriers
  useEffect(() => {
    fetchCarriers()
  }, [])

  const fetchCarriers = async () => {
    try {
      const response = await fetch('/api/carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setCarriers(data.carriers || [])
    } catch (error) {
      console.error('Failed to fetch carriers:', error)
    }
  }

  const handleAddFeature = (lang: 'ko' | 'en' | 'vi' | 'th') => {
    const inputs = { ko: featureInput, en: featureInputEn, vi: featureInputVi, th: featureInputTh }
    const setInputs = { ko: setFeatureInput, en: setFeatureInputEn, vi: setFeatureInputVi, th: setFeatureInputTh }
    const featureLists = { ko: features, en: featuresEn, vi: featuresVi, th: featuresTh }
    const setFeatureLists = { ko: setFeatures, en: setFeaturesEn, vi: setFeaturesVi, th: setFeaturesTh }

    const input = inputs[lang]
    if (input.trim() && !featureLists[lang].includes(input.trim())) {
      setFeatureLists[lang]([...featureLists[lang], input.trim()])
      setInputs[lang]('')
    }
  }

  const handleRemoveFeature = (lang: 'ko' | 'en' | 'vi' | 'th', featureToRemove: string) => {
    const featureLists = { ko: features, en: featuresEn, vi: featuresVi, th: featuresTh }
    const setFeatureLists = { ko: setFeatures, en: setFeaturesEn, vi: setFeaturesVi, th: setFeaturesTh }

    setFeatureLists[lang](featureLists[lang].filter(f => f !== featureToRemove))
  }

  const handleSave = async () => {
    if (!name.trim() || !carrierId || !priceKrw) {
      alert('통신사, 요금제명, 가격은 필수 항목입니다.')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        id: initialData?.id,
        carrier_id: carrierId,
        plan_type: planType,
        payment_type: paymentType,
        name,
        description,
        description_en: descriptionEn,
        description_vi: descriptionVi,
        description_th: descriptionTh,
        data_amount_gb: dataAmountGb ? parseFloat(dataAmountGb) : null,
        validity_days: parseInt(validityDays),
        voice_minutes: voiceMinutes ? parseInt(voiceMinutes) : null,
        sms_count: smsCount ? parseInt(smsCount) : null,
        price_krw: parseInt(priceKrw),
        features,
        features_en: featuresEn,
        features_vi: featuresVi,
        features_th: featuresTh,
        airport_pickup: airportPickup,
        esim_support: esimSupport,
        physical_sim: physicalSim,
        is_popular: isPopular,
        is_active: isActive
      })
    } catch (error) {
      console.error('Save error:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {initialData?.id ? '요금제 수정' : '새 요금제 추가'}
        </h1>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline">
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            저장
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">기본 정보</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="carrier">통신사 *</Label>
                <select
                  id="carrier"
                  value={carrierId}
                  onChange={(e) => setCarrierId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">통신사 선택</option>
                  {carriers.map(carrier => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name_ko} ({carrier.name_en})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planType">요금제 유형 *</Label>
                  <select
                    id="planType"
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="data">데이터</option>
                    <option value="voice">음성</option>
                    <option value="data_voice">데이터+음성</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="paymentType">결제 방식 *</Label>
                  <select
                    id="paymentType"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="prepaid">선불</option>
                    <option value="postpaid">후불</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="name">요금제명 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 7일 무제한 데이터"
                />
              </div>

              <div>
                <Label htmlFor="description">설명 (한국어)</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="요금제 설명"
                  className="w-full p-2 border rounded h-24"
                />
              </div>

              <div>
                <Label htmlFor="descriptionEn">설명 (English)</Label>
                <textarea
                  id="descriptionEn"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Plan description in English"
                  className="w-full p-2 border rounded h-24"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">요금제 상세</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataAmount">데이터 용량 (GB)</Label>
                <Input
                  id="dataAmount"
                  type="number"
                  value={dataAmountGb}
                  onChange={(e) => setDataAmountGb(e.target.value)}
                  placeholder="무제한은 비워두세요"
                />
              </div>

              <div>
                <Label htmlFor="validityDays">유효 기간 (일) *</Label>
                <Input
                  id="validityDays"
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  placeholder="30"
                />
              </div>

              <div>
                <Label htmlFor="voiceMinutes">음성 통화 (분)</Label>
                <Input
                  id="voiceMinutes"
                  type="number"
                  value={voiceMinutes}
                  onChange={(e) => setVoiceMinutes(e.target.value)}
                  placeholder="없으면 비워두세요"
                />
              </div>

              <div>
                <Label htmlFor="smsCount">SMS 개수</Label>
                <Input
                  id="smsCount"
                  type="number"
                  value={smsCount}
                  onChange={(e) => setSmsCount(e.target.value)}
                  placeholder="없으면 비워두세요"
                />
              </div>

              <div>
                <Label htmlFor="price">가격 (원) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={priceKrw}
                  onChange={(e) => setPriceKrw(e.target.value)}
                  placeholder="25000"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">특징 (한국어)</h3>
            <div className="flex gap-2 mb-2">
              <Input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature('ko'))}
                placeholder="특징 입력"
              />
              <Button onClick={() => handleAddFeature('ko')} size="sm">추가</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {features.map(feature => (
                <span
                  key={feature}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                >
                  {feature}
                  <button onClick={() => handleRemoveFeature('ko', feature)} className="hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">특징 (English)</h3>
            <div className="flex gap-2 mb-2">
              <Input
                value={featureInputEn}
                onChange={(e) => setFeatureInputEn(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature('en'))}
                placeholder="Add feature"
              />
              <Button onClick={() => handleAddFeature('en')} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {featuresEn.map(feature => (
                <span
                  key={feature}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1"
                >
                  {feature}
                  <button onClick={() => handleRemoveFeature('en', feature)} className="hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">옵션</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="airportPickup"
                  checked={airportPickup}
                  onCheckedChange={(checked) => setAirportPickup(checked as boolean)}
                />
                <Label htmlFor="airportPickup">공항 픽업 가능</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="esimSupport"
                  checked={esimSupport}
                  onCheckedChange={(checked) => setEsimSupport(checked as boolean)}
                />
                <Label htmlFor="esimSupport">eSIM 지원</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="physicalSim"
                  checked={physicalSim}
                  onCheckedChange={(checked) => setPhysicalSim(checked as boolean)}
                />
                <Label htmlFor="physicalSim">물리적 SIM 지원</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPopular"
                  checked={isPopular}
                  onCheckedChange={(checked) => setIsPopular(checked as boolean)}
                />
                <Label htmlFor="isPopular">인기 요금제</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked as boolean)}
                />
                <Label htmlFor="isActive">활성화</Label>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
