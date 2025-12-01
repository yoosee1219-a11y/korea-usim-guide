/**
 * Continue Translation from where it left off
 * Starts from skip=7 to complete remaining 7 plans
 */

const API_URL = 'https://koreausimguide.com/api/translate/plans';
const BATCH_SIZE = 1;
const DELAY_BETWEEN_BATCHES = 3000;
const START_FROM = 7; // Continue from 8th plan (0-indexed, so 7)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateBatch(skip, batchSize) {
  console.log(`\n📦 Processing batch starting at ${skip}...`);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      skip,
      batch_size: batchSize,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  console.log(`✅ ${data.message}`);
  console.log(`   Translated: ${data.stats.translated}/${data.stats.batch}`);
  console.log(`   Progress: ${data.stats.processed}/${data.stats.total_plans} (${Math.round(data.stats.processed / data.stats.total_plans * 100)}%)`);
  console.log(`   Remaining: ${data.stats.remaining} plans`);

  if (data.errors && data.errors.length > 0) {
    console.log(`   ⚠️  Errors:`, data.errors);
  }

  return data;
}

async function continueTranslation() {
  console.log('🔄 Continuing translation from where it left off...\n');
  console.log(`Starting from plan ${START_FROM + 1}`);
  console.log(`Batch size: ${BATCH_SIZE} plan`);
  console.log(`Delay between batches: ${DELAY_BETWEEN_BATCHES}ms\n`);

  let skip = START_FROM;
  let hasMore = true;
  let totalTranslated = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  try {
    while (hasMore) {
      const result = await translateBatch(skip, BATCH_SIZE);

      totalTranslated += result.stats.translated;
      totalFailed += result.stats.failed;

      hasMore = result.pagination.has_more;

      if (hasMore) {
        skip = result.pagination.next_skip;
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n\n🎉 All remaining batches completed!');
    console.log('═'.repeat(50));
    console.log(`✅ Total translated: ${totalTranslated} plans`);
    console.log(`❌ Total failed: ${totalFailed} plans`);
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('\n❌ Error during batch translation:', error.message);
    console.error('Progress so far:');
    console.error(`  Translated: ${totalTranslated}`);
    console.error(`  Failed: ${totalFailed}`);
    process.exit(1);
  }
}

// Run the translation
continueTranslation();
