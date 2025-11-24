import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  structuredData?: object;
}

export function SEOHead({
  title = "KOREAUSIMGUIDE - 한국 유심/eSIM 가이드",
  description = "한국 여행을 위한 완벽한 유심/eSIM 가이드. SK, KT, LG 등 통신사 요금제 비교 및 한국 통신 꿀팁을 제공합니다.",
  keywords = "한국 유심, 한국 eSIM, 한국 여행, 통신사 비교, SK텔레콤, KT, LG유플러스, 알뜰폰, 한국 SIM 카드",
  ogImage = "https://koreausimguide.com/og-image.png",
  canonical,
  structuredData,
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
    if (ogImage) {
      updateMetaTag("property", "og:image", ogImage);
    }

    // Twitter Card tags 업데이트
    updateMetaTag("name", "twitter:title", title);
    updateMetaTag("name", "twitter:description", description);
    if (ogImage) {
      updateMetaTag("name", "twitter:image", ogImage);
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

    // Structured Data (JSON-LD) 추가
    if (structuredData) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, keywords, ogImage, canonical, structuredData]);

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

