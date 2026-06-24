import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const rituals = [
  {
    number: '01',
    title: 'Anoint',
    description: 'Apply to pulse points — wrists, neck, behind the ears. The warmth of your body awakens the top notes.',
  },
  {
    number: '02',
    title: 'Breathe',
    description: 'Wait sixty seconds. Let the alcohol evaporate. Inhale deeply as the heart notes begin to surface.',
  },
  {
    number: '03',
    title: 'Linger',
    description: 'The base notes reveal themselves over hours. Carry the scent like a secret through your day.',
  },
];

export default function RitualsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      itemsRef.current.forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
            delay: i * 0.15,
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="rituals"
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: '20vh',
        paddingBottom: '20vh',
        backgroundColor: '#F4F4F0',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 40px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '12vh',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(32px, 5vw, 72px)',
              color: '#030303',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            The Ritual
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: '#8A7E72',
              textTransform: 'uppercase',
              marginTop: '16px',
            }}
          >
            How to wear scent as ceremony
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '80px',
          }}
        >
          {rituals.map((ritual, i) => (
            <div
              key={ritual.number}
              ref={(el) => {
                if (el) itemsRef.current[i] = el;
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '40px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  color: '#C9A87C',
                  fontWeight: 400,
                  minWidth: '30px',
                  paddingTop: '6px',
                }}
              >
                {ritual.number}
              </span>

              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(24px, 3vw, 40px)',
                    color: '#030303',
                    fontWeight: 400,
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {ritual.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '15px',
                    lineHeight: 1.7,
                    color: '#3D3A36',
                    marginTop: '12px',
                    maxWidth: '480px',
                    fontWeight: 300,
                  }}
                >
                  {ritual.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
