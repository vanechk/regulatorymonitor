import jwt from 'jsonwebtoken';
import { JWTPayload } from '../middleware/auth';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 минут
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 дней

  /**
   * Создает пару токенов (access + refresh)
   */
  static generateTokenPair(userId: string, username: string, email: string, role: string): TokenPair {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET не настроен в переменных окружения');
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET не настроен в переменных окружения');
    }

    const accessToken = jwt.sign(
      {
        userId,
        username,
        email,
        role,
        type: 'access'
      } satisfies JWTPayload,
      process.env.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        tokenId: this.generateTokenId(),
        type: 'refresh'
      } satisfies RefreshTokenPayload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Проверяет access токен
   */
  static verifyAccessToken(token: string): JWTPayload {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET не настроен в переменных окружения');
    }

    return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
  }

  /**
   * Проверяет refresh токен
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET не настроен в переменных окружения');
    }

    return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  }

  /**
   * Генерирует уникальный ID для токена
   */
  private static generateTokenId(): string {
    // Сокращаем длину для совместимости с БД
    return Math.random().toString(36).substring(2, 8) + Date.now().toString(36).substring(0, 8);
  }

  /**
   * Проверяет, истек ли токен
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Получает время истечения токена
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return null;
      
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Получает информацию о пользователе из токена без проверки подписи
   */
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  }
}
