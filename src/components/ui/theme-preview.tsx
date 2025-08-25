import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Switch } from './switch';
import { Input } from './input';

interface ThemePreviewProps {
  themeColor: string;
}

export function ThemePreview({ themeColor }: ThemePreviewProps) {
  const [switchChecked, setSwitchChecked] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('Пример текста');

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Предварительный просмотр темы</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Кнопки */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Кнопки</h4>
          <div className="flex gap-2">
            <Button 
              size="sm"
              style={{ 
                backgroundColor: `hsl(${themeColor})`,
                borderColor: `hsl(${themeColor})`
              }}
            >
              Основная кнопка
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              style={{ 
                borderColor: `hsl(${themeColor})`,
                color: `hsl(${themeColor})`
              }}
            >
              Outline кнопка
            </Button>
          </div>
        </div>

        {/* Переключатели */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Переключатели</h4>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={switchChecked}
              onCheckedChange={setSwitchChecked}
              style={{ 
                backgroundColor: switchChecked ? `hsl(${themeColor})` : undefined
              }}
            />
            <span className="text-sm">Пример переключателя</span>
          </div>
        </div>

        {/* Поля ввода */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Поля ввода</h4>
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ 
              borderColor: `hsl(${themeColor})`,
              outlineColor: `hsl(${themeColor})`
            }}
          />
        </div>

        {/* Бейджи */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Бейджи</h4>
          <div className="flex gap-2">
            <Badge 
              style={{ 
                backgroundColor: `hsl(${themeColor})`,
                color: 'white'
              }}
            >
              Основной бейдж
            </Badge>
            <Badge 
              variant="outline"
              style={{ 
                borderColor: `hsl(${themeColor})`,
                color: `hsl(${themeColor})`
              }}
            >
              Outline бейдж
            </Badge>
          </div>
        </div>

        {/* Цветовая палитра */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Цветовая палитра</h4>
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center">
              <div 
                className="w-8 h-8 rounded border mx-auto mb-1"
                style={{ backgroundColor: `hsl(${themeColor})` }}
              />
              <span className="text-xs">Основной</span>
            </div>
            <div className="text-center">
              <div 
                className="w-8 h-8 rounded border mx-auto mb-1"
                style={{ 
                  backgroundColor: `hsl(${themeColor.split(' ')[0]} ${themeColor.split(' ')[1]}% ${Math.min(Number(themeColor.split(' ')[2]) + 20, 95)}%)` 
                }}
              />
              <span className="text-xs">Светлый</span>
            </div>
            <div className="text-center">
              <div 
                className="w-8 h-8 rounded border mx-auto mb-1"
                style={{ 
                  backgroundColor: `hsl(${themeColor.split(' ')[0]} ${themeColor.split(' ')[1]}% ${Math.min(Number(themeColor.split(' ')[2]) + 40, 98)}%)` 
                }}
              />
              <span className="text-xs">Очень светлый</span>
            </div>
            <div className="text-center">
              <div 
                className="w-8 h-8 rounded border mx-auto mb-1"
                style={{ 
                  backgroundColor: `hsl(${themeColor.split(' ')[0]} ${themeColor.split(' ')[1]}% ${Math.max(Number(themeColor.split(' ')[2]) - 20, 5)}%)` 
                }}
              />
              <span className="text-xs">Темный</span>
            </div>
            <div className="text-center">
              <div 
                className="w-8 h-8 rounded border mx-auto mb-1"
                style={{ 
                  backgroundColor: `hsl(${themeColor.split(' ')[0]} ${themeColor.split(' ')[1]}% ${Math.max(Number(themeColor.split(' ')[2]) - 40, 2)}%)` 
                }}
              />
              <span className="text-xs">Очень темный</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
