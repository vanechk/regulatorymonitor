/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `EmailSettings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url]` on the table `Source` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `_newsitemkeywords` DROP FOREIGN KEY `_NewsItemKeywords_A_fkey`;

-- DropForeignKey
ALTER TABLE `_newsitemkeywords` DROP FOREIGN KEY `_NewsItemKeywords_B_fkey`;

-- DropForeignKey
ALTER TABLE `newsitem` DROP FOREIGN KEY `NewsItem_sourceId_fkey`;

-- CreateIndex
CREATE UNIQUE INDEX `EmailSettings_email_key` ON `EmailSettings`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `Source_url_key` ON `Source`(`url`);
