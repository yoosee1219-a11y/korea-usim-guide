'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import slugify from 'slugify'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {initialData?.id ? '블로그 글 수정' : '새 블로그 글 작성'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            {showPreview ? '편집' : '미리보기'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            취소
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            임시저장
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            발행하기
          </button>
        </div>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          {category && (
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded mb-4">
              {category}
            </span>
          )}
          {tags.length > 0 && (
            <div className="flex gap-2 mb-4">
              {tags.map(tag => (
                <span key={tag} className="bg-gray-100 px-2 py-1 rounded text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="블로그 글 제목을 입력하세요"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-2">URL 슬러그</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">koreausimguide.com/blog/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="url-slug"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">카테고리 선택</option>
              <option value="guide">가이드</option>
              <option value="comparison">비교</option>
              <option value="news">뉴스</option>
              <option value="tips">팁</option>
              <option value="review">리뷰</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">태그</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="태그 입력 후 Enter"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium mb-2">대표 이미지 URL</label>
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {featuredImage && (
              <img
                src={featuredImage}
                alt="Preview"
                className="mt-2 max-w-md rounded-lg"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium mb-2">요약 (선택사항)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="글 요약을 입력하세요 (비워두면 자동 생성)"
            />
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium mb-2">내용 *</label>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              className="bg-white"
              theme="snow"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="published" className="text-sm font-medium">
              바로 발행하기
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
