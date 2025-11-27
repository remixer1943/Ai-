import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const addToast = (message: string, type: ToastType): string => {
  const id = `toast-${Date.now()}-${Math.random()}`;
  toasts = [...toasts, { id, message, type }];
  notifyListeners();

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    removeToast(id);
  }, 3000);

  return id;
};

const removeToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
};

export const useToast = () => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    toasts,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
    warning: (msg: string) => addToast(msg, 'warning'),
    dismiss: removeToast,
  };
};
