import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const images = [
  { src: '/images/archive-01.jpg', label: 'Obsidian Glass' },
  { src: '/images/archive-02.jpg', label: 'Crushed Velvet' },
  { src: '/images/archive-03.jpg', label: 'Smoke Rising' },
  { src: '/images/archive-04.jpg', label: 'Gold Leaf' },
  { src: '/images/archive-05.jpg', label: 'Dried Petals' },
  { src: '/images/archive-06.jpg', label: 'Polished Stone' },
  { src: '/images/archive-07.jpg', label: 'Dark Water' },
  { src: '/images/archive-08.jpg', label: 'Silk Thread' },
];

export default function ArchiveSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const items = itemsRef.current;
    if (!items.length) return;

    const ctx = gsap.context(() => {
      items.forEach((el) => {
        const inner = el.querySelector('.archive-inner') as HTMLElement;

        // 1. Rotation fold
        gsap.fromTo(el,
          { rotationX: 0 },
          {
            rotationX: -70,
            ease: 'power1.in',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              end: 'top 15%',
              scrub: true,
            },
          }
        );

        // 2. Inner parallax
        if (inner) {
          gsap.fromTo(inner,
            { yPercent: -40 },
            {
              yPercent: 40,
              ease: 'none',
              scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
        }

        // 3. Brightness reveal
        gsap.fromTo(el,
          { filter: 'brightness(0.17)' },
          {
            filter: 'brightness(1)',
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              end: 'top 20%',
              scrub: true,
            },
          }
        );

        // 4. Scale un-focus
        gsap.to(el, {
          scale: 0.98,
          ease: 'sine.inOut',
          scrollTrigger: {
            trigger: el,
            start: 'top 50%',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="archive"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '150vh',
        backgroundColor: '#030303',
        paddingTop: '15vh',
        paddingBottom: '15vh',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '10vh',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(32px, 5vw, 72px)',
            color: '#F4F4F0',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Archive of Notes
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
          Raw materials that define our compositions
        </p>
      </div>

      <div
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              ref={(el) => {
                if (el) itemsRef.current[i] = el;
              }}
              style={{
                transformOrigin: '0% 100%',
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '1',
                cursor: 'pointer',
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="archive-inner"
                style={{
                  width: '100%',
                  height: '140%',
                  position: 'absolute',
                  top: '-20%',
                }}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  loading="lazy"
                />
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    color: '#F4F4F0',
                    textTransform: 'uppercase',
                    fontWeight: 400,
                    textShadow: '0 1px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  {img.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
