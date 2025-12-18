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
  const [excerpt, setExcerpt] = useState(initialData?.excerpt_ko || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [featuredImage, setFeaturedImage] = useState(initialData?.featured_image || '')
  const [isPublished, setIsPublished] = useState(initialData?.is_published || false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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
        content_ko: content,
        excerpt_ko: excerpt || editor.getText().substring(0, 200),
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
