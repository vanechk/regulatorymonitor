/*
  Warnings:

  - You are about to drop the `newsitem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `newsitem` DROP FOREIGN KEY `NewsItem_sourceId_fkey`;

-- DropTable
DROP TABLE `newsitem`;

-- CreateTable
CREATE TABLE `NewsItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` TEXT NOT NULL,
    `summary` TEXT NOT NULL,
    `sourceUrl` TEXT NOT NULL,
    `sourceName` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `documentRef` TEXT NULL,
    `taxType` TEXT NULL,
    `subject` TEXT NULL,
    `position` TEXT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NewsItem` ADD CONSTRAINT `NewsItem_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_NewsItemKeywords` ADD CONSTRAINT `_NewsItemKeywords_B_fkey` FOREIGN KEY (`B`) REFERENCES `NewsItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
