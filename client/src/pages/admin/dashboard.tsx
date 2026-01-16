import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Lightbulb,
  Wand2,
  Download,
  LogOut,
  TrendingUp,
  Globe,
  Settings
} from 'lucide-react';

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      // JWT 토큰에서 isDemo 플래그 확인
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsDemo(payload.isDemo === true);
      } catch {
        setIsDemo(false);
      }
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
        toast({
          title: "로그인 성공",
          description: "어드민 대시보드에 오신 것을 환영합니다.",
        });
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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    navigate('/');
    toast({
      title: "로그아웃 완료",
      description: "안전하게 로그아웃되었습니다.",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full p-8 shadow-lg">
          <div className="text-center mb-6">
            <LayoutDashboard className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold">관리자 로그인</h1>
            <p className="text-gray-600 mt-2">Korea USIM Guide Admin</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

  const adminFeatures = [
    {
      title: '요금제 관리',
      description: '요금제 목록, 추가, 수정, 삭제',
      icon: DollarSign,
      link: '/admin/plans',
      color: 'bg-green-50 text-green-600 border-green-200'
    },
    {
      title: '요금제 자동 수집',
      description: '경쟁사 사이트에서 요금제 스크래핑',
      icon: Download,
      link: '/admin/plans-scraper',
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      title: '블로그 관리',
      description: '블로그 포스트 작성 및 관리',
      icon: FileText,
      link: '/admin/blog',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      title: '콘텐츠 관리',
      description: '꿀팁 콘텐츠 목록 및 번역 상태',
      icon: Lightbulb,
      link: '/admin/tips',
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200'
    },
    {
      title: '콘텐츠 자동화',
      description: 'AI 기반 콘텐츠 자동 생성 및 발행',
      icon: Wand2,
      link: '/admin/content-automation',
      color: 'bg-pink-50 text-pink-600 border-pink-200'
    },
    {
      title: '키워드 관리',
      description: 'SEO 키워드 목록 및 우선순위 설정',
      icon: TrendingUp,
      link: '/admin/keywords',
      color: 'bg-orange-50 text-orange-600 border-orange-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-amber-500 text-white px-4 py-3 text-center">
          <span className="font-medium">
            데모 모드 - 읽기 전용으로 실행 중입니다. 데이터 수정/삭제가 제한됩니다.
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <LayoutDashboard className="w-10 h-10 text-blue-600" />
              관리자 대시보드
            </h1>
            <p className="text-gray-600 mt-2">Korea USIM Guide 통합 관리 시스템</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">총 기능</p>
                <p className="text-3xl font-bold text-blue-900">{adminFeatures.length}</p>
              </div>
              <Settings className="w-12 h-12 text-blue-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">다국어 지원</p>
                <p className="text-3xl font-bold text-green-900">12개</p>
              </div>
              <Globe className="w-12 h-12 text-green-400" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">자동화 시스템</p>
                <p className="text-3xl font-bold text-purple-900">활성</p>
              </div>
              <Wand2 className="w-12 h-12 text-purple-400" />
            </div>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature, index) => (
            <Link key={index} href={feature.link}>
              <Card className={`p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${feature.color} hover:scale-105`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <Card className="mt-8 p-6 bg-white">
          <h3 className="text-lg font-bold mb-4">빠른 링크</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/">
              <Button variant="outline" className="w-full">
                메인 페이지
              </Button>
            </Link>
            <Link href="/tips">
              <Button variant="outline" className="w-full">
                꿀팁 페이지
              </Button>
            </Link>
            <Link href="/plans">
              <Button variant="outline" className="w-full">
                요금제 페이지
              </Button>
            </Link>
            <Link href="/compare">
              <Button variant="outline" className="w-full">
                비교 페이지
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
