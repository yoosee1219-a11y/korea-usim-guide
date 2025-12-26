import Replicate from "replicate";
import { createApi } from "unsplash-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replicate (Stable Diffusion) 초기화
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

// Unsplash 초기화
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || 'demo',
});

export interface GeneratedImage {
  url: string;
  type: 'ai' | 'stock';
  source: 'replicate' | 'unsplash';
  prompt?: string;
  query?: string;
}

/**
 * Stable Diffusion으로 대표 이미지 생성
 * @param prompt 이미지 생성 프롬프트 (영어)
 * @returns 생성된 이미지 URL
 */
export async function generateThumbnailWithAI(prompt: string): Promise<GeneratedImage> {
  try {
    console.log(`🎨 Generating AI thumbnail with prompt: "${prompt}"`);

    // SDXL (Stable Diffusion XL) 사용
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          negative_prompt: "ugly, blurry, low quality, distorted, deformed",
        }
      }
    ) as string[];

    const imageUrl = output[0];
    console.log(`✅ AI thumbnail generated: ${imageUrl}`);

    return {
      url: imageUrl,
      type: 'ai',
      source: 'replicate',
      prompt: prompt
    };

  } catch (error) {
    console.error("❌ AI image generation failed:", error);
    throw error;
  }
}

/**
 * Unsplash에서 관련 이미지 검색
 * @param query 검색어 (한국어 → 영어로 자동 번역 필요)
 * @param count 가져올 이미지 개수
 * @returns 이미지 URL 배열
 */
export async function searchStockImages(
  query: string,
  count: number = 3
): Promise<GeneratedImage[]> {
  try {
    console.log(`📸 Searching Unsplash for: "${query}"`);

    // 영어 검색어로 변환 (간단한 매핑 - 나중에 Google Translate 사용 가능)
    const englishQuery = translateKeywordToEnglish(query);

    const result = await unsplash.search.getPhotos({
      query: englishQuery,
      page: 1,
      perPage: count,
      orientation: 'landscape',
    });

    if (result.errors) {
      throw new Error(`Unsplash API error: ${result.errors.join(', ')}`);
    }

    const images: GeneratedImage[] = result.response?.results.map(photo => ({
      url: photo.urls.regular,
      type: 'stock',
      source: 'unsplash',
      query: englishQuery
    })) || [];

    console.log(`✅ Found ${images.length} stock images`);

    return images;

  } catch (error) {
    console.error("❌ Unsplash search failed:", error);
    // 실패 시 빈 배열 반환 (블로킹하지 않음)
    return [];
  }
}

/**
 * 한국어 키워드를 영어로 간단 매핑
 * (추후 Google Translate API 사용 가능)
 */
function translateKeywordToEnglish(korean: string): string {
  const translations: Record<string, string> = {
    '한국': 'korea',
    '유심': 'sim card',
    '유심카드': 'sim card',
    '외국인': 'foreigner',
    '개통': 'activation',
    'LG': 'LG',
    'SK': 'SK',
    'KT': 'KT',
    '통신사': 'telecom',
    '요금제': 'plan',
    '공항': 'airport',
    '인천': 'incheon',
    '서울': 'seoul',
    '등록': 'registration',
    '외국인등록증': 'alien registration card',
    '비자': 'visa',
    '체류': 'residence',
  };

  let english = korean;
  for (const [ko, en] of Object.entries(translations)) {
    english = english.replace(new RegExp(ko, 'g'), en);
  }

  return english || 'korea travel';
}

/**
 * Gemini가 생성한 이미지 프롬프트를 영어로 변환
 * @param koreanPrompt 한국어 프롬프트
 * @returns 영어 프롬프트
 */
export function convertImagePromptToEnglish(koreanPrompt: string): string {
  // 간단한 매핑 (추후 Google Translate API 사용)
  const prompt = translateKeywordToEnglish(koreanPrompt);

  // Stable Diffusion 최적화
  return `${prompt}, professional photo, high quality, detailed, 4k, korean style`;
}

/**
 * 이미지 URL에서 다운로드하여 로컬에 저장
 * @param imageUrl 이미지 URL
 * @param filename 저장할 파일명
 * @returns 저장된 파일 경로
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  filename: string
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // attached_assets 폴더에 저장
    const assetsDir = path.resolve(__dirname, '../../attached_assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const filePath = path.join(assetsDir, filename);
    fs.writeFileSync(filePath, buffer);

    console.log(`✅ Image saved: ${filePath}`);

    // 웹에서 접근 가능한 URL 반환
    return `/assets/${filename}`;

  } catch (error) {
    console.error("❌ Image download failed:", error);
    // 실패 시 원본 URL 반환
    return imageUrl;
  }
}

/**
 * 콘텐츠용 이미지 패키지 생성
 * @param keyword 키워드
 * @param thumbnailPrompt 대표 이미지 프롬프트 (Gemini 생성)
 * @returns 대표 이미지 + 본문 이미지들
 */
export async function generateContentImages(
  keyword: string,
  thumbnailPrompt: string
): Promise<{
  thumbnail: GeneratedImage;
  contentImages: GeneratedImage[];
}> {
  try {
    console.log(`\n🎨 Generating images for keyword: "${keyword}"`);

    let thumbnail: GeneratedImage;

    // 1. AI 대표 이미지 생성 (Replicate fallback to Unsplash)
    try {
      const englishPrompt = convertImagePromptToEnglish(thumbnailPrompt);
      thumbnail = await generateThumbnailWithAI(englishPrompt);
      console.log(`✅ Thumbnail: AI generated`);
    } catch (aiError: any) {
      // Replicate 실패 시 Unsplash로 폴백
      console.warn(`⚠️ AI thumbnail failed (${aiError.message}), falling back to Unsplash`);
      const unsplashImages = await searchStockImages(keyword, 1);
      if (unsplashImages.length === 0) {
        // Unsplash도 실패하면 플레이스홀더 이미지 사용
        console.warn(`⚠️ Unsplash also failed, using placeholder`);
        thumbnail = {
          url: `https://via.placeholder.com/1024x1024.png?text=${encodeURIComponent(keyword)}`,
          type: 'stock',
          source: 'unsplash',
          query: keyword
        };
      } else {
        thumbnail = unsplashImages[0];
        console.log(`✅ Thumbnail: Unsplash fallback`);
      }
    }

    // 2. Unsplash 본문 이미지 검색
    const contentImages = await searchStockImages(keyword, 3);

    console.log(`✅ Image package generated:`);
    console.log(`   - Thumbnail: ${thumbnail.source === 'replicate' ? 'AI' : 'Unsplash'}`);
    console.log(`   - Content images: ${contentImages.length} from Unsplash`);

    return {
      thumbnail,
      contentImages
    };

  } catch (error) {
    console.error("❌ Content images generation failed:", error);
    throw error;
  }
}
