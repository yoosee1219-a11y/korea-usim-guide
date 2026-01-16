import { Router } from 'express';
import { authenticateAdmin, authenticateWithEmail } from '../../services/authService.js';

const router = Router();

/**
 * POST /api/admin/login
 * 관리자 로그인 (이메일 + 비밀번호 또는 비밀번호만)
 */
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password is required'
      });
    }

    let token: string | null = null;

    // 이메일이 있으면 이메일 기반 인증 (데모 계정 지원)
    if (email) {
      token = await authenticateWithEmail(email, password);
    } else {
      // 기존 방식 (비밀번호만)
      token = await authenticateAdmin(password);
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // 토큰 반환
    res.json({
      success: true,
      token,
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

/**
 * POST /api/admin/verify
 * JWT 토큰 검증
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token is required'
      });
    }

    const { verifyToken } = await import('../../services/authService.js');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    res.json({
      valid: true,
      admin: decoded.admin,
      isDemo: decoded.isDemo || false,
      email: decoded.email
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Verification failed'
    });
  }
});

export default router;
