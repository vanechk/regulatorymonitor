# Добавление диалога подтверждения при выходе из системы

## Описание проблемы

При нажатии на кнопку "Выйти" пользователь сразу выходил из системы без подтверждения. Это могло привести к случайному выходу и потере несохраненных данных.

## Причина проблемы

1. **Отсутствие подтверждения**: Кнопка выхода сразу выполняла функцию `logout()`
2. **Потенциальная потеря данных**: Пользователь мог случайно нажать на кнопку
3. **Плохой UX**: Нет возможности отменить действие выхода

## Внесенные исправления

### 1. Добавление состояния для диалога

**Файл**: `src/client/components/Layout.tsx`

```typescript
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
```

### 2. Обновление логики выхода

```typescript
const handleLogoutClick = () => {
  setShowLogoutDialog(true);
};

const handleLogoutConfirm = () => {
  logout();
  navigate('/auth');
  setShowLogoutDialog(false);
};

const handleLogoutCancel = () => {
  setShowLogoutDialog(false);
};
```

### 3. Обновление кнопки выхода

```typescript
<Button
  variant="outline"
  size="default"
  onClick={handleLogoutClick} // ✅ Теперь показывает диалог вместо прямого выхода
  className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
>
  <LogOut className="h-4 w-4" />
  <span>Выйти</span>
</Button>
```

### 4. Добавление диалога подтверждения

```typescript
{/* Диалог подтверждения выхода */}
<Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        Подтверждение выхода
      </DialogTitle>
      <DialogDescription>
        Вы действительно хотите выйти из системы? Все несохраненные данные будут потеряны.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="flex gap-2 sm:justify-end">
      <Button
        variant="outline"
        onClick={handleLogoutCancel}
        className="border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        Отмена
      </Button>
      <Button
        onClick={handleLogoutConfirm}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        Да, выйти
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 5. Импорт необходимых компонентов

```typescript
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Home, Settings, FileSpreadsheet, Calendar, User, LogOut, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../../components/ui/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
```

## Результат исправления

После внесения изменений:

1. ✅ **Подтверждение выхода**: При нажатии на кнопку "Выйти" появляется диалог подтверждения
2. ✅ **Защита от случайного выхода**: Пользователь может отменить действие
3. ✅ **Информативность**: Диалог предупреждает о возможной потере данных
4. ✅ **Улучшенный UX**: Четкие кнопки "Отмена" и "Да, выйти"
5. ✅ **Визуальное оформление**: Иконка предупреждения и цветовое выделение

## Поток работы

1. **Пользователь нажимает "Выйти"** → Открывается диалог подтверждения
2. **Диалог показывает предупреждение** → "Вы действительно хотите выйти из системы?"
3. **Пользователь выбирает действие**:
   - **"Отмена"** → Диалог закрывается, выход не выполняется
   - **"Да, выйти"** → Выполняется выход, переход на страницу авторизации
4. **Диалог автоматически закрывается** → После выполнения действия

## Особенности реализации

- **Состояние диалога**: Управляется через `useState` хук
- **Обработчики событий**: Отдельные функции для показа, подтверждения и отмены
- **Доступность**: Использует стандартные компоненты Dialog для лучшей доступности
- **Стилизация**: Красная цветовая схема для предупреждения
- **Иконки**: AlertTriangle для визуального выделения предупреждения

## Рекомендации

1. **Тестирование**: Протестировать работу диалога на разных устройствах
2. **Доступность**: Убедиться, что диалог корректно работает с клавиатурой
3. **Локализация**: Рассмотреть добавление поддержки разных языков
4. **Анимации**: Возможно добавить плавные переходы при открытии/закрытии диалога
