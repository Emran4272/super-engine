import DropletVoid from '../components/DropletVoid';

export default function HeroSection() {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#030303',
      }}
    >
      <DropletVoid />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(40px, 8vw, 140px)',
            fontWeight: 400,
            color: '#F4F4F0',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            textShadow: '0px 4px 24px rgba(0,0,0,0.5)',
            margin: 0,
          }}
        >
          LINGER IN THE LIMINAL
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            letterSpacing: '0.1em',
            color: '#F4F4F0',
            textTransform: 'uppercase',
            marginTop: '24px',
            fontWeight: 400,
            opacity: 0.8,
          }}
        >
          A house of olfactory shadows
        </p>
      </div>
    </section>
  );
}
