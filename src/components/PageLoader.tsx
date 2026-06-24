import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#F4F4F0',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.5s ease-out',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '18px',
          letterSpacing: '0.08em',
          color: '#030303',
        }}
      >
        ATELIER VEIL
      </span>
    </div>
  );
}
