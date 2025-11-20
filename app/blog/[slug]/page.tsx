'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import { useLanguage } from '@/lib/useLanguage'
import type { BlogPost } from '@/types/database'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const { language, setLanguage, isLoaded } = useLanguage()
  const { toasts, hideToast, error } = useToast()

  useEffect(() => {
    fetchPost()
  }, [slug])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/blog?slug=${slug}`)
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setPost(data[0])
        } else {
          error('블로그 포스트를 찾을 수 없습니다')
        }
      } else {
        error('블로그 포스트를 불러오는데 실패했습니다')
      }
    } catch (err) {
      console.error('Failed to fetch blog post:', err)
      error('서버와의 연결에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">블로그 포스트를 찾을 수 없습니다</h1>
          <Link href="/blog" className="text-primary hover:underline">
            블로그 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const getTitle = () => {
    const titleMap = {
      ko: post.title_ko,
      en: post.title_en,
      vi: post.title_vi,
      th: post.title_th,
      tl: post.title_tl,
      uz: post.title_uz,
      ne: post.title_ne,
      mn: post.title_mn,
      id: post.title_id,
      my: post.title_my,
      zh: post.title_zh,
      ru: post.title_ru,
    }
    return titleMap[language] || post.title_ko
  }

  const getContent = () => {
    const contentMap = {
      ko: post.content_ko,
      en: post.content_en,
      vi: post.content_vi,
      th: post.content_th,
      tl: post.content_tl,
      uz: post.content_uz,
      ne: post.content_ne,
      mn: post.content_mn,
      id: post.content_id,
      my: post.content_my,
      zh: post.content_zh,
      ru: post.content_ru,
    }
    return contentMap[language] || post.content_ko
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link
              href="/blog"
              className="text-primary hover:text-primary-dark transition-colors"
            >
              ← 블로그 목록
            </Link>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ko">🇰🇷 한국어</option>
              <option value="en">🇺🇸 English</option>
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="th">🇹🇭 ไทย</option>
              <option value="tl">🇵🇭 Tagalog</option>
              <option value="uz">🇺🇿 Oʻzbek</option>
              <option value="ne">🇳🇵 नेपाली</option>
              <option value="mn">🇲🇳 Монгол</option>
              <option value="id">🇮🇩 Bahasa Indonesia</option>
              <option value="my">🇲🇲 မြန်မာ</option>
              <option value="zh">🇨🇳 中文</option>
              <option value="ru">🇷🇺 Русский</option>
            </select>
          </div>
        </div>
      </header>

      {/* 포스트 내용 */}
      <main className="container mx-auto px-4 py-12">
        <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          {post.featured_image && (
            <div className="aspect-video relative bg-gray-200">
              <img
                src={post.featured_image}
                alt={getTitle()}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8 md:p-12">
            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-4 items-center mb-6 text-sm text-gray-600">
              {post.category && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">
                  {post.category}
                </span>
              )}
              <span>{post.author || '관리자'}</span>
              <span>•</span>
              <time>{new Date(post.published_at || post.created_at).toLocaleDateString('ko-KR')}</time>
            </div>

            {/* 제목 */}
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {getTitle()}
            </h1>

            {/* 태그 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 내용 */}
            <div className="prose prose-lg max-w-none">
              {getContent().split('\n').map((paragraph, index) => (
                paragraph.trim() ? (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ) : (
                  <br key={index} />
                )
              ))}
            </div>
          </div>
        </article>

        {/* 하단 네비게이션 */}
        <div className="max-w-4xl mx-auto mt-8 flex justify-center">
          <Link
            href="/blog"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            블로그 목록으로 돌아가기
          </Link>
        </div>
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
