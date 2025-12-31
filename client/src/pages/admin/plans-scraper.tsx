import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PlayCircle, Save, Trash2, RefreshCw } from 'lucide-react';

interface ScrapedPlan {
  name: string;
  price: number;
  data: string;
  voice: string;
  sms: string;
  features?: string[];
}

export default function PlansScraper() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // 스크래핑 설정
  const [url, setUrl] = useState('https://www.freet.co.kr/plan/ratePlan?svcTypes=PP');
  const [scraping, setScraping] = useState(false);
  const [scrapedPlans, setScrapedPlans] = useState<ScrapedPlan[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // DB 적용
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
      } else {
        toast({
          title: "로그인 실패",
          description: "잘못된 비밀번호입니다.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "오류 발생",
        description: "로그인 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      toast({
        title: "입력 오류",
        description: "URL을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setScraping(true);
    setLogs([]);
    setScrapedPlans([]);

    addLog('🚀 스크래핑 시작...');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/plans-scraper/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('스크래핑 실패');
      }

      const data = await response.json();

      addLog(`✅ ${data.plans.length}개 요금제 수집 완료`);
      setScrapedPlans(data.plans);

      toast({
        title: "스크래핑 완료",
        description: `${data.plans.length}개 요금제를 찾았습니다.`,
      });

    } catch (error) {
      console.error('Scraping error:', error);
      addLog(`❌ 스크래핑 실패: ${error}`);
      toast({
        title: "스크래핑 실패",
        description: "요금제 정보를 가져오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setScraping(false);
    }
  };

  const handleApply = async () => {
    if (scrapedPlans.length === 0) {
      toast({
        title: "적용 불가",
        description: "먼저 스크래핑을 실행해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`⚠️ 기존 요금제를 모두 삭제하고 ${scrapedPlans.length}개의 새 요금제로 교체하시겠습니까?`)) {
      return;
    }

    setApplying(true);
    addLog('💾 DB 적용 중...');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/plans-scraper/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plans: scrapedPlans })
      });

      if (!response.ok) {
        throw new Error('DB 적용 실패');
      }

      const data = await response.json();

      addLog(`✅ ${data.deleted}개 삭제, ${data.inserted}개 삽입 완료`);

      toast({
        title: "적용 완료",
        description: `요금제가 성공적으로 업데이트되었습니다.`,
      });

      // 결과 초기화
      setScrapedPlans([]);
      setLogs([]);

    } catch (error) {
      console.error('Apply error:', error);
      addLog(`❌ DB 적용 실패: ${error}`);
      toast({
        title: "적용 실패",
        description: "DB 업데이트에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setApplying(false);
    }
  };

  const handleClear = () => {
    if (confirm('수집된 데이터를 지우시겠습니까?')) {
      setScrapedPlans([]);
      setLogs([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">관리자 로그인</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="관리자 비밀번호 입력"
              />
            </div>
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/plans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                요금제 목록
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">요금제 자동 수집</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/tips">
              <Button variant="outline">콘텐츠 관리</Button>
            </Link>
            <Button onClick={handleLogout} variant="outline">
              로그아웃
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 스크래핑 설정 */}
          <div className="space-y-6">
            {/* URL 입력 */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">1. 스크래핑 소스</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    사이트 URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    예: https://www.freet.co.kr/plan/ratePlan?svcTypes=PP
                  </p>
                </div>

                <Button
                  onClick={handleScrape}
                  disabled={scraping}
                  className="w-full"
                >
                  {scraping ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      스크래핑 중...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      스크래핑 시작
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* 로그 */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">📝 진행 로그</h2>
              <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-gray-500">로그가 여기에 표시됩니다...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* 오른쪽: 결과 미리보기 */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">2. 수집 결과 ({scrapedPlans.length}개)</h2>
                {scrapedPlans.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      지우기
                    </Button>
                    <Button
                      onClick={handleApply}
                      disabled={applying}
                      size="sm"
                    >
                      {applying ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                          적용 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          DB 적용
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {scrapedPlans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  스크래핑을 실행하면 결과가 여기에 표시됩니다.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {scrapedPlans.map((plan, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="font-semibold mb-2">{plan.name}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>💰 가격: <span className="font-mono">{plan.price}원</span></div>
                        <div>📊 데이터: {plan.data}</div>
                        <div>📞 음성: {plan.voice}</div>
                        <div>💬 문자: {plan.sms}</div>
                      </div>
                      {plan.features && plan.features.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          ✨ {plan.features.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* 안내 */}
        <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>⚠️ 주의:</strong> "DB 적용" 버튼을 누르면 기존의 모든 요금제가 삭제되고 새로 수집된 요금제로 교체됩니다. 신중하게 확인 후 실행하세요.
          </p>
        </Card>
      </div>
    </div>
  );
}
