/**
 * Утилиты для работы с русскими буквами
 * Обеспечивает, чтобы "е" и "ё" считались разными символами
 */

/**
 * Нормализует русский текст, сохраняя различия между "е" и "ё"
 * @param text - исходный текст
 * @returns нормализованный текст
 */
export function normalizeRussianText(text: string): string {
  if (!text) return text;
  
  // Приводим к нижнему регистру, но сохраняем "е" и "ё"
  return text.toLowerCase().trim();
}

/**
 * Проверяет, являются ли два слова одинаковыми с учетом русских букв
 * @param word1 - первое слово
 * @param word2 - второе слово
 * @returns true, если слова одинаковые
 */
export function areWordsEqual(word1: string, word2: string): boolean {
  if (!word1 || !word2) return false;
  
  // Нормализуем оба слова, сохраняя различия между "е" и "ё"
  const normalized1 = normalizeRussianText(word1);
  const normalized2 = normalizeRussianText(word2);
  
  return normalized1 === normalized2;
}

/**
 * Проверяет, содержит ли массив слов указанное слово
 * @param words - массив слов
 * @param targetWord - искомое слово
 * @returns true, если слово найдено
 */
export function containsWord(words: string[], targetWord: string): boolean {
  if (!words || !targetWord) return false;
  
  const normalizedTarget = normalizeRussianText(targetWord);
  
  return words.some(word => {
    const normalizedWord = normalizeRussianText(word);
    return normalizedWord === normalizedTarget;
  });
}

/**
 * Добавляет слово в массив, если его там нет
 * @param words - массив слов
 * @param newWord - новое слово
 * @returns новый массив с добавленным словом
 */
export function addWordIfNotExists(words: string[], newWord: string): string[] {
  if (!newWord || containsWord(words, newWord)) {
    return words;
  }
  
  return [...words, newWord.trim()];
}

/**
 * Удаляет слово из массива
 * @param words - массив слов
 * @param wordToRemove - слово для удаления
 * @returns новый массив без указанного слова
 */
export function removeWord(words: string[], wordToRemove: string): string[] {
  if (!wordToRemove) return words;
  
  const normalizedTarget = normalizeRussianText(wordToRemove);
  
  return words.filter(word => {
    const normalizedWord = normalizeRussianText(word);
    return normalizedWord !== normalizedTarget;
  });
}
