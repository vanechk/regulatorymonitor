import React, { ReactNode, useEffect } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(30, 41, 59, 0.45)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(26,35,126,0.18)',
          minWidth: 320,
          maxWidth: '90vw',
          maxHeight: '90vh',
          padding: 32,
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Крестик для закрытия */}
        <button
          onClick={() => onOpenChange(false)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            color: '#888',
            cursor: 'pointer',
            zIndex: 10,
          }}
          aria-label="Закрыть"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={style}>{children}</div>;
}
export function DialogHeader({ children }: { children: ReactNode }) {
  return <div style={{ marginBottom: 16 }}>{children}</div>;
}
export function DialogTitle({ children }: { children: ReactNode }) {
  return <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{children}</h2>;
}
export function DialogFooter({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>{children}</div>;
} 