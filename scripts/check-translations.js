require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkData() {
  console.log('Check blog post multilingual data\n');

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title_ko, title_en, title_zh, content_ko, content_en, content_zh')
    .eq('is_published', true)
    .order('created_at', { ascending: true })
    .limit(3);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  posts.forEach((post, idx) => {
    console.log(`\n========== Blog #${idx + 1}: ${post.slug} ==========`);
    console.log(`ID: ${post.id}`);
    console.log(`\nTitle (Korean): ${post.title_ko}`);
    console.log(`Title (English): ${post.title_en || 'MISSING'}`);
    console.log(`Title (Chinese): ${post.title_zh || 'MISSING'}`);
    console.log(`\nContent (Korean): ${post.content_ko ? post.content_ko.substring(0, 100) + '...' : 'MISSING'}`);
    console.log(`Content (English): ${post.content_en ? post.content_en.substring(0, 100) + '...' : 'MISSING'}`);
    console.log(`Content (Chinese): ${post.content_zh ? post.content_zh.substring(0, 100) + '...' : 'MISSING'}`);
    console.log(`\nLength - Korean: ${post.content_ko?.length || 0} chars`);
    console.log(`Length - English: ${post.content_en?.length || 0} chars`);
    console.log(`Length - Chinese: ${post.content_zh?.length || 0} chars`);
  });
}

checkData();
