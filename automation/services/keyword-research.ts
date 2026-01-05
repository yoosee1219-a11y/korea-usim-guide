import axios from 'axios';
import { db } from '../../server/storage/db.js';

/**
 * 키워드 자동 리서치 서비스
 * 목적: 외국인 타겟 고트래픽 키워드 자동 발굴
 */

export interface ResearchedKeyword {
  keyword: string;
  estimated_volume: number;
  priority: 'high' | 'medium' | 'low';
  source: string;
}

export class KeywordResearchService {
  // 시드 키워드 (광범위한 한국 관련 주제)
  private seedKeywords = [
    'Korea travel',
    'Seoul guide',
    'Korea visa',
    'Korea SIM card',
    'Korea apartment',
    'Korea job',
    'Korean food',
    'Korea budget',
    'Incheon airport',
    'Korea subway',
    'Korea shopping',
    'Korea bank account',
    'Korea foreigner',
    'Korea itinerary',
    'Busan travel',
    'Korea culture',
    'Korea cost',
    'Korea tips',
    'Korea registration',
    'Korea health insurance'
  ];

  // 확장 접미사 (롱테일 키워드 생성)
  private expansionSuffixes = [
    'guide',
    'tips',
    'for foreigners',
    'how to',
    'best',
    'cheap',
    'budget',
    '2024',
    '2025',
    'complete guide',
    'step by step',
    'online',
    'requirements',
    'process',
    'cost'
  ];

