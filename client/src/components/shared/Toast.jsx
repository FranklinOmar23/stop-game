import { Toaster } from 'react-hot-toast';

const Toast = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1f2937',
          color: '#fff',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '600',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

export default Toast;