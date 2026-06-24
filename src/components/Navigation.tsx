export default function Navigation() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mixBlendMode: 'difference',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '32px',
        }}
      >
        {['SCENT LIBRARY', 'RITUALS', 'ARCHIVE'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(' ', '-')}`}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: '#F4F4F0',
              textDecoration: 'none',
              textTransform: 'uppercase' as const,
              fontWeight: 400,
            }}
          >
            {item}
          </a>
        ))}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '18px',
          color: '#F4F4F0',
          letterSpacing: '0.04em',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        ATELIER VEIL
      </div>

      <div>
        <a
          href="#inquiry"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: '#F4F4F0',
            textDecoration: 'none',
            textTransform: 'uppercase' as const,
            fontWeight: 400,
          }}
        >
          INQUIRY
        </a>
      </div>
    </nav>
  );
}
