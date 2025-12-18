import { Router } from 'express';
import { authenticateAdmin } from '../../services/authService.js';

const router = Router();

/**
 * POST /api/admin/login
 * 관리자 로그인
 */
router.post('/', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password is required'
      });
    }

    // 비밀번호 검증 및 JWT 토큰 생성
    const token = await authenticateAdmin(password);

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid password'
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
      admin: decoded.admin
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
