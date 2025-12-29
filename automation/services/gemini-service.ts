import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GeneratedContent {
  title: string;
  excerpt: string;
  content: string;
  h2_tags: string[];
  keywords: string[];
  slug_suggestion: string;
  thumbnail_suggestion: string;
}

/**
 * Generates SEO-optimized blog content using Gemini AI
 *
 * Uses Gemini 2.5 Flash model to create comprehensive blog posts optimized for search engines.
 * The generated content includes structured HTML, H2 headings, meta descriptions, and keyword optimization.
 *
 * @param keyword - Target keyword for content generation (e.g., "Korea SIM card")
 * @param seoData - SEO metadata including search intent and CPC value
 * @param seoData.searchIntent - User search intent: "informational", "transactional", "navigational"
 * @param seoData.cpc - Cost per click in KRW, used to prioritize content quality
 * @returns Generated content with title, excerpt, HTML content, H2 tags, keywords, and slug
 * @throws Error if content generation fails, JSON parsing fails, or validation fails
 *
 * @example
 * const content = await generateBlogContent("Korea SIM card", {
 *   searchIntent: "informational",
 *   cpc: 5000
 * });
 * console.log(content.title); // "Ultimate Guide to Korea SIM Cards in 2025"
 */
export async function generateBlogContent(
  keyword: string,
  seoData: { searchIntent?: string; cpc?: number }
): Promise<GeneratedContent> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",  // 최신 안정 버전 (2025년 6월 릴리스)
    generationConfig: {
      temperature: 0.7,        // 창의성 조절 (0.7 = 균형)
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,   // 최대 출력 길이
    }
  });

  const prompt = createBlogPrompt(keyword, seoData);

  try {
    console.log(`🤖 Generating content for keyword: "${keyword}"`);

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log(`✅ Content generated successfully`);

    // JSON 파싱 (```json ... ``` 제거)
    // 여러 패턴 시도: 1) ```json...``` 2) ```json... (closing 없음) 3) { ... }
    let jsonContent = '';

    // 패턴 1: ```json\n...\n``` (정상적인 마크다운 코드 블록)
    let jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    } else {
      // 패턴 2: ```json\n... (closing backticks 없음 - Gemini가 자를 수 있음)
      jsonMatch = response.match(/```json\s*\n([\s\S]+)/);
      if (jsonMatch) {
        // closing ``` 가 있으면 제거
        jsonContent = jsonMatch[1].replace(/\n```\s*$/, '');
      } else {
        // 패턴 3: 직접 { } 매칭 (fallback)
        const firstBrace = response.indexOf('{');
        const lastBrace = response.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonContent = response.substring(firstBrace, lastBrace + 1);
        } else {
          console.error('Response preview:', response.substring(0, 500));
          console.error('Response end:', response.substring(response.length - 200));
          console.error('Response length:', response.length);
          throw new Error("Invalid JSON response from Gemini - no JSON block found");
        }
      }
    }

    const content = JSON.parse(jsonContent);

    // 디버깅: 생성된 콘텐츠 구조 확인
    console.log('📝 Generated content structure:');
    console.log('  - title:', content.title?.substring(0, 50) || 'MISSING');
    console.log('  - excerpt length:', content.excerpt?.length || 0);
    console.log('  - content length:', content.content?.length || 0);
    console.log('  - h2_tags:', content.h2_tags?.length || 0, 'items');
    console.log('  - keywords:', content.keywords?.length || 0, 'items');
    console.log('  - slug_suggestion:', content.slug_suggestion || 'MISSING');
    console.log('  - thumbnail_suggestion:', content.thumbnail_suggestion || 'MISSING');

    // 검증
    if (!content.title || !content.content || !content.excerpt) {
      throw new Error("Missing required fields in generated content");
    }

    // 필드 검증
    if (content.title.length > 100) {
      console.warn('⚠️ Title too long, truncating...');
      content.title = content.title.substring(0, 97) + '...';
    }

    if (content.excerpt.length > 200) {
      console.warn('⚠️ Excerpt too long, truncating...');
      content.excerpt = content.excerpt.substring(0, 197) + '...';
    }

    return content as GeneratedContent;

  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    throw error;
  }
}

/**
 * 블로그 생성 프롬프트 생성
 */
function createBlogPrompt(keyword: string, seoData: any): string {
  return `당신은 네이버 검색 상위 노출 전문가이자, 한국에 거주하는 외국인을 위한 생활 정보 전문 콘텐츠 작가입니다.

# 타겟 정보
- 타겟 키워드: "${keyword}"
- 검색 의도: ${seoData.searchIntent || '정보 검색'}
- 예상 CPC: ${seoData.cpc || 0}원 ${seoData.cpc > 3000 ? '(높은 가치의 키워드)' : ''}

# 글의 목표
이 글은 **블로그에 그대로 올려도 되는 완성형 가이드 글**입니다.
네이버가 좋아하는 **문제 해결형 제목 → 단계형 설명 → FAQ 스니펫 구조**를 모두 반영해야 합니다.

# 작성 요구사항

## 1. SEO 최적화 (네이버/구글 검색 상위 노출)
- 제목에 타겟 키워드 포함 (60자 이내) + "완벽 가이드", "총정리", "방법" 등 문제 해결형 키워드 포함
- 메타 설명 150자 이내, 클릭 유도 문구 포함
- H2 태그 최소 5-8개 (많을수록 좋음)
- H3 태그 각 H2마다 2-4개
- 키워드 밀도 1-2% 유지, 자연스러운 배치
- 글자 수: **최소 3000자 이상 ~ 5000자 목표** (네이버는 긴 글을 선호)

## 2. 콘텐츠 구조 (반드시 이 순서로)

### 1) 도입부 - 공감 형성 (300-500자)
- 외국인이 실제로 겪는 문제 상황 제시
- "이런 경험 있으신가요?" 형태의 공감 유도
- 이 글에서 해결할 내용 예고
- 왜 이 정보가 중요한지 설명

### 2) 배경 설명 (200-300자)
- 키워드 주제의 법적/제도적 배경 설명
- 왜 이 절차가 필요한지 이해시키기

### 3) 본문 - 단계별 가이드 (2500-4000자)
다음 형식을 **반드시** 따르세요:

<h2>전체 절차 한눈에 보기</h2>
<ul>
  <li>1단계: ...</li>
  <li>2단계: ...</li>
  <li>3단계: ...</li>
</ul>

<h2>1단계: [단계명]</h2>
<h3>[세부 주제 1]</h3>
<p>자세한 설명...</p>

<h3>[세부 주제 2]</h3>
<p>자세한 설명...</p>

<h2>2단계: [단계명]</h2>
...

각 단계마다:
- 실용적이고 구체적인 정보 (가격, 주소, 전화번호, URL)
- **공식 사이트 링크 반드시 포함** (예: <a href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer">하이코리아 공식 사이트</a>)
- 표, 리스트, 예시 적극 활용
- 2025년 최신 정보 반영
- 실패 사례와 주의사항 포함

### 4) FAQ 섹션 - 네이버 스니펫 노출용 (필수)
<h2>[주제] 관련 FAQ</h2>

<h3>Q1. [자주 묻는 질문 1]</h3>
<p>간결하고 명확한 답변 (50-100자)</p>

<h3>Q2. [자주 묻는 질문 2]</h3>
<p>간결하고 명확한 답변 (50-100자)</p>

... (최소 5-8개)

### 5) 마무리 (100-200자)
- 핵심 요약
- 추가 도움이 되는 정보 안내
- 관련 글 추천

## 3. 외부 링크 삽입 규칙 (매우 중요!)
- 공식 정부/기관 사이트 링크를 **문맥 안에 자연스럽게 삽입**
- 링크 형식: <a href="[URL]" target="_blank" rel="noopener noreferrer">[설명 텍스트]</a>
- 예시:
  * 하이코리아: https://www.hikorea.go.kr
  * 법무부 출입국: https://www.immigration.go.kr
  * 외국인종합안내센터: 1345
  * 관련 정부 기관 사이트
- 링크는 **설명 텍스트 안에 자연스럽게** 배치 (절대 "여기를 클릭" 같은 표현 사용 금지)

## 4. 톤앤매너
- 친근하고 도움이 되는 어투 (존댓말)
- 전문적이지만 어렵지 않게
- 외국인 입장에서 이해하기 쉽게
- "이런 경우", "예를 들어", "주의하세요" 같은 표현 적극 활용

## 5. 출력 형식
반드시 아래 JSON 형식으로 출력하세요:

\`\`\`json
{
  "title": "타겟 키워드 + 완벽 가이드/총정리/방법 (60자 이내)",
  "excerpt": "문제 상황 + 해결 방법 요약 (150자 이내, 클릭 유도)",
  "content": "HTML 형식의 본문 내용 (h2, h3, p, ul, ol, table, a 태그 사용, 최소 3000자)",
  "h2_tags": ["H2 태그 1", "H2 태그 2", "...", "최소 5-8개"],
  "keywords": ["키워드1", "키워드2", "...", "5-10개"],
  "slug_suggestion": "url-friendly-slug",
  "thumbnail_suggestion": "섬네일 이미지 주제 설명 (영어)"
}
\`\`\`

## 6. HTML 콘텐츠 작성 세부 가이드
- <h2>로 주요 섹션 구분 (최소 5-8개)
- <h3>로 하위 섹션 구분 (각 H2마다 2-4개)
- <p>로 단락 구분 (한 단락당 2-4문장)
- <ul>/<ol>로 리스트 작성 (단계, 항목 정리)
- <table>로 비교 정보 표현 (요금제, 서류 비교 등)
- <strong>로 핵심 키워드 강조
- <a href="..." target="_blank" rel="noopener noreferrer">로 외부 링크 삽입
- 절대 마크다운 문법(##, **, [](url)) 사용 금지 - 순수 HTML만 사용

## 7. 필수 체크리스트
- [ ] 제목에 타겟 키워드 포함
- [ ] 글자 수 3000자 이상
- [ ] H2 태그 5개 이상
- [ ] FAQ 섹션 5개 이상 질문
- [ ] 공식 사이트 링크 최소 2개 이상 포함
- [ ] 단계별 가이드 형식
- [ ] 2025년 최신 정보
- [ ] 표나 리스트 최소 3개 이상 사용
- [ ] 실패 사례/주의사항 포함
- [ ] 구체적인 정보 (가격, 연락처, 주소 등)

지금 바로 "${keyword}"에 대한 완성형 SEO 최적화 가이드 글을 작성해주세요.
네이버 검색 1페이지에 노출될 수 있는 퀄리티로 작성하세요.`;
}

/**
 * 콘텐츠 품질 검증 (SEO 최적화 기준)
 */
export function validateGeneratedContent(content: GeneratedContent): boolean {
  const errors: string[] = [];

  if (!content.title || content.title.length === 0) {
    errors.push('Title is empty');
  }

  // SEO 최적화 기준: 최소 3000자
  if (!content.content || content.content.length < 3000) {
    errors.push(`Content is too short (minimum 3000 characters, got ${content.content?.length || 0})`);
  }

  if (!content.excerpt || content.excerpt.length === 0) {
    errors.push('Excerpt is empty');
  }

  // SEO 최적화 기준: 최소 5개 H2 태그
  if (!content.h2_tags || content.h2_tags.length < 5) {
    errors.push(`Not enough H2 tags (minimum 5, got ${content.h2_tags?.length || 0})`);
  }

  if (!content.keywords || content.keywords.length < 5) {
    errors.push(`Not enough keywords (minimum 5, got ${content.keywords?.length || 0})`);
  }

  // 외부 링크 확인 (권장)
  const hasExternalLinks = content.content.includes('<a href=');
  if (!hasExternalLinks) {
    console.warn('⚠️ No external links found in content (recommended for SEO)');
  }

  if (errors.length > 0) {
    console.error('❌ Content validation failed:', errors);
    return false;
  }

  console.log('✅ Content validation passed (SEO optimized)');
  return true;
}
