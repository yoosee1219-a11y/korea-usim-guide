'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import { useLanguage } from '@/lib/useLanguage'
import type { BlogPost } from '@/types/database'

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const { language, setLanguage } = useLanguage()
  const { toasts, hideToast, error } = useToast()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/blog')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      } else {
        error('블로그 포스트를 불러오는데 실패했습니다')
      }
    } catch (err) {
      console.error('Failed to fetch blog posts:', err)
      error('서버와의 연결에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(posts.map(post => post.category).filter(Boolean))] as string[]

  const filteredPosts = selectedCategory
    ? posts.filter(post => post.category === selectedCategory)
    : posts

  const getTitle = (post: BlogPost) => {
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

  const getExcerpt = (post: BlogPost) => {
    const excerptMap = {
      ko: post.excerpt_ko,
      en: post.excerpt_en,
      tl: post.excerpt_tl,
    }
    return excerptMap[language as keyof typeof excerptMap] || post.excerpt_ko || ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📝 블로그
              </h1>
              <p className="text-gray-600 mt-2">
                유심 요금제와 관련된 유용한 정보를 확인하세요
              </p>
            </div>
            <Link
              href="/"
              className="text-primary hover:text-primary-dark transition-colors"
            >
              ← 홈으로
            </Link>
          </div>
        </div>
      </header>

      {/* 필터 */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === ''
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              전체
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 언어 선택 */}
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

      {/* 블로그 목록 */}
      <main className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">블로그 포스트가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {post.featured_image && (
                  <div className="aspect-video relative bg-gray-200">
                    <img
                      src={post.featured_image}
                      alt={getTitle(post)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  {post.category && (
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm rounded-full mb-3">
                      {post.category}
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {getTitle(post)}
                  </h2>
                  {getExcerpt(post) && (
                    <p className="text-gray-600 line-clamp-3 mb-4">
                      {getExcerpt(post)}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.author || '관리자'}</span>
                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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
