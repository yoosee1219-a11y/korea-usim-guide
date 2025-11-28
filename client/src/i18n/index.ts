import { Translation } from './types';
import { ko } from './locales/ko';
import { en } from './locales/en';
import { type LanguageCode } from '@/contexts/LanguageContext';

// 번역 데이터 맵
const translations: Record<LanguageCode, Translation> = {
  ko,
  en,
  // 나머지 언어들은 현재 영어 fallback 사용 (향후 추가 예정)
  vi: en, // 베트남어
  th: en, // 태국어
  tl: en, // 타갈로그어
  uz: en, // 우즈베크어
  ne: en, // 네팔어
  mn: en, // 몽골어
  id: en, // 인도네시아어
  my: en, // 미얀마어
  zh: en, // 중국어
  ru: en, // 러시아어
};

/**
 * 언어 코드에 해당하는 번역 객체 반환
 */
export function getTranslation(languageCode: LanguageCode): Translation {
  return translations[languageCode] || translations.ko;
}

/**
 * 중첩된 객체 경로로 번역 문자열 가져오기
 * 예: get(translations.ko, 'home.hero.title') => 'Korea'
 */
export function get(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      console.warn(`Translation key not found: ${path}`);
      return path; // fallback to key itself
    }
  }

  return typeof result === 'string' ? result : path;
}
