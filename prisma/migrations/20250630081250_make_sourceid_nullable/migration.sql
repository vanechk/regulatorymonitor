-- DropForeignKey
ALTER TABLE `newsitem` DROP FOREIGN KEY `NewsItem_sourceId_fkey`;

-- AlterTable
ALTER TABLE `newsitem` MODIFY `summary` TEXT NOT NULL,
    MODIFY `sourceId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `NewsItem` ADD CONSTRAINT `NewsItem_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
