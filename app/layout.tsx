import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: '한국 유심 요금제 비교 - Korea USIM Comparison',
    template: '%s | 한국 유심 요금제 비교'
  },
  description: '한국 통신사 유심 요금제를 쉽고 빠르게 비교하세요. SKT, KT, LG U+, MVNO 등 다양한 요금제를 한눈에!',
  keywords: ['한국 유심', '유심 요금제', '통신사 비교', 'SKT', 'KT', 'LG U+', 'MVNO', '선불 유심', '데이터 요금제'],
  authors: [{ name: 'Korea USIM Comparison' }],
  creator: 'Korea USIM Comparison',
  publisher: 'Korea USIM Comparison',
  metadataBase: new URL('https://korea-usim-guide-yoosee1219-3402s-projects.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/',
    },
  },
  openGraph: {
    title: '한국 유심 요금제 비교 - Korea USIM Comparison',
    description: '한국 통신사 유심 요금제를 쉽고 빠르게 비교하세요. SKT, KT, LG U+, MVNO 등 다양한 요금제를 한눈에!',
    url: 'https://korea-usim-guide-yoosee1219-3402s-projects.vercel.app',
    siteName: '한국 유심 요금제 비교',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '한국 유심 요금제 비교',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '한국 유심 요금제 비교 - Korea USIM Comparison',
    description: '한국 통신사 유심 요금제를 쉽고 빠르게 비교하세요',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
