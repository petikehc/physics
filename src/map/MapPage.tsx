import { useEffect, useState } from 'react';
import { useApp } from '../state/store';
import { TopBar } from '../ui/TopBar';
import { ChaptersMenu } from '../ui/ChaptersMenu';
import { runtime } from '../engine/runtime';
import { shotVars } from '../engine/camera/shots';
import { createCameraRig, createWorldRig, resetRig } from '../engine/rigs';
import { station } from '../engine/world/stations';
import { DUST_SCALE, finaleRig, FINALE_DEFAULTS, SLUG } from '../chapters/finale/rig';
import { INDEX_FRAME } from '../chapters/finale/timeline';
import { STARS } from '../chapters/finale/layout';
import { ConstellationIndex } from '../chapters/finale/ui/ConstellationIndex';

/** The constellation as it is left at the end of the journey: every star lit, and ready to be chosen. */
function enterMap() {
  resetRig(runtime.camera, createCameraRig());
  resetRig(runtime.world, createWorldRig());
  runtime.world.night = 1;
  Object.assign(finaleRig(), {
    ...FINALE_DEFAULTS,
    on: 1,
    lit: STARS.length,
    thread: 1,
    visited: STARS.length,
    glow: 0.6,
    labels: 1,
    index: 1,
  });
  Object.assign(runtime.camera, { ...shotVars(SLUG, INDEX_FRAME), fov: 40, shake: 0.3, dof: 0 });
  const o = station(SLUG);
  Object.assign(runtime.dust, {
    from: 'constellation',
    to: 'constellation',
    morph: 1,
    x: o.x,
    y: o.y,
    z: o.z,
    rotX: 0,
    rotY: 0,
    scale: DUST_SCALE,
    size: 3,
    opacity: 1,
    spin: 0,
    swirl: 1.2,
    drift: 0.15,
    colorA: '#fff1d8',
    colorB: '#ffd9a8',
  });
}

/** /map: the constellation, the index of the journey. */
export default function MapPage() {
  const set = useApp((s) => s.set);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    enterMap();
    set({ mode: 'map', chapterSlug: SLUG, cameraMode: 'directed' });
    return () => set({ mode: 'page' });
  }, [set]);
  return (
    <div className="overlay">
      <TopBar chapterLabel="Constellation" onChapters={() => setMenu(true)} />
      <ConstellationIndex where="map" />
      {menu ? <ChaptersMenu onClose={() => setMenu(false)} /> : null}
    </div>
  );
}
