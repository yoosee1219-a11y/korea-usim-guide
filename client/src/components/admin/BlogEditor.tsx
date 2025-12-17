import { useState, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import slugify from 'slugify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

interface BlogEditorProps {
  initialData?: {
    id?: string
    title_ko?: string
    content_ko?: string
    excerpt_ko?: string
    slug?: string
    category?: string
    tags?: string[]
    featured_image?: string
    is_published?: boolean
  }
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export default function BlogEditor({ initialData, onSave, onCancel }: BlogEditorProps) {
  const [title, setTitle] = useState(initialData?.title_ko || '')
  const [content, setContent] = useState(initialData?.content_ko || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt_ko || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [featuredImage, setFeaturedImage] = useState(initialData?.featured_image || '')
  const [isPublished, setIsPublished] = useState(initialData?.is_published || false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !initialData?.slug) {
      const autoSlug = slugify(title, {
        lower: true,
        strict: true,
        locale: 'ko'
      })
      setSlug(autoSlug)
    }
  }, [title, initialData])

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['clean']
    ]
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image',
    'color', 'background',
    'align'
  ]

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        id: initialData?.id,
        title_ko: title,
        content_ko: content,
        excerpt_ko: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200),
        slug: slug || slugify(title, { lower: true, strict: true }),
        category,
        tags,
        featured_image: featuredImage,
        is_published: publish
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
          {initialData?.id ? '글 수정' : '새 글 작성'}
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowPreview(!showPreview)} variant="outline">
            {showPreview ? '편집' : '미리보기'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            취소
          </Button>
          <Button onClick={() => handleSave(false)} disabled={isSaving}>
            임시저장
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving}>
            발행하기
          </Button>
        </div>
      </div>

      {showPreview ? (
        <Card className="p-6">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          {featuredImage && (
            <img src={featuredImage} alt={title} className="w-full h-64 object-cover mb-4 rounded" />
          )}
          {excerpt && <p className="text-gray-600 mb-4">{excerpt}</p>}
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="글 제목을 입력하세요"
                className="text-2xl font-bold"
              />
            </div>

            <div>
              <Label htmlFor="slug">URL 슬러그</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-slug"
              />
              <p className="text-sm text-gray-500 mt-1">
                /blog/{slug || 'url-slug'}
              </p>
            </div>

            <div>
              <Label htmlFor="content">본문 *</Label>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                className="h-96 mb-12"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">카테고리</h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">선택하세요</option>
                <option value="가이드">가이드</option>
                <option value="비교">비교</option>
                <option value="뉴스">뉴스</option>
                <option value="팁">팁</option>
                <option value="리뷰">리뷰</option>
              </select>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">태그</h3>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="태그 입력"
                />
                <Button onClick={handleAddTag} size="sm">추가</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">대표 이미지</h3>
              <Input
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="이미지 URL"
              />
              {featuredImage && (
                <img src={featuredImage} alt="Preview" className="mt-2 w-full rounded" />
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">요약 (선택사항)</h3>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="글의 간단한 요약 (비워두면 자동 생성)"
                className="w-full p-2 border rounded h-24"
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
