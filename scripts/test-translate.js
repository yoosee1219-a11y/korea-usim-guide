// 번역 테스트 스크립트 (1개만)
require('dotenv').config({ path: '.env.local' });
const translate = require('translate-google');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTranslate() {
  console.log('🧪 번역 테스트 시작!\n');

  // 가장 짧은 블로그 1개 가져오기
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title_ko, content_ko')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !posts || posts.length === 0) {
    console.error('❌ 블로그 조회 실패');
    return;
  }

  const post = posts[0];
  console.log(`📝 테스트 블로그: "${post.title_ko}"`);
  console.log(`   한국어 길이: ${post.content_ko?.length || 0}자\n`);

  // 제목만 번역 테스트
  console.log('1. 제목 번역 테스트...');
  try {
    const titleEn = await translate(post.title_ko, { from: 'ko', to: 'en' });
    const titleZh = await translate(post.title_ko, { from: 'ko', to: 'zh-CN' });
    const titleJa = await translate(post.title_ko, { from: 'ko', to: 'ja' });
    const titleTl = await translate(post.title_ko, { from: 'ko', to: 'tl' });

    console.log(`   ✅ 영어: ${titleEn}`);
    console.log(`   ✅ 중국어: ${titleZh}`);
    console.log(`   ✅ 일본어: ${titleJa}`);
    console.log(`   ✅ 타갈로그: ${titleTl}`);
  } catch (error) {
    console.error('   ❌ 제목 번역 실패:', error.message);
    return;
  }

  // 첫 문단만 번역 테스트
  console.log('\n2. 첫 문단 번역 테스트...');
  const firstParagraph = post.content_ko.split(/\r?\n\r?\n/)[0];
  console.log(`   원문 (${firstParagraph.length}자): ${firstParagraph.substring(0, 100)}...`);

  try {
    const contentEn = await translate(firstParagraph, { from: 'ko', to: 'en' });
    console.log(`   ✅ 영어 (${contentEn.length}자): ${contentEn.substring(0, 100)}...`);

    const contentZh = await translate(firstParagraph, { from: 'ko', to: 'zh-CN' });
    console.log(`   ✅ 중국어 (${contentZh.length}자): ${contentZh.substring(0, 100)}...`);
  } catch (error) {
    console.error('   ❌ 본문 번역 실패:', error.message);
    return;
  }

  console.log('\n✅ 테스트 성공! 전체 번역을 실행할 준비가 되었습니다.');
  console.log('\n다음 명령어로 전체 번역을 시작하세요:');
  console.log('  node scripts/translate-blogs.js');
}

testTranslate();
