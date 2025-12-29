import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

// JWT Secret - 환경변수 필수
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h'; // 24시간

// 관리자 비밀번호 해시 (실제로는 DB에 저장해야 하지만, 단순화를 위해 환경변수 사용)
// 이 해시는 'admin123'을 Argon2로 해싱한 값입니다
// 실제 운영에서는 더 강력한 비밀번호를 사용하세요!
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

/**
 * 비밀번호를 Argon2로 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await argon2.hash(password, {
      type: argon2.argon2id, // Argon2id 사용 (OWASP 권장)
      memoryCost: 65536, // 64 MB
      timeCost: 3, // 반복 횟수
      parallelism: 4, // 병렬 스레드
    });
    return hash;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * JWT 토큰 생성
 */
export function generateToken(payload: { admin: boolean; username?: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'korea-usim-guide',
  });
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * 관리자 로그인 검증
 */
export async function authenticateAdmin(password: string): Promise<string | null> {
  try {
    // 환경변수에 해시가 없으면 기본 비밀번호 'admin123' 사용 (개발용)
    let adminHash = ADMIN_PASSWORD_HASH;

    if (!adminHash) {
      console.warn('⚠️ ADMIN_PASSWORD_HASH not set, using default password. DO NOT use in production!');
      adminHash = await hashPassword('admin123');
    }

    const isValid = await verifyPassword(adminHash, password);

    if (isValid) {
      const token = generateToken({ admin: true, username: 'admin' });
      return token;
    }

    return null;
  } catch (error) {
    console.error('Admin authentication error:', error);
    return null;
  }
}

/**
 * 비밀번호 해시 생성 유틸리티 (개발/설정용)
 * 실행 예: node -e "require('./dist/server/services/authService.js').generatePasswordHash('your-password')"
 */
export async function generatePasswordHash(password: string): Promise<void> {
  const hash = await hashPassword(password);
  console.log('\n=== Argon2 Password Hash ===');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nAdd this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
  console.log('=============================\n');
}
