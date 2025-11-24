import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "korea-usim-guide-secret-key-change-in-production";

// JWT 토큰 검증 미들웨어
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  // Authorization 헤더에서 토큰 추출
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // "Bearer {token}" 형식에서 토큰 추출
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // req에 사용자 정보 추가 (타입 확장 필요)
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: "Token expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: "Invalid token" });
    }
    return res.status(403).json({ message: "Token verification failed" });
  }
}

// JWT 토큰 생성 함수
export function generateToken(payload: any = {}, expiresIn: string = "30d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

