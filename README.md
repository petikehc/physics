# From Sand to Stars

Ten theorems of mathematics and physics, told as one cinematic 3D journey, from a triangle scratched in the sand to the
stars. Built with React, TypeScript, three.js (React Three Fiber), GSAP and Tone.js.

The full research, storyboards and architecture are in [`docs/PLAN.md`](docs/PLAN.md).

## Status

| #    | Chapter                             | Status                                                         |
| ---- | ----------------------------------- | -------------------------------------------------------------- |
| I    | The Pythagorean Theorem             | **Playable**: journey, Your turn, Lab, score and sound effects |
| II   | The Area of a Circle                | **Playable**: journey, Your turn, Lab, score and sound effects |
| III  | Archimedes' Principle               | **Playable**: journey, Your turn, Lab, score and sound effects |
| IV   | Kepler's Laws                       | **Playable**: journey, Your turn, Lab, score and sound effects |
| V    | Universal Gravitation               | **Playable**: journey, Your turn, Lab, score and sound effects |
| VI   | The Fundamental Theorem of Calculus | **Playable**: journey, Your turn, Lab, score and sound effects |
| VII  | Euler's Identity                    | **Playable**: journey, Your turn, Lab, score and sound effects |
| VIII | Fourier Series                      | **Playable**: journey, Your turn, Lab, score and sound effects |
| IX   | The Doppler Effect                  | **Playable**: journey, Your turn, Lab, score and sound effects |
| X    | Conservation of Energy              | **Playable**: journey, Your turn, Lab, score and sound effects |
| ✦    | Finale: Something Stays the Same    | **Playable**: the constellation, one sweep, and the index      |

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                               | What it does                                                  |
| ------------------------------------ | ------------------------------------------------------------- |
| `npm run dev`                        | Vite dev server                                               |
| `npm run build`                      | Typecheck and production build to `dist/`                     |
| `npm run preview`                    | Serve the production build                                    |
| `npm test`                           | Unit tests (Vitest): the maths, the journey timeline, tuning  |
| `npm run e2e`                        | End-to-end tests (Playwright, software WebGL)                 |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint                                         |
| `npm run render:preview`             | Render the journey to `previews/` (WAV soundtrack + MP4 film) |

Useful URL parameters: `?quality=low|medium|high` (otherwise detected) and `?motion=reduced`.

### Rendering a preview film

With the production build served (`npm run build && npm run preview`), `npm run render:preview -- --quality low`
renders the soundtrack offline and the picture frame by frame (by seeking the timeline), then muxes both with ffmpeg
into `previews/journey.mp4`. It needs no GPU. Add `--resume` to continue an interrupted render and `--from`/`--seconds`
to render a slice.

### Deploys and previews

Every push publishes the site to GitHub Pages (the `gh-pages` branch, built by `.github/workflows/pages.yml`):

- `main` is the live site: https://petikehc.github.io/physics/
- any other branch gets its own preview: `https://petikehc.github.io/physics/preview/<branch>/` (lower-case, with
  `/` turned into `-`), removed again when the branch is deleted.

Work on a chapter or a fix in its own branch, check its preview (on a phone too), then merge it into `main` with a
pull request.

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
  hands the camera to the viewer in "Your turn" and the Labs. On a wide screen a shot can slide sideways (`side`) to
  leave room for a panel beside its subject; on a phone, where panels sit below, it stays centred.
- **The Dust** (`src/engine/dust`) is one GPU particle system that morphs between procedural point clouds. It carries
  every transition and the landing teaser.
- **Sound** (`src/audio`) is procedural Tone.js, lazy-loaded when the viewer chooses sound. The score is in
  Pythagorean tuning throughout: chapter 1 resolves on a 3:4:5 chord, chapter 2 glides into its own key, its
  arpeggio circling and climbing as the slices multiply, chapter 3's bath ripples in D, in chapter 4 Mars sings a
  note that follows how fast it turns, as Kepler imagined in Harmonices Mundi, in chapter 5 Newton's cannonball
  whistles higher the faster it falls, and in chapter 6 a voice sings a curve's height, which is also the slope of the
  area under it. In chapter 9 the ambulance's siren is worked out from Doppler's formula as you hear it, and in
  chapter 10 the coaster's rush follows its speed and each turn-back rings a note set by its height. The finale
  comes home to C: each star rings its own chapter's note, and the journey resolves on the 3:4:5 chord it began
  with. The same engine renders offline previews.
- **The world** (`runtime.world`) fades from the dusk beach of the first chapters into deep space (`space` 0 → 1)
  as the journey rises to the planets, and to a night street and fairground (`night`) for the last two chapters.

- **The finale** (`src/chapters/finale`) is a station like the chapters' but not one of them: the night's stars
  gather into a constellation of ten, one per chapter, and one sweep along them shows what each kept the same,
  before Noether's theorem says why. At the end of the journey, and at `/map`, the constellation is the index.

## Adding a chapter

1. Create `src/chapters/NN-slug/` with `rig.ts` (animated numbers), `math.ts` (+ tests), `Station.tsx` (reads the rig),
   `timeline.ts` (beats added through `JourneyBuilder`, starting with the flight in), `sound.ts` (continuous levels)
   and UI for Your turn and the Lab.
2. Register it in `src/chapters/registry.ts` and give it a place in `src/engine/world/stations.ts`.
3. Wire it in: its station in `src/chapters/stations.ts`, its Your turn, Lab and formula in `src/chapters/views.ts`,
   its rig reset and Your-turn exit in `src/chapters/hooks.ts`, its meter in `src/chapters/sound.ts`, its timeline in
   `src/journey/journey.ts`, and its beats in the score's `ARRANGEMENT`.
