/**
 * Auto-Translate with Timeout Protection and Auto-Recovery
 * - Each batch has 4-minute timeout
 * - Auto-skips failed batches
 * - Retries failed batches at the end
 */

const API_URL = 'https://koreausimguide.com/api/translate/plans';
const BATCH_SIZE = 1;
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds
const BATCH_TIMEOUT = 4 * 60 * 1000; // 4 minutes per batch
const MAX_RETRIES = 2; // Retry failed batches 2 times

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateBatchWithTimeout(skip, batchSize, timeoutMs) {
  console.log(`\n📦 Processing batch starting at ${skip}...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        skip,
        batch_size: batchSize,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

    return { success: true, data };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.log(`⏱️  TIMEOUT: Batch ${skip} exceeded ${timeoutMs / 1000}s - SKIPPING to next batch`);
      return { success: false, error: 'timeout', skip };
    } else {
      console.log(`❌ ERROR: ${error.message} - SKIPPING to next batch`);
      return { success: false, error: error.message, skip };
    }
  }
}

async function autoTranslate(startFrom = 0) {
  console.log('🤖 Auto-Translate with Timeout Protection\n');
  console.log(`Batch size: ${BATCH_SIZE} plan`);
  console.log(`Batch timeout: ${BATCH_TIMEOUT / 1000}s`);
  console.log(`Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log(`Starting from: plan ${startFrom + 1}\n`);

  let skip = startFrom;
  let hasMore = true;
  let totalTranslated = 0;
  let totalFailed = 0;
  const failedBatches = [];
  const startTime = Date.now();

  // First pass: process all batches
  console.log('═'.repeat(50));
  console.log('PHASE 1: Processing all batches');
  console.log('═'.repeat(50));

  try {
    while (hasMore) {
      const result = await translateBatchWithTimeout(skip, BATCH_SIZE, BATCH_TIMEOUT);

      if (result.success) {
        totalTranslated += result.data.stats.translated;
        totalFailed += result.data.stats.failed;
        hasMore = result.data.pagination.has_more;

        if (hasMore) {
          skip = result.data.pagination.next_skip;
        }
      } else {
        // Failed - record and skip to next
        failedBatches.push(result.skip);
        totalFailed++;
        skip++; // Move to next batch

        // Check if there are more plans (assume 14 total)
        hasMore = skip < 14;
      }

      if (hasMore) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    // Retry failed batches
    if (failedBatches.length > 0) {
      console.log('\n' + '═'.repeat(50));
      console.log(`PHASE 2: Retrying ${failedBatches.length} failed batches`);
      console.log('═'.repeat(50));

      for (let retry = 0; retry < MAX_RETRIES; retry++) {
        console.log(`\nRetry attempt ${retry + 1}/${MAX_RETRIES}`);
        const stillFailing = [];

        for (const failedSkip of failedBatches) {
          console.log(`\nRetrying batch ${failedSkip}...`);
          const result = await translateBatchWithTimeout(failedSkip, BATCH_SIZE, BATCH_TIMEOUT);

          if (result.success) {
            totalTranslated += result.data.stats.translated;
            console.log(`✅ Retry successful for batch ${failedSkip}`);
          } else {
            stillFailing.push(failedSkip);
            console.log(`❌ Retry failed for batch ${failedSkip}`);
          }

          await sleep(DELAY_BETWEEN_BATCHES);
        }

        if (stillFailing.length === 0) {
          console.log('\n🎉 All failed batches recovered!');
          break;
        } else {
          failedBatches.length = 0;
          failedBatches.push(...stillFailing);
        }
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n\n' + '═'.repeat(50));
    console.log('🎉 TRANSLATION COMPLETE!');
    console.log('═'.repeat(50));
    console.log(`✅ Total translated: ${totalTranslated} plans`);
    console.log(`❌ Total failed: ${failedBatches.length} plans`);
    console.log(`⏱️  Total time: ${minutes}m ${seconds}s`);

    if (failedBatches.length > 0) {
      console.log(`\n⚠️  Failed batches: ${failedBatches.join(', ')}`);
    }
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Progress so far:');
    console.error(`  Translated: ${totalTranslated}`);
    console.error(`  Failed: ${totalFailed}`);
    process.exit(1);
  }
}

// Get start position from command line argument, default to 7 (8th plan)
const startFrom = parseInt(process.argv[2]) || 7;
autoTranslate(startFrom);
