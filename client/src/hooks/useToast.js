import toast from 'react-hot-toast';

export const useToast = () => {
  const success = (message, options = {}) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#10b981',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '600',
      },
      ...options,
    });
  };

  const error = (message, options = {}) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#ef4444',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '600',
      },
      ...options,
    });
  };

  const info = (message, options = {}) => {
    toast(message, {
      duration: 3000,
      position: 'top-center',
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '600',
      },
      ...options,
    });
  };

  const warning = (message, options = {}) => {
    toast(message, {
      duration: 3500,
      position: 'top-center',
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '600',
      },
      ...options,
    });
  };

  const custom = (message, options = {}) => {
    toast(message, {
      duration: 3000,
      position: 'top-center',
      ...options,
    });
  };

  const promise = (promiseFunc, messages) => {
    return toast.promise(
      promiseFunc,
      {
        loading: messages.loading || 'Cargando...',
        success: messages.success || 'Éxito!',
        error: messages.error || 'Error!',
      },
      {
        position: 'top-center',
        style: {
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '600',
        },
      }
    );
  };

  return {
    success,
    error,
    info,
    warning,
    custom,
    promise,
  };
};