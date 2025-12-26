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
 * Gemini API로 블로그 콘텐츠 생성
 * @param keyword 타겟 키워드
 * @param seoData SEO 관련 데이터
 * @returns 생성된 콘텐츠
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
  return `당신은 한국에 거주하는 외국인을 위한 생활 정보 전문 콘텐츠 작가입니다.

# 타겟 정보
- 타겟 키워드: "${keyword}"
- 검색 의도: ${seoData.searchIntent || '정보 검색'}
- 예상 CPC: ${seoData.cpc || 0}원 ${seoData.cpc > 3000 ? '(높은 가치의 키워드)' : ''}

# 작성 요구사항

## 1. SEO 최적화
- 제목에 타겟 키워드 포함 (60자 이내)
- 메타 설명 150자 이내, 클릭 유도 문구 포함
- H2 태그 3-5개, H3 태그 각 H2마다 2-3개
- 키워드 밀도 1-2% 유지
- 자연스러운 키워드 배치

## 2. 콘텐츠 구조
### 서론 (200-300자)
- 외국인이 겪는 실제 문제 제시
- 공감 형성 + 이 글에서 해결할 내용 예고

### 본문 (2000-3000자)
- 실용적이고 구체적인 정보
- 단계별 가이드 형식
- 표, 리스트, 예시 코드 적극 활용
- 최신 정보 (2025년 기준)

### 결론 (150-200자)
- 핵심 요약 (3-5줄)
- CTA (Call To Action): 다음 단계 안내

## 3. 톤앤매너
- 친근하고 도움이 되는 어투
- 전문적이지만 어렵지 않게
- 외국인 입장에서 이해하기 쉽게
- 존댓말 사용

## 4. 출력 형식
반드시 아래 JSON 형식으로 출력하세요:

\`\`\`json
{
  "title": "타겟 키워드가 포함된 제목 (60자 이내)",
  "excerpt": "메타 설명 (150자 이내)",
  "content": "HTML 형식의 본문 내용 (h2, h3, p, ul, ol, table 태그 사용)",
  "h2_tags": ["H2 태그 1", "H2 태그 2", "H2 태그 3"],
  "keywords": ["추출된", "키워드", "목록", "5개 정도"],
  "slug_suggestion": "url-friendly-slug",
  "thumbnail_suggestion": "섬네일 이미지 주제 설명"
}
\`\`\`

## 5. 필수 포함 요소
- 실제 사용 가능한 정보 (가격, 연락처, 위치 등)
- 한국 문화/시스템에 대한 설명
- FAQ 섹션 (3-5개 질문)
- 2025년 최신 정보 반영

## 6. HTML 콘텐츠 작성 가이드
- h2 태그로 주요 섹션 구분
- h3 태그로 하위 섹션 구분
- p 태그로 단락 구분
- ul/ol 태그로 리스트 작성
- table 태그로 비교 정보 표현
- strong, em 태그로 강조

지금 바로 "${keyword}"에 대한 블로그 글을 작성해주세요.`;
}

/**
 * 콘텐츠 품질 검증
 */
export function validateGeneratedContent(content: GeneratedContent): boolean {
  const errors: string[] = [];

  if (!content.title || content.title.length === 0) {
    errors.push('Title is empty');
  }

  if (!content.content || content.content.length < 500) {
    errors.push('Content is too short (minimum 500 characters)');
  }

  if (!content.excerpt || content.excerpt.length === 0) {
    errors.push('Excerpt is empty');
  }

  if (!content.h2_tags || content.h2_tags.length < 3) {
    errors.push('Not enough H2 tags (minimum 3)');
  }

  if (!content.keywords || content.keywords.length < 3) {
    errors.push('Not enough keywords (minimum 3)');
  }

  if (errors.length > 0) {
    console.error('❌ Content validation failed:', errors);
    return false;
  }

  return true;
}
