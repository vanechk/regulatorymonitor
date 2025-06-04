import { toast as hotToast } from 'react-hot-toast';

export const useToast = () => {
  return {
    toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
      hotToast(props.title, {
        duration: 4000,
        style: props.variant === 'destructive' 
          ? { background: '#ef4444', color: 'white' } 
          : undefined,
      });
      
      if (props.description) {
        hotToast(props.description, {
          duration: 4000,
          style: props.variant === 'destructive'
            ? { background: '#ef4444', color: 'white' }
            : undefined,
        });
      }
    },
  };
}; 