  /**
   * 메인 함수: 새로운 키워드 리서치 실행
   */
  async researchKeywords(targetCount: number = 30): Promise<ResearchedKeyword[]> {
    console.log(`🔍 키워드 리서치 시작 (목표: ${targetCount}개)`);

    const allKeywords: ResearchedKeyword[] = [];

    try {
      // 1. Google Autocomplete에서 키워드 수집
      console.log('📊 Google Autocomplete 검색 중...');
      const autocompleteKeywords = await this.fetchAutocompleteKeywords();
      allKeywords.push(...autocompleteKeywords);

      // 2. 시드 키워드 확장
      console.log('🌱 시드 키워드 확장 중...');
      const expandedKeywords = this.expandSeedKeywords();
      allKeywords.push(...expandedKeywords);

      // 3. 중복 제거
      const uniqueKeywords = this.deduplicateKeywords(allKeywords);

      // 4. 이미 DB에 있는 키워드 필터링
      const newKeywords = await this.filterExistingKeywords(uniqueKeywords);

      // 5. 우선순위 정렬 및 상위 N개 선택
      const sortedKeywords = newKeywords
        .sort((a, b) => {
          if (a.priority === b.priority) {
            return b.estimated_volume - a.estimated_volume;
          }
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, targetCount);

      console.log(`✅ 최종 선정: ${sortedKeywords.length}개 키워드`);
      console.log(`   - High: ${sortedKeywords.filter(k => k.priority === 'high').length}개`);
      console.log(`   - Medium: ${sortedKeywords.filter(k => k.priority === 'medium').length}개`);
      console.log(`   - Low: ${sortedKeywords.filter(k => k.priority === 'low').length}개`);

      return sortedKeywords;

    } catch (error) {
      console.error('❌ 키워드 리서치 실패:', error);
      throw error;
    }
  }

  /**
   * Google Autocomplete API로 키워드 수집
   */
  private async fetchAutocompleteKeywords(): Promise<ResearchedKeyword[]> {
    const keywords: ResearchedKeyword[] = [];

    // 각 시드 키워드에 대해 자동완성 검색
    for (const seed of this.seedKeywords.slice(0, 10)) { // 처음 10개만 (API 부하 방지)
      try {
        const response = await axios.get('http://suggestqueries.google.com/complete/search', {
          params: {
            client: 'firefox',
            q: seed,
            hl: 'en'
          },
          timeout: 5000
        });

        const suggestions = response.data[1] as string[]; // 자동완성 결과

        suggestions.slice(0, 5).forEach((suggestion: string) => {
          keywords.push({
            keyword: suggestion,
            estimated_volume: this.estimateVolume(suggestion),
            priority: this.calculatePriority(suggestion),
            source: 'google_autocomplete'
          });
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.warn(`⚠️  Autocomplete 실패 (${seed}):`, error instanceof Error ? error.message : String(error));
      }
    }

    return keywords;
  }

  /**
   * 시드 키워드 확장 (조합 생성)
   */
  private expandSeedKeywords(): ResearchedKeyword[] {
    const keywords: ResearchedKeyword[] = [];

    this.seedKeywords.forEach(seed => {
      this.expansionSuffixes.slice(0, 3).forEach(suffix => { // 각 시드당 3개 확장
        const expanded = `${seed} ${suffix}`;
        keywords.push({
          keyword: expanded,
          estimated_volume: this.estimateVolume(expanded),
          priority: this.calculatePriority(expanded),
          source: 'seed_expansion'
        });
      });
    });

    return keywords;
  }

  /**
   * 검색량 추정 (휴리스틱)
   */
  private estimateVolume(keyword: string): number {
    let volume = 1000; // 기본값

    // 키워드 길이 (짧을수록 검색량 높음)
    const wordCount = keyword.split(' ').length;
    if (wordCount <= 2) volume += 2000;
    else if (wordCount === 3) volume += 1000;
    else volume += 500;

    // 인기 주제 보너스
    const highVolumeTerms = ['travel', 'visa', 'guide', 'Seoul', 'food', 'job'];
    highVolumeTerms.forEach(term => {
      if (keyword.toLowerCase().includes(term)) volume += 1500;
    });

    // 롱테일 키워드 (구체적일수록 낮음)
    if (keyword.length > 40) volume = Math.floor(volume * 0.5);

    return Math.min(volume, 10000); // 최대 10K
  }

  /**
   * 우선순위 계산
   */
  private calculatePriority(keyword: string): 'high' | 'medium' | 'low' {
    const volume = this.estimateVolume(keyword);

    // 정보성 키워드 (가이드, 팁 등) - 광고 클릭률 높음
    const informationalTerms = ['guide', 'how to', 'tips', 'best', 'complete'];
    const isInformational = informationalTerms.some(term =>
      keyword.toLowerCase().includes(term)
    );

    // 고트래픽 주제
    const highTrafficTopics = ['travel', 'visa', 'Seoul', 'airport'];
    const isHighTraffic = highTrafficTopics.some(topic =>
      keyword.toLowerCase().includes(topic)
    );

    if (volume >= 3000 && isInformational) return 'high';
    if (volume >= 2000 || isHighTraffic) return 'high';
    if (volume >= 1000) return 'medium';
    return 'low';
  }

  /**
   * 중복 키워드 제거
   */
  private deduplicateKeywords(keywords: ResearchedKeyword[]): ResearchedKeyword[] {
    const seen = new Set<string>();
    return keywords.filter(kw => {
      const normalized = kw.keyword.toLowerCase().trim();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  /**
   * 이미 DB에 있는 키워드 필터링
   */
  private async filterExistingKeywords(keywords: ResearchedKeyword[]): Promise<ResearchedKeyword[]> {
    const existingResult = await db.query(
      'SELECT keyword FROM content_keywords'
    );

    const existingKeywords = new Set(
      existingResult.rows.map((row: any) => row.keyword.toLowerCase().trim())
    );

    return keywords.filter(kw =>
      !existingKeywords.has(kw.keyword.toLowerCase().trim())
    );
  }

  /**
   * 키워드를 DB에 저장
   */
  async saveKeywordsToDB(keywords: ResearchedKeyword[]): Promise<number> {
    let savedCount = 0;

    for (const kw of keywords) {
      try {
        await db.query(
          `INSERT INTO content_keywords (keyword, priority, cpc_krw, status, source)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            kw.keyword,
            kw.priority,
            0, // CPC는 나중에 실제 데이터로 업데이트
            'pending',
            kw.source
          ]
        );
        savedCount++;
      } catch (error) {
        console.warn(`⚠️  키워드 저장 실패 (${kw.keyword}):`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log(`✅ DB 저장 완료: ${savedCount}/${keywords.length}개`);
    return savedCount;
  }

  /**
   * 대기 중인 키워드 개수 확인
   */
  async getPendingKeywordsCount(): Promise<number> {
    const result = await db.query(
      "SELECT COUNT(*) as count FROM content_keywords WHERE status = 'pending'"
    );
    return parseInt(result.rows[0].count);
  }
}

export const keywordResearchService = new KeywordResearchService();
