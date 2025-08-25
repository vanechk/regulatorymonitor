import { z } from 'zod';

// Схемы валидации для пользователей
export const userRegistrationSchema = z.object({
  username: z.string()
    .min(3, 'Имя пользователя должно содержать минимум 3 символа')
    .max(30, 'Имя пользователя не должно превышать 30 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Имя пользователя может содержать только буквы, цифры и подчеркивания'),
  email: z.string()
    .email('Некорректный email адрес')
    .max(255, 'Email не должен превышать 255 символов'),
  password: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль не должен превышать 128 символов')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль должен содержать минимум одну строчную букву, одну заглавную букву и одну цифру'),
  firstName: z.string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя не должно превышать 50 символов')
    .optional(),
  lastName: z.string()
    .min(2, 'Фамилия должна содержать минимум 2 символа')
    .max(50, 'Фамилия не должна превышать 50 символов')
    .optional(),
  region: z.string()
    .min(2, 'Регион должен содержать минимум 2 символа')
    .max(100, 'Регион не должен превышать 100 символов')
    .optional()
});

export const userLoginSchema = z.object({
  username: z.string()
    .min(1, 'Имя пользователя или email обязательно'),
  password: z.string()
    .min(1, 'Пароль обязателен')
}).or(z.object({
  email: z.string()
    .email('Некорректный email адрес')
    .min(1, 'Email обязателен'),
  password: z.string()
    .min(1, 'Пароль обязателен')
}));

export const userProfileUpdateSchema = z.object({
  firstName: z.string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя не должно превышать 50 символов')
    .optional(),
  lastName: z.string()
    .min(2, 'Фамилия должна содержать минимум 2 символа')
    .max(50, 'Фамилия не должна превышать 50 символов')
    .optional(),
  region: z.string()
    .min(2, 'Регион должен содержать минимум 2 символа')
    .max(100, 'Регион не должен превышать 100 символов')
    .optional(),
  themeColor: z.string()
    .regex(/^\d+\s+\d+%\s+\d+%$/, 'Некорректный формат цвета HSL')
    .optional(),
  themeMode: z.enum(['light', 'dark'])
    .optional()
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Текущий пароль обязателен'),
  newPassword: z.string()
    .min(8, 'Новый пароль должен содержать минимум 8 символов')
    .max(128, 'Новый пароль не должен превышать 128 символов')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Новый пароль должен содержать минимум одну строчную букву, одну заглавную букву и одну цифру')
});

// Схемы валидации для источников
export const sourceSchema = z.object({
  name: z.string()
    .min(2, 'Название источника должно содержать минимум 2 символа')
    .max(255, 'Название источника не должно превышать 255 символов'),
  url: z.string()
    .url('Некорректный URL')
    .max(500, 'URL не должен превышать 500 символов'),
  type: z.enum(['website', 'telegram'], {
    errorMap: () => ({ message: 'Тип источника должен быть website или telegram' })
  })
});

// Схемы валидации для ключевых слов
export const keywordSchema = z.object({
  text: z.string()
    .min(2, 'Ключевое слово должно содержать минимум 2 символа')
    .max(100, 'Ключевое слово не должно превышать 100 символов')
    .regex(/^[а-яА-Яa-zA-Z0-9\s\-_]+$/, 'Ключевое слово может содержать только буквы, цифры, пробелы, дефисы и подчеркивания')
});

// Схемы валидации для email настроек
export const emailSettingsSchema = z.object({
  email: z.string()
    .email('Некорректный email адрес')
    .max(255, 'Email не должен превышать 255 символов'),
  isEnabled: z.boolean(),
  summaryFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY'], {
    errorMap: () => ({ message: 'Частота должна быть DAILY, WEEKLY или MONTHLY' })
  })
});

// Схемы валидации для отчетов
export const reportSchema = z.object({
  name: z.string()
    .min(2, 'Название отчета должно содержать минимум 2 символа')
    .max(255, 'Название отчета не должно превышать 255 символов'),
  dateFrom: z.string()
    .datetime('Некорректная дата начала'),
  dateTo: z.string()
    .datetime('Некорректная дата окончания'),
  keywordsUsed: z.string()
    .max(1000, 'Ключевые слова не должны превышать 1000 символов')
    .optional()
});

// Функция для валидации данных
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Неизвестная ошибка валидации'] };
  }
}

// Функция для частичной валидации данных (для обновлений)
export function validatePartialData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: Partial<T> } | { success: false; errors: string[] } {
  try {
    // Создаем частичную схему для обновлений
    const partialSchema = schema.extend({}).partial();
    const validatedData = partialSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Неизвестная ошибка валидации'] };
  }
}

// Функция для санитизации данных
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Убираем потенциально опасные символы
    .replace(/\s+/g, ' '); // Заменяем множественные пробелы на один
}

// Функция для валидации и санитизации строк
export function validateAndSanitizeString(input: string, minLength: number, maxLength: number): string | null {
  const sanitized = sanitizeString(input);
  
  if (sanitized.length < minLength || sanitized.length > maxLength) {
    return null;
  }
  
  return sanitized;
}
