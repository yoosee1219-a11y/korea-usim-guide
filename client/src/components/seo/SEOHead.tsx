import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  canonical?: string;
  structuredData?: object;
  hreflangUrls?: Array<{ lang: string; url: string }>; // 다국어 SEO
  currentLanguage?: string;
}

export function SEOHead({
  title = "KOREAUSIMGUIDE - 한국 유심/eSIM 가이드",
  description = "한국 여행을 위한 완벽한 유심/eSIM 가이드. SK, KT, LG 등 통신사 요금제 비교 및 한국 통신 꿀팁을 제공합니다.",
  keywords = "한국 유심, 한국 eSIM, 한국 여행, 통신사 비교, SK텔레콤, KT, LG유플러스, 알뜰폰, 한국 SIM 카드",
  ogImage = "https://koreausimguide.com/diverse_travelers_in_seoul_using_smartphones.png",
  ogType = "website",
  canonical,
  structuredData,
  hreflangUrls,
  currentLanguage = 'ko',
}: SEOHeadProps) {
  useEffect(() => {
    // Title 업데이트
    document.title = title;

    // Meta description 업데이트
    updateMetaTag("name", "description", description);
    updateMetaTag("name", "keywords", keywords);

    // Open Graph tags 업데이트
    updateMetaTag("property", "og:title", title);
    updateMetaTag("property", "og:description", description);
    updateMetaTag("property", "og:type", ogType);
    updateMetaTag("property", "og:site_name", "KOREAUSIMGUIDE");
    updateMetaTag("property", "og:locale", "ko_KR");
    if (ogImage) {
      updateMetaTag("property", "og:image", ogImage);
      updateMetaTag("property", "og:image:alt", title);
      updateMetaTag("property", "og:image:width", "1200");
      updateMetaTag("property", "og:image:height", "630");
      updateMetaTag("property", "og:image:type", "image/png");
    }
    if (canonical) {
      updateMetaTag("property", "og:url", canonical);
    }

    // Twitter Card tags 업데이트
    updateMetaTag("name", "twitter:card", "summary_large_image");
    updateMetaTag("name", "twitter:title", title);
    updateMetaTag("name", "twitter:description", description);
    if (ogImage) {
      updateMetaTag("name", "twitter:image", ogImage);
      updateMetaTag("name", "twitter:image:alt", title);
    }

    // Canonical URL 업데이트
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.rel = "canonical";
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    }

    // hreflang 태그 추가 (다국어 SEO)
    // 기존 hreflang 태그 모두 제거
    const existingHreflang = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingHreflang.forEach(link => link.remove());

    if (hreflangUrls && hreflangUrls.length > 0) {
      hreflangUrls.forEach(({ lang, url }) => {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        link.href = url;
        document.head.appendChild(link);
      });

      // x-default 추가 (영어를 기본으로)
      const defaultLink = document.createElement('link');
      defaultLink.rel = 'alternate';
      defaultLink.hreflang = 'x-default';
      defaultLink.href = hreflangUrls.find(u => u.lang === 'en')?.url || hreflangUrls[0].url;
      document.head.appendChild(defaultLink);
    }

    // OG locale 업데이트 (현재 언어에 맞게)
    const localeMap: Record<string, string> = {
      ko: 'ko_KR',
      en: 'en_US',
      vi: 'vi_VN',
      th: 'th_TH',
      tl: 'tl_PH',
      uz: 'uz_UZ',
      ne: 'ne_NP',
      mn: 'mn_MN',
      id: 'id_ID',
      my: 'my_MM',
      zh: 'zh_CN',
      ru: 'ru_RU',
    };
    updateMetaTag("property", "og:locale", localeMap[currentLanguage] || 'ko_KR');

    // Structured Data (JSON-LD) 추가
    if (structuredData) {
      // 기존 구조화된 데이터 스크립트 태그 모두 제거
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());

      // 구조화된 데이터가 배열인지 단일 객체인지 확인
      const dataArray = Array.isArray(structuredData) ? structuredData : [structuredData];
      
      // 각 구조화된 데이터에 대해 스크립트 태그 생성
      dataArray.forEach((data, index) => {
        const scriptTag = document.createElement("script");
        scriptTag.type = "application/ld+json";
        scriptTag.id = `structured-data-${index}`;
        scriptTag.textContent = JSON.stringify(data);
        document.head.appendChild(scriptTag);
      });
    }
  }, [title, description, keywords, ogImage, canonical, structuredData, hreflangUrls, currentLanguage]);

  return null; // 이 컴포넌트는 렌더링하지 않음
}

function updateMetaTag(attribute: "name" | "property", key: string, value: string) {
  let metaTag = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement;
  if (!metaTag) {
    metaTag = document.createElement("meta");
    metaTag.setAttribute(attribute, key);
    document.head.appendChild(metaTag);
  }
  metaTag.content = value;
}

