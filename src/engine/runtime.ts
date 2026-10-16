import { createCameraRig, createDustRig, type CameraRig, type DustRig } from './rigs';

/**
 * The single place where the live animation rigs are kept. Timelines tween these objects;
 * the R3F world reads them every frame. Non-React by design: nothing here triggers a re-render.
 */
export interface Runtime {
  camera: CameraRig;
  dust: DustRig;
  /** Per-chapter rigs keyed by chapter slug. */
  chapters: Record<string, object>;
}

export const runtime: Runtime = {
  camera: createCameraRig(),
  dust: createDustRig(),
  chapters: {},
};

export function chapterRig<T extends object>(slug: string, create: () => T): T {
  const existing = runtime.chapters[slug];
  if (existing) return existing as T;
  const rig = create();
  runtime.chapters[slug] = rig;
  return rig;
}
