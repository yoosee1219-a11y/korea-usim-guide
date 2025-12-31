import { useState, useEffect } from 'react'
import { useLocation, useRoute, Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'

interface TipData {
  id: string
  title: string
  excerpt: string
  content: string
  thumbnail_url: string
  category_id: string | null
  language: string
  original_id: string | null
  is_published: boolean
  slug: string
}

export default function TipEdit() {
  const [, navigate] = useLocation()
  const [, params] = useRoute('/admin/tips/edit/:id')
  const { toast } = useToast()

  const [tipData, setTipData] = useState<TipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchTip(params.id)
    }
  }, [params])

  const fetchTip = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/tips-grouped/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      setTipData(data)
      setTitle(data.title)
      setExcerpt(data.excerpt || '')
      setContent(data.content)
      setThumbnailUrl(data.thumbnail_url || '')
      setIsPublished(data.is_published)
    } catch (error) {
      console.error('Failed to fetch tip:', error)
      toast({
        title: "로딩 실패",
        description: "데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "입력 오류",
        description: "제목을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "입력 오류",
        description: "내용을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/tips-grouped/${params?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          thumbnail_url: thumbnailUrl,
          is_published: isPublished,
          // 한국어 원본인 경우 썸네일 동기화 플래그
          sync_thumbnail: tipData?.language === 'ko' && !tipData?.original_id
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "저장 완료",
          description: result.synced_count
            ? `저장되었습니다! (${result.synced_count}개 번역본 썸네일 동기화됨)`
            : "저장되었습니다!",
        })
        navigate('/admin/tips')
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
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (confirm('수정을 취소하시겠습니까?')) {
      navigate('/admin/tips')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!tipData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <p className="text-xl text-gray-600 mb-4">콘텐츠를 찾을 수 없습니다.</p>
          <Link href="/admin/tips">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const isKoreanOriginal = tipData.language === 'ko' && !tipData.original_id

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/tips">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">콘텐츠 수정</h1>
            <div className="flex gap-2">
              <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {tipData.language === 'ko' ? '한국어' : tipData.language}
              </span>
              {isKoreanOriginal && (
                <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  원본
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail Sync Notice */}
        {isKoreanOriginal && (
          <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>원본 컨텐츠</strong>입니다. 썸네일 이미지를 변경하면 모든 번역본(11개 언어)에 자동으로 동일한 이미지가 적용됩니다.
            </p>
          </Card>
        )}

        <Card className="p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="제목을 입력하세요"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium mb-2">
                요약 (메타 설명)
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="검색 결과에 표시될 요약 내용 (150-200자 권장)"
              />
              <p className="text-xs text-gray-500 mt-1">
                현재 {excerpt.length}자
              </p>
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-sm font-medium mb-2">
                썸네일 이미지 URL {isKoreanOriginal && <span className="text-blue-600">(모든 언어에 반영됨)</span>}
              </label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              {thumbnailUrl && (
                <div className="mt-3">
                  <img
                    src={thumbnailUrl}
                    alt="썸네일 미리보기"
                    className="max-w-md rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = 'https://koreausimguide.com/diverse_travelers_in_seoul_using_smartphones.png'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">
                본문 내용 (HTML) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="HTML 형식으로 작성된 본문 내용"
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.length}자 / HTML 태그 포함
              </p>
            </div>

            {/* Published Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="is_published" className="text-sm font-medium cursor-pointer">
                발행 상태 (체크 시 사이트에 공개)
              </label>
            </div>

            {/* Info */}
            <div className="pt-4 border-t text-sm text-gray-600 space-y-1">
              <p><strong>Slug:</strong> {tipData.slug}</p>
              <p><strong>ID:</strong> {tipData.id}</p>
              <p><strong>언어:</strong> {tipData.language}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
              >
                취소
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
