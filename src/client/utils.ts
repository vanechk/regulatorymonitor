import { toast as hotToast } from 'react-hot-toast';

export const useToast = () => {
  return {
    toast: (props: { 
      title: string; 
      description?: string; 
      variant?: 'default' | 'destructive' | 'success';
      icon?: string;
    }) => {
      const isSuccess = props.variant === 'success';
      const isError = props.variant === 'destructive';
      
      // Современный стиль с градиентами и анимациями
      const toastStyle = {
        background: isSuccess 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : isError 
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '16px 20px',
        fontSize: '16px',
        fontWeight: '500',
        boxShadow: isSuccess
          ? '0 20px 25px -5px rgba(16, 185, 129, 0.3), 0 10px 10px -5px rgba(16, 185, 129, 0.2)'
          : isError
          ? '0 20px 25px -5px rgba(239, 68, 68, 0.3), 0 10px 10px -5px rgba(239, 68, 68, 0.2)'
          : '0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        minWidth: '300px',
        maxWidth: '400px',
        lineHeight: '1.5',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative' as const,
        overflow: 'hidden'
      };

      // Создаем простой текст для toast
      const icon = isSuccess ? '✅' : isError ? '❌' : props.icon || 'ℹ️';
      const message = props.description 
        ? `${icon} ${props.title}\n${props.description}`
        : `${icon} ${props.title}`;

      hotToast(message, {
        duration: 5000,
        style: toastStyle,
        position: 'top-right',
        className: 'modern-toast',
      });
    },
  };
}; 