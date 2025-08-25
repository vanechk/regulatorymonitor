-- DropIndex
DROP INDEX `NewsItem_sourceId_fkey` ON `newsitem`;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `themeColor` VARCHAR(191) NULL DEFAULT '220 85% 45%',
    `themeMode` VARCHAR(191) NOT NULL DEFAULT 'light',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
