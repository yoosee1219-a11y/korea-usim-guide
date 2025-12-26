import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // 관리자 토큰 확인
    const token = localStorage.getItem("adminToken");

    if (!token) {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      setLocation("/admin/login");
    }
  }, [setLocation]);

  // 토큰이 있으면 자식 컴포넌트 렌더링
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return null; // 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }

  return <>{children}</>;
}
