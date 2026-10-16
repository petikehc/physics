# From Sand to Stars

Ten theorems of mathematics and physics, told as one cinematic 3D journey, from a triangle scratched in the sand to the
stars. Built with React, TypeScript, three.js (React Three Fiber), GSAP and Tone.js.

The full research, storyboards and architecture are in [`docs/PLAN.md`](docs/PLAN.md).

## Status

| #    | Chapter                                                                            | Status                                                         |
| ---- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| I    | The Pythagorean Theorem                                                            | **Playable**: journey, Your turn, Lab, score and sound effects |
| II–X | Circle area, Archimedes, Kepler, Newton, Calculus, Euler, Fourier, Doppler, Energy | In production                                                  |

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                               | What it does                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `npm run dev`                        | Vite dev server                                              |
| `npm run build`                      | Typecheck and production build to `dist/`                    |
| `npm run preview`                    | Serve the production build                                   |
| `npm test`                           | Unit tests (Vitest): the maths, the journey timeline, tuning |
| `npm run e2e`                        | End-to-end tests (Playwright, software WebGL)                |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint                                        |

Useful URL parameters: `?quality=low|medium|high` (otherwise detected) and `?motion=reduced`.

## How it fits together

- **One world, one canvas.** `src/app/World.tsx` renders a single persistent R3F `<Canvas>` behind every route. Each
  chapter is a _station_ placed in world space (`src/engine/world/stations.ts`).
- **Animation rigs.** Timelines never touch three.js objects. They tween plain objects (`src/engine/rigs.ts`, each
  chapter's `rig.ts`), and stations read those rigs every frame. That is why seeking, stepping and the Labs all work
  from the same animation.
- **The journey is one GSAP timeline.** `src/journey/builder.ts` assembles chapter beats into a master timeline. Each
  beat is padded so its caption can be read and carries sound cues and an optional Your-turn pause.
  `src/journey/controller.ts` drives playback, stepping and cues.
- **The camera director** (`src/engine/camera`) turns the camera rig into shots (orbits, arcs, handheld breathing) and
  hands the camera to the viewer in "Your turn" and the Labs.
- **The Dust** (`src/engine/dust`) is one GPU particle system that morphs between procedural point clouds. It carries
  every transition and the landing teaser.
- **Sound** (`src/audio`) is procedural Tone.js, lazy-loaded when the viewer chooses sound. Chapter 1 is scored in
  Pythagorean tuning and resolves on a 3:4:5 chord. The same engine renders offline previews.

## Adding a chapter

1. Create `src/chapters/NN-slug/` with `rig.ts` (animated numbers), `math.ts` (+ tests), `Station.tsx` (reads the rig),
   `timeline.ts` (beats added through `JourneyBuilder`) and UI for Your turn and the Lab.
2. Register it in `src/chapters/registry.ts`, give it a station in `stations.ts`, and add its timeline in
   `src/journey/journey.ts`.
