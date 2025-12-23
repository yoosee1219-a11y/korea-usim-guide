import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import slugify from 'slugify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from 'lucide-react'
import './BlogEditor.css'

interface BlogEditorProps {
  initialData?: {
    id?: string
    title_ko?: string
    title_en?: string
    title_vi?: string
    title_th?: string
    content_ko?: string
    content_en?: string
    content_vi?: string
    content_th?: string
    excerpt_ko?: string
    excerpt_en?: string
    excerpt_vi?: string
    excerpt_th?: string
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
  // Korean (primary language)
  const [title, setTitle] = useState(initialData?.title_ko || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt_ko || '')

  // All 11 languages (storing all even if UI only shows 3)
  const [titleEn, setTitleEn] = useState(initialData?.title_en || '')
  const [excerptEn, setExcerptEn] = useState(initialData?.excerpt_en || '')
  const [titleVi, setTitleVi] = useState(initialData?.title_vi || '')
  const [excerptVi, setExcerptVi] = useState(initialData?.excerpt_vi || '')
  const [titleTh, setTitleTh] = useState(initialData?.title_th || '')
  const [excerptTh, setExcerptTh] = useState(initialData?.excerpt_th || '')
  const [titleTl, setTitleTl] = useState(initialData?.title_tl || '')
  const [excerptTl, setExcerptTl] = useState(initialData?.excerpt_tl || '')
  const [titleUz, setTitleUz] = useState(initialData?.title_uz || '')
  const [excerptUz, setExcerptUz] = useState(initialData?.excerpt_uz || '')
  const [titleNe, setTitleNe] = useState(initialData?.title_ne || '')
  const [excerptNe, setExcerptNe] = useState(initialData?.excerpt_ne || '')
  const [titleMn, setTitleMn] = useState(initialData?.title_mn || '')
  const [excerptMn, setExcerptMn] = useState(initialData?.excerpt_mn || '')
  const [titleId, setTitleId] = useState(initialData?.title_id || '')
  const [excerptId, setExcerptId] = useState(initialData?.excerpt_id || '')
  const [titleMy, setTitleMy] = useState(initialData?.title_my || '')
  const [excerptMy, setExcerptMy] = useState(initialData?.excerpt_my || '')
  const [titleZh, setTitleZh] = useState(initialData?.title_zh || '')
  const [excerptZh, setExcerptZh] = useState(initialData?.excerpt_zh || '')
  const [titleRu, setTitleRu] = useState(initialData?.title_ru || '')
  const [excerptRu, setExcerptRu] = useState(initialData?.excerpt_ru || '')

  const [slug, setSlug] = useState(initialData?.slug || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [featuredImage, setFeaturedImage] = useState(initialData?.featured_image || '')
  const [isPublished, setIsPublished] = useState(initialData?.is_published || false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState<{
    title: boolean
    excerpt: boolean
    content: boolean
  }>({ title: false, excerpt: false, content: false })
  const [showPreview, setShowPreview] = useState(false)
  const [expandedLanguages, setExpandedLanguages] = useState<Record<string, boolean>>({
    en: false,
    vi: false,
    th: false
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      TextStyle,
      Color,
    ],
    content: initialData?.content_ko || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  })

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('adminToken')
        const response = await fetch('/api/tips/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (data.categories) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

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

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleAutoTranslate = async () => {
    if (!title.trim() || !editor?.getHTML()) {
      alert('제목과 본문을 먼저 작성해주세요.')
      return
    }

    setIsTranslating(true)
    setTranslationProgress({ title: false, excerpt: false, content: false })

    try {
      const token = localStorage.getItem('adminToken')
      const excerptText = excerpt || editor.getText().substring(0, 200)
      const contentText = editor.getText()

      // 병렬 처리: 모든 번역을 동시에 실행
      const [titleData, excerptData, contentData] = await Promise.all([
        // Translate title
        fetch('/api/translate-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: title, sourceLanguage: 'ko' })
        }).then(res => res.json()).then(data => {
          setTranslationProgress(prev => ({ ...prev, title: true }))
          return data
        }),

        // Translate excerpt
        fetch('/api/translate-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: excerptText, sourceLanguage: 'ko' })
        }).then(res => res.json()).then(data => {
          setTranslationProgress(prev => ({ ...prev, excerpt: true }))
          return data
        }),

        // Translate content
        fetch('/api/translate-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: contentText, sourceLanguage: 'ko' })
        }).then(res => res.json()).then(data => {
          setTranslationProgress(prev => ({ ...prev, content: true }))
          return data
        })
      ])

      // Update state with translated content (all 11 languages)
      if (titleData.translations) {
        setTitleEn(titleData.translations.en || '')
        setTitleVi(titleData.translations.vi || '')
        setTitleTh(titleData.translations.th || '')
        setTitleTl(titleData.translations.tl || '')
        setTitleUz(titleData.translations.uz || '')
        setTitleNe(titleData.translations.ne || '')
        setTitleMn(titleData.translations.mn || '')
        setTitleId(titleData.translations.id || '')
        setTitleMy(titleData.translations.my || '')
        setTitleZh(titleData.translations['zh-CN'] || titleData.translations.zh || '')
        setTitleRu(titleData.translations.ru || '')
      }

      if (excerptData.translations) {
        setExcerptEn(excerptData.translations.en || '')
        setExcerptVi(excerptData.translations.vi || '')
        setExcerptTh(excerptData.translations.th || '')
        setExcerptTl(excerptData.translations.tl || '')
        setExcerptUz(excerptData.translations.uz || '')
        setExcerptNe(excerptData.translations.ne || '')
        setExcerptMn(excerptData.translations.mn || '')
        setExcerptId(excerptData.translations.id || '')
        setExcerptMy(excerptData.translations.my || '')
        setExcerptZh(excerptData.translations['zh-CN'] || excerptData.translations.zh || '')
        setExcerptRu(excerptData.translations.ru || '')
      }

      // Content stored as plain text for now (can be enhanced later to preserve formatting)
      if (contentData.translations) {
        // You can enhance this to convert back to HTML with formatting if needed
        // For now, storing as plain text
      }

      alert('번역이 완료되었습니다!')

      // Expand all language sections to show translated content
      setExpandedLanguages({ en: true, vi: true, th: true })
    } catch (error) {
      console.error('Translation error:', error)
      alert('번역 중 오류가 발생했습니다.')
    } finally {
      setIsTranslating(false)
      setTranslationProgress({ title: false, excerpt: false, content: false })
    }
  }

