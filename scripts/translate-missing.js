// 누락된 번역만 재번역 (재시도 로직 포함)
require('dotenv').config({ path: '.env.local' });
const translate = require('translate-google');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 재시도 로직을 포함한 번역 함수
async function translateWithRetry(text, targetLang, maxRetries = 3) {
  if (!text || text.trim().length === 0) {
    return '';
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`      시도 ${attempt}/${maxRetries}...`);

      const result = await translate(text, { from: 'ko', to: targetLang });

      if (result && result.length > 0) {
        console.log(`      ✅ 성공 (${result.length}자)`);
        return result;
      } else {
        console.log(`      ⚠️  빈 결과 - 재시도`);
        await delay(2000); // 2초 대기 후 재시도
      }
    } catch (error) {
      console.log(`      ❌ 실패: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`      ⏳ ${2 * attempt}초 대기 후 재시도...`);
        await delay(2000 * attempt); // 점진적 백오프
      }
    }
  }

  console.log(`      ❌ ${maxRetries}번 시도 후 실패`);
  return '';
}

// 긴 텍스트를 문단별로 번역 (재시도 포함)
async function translateLongText(text, targetLang) {
  if (!text || text.trim().length === 0) {
    return '';
  }

  const paragraphs = text.split(/\r?\n\r?\n/);
  const translatedParagraphs = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();

    if (paragraph.length === 0) {
      translatedParagraphs.push('');
      continue;
    }

    console.log(`   [${targetLang.toUpperCase()}] ${i + 1}/${paragraphs.length} 문단 번역 중...`);

    const translated = await translateWithRetry(paragraph, targetLang);
    translatedParagraphs.push(translated);

    // 다음 문단 전 대기 (Rate limit 방지)
    await delay(1000);
  }

  return translatedParagraphs.join('\n\n');
}

// 누락된 언어만 번역
async function translateMissing() {
  console.log('🔄 누락된 번역 재번역 시작!\n');

  // 누락된 번역이 있는 블로그만 가져오기
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title_ko, slug, content_ko, content_en, content_vi, content_th, content_tl, content_uz, content_ne, content_mn, content_id, content_my, content_zh, content_ru, title_en, title_vi, title_th, title_tl, title_uz, title_ne, title_mn, title_id, title_my, title_zh, title_ru')
    .eq('is_published', true);

  if (error) {
    console.error('❌ 블로그 조회 실패:', error.message);
    return;
  }

  // 누락된 번역이 있는 것만 필터링
  const needsTranslation = posts.filter(post => {
    const hasKorean = post.content_ko && post.content_ko.length > 100;
    const needsEn = !post.content_en || post.content_en.length < 100;
    const needsVi = !post.content_vi || post.content_vi.length < 100;
    const needsTh = !post.content_th || post.content_th.length < 100;
    const needsTl = !post.content_tl || post.content_tl.length < 100;
    const needsUz = !post.content_uz || post.content_uz.length < 100;
    const needsNe = !post.content_ne || post.content_ne.length < 100;
    const needsMn = !post.content_mn || post.content_mn.length < 100;
    const needsId = !post.content_id || post.content_id.length < 100;
    const needsMy = !post.content_my || post.content_my.length < 100;
    const needsZh = !post.content_zh || post.content_zh.length < 100;
    const needsRu = !post.content_ru || post.content_ru.length < 100;

    return hasKorean && (needsEn || needsVi || needsTh || needsTl || needsUz || needsNe || needsMn || needsId || needsMy || needsZh || needsRu);
  });

  console.log(`📊 ${needsTranslation.length}개 블로그 재번역 필요\n`);

  for (let i = 0; i < needsTranslation.length; i++) {
    const post = needsTranslation[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`진행: ${i + 1}/${needsTranslation.length}`);
    console.log(`📝 "${post.title_ko}"`);

    const translations = {};

    // 제목 번역 (누락된 것만)
    const titleLangs = [
      { code: 'en', name: 'EN' },
      { code: 'vi', name: 'VI' },
      { code: 'th', name: 'TH' },
      { code: 'tl', name: 'TL' },
      { code: 'uz', name: 'UZ' },
      { code: 'ne', name: 'NE' },
      { code: 'mn', name: 'MN' },
      { code: 'id', name: 'ID' },
      { code: 'my', name: 'MY' },
      { code: 'zh-CN', name: 'ZH', key: 'zh' },
      { code: 'ru', name: 'RU' },
    ];

    for (const lang of titleLangs) {
      const key = lang.key || lang.code;
      if (!post[`title_${key}`]) {
        console.log(`   📌 제목 ${lang.name} 번역 중...`);
        translations[`title_${key}`] = await translateWithRetry(post.title_ko, lang.code);
      }
    }

    // 본문 번역 (누락된 것만)
    const contentLangs = [
      { code: 'en', name: 'EN' },
      { code: 'vi', name: 'VI' },
      { code: 'th', name: 'TH' },
      { code: 'tl', name: 'TL' },
      { code: 'uz', name: 'UZ' },
      { code: 'ne', name: 'NE' },
      { code: 'mn', name: 'MN' },
      { code: 'id', name: 'ID' },
      { code: 'my', name: 'MY' },
      { code: 'zh-CN', name: 'ZH', key: 'zh' },
      { code: 'ru', name: 'RU' },
    ];

    for (const lang of contentLangs) {
      const key = lang.key || lang.code;
      if (!post[`content_${key}`] || post[`content_${key}`].length < 100) {
        console.log(`   📄 본문 ${lang.name} 번역 시작...`);
        translations[`content_${key}`] = await translateLongText(post.content_ko, lang.code);
      }
    }

    // DB 업데이트
    if (Object.keys(translations).length > 0) {
      console.log(`   💾 DB 업데이트 중...`);
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update(translations)
        .eq('id', post.id);

      if (updateError) {
        console.error(`   ❌ DB 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ "${post.title_ko}" 완료!`);
        const langs = ['en', 'vi', 'th', 'tl', 'uz', 'ne', 'mn', 'id', 'my', 'zh', 'ru'];
        langs.forEach(lang => {
          if (translations[`content_${lang}`]) {
            console.log(`      ${lang.toUpperCase()}: ${translations[`content_${lang}`]?.length || 0}자`);
          }
        });
      }
    }

    // 다음 블로그 전 대기
    if (i < needsTranslation.length - 1) {
      console.log(`\n⏳ 2초 대기 중...`);
      await delay(2000);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n🎉 재번역 완료!`);
}

translateMissing();
