import { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { tex } from './tex';

interface Props {
  source: string;
  visible: boolean;
  caption?: string;
  reduced?: boolean;
}

/**
 * A KaTeX formula that assembles atom by atom when it becomes visible and dissolves when hidden.
 * Colour each symbol with \textcolor so it matches its geometry in the 3D scene.
 */
export function Formula({ source, visible, caption, reduced = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef(false);
  const html = useMemo(() => tex(source, false), [source]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const atoms = el.querySelectorAll('.katex-html .base > span');
    const cap = el.querySelector('.formula__caption');
    const ctx = gsap.context(() => {
      if (visible) {
        gsap.set(el, { autoAlpha: 1 });
        if (reduced) {
          gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 });
          return;
        }
        gsap.fromTo(
          atoms,
          { y: 40, autoAlpha: 0, filter: 'blur(10px)', scale: 0.85 },
          {
            y: 0,
            autoAlpha: 1,
            filter: 'blur(0px)',
            scale: 1,
            duration: 0.9,
            stagger: 0.09,
            ease: 'expo.out',
          },
        );
        if (cap) gsap.fromTo(cap, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, delay: 0.6, duration: 0.6 });
      } else if (shown.current) {
        gsap.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.45, ease: 'power2.in' });
      }
    }, el);
    shown.current = visible;
    return () => ctx.revert();
  }, [visible, html, reduced]);

  // A long formula on a narrow screen shrinks until it fits across it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '';
      const room = window.innerWidth - 32;
      const width = el.scrollWidth;
      if (width > room) {
        const size = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = `${Math.floor((size * room) / width)}px`;
      }
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [html]);

  return (
    <div className="formula" ref={ref} style={{ visibility: 'hidden' }} aria-hidden={!visible}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {caption ? <span className="formula__caption">{caption}</span> : null}
    </div>
  );
}
