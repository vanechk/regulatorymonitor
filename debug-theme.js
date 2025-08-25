// Скрипт для отладки системы тем
// Вставьте этот код в консоль браузера (F12)

console.log('=== ОТЛАДКА СИСТЕМЫ ТЕМ ===');

// Функция для проверки CSS переменных
function checkCSSVariables() {
  const root = document.documentElement;
  const computed = getComputedStyle(document.body);
  
  const variables = {
    '--primary': root.style.getPropertyValue('--primary'),
    '--accent': root.style.getPropertyValue('--accent'),
    '--ring': root.style.getPropertyValue('--ring'),
    '--primary-light': root.style.getPropertyValue('--primary-light'),
    '--primary-hover': root.style.getPropertyValue('--primary-hover'),
    'computed-primary': computed.getPropertyValue('--primary'),
    'computed-accent': computed.getPropertyValue('--accent')
  };
  
  console.log('CSS переменные:', variables);
  return variables;
}

// Функция для принудительного обновления темы
function forceUpdateTheme() {
  console.log('Принудительное обновление темы...');
  
  // Обновляем все элементы с цветами темы
  const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
  
  console.log('Найдено элементов для обновления:', elements.length);
  
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      // Триггерим перерисовку
      element.style.transform = 'translateZ(0)';
      setTimeout(() => {
        element.style.transform = '';
      }, 10);
    }
  });
  
  // Отправляем событие изменения темы
  const event = new Event('themeChange');
  window.dispatchEvent(event);
  
  console.log('Обновление завершено');
}

// Функция для установки цвета темы
function setThemeColor(color) {
  console.log('Установка цвета темы:', color);
  
  const root = document.documentElement;
  
  // Основные цвета темы
  root.style.setProperty('--primary', `hsl(${color})`);
  root.style.setProperty('--accent', `hsl(${color})`);
  root.style.setProperty('--ring', `hsl(${color})`);
  
  // Дополнительные цвета на основе основного
  const [h, s, l] = color.split(' ').map(Number);
  
  root.style.setProperty('--primary-light', `hsl(${h}, ${s}%, ${Math.min(l + 20, 95)}%)`);
  root.style.setProperty('--primary-lighter', `hsl(${h}, ${s}%, ${Math.min(l + 40, 98)}%)`);
  root.style.setProperty('--primary-dark', `hsl(${h}, ${s}%, ${Math.max(l - 20, 5)}%)`);
  root.style.setProperty('--primary-hover', `hsl(${h}, ${s}%, ${Math.max(l - 10, 5)}%)`);
  root.style.setProperty('--primary-foreground', `hsl(${h}, ${s}%, ${l > 50 ? 10 : 90}%)`);
  root.style.setProperty('--accent-foreground', `hsl(${h}, ${s}%, ${l > 50 ? 10 : 90}%)`);
  root.style.setProperty('--focus', `hsl(${h}, ${s}%, ${l}%)`);
  root.style.setProperty('--selection', `hsl(${h}, ${s}%, ${Math.min(l + 30, 95)}%)`);
  
  // Принудительно обновляем стили
  root.style.setProperty('--primary', `hsl(${color})`, 'important');
  
  // Сохраняем в localStorage
  localStorage.setItem('themeColor', color);
  
  // Принудительно обновляем все элементы
  setTimeout(forceUpdateTheme, 100);
  
  console.log('Цвет темы установлен:', color);
}

// Функция для тестирования цветов
function testColors() {
  const colors = [
    { name: 'Красный', value: '0 100% 50%' },
    { name: 'Зеленый', value: '120 100% 50%' },
    { name: 'Синий', value: '240 100% 50%' },
    { name: 'Розовый', value: '300 100% 50%' },
    { name: 'Желтый', value: '45 100% 50%' },
    { name: 'Фиолетовый', value: '280 100% 50%' }
  ];
  
  console.log('Доступные цвета для тестирования:');
  colors.forEach((color, index) => {
    console.log(`${index + 1}. ${color.name}: ${color.value}`);
  });
  
  // Создаем кнопки для быстрого тестирования
  const container = document.createElement('div');
  container.style.cssText = 'position: fixed; top: 10px; right: 10px; background: white; padding: 10px; border: 1px solid #ccc; border-radius: 5px; z-index: 10000;';
  container.innerHTML = '<h4>Быстрые тесты цветов:</h4>';
  
  colors.forEach(color => {
    const button = document.createElement('button');
    button.textContent = color.name;
    button.style.cssText = 'display: block; margin: 5px 0; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;';
    button.style.backgroundColor = `hsl(${color.value})`;
    button.style.color = 'white';
    button.onclick = () => setThemeColor(color.value);
    container.appendChild(button);
  });
  
  document.body.appendChild(container);
  console.log('Панель быстрых тестов добавлена в правый верхний угол');
}

// Функция для проверки элементов с цветами темы
function checkThemeElements() {
  const selectors = [
    '[class*="bg-primary"]',
    '[class*="text-primary"]',
    '[class*="border-primary"]',
    '[class*="bg-accent"]',
    '[class*="text-accent"]',
    '[class*="border-accent"]'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: найдено ${elements.length} элементов`);
    
    if (elements.length > 0) {
      elements.forEach((element, index) => {
        if (index < 3) { // Показываем только первые 3 элемента
          console.log(`  ${index + 1}. ${element.tagName}${element.className ? '.' + element.className.split(' ').join('.') : ''}`);
        }
      });
    }
  });
}

// Экспортируем функции в глобальную область
window.debugTheme = {
  checkCSSVariables,
  forceUpdateTheme,
  setThemeColor,
  testColors,
  checkThemeElements
};

console.log('Функции отладки доступны через window.debugTheme:');
console.log('- checkCSSVariables() - проверить CSS переменные');
console.log('- forceUpdateTheme() - принудительно обновить тему');
console.log('- setThemeColor("300 100% 50%") - установить розовый цвет');
console.log('- testColors() - добавить панель быстрых тестов');
console.log('- checkThemeElements() - проверить элементы с цветами темы');

// Автоматически запускаем проверку
checkCSSVariables();
checkThemeElements();



