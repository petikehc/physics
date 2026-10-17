import { useEffect } from 'react';
import gsap from 'gsap';
import { runtime } from '../engine/runtime';

/** Bottom of the top bar: the scene is lifted into the space between it and the panel. */
const TOP = 72;

/**
 * On a phone, a panel (Your turn, a Lab) is a sheet across the bottom of the screen that covers the middle, where
 * the camera keeps its subject. While the panel is open, lift the picture (a lens shift) so the subject sits in
 * the middle of the space above it. On a wider screen the panel stands at the side and nothing moves.
 */
export function useLiftAbove(find: () => HTMLElement | null) {
  useEffect(() => {
    const el = find();
    if (!el) return;
    const cam = runtime.camera;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const { innerWidth: w, innerHeight: h } = window;
      const sheet = r.width > w * 0.7;
      const lift = sheet ? Math.max(0, (h / 2 - (TOP + r.top) / 2) / h) : 0;
      gsap.to(cam, { lensY: lift, duration: 0.7, ease: 'power2.inOut', overwrite: 'auto' });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
      gsap.to(cam, { lensY: 0, duration: 0.7, ease: 'power2.inOut', overwrite: 'auto' });
    };
    // The panel is found once, when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