  const toggleLanguage = (lang: string) => {
    setExpandedLanguages(prev => ({ ...prev, [lang]: !prev[lang] }))
  }

  const addLink = () => {
    const url = window.prompt('URL을 입력하세요:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt('이미지 URL을 입력하세요:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !editor?.getHTML()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    const content = editor.getHTML()

    setIsSaving(true)
    try {
      await onSave({
        id: initialData?.id,
        title_ko: title,
        title_en: titleEn,
        title_vi: titleVi,
        title_th: titleTh,
        title_tl: titleTl,
        title_uz: titleUz,
        title_ne: titleNe,
        title_mn: titleMn,
        title_id: titleId,
        title_my: titleMy,
        title_zh: titleZh,
        title_ru: titleRu,
        content_ko: content,
        content_en: excerptEn, // Simplified: Using excerpt as content for now
        content_vi: excerptVi,
        content_th: excerptTh,
        content_tl: excerptTl,
        content_uz: excerptUz,
        content_ne: excerptNe,
        content_mn: excerptMn,
        content_id: excerptId,
        content_my: excerptMy,
        content_zh: excerptZh,
        content_ru: excerptRu,
        excerpt_ko: excerpt || editor.getText().substring(0, 200),
        excerpt_en: excerptEn,
        excerpt_vi: excerptVi,
        excerpt_th: excerptTh,
        excerpt_tl: excerptTl,
        excerpt_uz: excerptUz,
        excerpt_ne: excerptNe,
        excerpt_mn: excerptMn,
        excerpt_id: excerptId,
        excerpt_my: excerptMy,
        excerpt_zh: excerptZh,
        excerpt_ru: excerptRu,
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

  if (!editor) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {initialData?.id ? '글 수정' : '새 글 작성'}
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleAutoTranslate}
            disabled={isTranslating || !title.trim()}
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100"
          >
            {isTranslating ? '번역 중...' : '🌐 자동 번역'}
          </Button>
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

      {/* Translation Progress Indicator */}
      {isTranslating && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <p className="font-medium text-blue-900">번역 진행 중...</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className={translationProgress.title ? 'text-green-600' : 'text-gray-500'}>
                  {translationProgress.title ? '✓' : '⏳'} 제목
                </span>
                <span className={translationProgress.excerpt ? 'text-green-600' : 'text-gray-500'}>
                  {translationProgress.excerpt ? '✓' : '⏳'} 요약
                </span>
                <span className={translationProgress.content ? 'text-green-600' : 'text-gray-500'}>
                  {translationProgress.content ? '✓' : '⏳'} 본문
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {showPreview ? (
        <Card className="p-6">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          {featuredImage && (
            <img src={featuredImage} alt={title} className="w-full h-64 object-cover mb-4 rounded" />
          )}
          {excerpt && <p className="text-gray-600 mb-4">{excerpt}</p>}
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
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
              <Label>본문 *</Label>

              {/* Toolbar */}
              <div className="border border-gray-300 rounded-t-md p-2 bg-gray-50 flex flex-wrap gap-1">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <UnderlineIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>

                <div className="w-px bg-gray-300 mx-1" />

                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <Heading3 className="w-4 h-4" />
                </button>

                <div className="w-px bg-gray-300 mx-1" />

                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <Quote className="w-4 h-4" />
                </button>

                <div className="w-px bg-gray-300 mx-1" />

                <button
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <AlignRight className="w-4 h-4" />
                </button>

                <div className="w-px bg-gray-300 mx-1" />

                <button
                  onClick={addLink}
                  className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-300' : ''}`}
                  type="button"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={addImage}
                  className="p-2 rounded hover:bg-gray-200"
                  type="button"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <div className="w-px bg-gray-300 mx-1" />

                <button
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
                  type="button"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
                  type="button"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>

              {/* Editor */}
              <div className="border border-gray-300 rounded-b-md">
                <EditorContent editor={editor} />
              </div>
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
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

            {/* Multi-language fields */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">다국어 번역</h3>
              <p className="text-sm text-gray-600 mb-3">
                '🌐 자동 번역' 버튼을 클릭하면 한국어 내용이 자동으로 번역됩니다.
              </p>

              {/* English */}
              <div className="mb-3">
                <button
                  onClick={() => toggleLanguage('en')}
                  className="flex items-center justify-between w-full p-2 bg-gray-100 hover:bg-gray-200 rounded"
                  type="button"
                >
                  <span className="font-medium">🇬🇧 English</span>
                  <span>{expandedLanguages.en ? '▼' : '▶'}</span>
                </button>
                {expandedLanguages.en && (
                  <div className="mt-2 space-y-2 p-2 border rounded">
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                        placeholder="English title"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Excerpt</Label>
                      <textarea
                        value={excerptEn}
                        onChange={(e) => setExcerptEn(e.target.value)}
                        placeholder="English excerpt"
                        className="w-full p-2 border rounded h-20 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Vietnamese */}
              <div className="mb-3">
                <button
                  onClick={() => toggleLanguage('vi')}
                  className="flex items-center justify-between w-full p-2 bg-gray-100 hover:bg-gray-200 rounded"
                  type="button"
                >
                  <span className="font-medium">🇻🇳 Tiếng Việt</span>
                  <span>{expandedLanguages.vi ? '▼' : '▶'}</span>
                </button>
                {expandedLanguages.vi && (
                  <div className="mt-2 space-y-2 p-2 border rounded">
                    <div>
                      <Label className="text-xs">Tiêu đề</Label>
                      <Input
                        value={titleVi}
                        onChange={(e) => setTitleVi(e.target.value)}
                        placeholder="Vietnamese title"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Trích dẫn</Label>
                      <textarea
                        value={excerptVi}
                        onChange={(e) => setExcerptVi(e.target.value)}
                        placeholder="Vietnamese excerpt"
                        className="w-full p-2 border rounded h-20 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Thai */}
              <div className="mb-3">
                <button
                  onClick={() => toggleLanguage('th')}
                  className="flex items-center justify-between w-full p-2 bg-gray-100 hover:bg-gray-200 rounded"
                  type="button"
                >
                  <span className="font-medium">🇹🇭 ภาษาไทย</span>
                  <span>{expandedLanguages.th ? '▼' : '▶'}</span>
                </button>
                {expandedLanguages.th && (
                  <div className="mt-2 space-y-2 p-2 border rounded">
                    <div>
                      <Label className="text-xs">หัวข้อ</Label>
                      <Input
                        value={titleTh}
                        onChange={(e) => setTitleTh(e.target.value)}
                        placeholder="Thai title"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">สรุป</Label>
                      <textarea
                        value={excerptTh}
                        onChange={(e) => setExcerptTh(e.target.value)}
                        placeholder="Thai excerpt"
                        className="w-full p-2 border rounded h-20 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
