/**
 * Structured Data Component
 * Adds JSON-LD Schema for better SEO
 */

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Korea USIM Guide',
    url: 'https://koreausimguide.com',
    logo: 'https://koreausimguide.com/logo.png',
    description: '한국 통신사 유심 요금제를 쉽고 빠르게 비교하세요. SKT, KT, LG U+, MVNO 등 다양한 요금제를 한눈에!',
    sameAs: [
      // Add social media URLs here when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Korean', 'English', 'Vietnamese', 'Thai', 'Tagalog', 'Uzbek', 'Nepali', 'Mongolian', 'Indonesian', 'Burmese', 'Chinese', 'Russian']
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Korea USIM Guide',
    url: 'https://koreausimguide.com',
    description: '한국 통신사 유심 요금제 비교 및 가이드',
    inLanguage: ['ko', 'en', 'vi', 'th', 'tl', 'uz', 'ne', 'mn', 'id', 'my', 'zh', 'ru'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://koreausimguide.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string, url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function ProductSchema({ plan }: { plan: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: plan.name,
    description: `${plan.data_amount} 데이터, ${plan.voice_minutes || '무제한'} 통화, ${plan.network_type} 요금제`,
    brand: {
      '@type': 'Brand',
      name: plan.carrier?.name || '통신사'
    },
    offers: {
      '@type': 'Offer',
      price: plan.discounted_fee || plan.monthly_fee,
      priceCurrency: 'KRW',
      availability: plan.is_active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    aggregateRating: plan.rating ? {
      '@type': 'AggregateRating',
      ratingValue: plan.rating,
      reviewCount: plan.review_count || 0
    } : undefined
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BlogPostSchema({ post }: { post: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title_ko || post.title_en,
    description: post.excerpt_ko || post.excerpt_en,
    image: post.featured_image || 'https://koreausimguide.com/og-image.png',
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author || 'Korea USIM Guide'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Korea USIM Guide',
      logo: {
        '@type': 'ImageObject',
        url: 'https://koreausimguide.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://koreausimguide.com/blog/${post.slug}`
    },
    keywords: post.tags?.join(', ') || '',
    articleSection: post.category || 'Guide'
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQPageSchema({ faqs }: { faqs: Array<{ question: string, answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
