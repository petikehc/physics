import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, SplitText, CustomEase);
// One shared ease for every chapter-to-chapter handoff.
CustomEase.create('handoff', 'M0,0 C0.62,0 0.18,1 1,1');
// Keep timelines smooth after a hitch (e.g. a tab switch) instead of jumping.
gsap.ticker.lagSmoothing(500, 33);

export { gsap };
