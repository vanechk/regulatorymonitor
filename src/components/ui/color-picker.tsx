import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { cn } from '../../lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(value);
  const [currentColor, setCurrentColor] = useState(value); // Сохраняем текущий цвет
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
  const [hex, setHex] = useState('#000000');
  const [selectedHue, setSelectedHue] = useState(0); // Сохраняем выбранный оттенок
  const [isInitialized, setIsInitialized] = useState(false); // Флаг инициализации
  
  const spectrumRef = useRef<HTMLDivElement>(null);
  const grayscaleRef = useRef<HTMLDivElement>(null);

  // Преобразование RGB в оттенок (Hue)
  const rgbToHue = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    if (diff === 0) return 0;
    
    let hue = 0;
    switch (max) {
      case r:
        hue = ((g - b) / diff) % 6;
        break;
      case g:
        hue = (b - r) / diff + 2;
        break;
      case b:
        hue = (r - g) / diff + 4;
        break;
    }
    
    hue = hue * 60;
    if (hue < 0) hue += 360;
    return hue;
  };

  // Преобразование HSL в RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  // Преобразование RGB в HEX
  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  // Преобразование HSL в HEX
  const hslToHex = (h: number, s: number, l: number) => {
    const rgb = hslToRgb(h, s / 100, l / 100);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };

  // Преобразование HSL строки в HEX
  const hslStringToHex = (hslString: string) => {
    try {
      // Парсим строку вида "220 85% 45%"
      const parts = hslString.split(' ');
      if (parts.length === 3) {
        const h = parseFloat(parts[0]);
        const s = parseFloat(parts[1].replace('%', ''));
        const l = parseFloat(parts[2].replace('%', ''));
        
        if (!isNaN(h) && !isNaN(s) && !isNaN(l)) {
          return hslToHex(h, s, l);
        }
      }
    } catch (error) {
      console.error('Ошибка парсинга HSL:', error);
    }
    return '#000000'; // fallback
  };

  // Преобразование RGB в HSL
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    
    let h = 0;
    let s = 0;
    const l = sum / 2;
    
    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - sum) : diff / sum;
      
      switch (max) {
        case r:
          h = ((g - b) / diff) % 6;
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      
      h = h * 60;
      if (h < 0) h += 360;
    }
    
    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Преобразование HEX в HSL строку
  const hexToHslString = (hex: string) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const hsl = rgbToHsl(r, g, b);
        return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
      }
    } catch (error) {
      console.error('Ошибка преобразования HEX в HSL:', error);
    }
    return '220 85% 45%'; // fallback
  };

  // Инициализация значений при загрузке
  useEffect(() => {
    try {
      let hexValue = value;
      
      // Если значение в формате HSL, преобразуем в HEX
      if (value && !value.startsWith('#')) {
        hexValue = hslStringToHex(value);
      }
      
      if (hexValue && hexValue.startsWith('#')) {
        setSelectedColor(hexValue);
        
        // Устанавливаем currentColor только при первой инициализации
        if (!isInitialized) {
          setCurrentColor(hexValue);
          setIsInitialized(true);
        }
        
        setHex(hexValue);
        const r = parseInt(hexValue.slice(1, 3), 16);
        const g = parseInt(hexValue.slice(3, 5), 16);
        const b = parseInt(hexValue.slice(5, 7), 16);
        
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          setRgb({ r, g, b });
          // Вычисляем оттенок из RGB
          const hue = rgbToHue(r, g, b);
          setSelectedHue(hue);
        }
      } else {
        // Устанавливаем значения по умолчанию
        const defaultColor = '#000000';
        setSelectedColor(defaultColor);
        
        if (!isInitialized) {
          setCurrentColor(defaultColor);
          setIsInitialized(true);
        }
        
        setHex(defaultColor);
        setRgb({ r: 0, g: 0, b: 0 });
        setSelectedHue(0);
      }
    } catch (error) {
      console.error('Ошибка инициализации ColorPicker:', error);
      // Устанавливаем значения по умолчанию при ошибке
      const defaultColor = '#000000';
      setSelectedColor(defaultColor);
      
      if (!isInitialized) {
        setCurrentColor(defaultColor);
        setIsInitialized(true);
      }
      
      setHex(defaultColor);
      setRgb({ r: 0, g: 0, b: 0 });
      setSelectedHue(0);
    }
  }, [value, isInitialized]);

  // Обработка клика по спектру
  const handleSpectrumClick = (e: React.MouseEvent) => {
    if (!spectrumRef.current) return;
    
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const hue = (x / rect.width) * 360;
    setSelectedHue(hue);
    
    // Используем текущую яркость (50%)
    const saturation = 100;
    const lightness = 50;
    
    const newRgb = hslToRgb(hue, saturation / 100, lightness / 100);
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setSelectedColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    onChange(hexToHslString(rgbToHex(newRgb.r, newRgb.g, newRgb.b)));
  };

  // Обработка клика по градации яркости
  const handleBrightnessClick = (e: React.MouseEvent) => {
    if (!grayscaleRef.current) return;
    
    const rect = grayscaleRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const lightness = ((rect.height - y) / rect.height) * 100;
    
    // Используем выбранный оттенок, но меняем яркость
    const saturation = 100;
    const newRgb = hslToRgb(selectedHue, saturation / 100, lightness / 100);
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setSelectedColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    onChange(hexToHslString(rgbToHex(newRgb.r, newRgb.g, newRgb.b)));
  };

  // Обработка изменения RGB полей
  const handleRgbChange = (field: 'r' | 'g' | 'b', value: string) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgb = { ...rgb, [field]: numValue };
    setRgb(newRgb);
    
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHex(newHex);
    setSelectedColor(newHex);
    
    // Обновляем выбранный оттенок
    const hue = rgbToHue(newRgb.r, newRgb.g, newRgb.b);
    setSelectedHue(hue);
    
    onChange(hexToHslString(newHex));
  };

  // Обработка изменения HEX поля
  const handleHexChange = (value: string) => {
    if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
      setHex(value);
      const r = parseInt(value.slice(1, 3), 16);
      const g = parseInt(value.slice(3, 5), 16);
      const b = parseInt(value.slice(5, 7), 16);
      setRgb({ r, g, b });
      setSelectedColor(value);
      
      // Обновляем выбранный оттенок
      const hue = rgbToHue(r, g, b);
      setSelectedHue(hue);
      
      onChange(hexToHslString(value));
    } else {
      setHex(value);
    }
  };

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      <div className="space-y-6">
        {/* Область выбора цвета */}
        <div className="flex gap-4">
          {/* Спектр - увеличенный размер */}
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Цветовой спектр</Label>
            <div 
              ref={spectrumRef}
              className="w-full h-40 rounded-lg cursor-crosshair relative border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              style={{
                background: 'linear-gradient(to right, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)'
              }}
              onClick={handleSpectrumClick}
            />
          </div>
          
          {/* Градация яркости - теперь меняет яркость выбранного цвета */}
          <div className="w-16">
            <Label className="text-sm font-medium mb-2 block">Яркость</Label>
            <div 
              ref={grayscaleRef}
              className="w-full h-40 rounded-lg cursor-crosshair relative border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              style={{
                background: `linear-gradient(to bottom, ${hslToHex(selectedHue, 100, 100)}, ${hslToHex(selectedHue, 100, 75)}, ${hslToHex(selectedHue, 100, 50)}, ${hslToHex(selectedHue, 100, 25)}, ${hslToHex(selectedHue, 100, 0)})`
              }}
              onClick={handleBrightnessClick}
            />
          </div>
        </div>
        
        {/* Цветовая модель и значения */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Цветовая модель</Label>
              <div className="mt-2 p-3 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700">
                RGB
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-red-600">Красный</Label>
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', e.target.value)}
                  className="h-10 text-sm border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-green-600">Зеленый</Label>
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', e.target.value)}
                  className="h-10 text-sm border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-blue-600">Синий</Label>
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', e.target.value)}
                  className="h-10 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Шестнадцатеричный формат</Label>
              <Input
                value={hex}
                onChange={(e) => handleHexChange(e.target.value)}
                className="h-10 text-sm font-mono border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="#000000"
              />
            </div>
            
            {/* Предварительный просмотр */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Предварительный просмотр</Label>
              <div className="flex gap-4">
                <div className="text-center">
                  <Label className="text-xs text-gray-600">Новый цвет</Label>
                  <div 
                    className="w-20 h-20 rounded-lg border-2 border-gray-300 mt-2 shadow-sm"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div className="text-xs text-gray-500 mt-1 font-mono">{selectedColor}</div>
                </div>
                <div className="text-center">
                  <Label className="text-xs text-gray-600">Текущий цвет</Label>
                  <div 
                    className="w-20 h-20 rounded-lg border-2 border-gray-300 mt-2 shadow-sm"
                    style={{ backgroundColor: currentColor }}
                  />
                  <div className="text-xs text-gray-500 mt-1 font-mono">{currentColor}</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs h-6 px-2"
                    onClick={() => setCurrentColor(selectedColor)}
                  >
                    Обновить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
