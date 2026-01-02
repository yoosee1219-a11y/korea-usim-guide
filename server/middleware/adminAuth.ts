import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';

/**
 * JWT 기반 관리자 인증 미들웨어
 *
 * 요청 헤더에서 JWT 토큰을 확인하고 검증합니다.
 * Authorization: Bearer <token>
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    console.log('[AdminAuth] Request path:', req.path);
    console.log('[AdminAuth] Authorization header:', authHeader ? 'present' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AdminAuth] FAILED: No valid Bearer token');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거
    console.log('[AdminAuth] Token length:', token.length);

    // 토큰 검증
    const decoded = verifyToken(token);
    console.log('[AdminAuth] Decoded:', decoded ? 'valid' : 'invalid');

    if (!decoded || !decoded.admin) {
      console.log('[AdminAuth] FAILED: Invalid or non-admin token');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // 토큰이 유효하면 요청 객체에 사용자 정보 추가
    (req as any).admin = decoded;
    console.log('[AdminAuth] SUCCESS: Admin authenticated');

    next();
  } catch (error) {
    console.error('[AdminAuth] Exception:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 선택적 관리자 인증 미들웨어
 * 토큰이 있으면 검증하지만, 없어도 진행
 */
export function optionalAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded && decoded.admin) {
        (req as any).admin = decoded;
      }
    }

    next();
  } catch (error) {
    // 에러가 있어도 진행
    next();
  }
}
