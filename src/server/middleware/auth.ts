import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

// Расширяем интерфейс Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Токен авторизации не предоставлен',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Убираем 'Bearer '
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET не настроен в переменных окружения');
      return res.status(500).json({ 
        error: 'Ошибка конфигурации сервера',
        code: 'SERVER_CONFIG_ERROR'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    
    // Проверяем, существует ли пользователь в БД
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Пользователь не найден',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Email не подтвержден',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Добавляем информацию о пользователе в request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Недействительный токен',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Токен истек',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Ошибка в auth middleware:', error);
    return res.status(500).json({ 
      error: 'Ошибка авторизации',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware для проверки роли
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Не авторизован',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Недостаточно прав',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Middleware для логирования действий
export const logUserAction = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Логируем начало действия
    if (req.user) {
      console.log(`[${new Date().toISOString()}] User ${req.user.username} (${req.user.id}) started: ${action}`);
    }

    // Перехватываем ответ для логирования
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      if (req.user) {
        const status = res.statusCode;
        const logLevel = status >= 400 ? 'ERROR' : 'INFO';
        console.log(`[${new Date().toISOString()}] User ${req.user.username} (${req.user.id}) completed: ${action} - ${status} (${duration}ms)`);
        
        if (status >= 400) {
          console.error(`[${new Date().toISOString()}] Error details:`, data);
        }
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
};
