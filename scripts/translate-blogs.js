// 블로그 포스트 자동 번역 스크립트
require('dotenv').config({ path: '.env.local' });
const translate = require('translate-google');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 번역 대기 시간 (Rate limit 방지)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 긴 텍스트를 문단별로 나눠서 번역
async function translateLongText(text, targetLang) {
  if (!text || text.trim().length === 0) {
    return '';
  }

  try {
    // 문단별로 나누기 (이중 줄바꿈 기준)
    const paragraphs = text.split(/\r?\n\r?\n/);
    const translatedParagraphs = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();

      if (paragraph.length === 0) {
        translatedParagraphs.push('');
        continue;
      }

      console.log(`   [${targetLang.toUpperCase()}] 번역 중... (${i + 1}/${paragraphs.length})`);

      // Google Translate API 호출
      const translated = await translate(paragraph, { from: 'ko', to: targetLang });
      translatedParagraphs.push(translated);

      // Rate limit 방지를 위한 대기 (500ms)
      await delay(500);
    }

    return translatedParagraphs.join('\n\n');
  } catch (error) {
    console.error(`   ❌ ${targetLang.toUpperCase()} 번역 실패:`, error.message);
    return '';
  }
}

// 블로그 포스트 번역
async function translatePost(post) {
  console.log(`\n📝 "${post.title_ko}" 번역 시작...`);
  console.log(`   한국어 길이: ${post.content_ko?.length || 0}자`);

  const translations = {};

  // 제목 번역 (12개 언어)
  console.log(`   📌 제목 번역 중...`);
  const titleLangs = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'th', name: 'ไทย' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'uz', name: 'Oʻzbek' },
    { code: 'ne', name: 'नेपाली' },
    { code: 'mn', name: 'Монгол' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'my', name: 'မြန်မာ' },
    { code: 'zh-CN', name: '中文', key: 'zh' },
    { code: 'ru', name: 'Русский' },
  ];

  for (const lang of titleLangs) {
    const key = lang.key || lang.code;
    translations[`title_${key}`] = await translate(post.title_ko, { from: 'ko', to: lang.code });
    await delay(300);
  }

  console.log(`   ✅ 제목 번역 완료 (11개 언어)`);

  // 내용 번역 (12개 언어)
  console.log(`   📄 본문 번역 시작...`);
  const contentLangs = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'ne', name: 'Nepali' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'id', name: 'Indonesian' },
    { code: 'my', name: 'Myanmar' },
    { code: 'zh-CN', name: 'Chinese', key: 'zh' },
    { code: 'ru', name: 'Russian' },
  ];

  for (const lang of contentLangs) {
    const key = lang.key || lang.code;
    console.log(`   [${lang.name.toUpperCase()}] 번역 중...`);
    translations[`content_${key}`] = await translateLongText(post.content_ko, lang.code);
  }

  // 요약 번역 (일부 언어만)
  if (post.excerpt_ko) {
    console.log(`   📋 요약 번역 시작...`);
    translations.excerpt_en = await translate(post.excerpt_ko, { from: 'ko', to: 'en' });
    translations.excerpt_tl = await translate(post.excerpt_ko, { from: 'ko', to: 'tl' });
    await delay(500);
  }

  console.log(`   ✅ 모든 번역 완료! (11개 언어)`);

  return translations;
}

// 데이터베이스 업데이트
async function updatePost(postId, translations) {
  console.log(`   💾 데이터베이스 업데이트 중...`);

  const { error } = await supabase
    .from('blog_posts')
    .update(translations)
    .eq('id', postId);

  if (error) {
    console.error(`   ❌ DB 업데이트 실패:`, error.message);
    return false;
  }

  console.log(`   ✅ DB 업데이트 성공!`);
  return true;
}

// 메인 함수
async function main() {
  console.log('🌐 블로그 자동 번역 시작!\n');
  console.log('대상 언어: 영어, 중국어, 일본어, 타갈로그어\n');

  // 번역이 필요한 블로그 가져오기
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title_ko, slug, content_ko, excerpt_ko, content_en, content_zh, content_ja, content_tl')
    .eq('is_published', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ 블로그 조회 실패:', error.message);
    return;
  }

  // 번역이 필요한 블로그만 필터링
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

  console.log(`📊 총 ${posts.length}개 블로그 중 ${needsTranslation.length}개 번역 필요\n`);

  // 각 블로그 번역 및 업데이트
  for (let i = 0; i < needsTranslation.length; i++) {
    const post = needsTranslation[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`진행: ${i + 1}/${needsTranslation.length}`);

    try {
      const translations = await translatePost(post);
      const success = await updatePost(post.id, translations);

      if (success) {
        console.log(`✅ "${post.title_ko}" 완료!`);
      }

      // 다음 블로그 번역 전 대기 (1초)
      if (i < needsTranslation.length - 1) {
        console.log(`\n⏳ 1초 대기 중...`);
        await delay(1000);
      }
    } catch (error) {
      console.error(`❌ "${post.title_ko}" 번역 실패:`, error.message);
      console.log(`⏩ 다음 블로그로 계속 진행...`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n🎉 모든 번역 완료!`);
  console.log(`✅ ${needsTranslation.length}개의 블로그가 4개 언어로 번역되었습니다.`);
}

main();
