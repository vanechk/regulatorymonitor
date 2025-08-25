-- Увеличиваем размер поля token в таблице refresh_tokens для JWT токенов
-- Сначала удаляем уникальный индекс
DROP INDEX `refresh_tokens_token_key` ON `refresh_tokens`;

-- Изменяем размер поля
ALTER TABLE `refresh_tokens` MODIFY COLUMN `token` VARCHAR(1000) NOT NULL;

-- Создаем новый уникальный индекс с ограничением длины
CREATE UNIQUE INDEX `refresh_tokens_token_key` ON `refresh_tokens`(`token`(191));
