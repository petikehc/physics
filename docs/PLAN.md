# From Sand to Stars — 10 theorems as a 3D cinematic journey (React + TS + three.js + GSAP)

## Context

`petikehc/physics` is an empty repo (branch `claude/nifty-gauss-ttjbaf`, no commits). The goal is a site that
explains the 10 most basic, well‑known math & physics theorems through animation, built with React, TypeScript,
three.js and GSAP, with SFX and an instrumental score.

**Decisions confirmed with the user**
- The 10 theorems below.
- "Ink & Starlight" art direction.
- Procedural SFX and an instrumental score.
- **Fully 3D**: one world with a directed, moving camera.
- **Play‑first**: a landing teaser with a ▶ Play button, not required scrolling.
- Labs and a Constellation index alongside the journey.

**This session's scope:** Phases 0–2 (§6). That means: commit the plan, scaffold the repo, build the engine (player,
camera director, Dust, audio), build the teaser landing, and finish chapter 1 (Pythagoras) end to end with its sound,
then stop for review.

---

## 1. Research — choosing the 10

**Selection criteria** (each scored 1–3):
- **Fame**: rank on the "100 Greatest Theorems" list / recurrence in popular "laws of physics" lists.
- **Animatable**: is there a classic proof or demonstration that is literally motion?
- **Self‑contained**: explainable in about 6 beats.
- **Story fit**: can it hand a visual baton to the next chapter?

**Evidence**
- Freek Wiedijk's *100 Theorems* list: Pythagorean **#4**, Area of a circle **#9**, Polyhedron formula **#13**, FTC **#15**,
  De Moivre **#17**, CLT **#47**, Fourier series **#76**.
- Euler's identity tied for first in Physics World's 2004 greatest‑equation poll, where F = ma and Pythagoras also placed in the top 5.
- Popular physics lists almost always include Newton's laws, gravitation and energy conservation. Archimedes, Kepler,
  Hooke and Snell appear often, and Doppler and momentum sometimes.
- Lessons from the best explainers:
  - Ciechanowski: one control changes one variable.
  - 3Blue1Brown: continuous morphs, and each symbol has the same colour in the formula and the geometry.
  - Jez Swanson's Fourier piece: draw a shape and epicycles redraw it.
  - PhET / Nicky Case: let people play first, explain after.

| Candidate | Fame | Anim. | Self | Story | |
|---|---|---|---|---|---|
| Pythagorean theorem | 3 | 3 | 3 | 3 | ✅ |
| Area of a circle πr² | 3 | 3 | 3 | 3 | ✅ |
| Archimedes' principle | 3 | 3 | 3 | 3 | ✅ |
| Kepler's laws | 3 | 3 | 3 | 3 | ✅ |
| Newton's gravitation & laws of motion | 3 | 3 | 3 | 3 | ✅ |
| Fundamental theorem of calculus | 3 | 3 | 2 | 3 | ✅ |
| Euler's formula / identity | 3 | 3 | 2 | 3 | ✅ |
| Fourier series | 2 | 3 | 3 | 3 | ✅ |
| Doppler effect | 3 | 3 | 3 | 3 | ✅ |
| Conservation of energy | 3 | 3 | 3 | 3 | ✅ |
| CLT (Galton board), Euler V−E+F=2, Snell's law, momentum (cradle), Gauss sum, Hooke | 2–3 | 3 | 3 | 1–2 | ◻ bench |
| E=mc², Noether, Bernoulli, Fermat's Last | 3 | 1 | 1 | – | ✗ |

**The 10 (5 math, 5 physics), in chronological order**

| # | Theorem | Formula | Who / when |
|---|---|---|---|
| 1 | Pythagorean theorem | a² + b² = c² | Pythagoras, c. 530 BC |
| 2 | Area of a circle | A = πr² | Archimedes, c. 250 BC |
| 3 | Archimedes' principle | F_b = ρ·V·g | Archimedes, c. 250 BC |
| 4 | Kepler's laws (equal areas) | ΔA/Δt = const | Kepler, 1609–1619 |
| 5 | Newton's gravitation & laws of motion | F = G·m₁m₂/r², F = ma | Newton, 1687 |
| 6 | Fundamental theorem of calculus | ∫ₐᵇ f = F(b) − F(a) | Newton & Leibniz, 1660s–80s |
| 7 | Euler's formula → identity | e^{iθ} = cos θ + i sin θ | Euler, 1748 |
| 8 | Fourier series | f(t) = Σ aₙ sin(nωt + φₙ) | Fourier, 1807–1822 |
| 9 | Doppler effect | f' = f·(v + v_o)/(v − v_s) | Doppler, 1842 |
| 10 | Conservation of energy | ½mv² + mgh = const | Mayer/Joule/Helmholtz, 1840s |

---

## 2. Experience concept

### Play‑first, not scroll‑first

| | Scroll‑scrubbed | **Play button + player (chosen)** |
|---|---|---|
| Music/SFX | must follow erratic scroll speed | composed against a real timeline: hits land on cue |
| Camera | limited by what scrubbing tolerates | directed shots: dolly, crane, orbit, chase |
| Interaction | fights with scrolling | free during "Your turn" pauses |
| Control | full | player bar, beat stepping, pause anywhere |
| Mobile | pinning quirks | full‑screen, tap/swipe |

**Flow**
1. **Landing `/` (the sneak peek).** A full‑screen 3D teaser loops silently. The Dust particles swirl and re‑form into
   each chapter's icon (triangle → disc → crown → orbit → apple → curve → helix → epicycles → wavefront →
   coaster loop) while the camera drifts. The title "From Sand to Stars" is set with SplitText. Below it:
   **▶ Begin the journey** (≈12 min, with sound) · *watch in silence* · *chapters*. Pressing Play collapses the Dust
   into a single grain of sand and chapter 1 begins. The button press is also the user gesture that unlocks audio.
2. **Journey `/play` and `/play/:slug`.** Directed playback through one 3D world.
   - **Player bar:** play/pause (space); a scrubber with 10 chapter markers that show the year and title on hover;
     previous/next beat (←/→, swipe, or one mouse‑wheel notch steps one beat); captions; speed 0.75/1/1.25×;
     music and SFX volume; a chapters menu.
   - **Reading‑aware pacing:** each beat holds at least as long as its caption takes to read.
   - **"Your turn" moment** ends every chapter. The camera settles, controls fade in (drag a vertex, a slider), then
     *Continue ▸*. Auto‑continue counts down about 12 s and any interaction cancels it. It can be switched off in settings.
3. **Labs `/lab/:slug`.** A full sandbox per theorem: the same scene with every control and a step‑through proof.
   It is linked from each "Your turn" moment.
4. **Constellation `/map`.** The finale and the index: 10 stars joined by the story thread. Click one to play from
   that chapter or open its Lab.

### Fully 3D: one world, a directed camera
- **Each chapter is a "station"** in a single world coordinate space. Between chapters, the camera flies a spline from
  one station to the next while the Dust morphs the outgoing object into the incoming one, so there are no hard cuts.
  Only the active station ± 1 is mounted.
- **Every flat concept gets a physical 3D form.** Areas become glass tanks that hold water. Riemann bars become
  columns that fly and stack. Epicycles become a layered clockwork. Wavefronts become expanding spheres. Formulas are
  DOM overlays; the world holds objects, not text.
- **Rule: 3D for wonder, face‑on for reading.** For a moment that must be read precisely (comparing areas, reading a
  graph), the camera lands perpendicular to the plane and holds, then breaks away into 3D.
- **Cinematic grammar:** macro push‑ins with depth of field, crane ups, slow orbits around a reveal, chase cams,
  gentle handheld "breathing" layered on every shot (switched off for reduced motion).

### The story: "From Sand to Stars"
2,500 years told in order: a triangle scratched in sand → water → the sky → falling apples → the curve → the circle in
the complex plane → waves → sound → motion → heat that floats up and becomes stars.

**Callbacks** (each one gets a beat):
- Ch.1's hypotenuse sweeps out ch.2's circle, and in ch.7 cos² + sin² = 1 turns out to be Pythagoras on the unit circle.
- Ch.4's ellipse ghosts in over ch.5's orbit.
- Ch.5's apple strobe becomes ch.6's graph, and the area under it is a triangle.
- Ch.7's arrow grows ch.8's epicycles.
- Ch.9 redshift points back to ch.4's stars, and ch.10's tanks echo ch.1 and ch.3.
- Epilogue: *something stays the same* (area, displaced weight, angular momentum = equal areas, |e^{iθ}| = 1,
  energy), with a nod to Noether.

### Signature motif: the Dust
One persistent GPU particle system (~60k points desktop, ~20k mobile) that carries every transition: sand →
droplets → stars → apple strobes → sound shells → heat sparks → constellation. A vertex shader morphs
`positionA → positionB` with curl noise mid‑transition. Target shapes are sampled from procedural meshes with
`MeshSurfaceSampler`.

### Art direction: "Ink & Starlight", in 3D
- **World:** a dark ink world with mood lighting per station: dusk sun, warm bath‑house lamps, the cold point light
  of a sun in space, sodium streetlights for Doppler.
- **Objects:** stylized and procedural (LatheGeometry, ExtrudeGeometry, TubeGeometry), with matte surfaces, rim
  lights and chalk‑white edge lines that draw in. There are no downloaded models; glTF can be added later.
- **Colour:** each chapter has one accent colour. a, b and c (and each later symbol) keep the same colour in the 3D
  geometry and in the formula.
- **Post‑processing:** depth of field on macro shots, bloom for stars and glow, vignette and film grain. All are
  scaled by quality tier.
- **Lighting:** procedural `Lightformer` environments, so there are no HDRI downloads.
- **Type:** Instrument Serif or Fraunces for titles, Inter for captions, JetBrains Mono for numbers that tick.
- **Motion:** KaTeX formulas assemble character by character with SplitText. All chapter‑to‑chapter handoffs share
  one ease. Nothing moves without a reason.

---

## 3. Chapter storyboards (beats · camera · Your turn · handoff)

**1 · Pythagoras — a² + b² = c²** (terracotta, dusk beach)
- Beats:
  - A macro shot at sand level (DOF) as a stick scratches a right triangle; grains are displaced and catch the low
    sun. Labels a, b, c appear and a right‑angle tick sounds.
  - The camera cranes up as three glass tanks rise out of the sand on the three sides. All have the same depth, so
    volume ∝ area.
  - The camera orbits slowly as the two small tanks tilt and pour into the big one, which fills exactly to the brim.
  - The camera lands **top‑down** for the reading moment. Four thick stone copies of the triangle lift, flip through
    the air and slam into an (a+b) frame. Layout A leaves holes a² + b², layout B leaves a hole c²: same pieces, same
    frame, so the areas are equal.
  - The formula assembles.
- Your turn: drag the vertices. Snapping to integers makes Pythagorean triples chime.
- Lab: proof selector; "break the right angle" angle slider showing c² ≠ a² + b².
- Handoff: the hypotenuse is fixed as a radius and spins, and its tip carves a circle in the sand; the camera tilts to the horizon.

**2 · Archimedes — A = πr²** (bronze)
- Beats:
  - The circle rises as a thick bronze disc. It slices into 8 wedges that lift and riffle through the air like a
    card shuffle, interleaving into a scalloped slab.
  - N grows 8 → 16 → 64 → 256 and the slab flattens into a πr × r block; the camera lands face‑on to read it.
  - Onion proof: the disc becomes concentric rope rings that uncoil in space and stack into a triangular prism ½·2πr·r.
  - π digits stream.
- Your turn / Lab: N slider with live error; drag r; switch between the wedge and onion proofs.
- Handoff: the disc extrudes into a golden crown.

**3 · Archimedes' principle — buoyancy = weight of displaced fluid** (aqua, bath house)
- Beats:
  - The crown hangs from a spring scale over a brimming stone tank.
  - It is lowered: ripples, and spilled water runs into a beaker. The scale drops by exactly the spilled water's
    weight, shown with force arrows.
  - The camera **dips below the waterline** (underwater filter) for a density line‑up: wood floats, gold sinks, ice
    floats about 90% under, with the submerged volume glowing.
  - "Eureka!"
- Your turn / Lab: drop materials into fluids (water, oil, Dead Sea, mercury); submerged fraction = ρ_obj/ρ_fluid.
- Handoff: a bubble rises; the camera follows it up through the surface into a darkening sky, and the bubble becomes a planet.

**4 · Kepler — equal areas in equal times** (amber, space)
- Beats:
  - Two glowing pins and a string loop draw an ellipse in a tilted orbital plane; the camera sweeps around it.
  - The planet orbits, and translucent fan blades of swept area fill at equal time ticks: long and thin far away,
    short and fat near the Sun, with equal area readouts. A comet exaggerates the effect.
  - The camera pulls back for Law III: planets at true relative distances, and a 3D T² vs a³ plot rises as a straight line of pillars.
- Your turn / Lab: eccentricity, semi‑major axis, tick interval, a solar‑system preset.
- Handoff: "Kepler knew how, not why." The camera dives toward the third planet.

**5 · Newton — F = G·m₁m₂/r², F = ma** (crimson)
- Beats:
  - A cannon on a mountain on a small planet. **Chase cam** on each shot: slow (short arc), faster (Earth curves
    away), about 7.9 km/s (it falls forever: "an orbit is falling and missing"), faster still (an ellipse that
    matches ch.4's ghost ellipse).
  - Arrows show velocity (tangent) and gravity (to the centre); a ghost straight line shows Law I.
  - The Moon and an apple: in 1 s the Moon falls 1.36 mm and the apple 4.9 m, a ratio of 3600 = 60². The
    inverse‑square law is shown as a spherical shell spreading through space.
- Your turn / Lab: launch speed and angle, mountain height, g, escape velocity.
- Handoff: an apple falls under a strobe, leaving ghost copies at equal time intervals; the strobe column rotates 90° to become a time axis.

**6 · Fundamental theorem of calculus** (violet, "the abstract realm": a dark void with a glowing grid)
- Beats:
  - The apple's v(t) is a 3D ribbon wall, and the area under it is a triangular slab (½gt²).
  - A curvy v(t): Riemann **columns** rise from the floor and subdivide 4 → 512.
  - Then the 3D reveal: the columns lift off one by one and **stack end to end on a second wall at right angles**,
    and the top of the stack traces A(x). Each column's height *is* the stair's slope. The camera swings between the
    two walls and lands face‑on to read: the slope of A equals f.
- Your turn / Lab: sculpt f by dragging control points; drag a and b; F(b) − F(a) live.
- Handoff: "a curve whose slope equals its height": eˣ. "What if the growth points sideways?" The velocity arrow turns 90°.

**7 · Euler — e^{iθ} = cos θ + i sin θ → e^{iπ} + 1 = 0** (cyan)
- Beats:
  - A point whose velocity stays ⟂ to its position circles the complex plane and lands on −1 at π.
  - The rotation extrudes along a time axis into a glowing **helix**. Two lights cast its shadows on two walls: one
    is cosine, the other sine (real shadow maps). The camera orbits between them.
  - A right triangle rides the point: cos² + sin² = 1, "Pythagoras was here all along."
  - The five constants fly in from earlier stations and assemble the identity.
- Your turn / Lab: drag θ; Taylor partial sums shown as a spiral of vectors converging onto the circle.
- Handoff: a smaller arrow sprouts on the tip of the first.

**8 · Fourier — every periodic signal is a sum of circles** (magenta)
- Beats:
  - The epicycles are built as a **layered clockwork**: each harmonic is a ring on its own z‑layer, and odd harmonics
    are added one by one as the trace sharpens into a square wave.
  - The camera swings to the side: **the side view of the stack is the spectrum.** Front = signal, side = frequencies.
  - The trace extrudes into a 3D ribbon.
  - About 100 rings draw the next chapter's siren.
- Your turn / Lab: draw anything → DFT → the clockwork redraws it; term count; hear the waveform.
- Handoff: the drawing becomes a siren on a car; sound shells start radiating.

**9 · Doppler — f' = f·(v + v_o)/(v − v_s)** (blue ↔ red, night street)
- Beats:
  - A street‑level shot as an ambulance passes. You *hear* the pitch drop.
  - The camera cranes up: wavefronts are translucent **spheres**, bunched ahead (blue) and stretched behind (red).
  - Swap to a jet: at Mach 1 the shells pile into a wall, then a real 3D **Mach cone** with a vapour cone and a
    shake on the boom.
  - The camera rises into space: a receding galaxy's spectral lines shift red.
- Your turn / Lab: source and observer speeds; place the listener.
- Handoff: a roller‑coaster train whooshes past, and the camera rides it up the lift hill.

**10 · Conservation of energy — ½mv² + mgh = const** (orange)
- Beats:
  - A **POV ride** and side shots of a coaster. Two glass tanks ride along: PE full, KE empty. Liquid flows between
    them, and the total line never moves.
  - On a hill taller than the start, the train rolls back.
  - With friction, sparks fly and a third "heat" tank fills; the total stays constant.
  - A Newton's cradle cameo.
- Your turn / Lab: build a track by dragging spline points; friction; show that mass cancels.
- Finale: the heat sparks drift up and become stars. The camera pulls back to the **Constellation**, with the
  invariants epilogue, and it becomes the index.

---

## 4. Sound & music

**Approach: procedural audio, generated live with Tone.js.** There are no files or licences, the chunk lazy‑loads
when the user presses Play with sound, and a `MusicSource` interface lets recorded stems replace or layer over the
score later.

**Synced to playback.** The GSAP master timeline is the clock. Play, pause and seek drive `Tone.Transport`, and drift
is corrected at beat labels when it exceeds 50 ms.
- *One‑shot SFX* are cues on the timeline. They fire while playing forward and are skipped while seeking or stepping back.
- *Continuous SFX* (chalk scratch, pouring, wind) follow animation parameters: chalk loudness follows line‑draw speed,
  pour loudness follows flow rate.

**Mix:**
- Buses: master (limiter) → music and SFX buses, with volumes saved per viewer (localStorage in try/catch).
- Music ducks under key hits. Everything fades out when the tab is hidden.

**Score:**
- An ambient bed: pads, long reverb, sparse plucks, a quiet sub.
- Each chapter has its own key, mode and palette, and crossfades into the next during the camera flight.
- Layers are arranged to the chapter's beats, so the swells land on the reveals.
- The teaser plays a soft looping motif once sound is unlocked.

| # | Musical idea |
|---|---|
| 1 | Pythagorean tuning (pure 3:2 fifths). The 3‑4‑5 triangle *sounds* as frequencies 3:4:5, a major chord, at the reveal. |
| 2 | Circular arpeggios whose pitch rises with N. |
| 3 | An underwater low‑pass below the waterline, plus bubble blips. |
| 4 | Kepler's *Harmonices Mundi*: each planet's pitch ∝ its angular speed, so it rises near the Sun. |
| 5 | Shots climb in pitch with speed, and the orbit becomes a sustained drone. |
| 6 | Each column plays a pitch set by its height, blurring into a gliss as N grows. |
| 7 | Pure sines, with the rotating phase audible. |
| 8 | Additive synthesis *is* Fourier: you hear each harmonic arrive. |
| 9 | A real Doppler siren computed from the formula, and a sonic‑boom low end. |
| 10 | Speed sets pitch and wind, friction adds crackle, and the finale swells. |

**Chapter 1 cue sheet (built this session)**
- Score "Pythagorean Drone": a C + G drone in Pythagorean tuning with a slow pad and pentatonic plucks. An arpeggio
  enters as the tanks rise, a filter opens through the pour, and it resolves on 3:4:5 at the formula.
- SFX:
  - chalk scratch (follows draw speed)
  - right‑angle tick
  - tank rise (low thump plus glass shimmer)
  - pour (band‑passed noise plus bubbles)
  - brim chime
  - stone clack as each tile lands
  - formula bell (FM, 3:4:5)
  - number ticks
  - handoff whoosh
  - quiet UI hover and click sounds
- Your turn / Lab: three soft tones follow a, b and c while dragging, and a triple chime plays on Pythagorean triples.

**Chapter 2 cue sheet (built)**
- Score "Circles": during the flight the drone glides from C + G to A + E and the pad turns to F–G–Em–Am. The
  arpeggio goes round its chord instead of up and down, doubles its rate and climbs an octave while the slices
  multiply, and the formula resolves on 3:4:5 again.
- SFX:
  - knife scrape for each cut, ending in a faint bronze ring
  - a riffle of light clicks as the pieces land in the row
  - one step up the pentatonic for each doubling of the slices
  - the onion rings uncoil with a long whoosh, and every third ring tinks as it lands, higher as the strips shorten
  - formula: a run once round the pentatonic, then a wide open chord
- Your turn / Lab: every slider change re-deals the row with the same doubling step and riffle.

**Chapter 3 (built)**
- Story: the crown (70 % gold, 30 % silver: 1 kg, 64.8 mL) on a hanging scale (the captions never say "spring":
  spring scales are some 2,000 years too late) over a brim-full stone tank with a glass front; lowered, it spills
  65 mL into a beaker and the scale falls from 1,000 g to 935 g; arrows show the 65 g push and the 65 g weight of
  the spilled water side by side (weights in grams throughout: Archimedes thought in weights, and newtons are
  1,900 years too late); the formula; Eureka: a pure gold bar of the same weight spills only 52 mL; then, at the
  waterline, pine floats half under, ice 92 % under and gold sinks, the submerged part of each block glowing.
  Handoff: a bubble rises and the dust blooms into chapter 4's orbit.
- Your turn / Lab: six materials (cork to gold) in four fluids (olive oil, water, Dead Sea, mercury).
- Score "Water": Dm–F–C–G over a D–A drone, the arpeggio rippling. SFX: plunk (immersion), splash, the pour, a
  bubble's bloop, a eureka run and three drops before the formula chord.

**Chapter 4 (built)**
- The flight rises out of the dusk into deep space (`runtime.world.space`: the sky, haze, fog and dusk lights fade
  to a starfield with a faint Milky Way). Prague, 1601: Kepler inherits Tycho Brahe's sightings. Mars circles the
  Sun on its orbit, stretched to e = 0.5 so the shape can be seen (its real one is 0.093, and the caption says so);
  Tycho's twelve sightings appear; the best circle through them misses at the sides by "8′" (Kepler's lunula),
  the crescents glowing red. Two pins at the foci, a loop of string and a pencil draw the ellipse through every
  sighting; the Sun takes one focus. Mars sweeps twelve equal-time fans (amber for area, blue ticks for time); the
  nearest and farthest fans are picked out, each labelled 1/12 of the area. The formula ΔA/Δt = constant (1609).
  Your turn. Then the third law (1619): Mars' orbit relaxes to its real shape, the other five planets join on
  their real orbits and periods, and six pillars of T²/a³ rise to the same height. Handoff: the camera dives to
  Earth, and the stars gather into an apple beside it ("how, but not why": Newton, nearly seventy years later).
- Your turn / Lab: eccentricity (0–0.9) with presets (Earth, Mars, Mercury, a comet) and equal times per year
  (4–24). The readout names the interval Kepler heard in each orbit (Earth a semitone, Mars a fifth); the Lab can
  pull back to all six planets and the pillars.
- Score "Spheres": Em–Am–C–G over an E–B drone, the arpeggio wheeling. Mars sings: a soft voice whose pitch
  follows how fast it turns seen from the Sun, so its swing is Kepler's interval. SFX: a high note per sighting,
  a semitone rub where the circle misses, the pins, chalk for the circle and the pencil, a tick per equal time,
  the Earth's mi–fa–mi before the formula chord, and the six pillars' chord.

**Chapter 5 (built)**
- A new station: the small planet of Newton's thought experiment (chapter 4's Earth, with a thin shell of air and its
  own sunlight; chapter 4's Sun goes out behind the flight). Its map is the real Earth, painted: Natural Earth's
  1:110m coastlines (public domain, `land.ts`, about 20 KB compressed) filled in, seas shading shallow near the
  coasts, land coloured by latitude, Antarctica and Greenland under ice. The globe is turned so Woolsthorpe is on top,
  under the apple and the mountain, with the cannon firing east. It is painted over a few frames when the station
  mounts (a flat two-colour map until then), once per visit. The apple flies ahead and
  falls on it: Woolsthorpe, 1666, and does the same pull reach the Moon? Newton's cannon: a mountain rises, 1,600 km
  tall (far taller than any real one, as in Newton's own figure, so the orbit stands clear of the ground), and three
  level shots (3, 5 and 6.3 km/s) land 19°, 42° and 88° round. At 7.1 km/s the ball falls all the way round (a chase
  camera follows it over the edge of the world, rolled so the ground stays below, then pulls out to see the
  circle). Slow motion on the forces: velocity, the pull to the centre, the straight line it would take, and the
  gap between that line and its path, its fall. The Moon test, to scale: 60 Earth radii marked off bead by bead,
  the apple's 4.9 m and the Moon's 1.36 mm in a second, 3,600 = 60 × 60. The inverse square: three shells and the
  same cone of pull crossing 1, 4 and 9 tiles. The formula F = G m₁m₂/r² (1687). Kepler, explained: a 9 km/s
  shot swings out on an ellipse with the planet's centre at one focus, Kepler's ellipse laid over it in chapter 4's
  amber. Handoff: the stars gather into an apple that falls under a strobe, a ghost at every flash (1, 3, 5, 7…);
  time laid out sideways turns the flashes into a curve, and the dust becomes chapter 6's icon (calculus is a
  "coming soon" stop for now).
- Physics: velocity Verlet under GM/r² in Earth units (one orbit in 4,000 steps; energy drifts by under 10⁻⁵), so
  shots land, circle, swing out or escape (10 km/s from the mountain top) exactly where the maths says.
- Your turn / Lab: the cannon's speed (1–12 km/s) with presets (falls short, circles, ellipse, escapes); the Lab
  adds the angle and the forces. The readout says where it lands and when, how high an ellipse reaches and how long
  it takes, or that it escapes.
- Score "Falling": G–Em–Am–C over a G–D drone, the arpeggio falling. The ball whistles higher the faster it goes
  (so an ellipse sounds its equal areas). SFX: the cannon's boom, a distant thud as each ball lands, a strobe tick
  a step lower each flash, and four falling notes, each a little sooner, before the formula chord.

**Chapter 6 (built)**
- A new station, "the abstract realm": no ground or sky, only a violet grid underfoot fading into the stars, and two
  glass walls. The curve's wall stands on the floor; the area's wall stands behind it and higher, its x axis level
  with the first's, so the area at each x sits straight above the curve there. (The storyboard had the second wall
  at right angles. With a shared corner, the two graphs either read mirror-image or overlap on screen from any one
  viewpoint, so the walls are stacked instead, which also fits a phone held upright.)
- Beats: the calculus icon flies in and the walls rise (Cambridge and Paris, 1660s and 1670s). Speed into distance: the
  falling apple's speed is a straight line, and the area under it a triangle, 4.9 m after a second; cut at each
  quarter second (chapter 5's flashes) its strips go 1, 3, 5, 7. The line bends into any curve, and columns rise
  under it, 4, then split in two again and again to 512, their total closing in on the area (Leibniz's ∫ f dx).
  Eight columns swing up onto the area's wall, each landing on the ones before as a step, a stair whose top is the
  area so far, A(x). One step picked out: it rises a column's area, f × Δx, over a run of Δx, so its slope is f; the
  stair smooths into a curve as the columns thin. A probe sweeps along: the curve's height and the area curve's
  slope, side by side, always equal. The formula ∫ₐᵇ f dx = F(b) − F(a), with the area between a and b shaded and
  A's climb between them. Handoff: a point pushed outwards by its own size grows as eˣ; turned to push at right
  angles it stops growing and goes round, and the stars gather into chapter 7's helix around its circle (Euler is a
  "coming soon" stop for now).
- Maths: the curve is a monotone cubic (Fritsch–Carlson) through six control points, so it never overshoots them
  (a curve dragged above the axis stays above it), and A(x) is its exact integral piece by piece. Columns are a
  midpoint Riemann sum.
- Your turn / Lab: drag the curve's six points in the scene, or pick a curve (wave, hill, the apple's speed, flat),
  and move a and b; the readout and the scene both show the area from a to b and A's climb, always equal. The Lab
  adds the columns (4 to 512) and their total beside the whole area.
- Score "Rising": F–Am–Dm–G over an F–C drone, the arpeggio climbing like a stair of octaves. A voice sings the
  curve's height wherever the story points (a split sweeping along it, the probe, a point being dragged), so the
  area's slope, the same number, is heard too. SFX: a note per rising column, as high as it is tall; a climbing note
  as each column lands on the stair; a quick stair of notes before the formula chord.
- Engine: labels can sit beside their point, offset in pixels (`engine/labels/beside.ts`), so labels on different
  sides of nearby points never overlap however small the scene is drawn.

---

## 5. Technical architecture

**Stack** (npm `latest` checked 2026‑10‑16; pin exact versions at scaffold):
- Vite 8, React 19.3 (R3F 9.8 needs React ≥19 and <19.4), TypeScript strict on 5.x/6.x (TS 7 once ESLint supports it).
- three 0.186, @react-three/fiber 9.8, @react-three/drei 10.7, @react-three/postprocessing 3.2.
- gsap 3.15 (SplitText, CustomEase, MotionPath; all plugins free since 3.13) and @gsap/react `useGSAP`.
- react-router 8, zustand 5, KaTeX 0.19, Tone.js (lazy chunk), vite-plugin-glsl.
- Dev only: leva, r3f-perf.
- Tests: Vitest, Playwright (Chromium at /opt/pw-browsers). Lint: ESLint + Prettier.
- No physics engine and no smooth‑scroll library (the journey has no page scroll).

**Folder layout**
```
src/
  app/          App.tsx, routes.tsx, providers (gsap.registerPlugin once)
  landing/      Landing.tsx, Teaser.tsx (Dust montage + drifting camera), PlayGate.tsx
  journey/      JourneyPage.tsx, World.tsx (single <Canvas>), StationWindow.tsx, masterTimeline.ts,
                PlayerBar.tsx, Captions.tsx, YourTurn.tsx, ChaptersMenu.tsx
  lab/          LabPage.tsx, StepPlayer.tsx, Slider/Toggle/DragHandle primitives
  map/          Constellation.tsx
  chapters/
    registry.ts            ordered ChapterDef[] (2–10 stubbed this session)
    01-pythagoras/         index.ts, Station.tsx, timeline.ts, beats.ts, cues.ts, score.ts, YourTurn.tsx, Lab.tsx,
                           math.ts, math.test.ts
  engine/
    camera/     CameraDirector.tsx (shot proxy → camera, handheld noise, hand‑off to CameraControls), shots.ts
    dust/       Dust.tsx, shapes.ts (procedural icons), sampleShape.ts, dust.vert/.frag
    world/      stations.ts (world positions, flight splines), Lighting presets, PostFX (quality tiers)
    lines/      ChalkLine.tsx (Line2 draw‑in)
    labels/     Formula.tsx (KaTeX + SplitText), MathLabel.tsx (drei <Html>)
    materials/  sand, water, glass, chalk‑edge shaders
    hooks/      useReducedMotion, useQuality (PerformanceMonitor → tier)
  audio/        AudioEngine.ts, transportSync.ts, cueScheduler.ts, sfx/, music/ (ChapterScore, MusicSource),
                tuning.ts, SoundControls.tsx
  state/        store.ts (playState, chapter, beat, quality, volumes, autoContinue)
  styles/       tokens.css, global.css
```

**Key patterns**
1. **ChapterDef contract.** Each chapter exports `{ slug, title, year, figure, kind, accent, formulaTeX, Station, YourTurn,
   Lab, beats, buildTimeline, cues, score, dustIcon, stationTransform }`. Components are `React.lazy`, so each chapter is its own chunk.
2. **The timeline is the single source of truth.** `buildTimeline(refs)` returns a paused GSAP timeline whose labels are
   the beats. It tweens refs, uniforms, **and the camera shot proxy** directly, never per‑frame React state.
   `masterTimeline.ts` concatenates chapter timelines and the flight interludes into one master timeline. Three
   drivers use the same animation:
   - *Play*: `master.play()`, scrubber, speed.
   - *Step*: `master.tweenTo(nextLabel)` from wheel, arrows or swipe.
   - *Lab*: StepPlayer plus direct manipulation of the same refs.
3. **CameraDirector.** Shots are `{ position, target, fov, focus, roll }` keyframes inside the timeline. A proxy object
   is tweened and applied in `useFrame`, with handheld noise added on top. In "Your turn" and Labs it hands over to
   drei `CameraControls` with limits, and on Continue it tweens back to the shot.
4. **One `<Canvas>` world.** Stations sit at fixed world transforms. A station window mounts only the active station ± 1
   and preloads the next chunk during the current chapter. Flights follow a CatmullRom spline between stations
   while the Dust morph covers the change.
5. **Pure math modules** (`math.ts` per chapter) are deterministic and unit‑tested; stations only render them.
6. **Performance:** instancing (wedges, columns, shells), shared geometry, quality tiers (Dust count, DPR, depth of
   field and shadows on or off), dispose on unmount, lazy chunks.
7. **Accessibility:**
   - `prefers-reduced-motion`: camera flights become crossfades, no handheld shake, no auto‑continue, manual beat stepping.
   - Captions and formulas are DOM text, with KaTeX MathML.
   - The full transcript is in a drawer.
   - Keyboard: space to play/pause, ←/→ to step beats; controls are focusable.
   - No WebGL: a poster image plus the transcript.
   - Fully usable in silence.

---

## 6. Build phases

**This session: phases 0–2**

0. **Repo setup:**
   - Commit this plan as `docs/PLAN.md` plus a README.
   - Scaffold Vite/React/TS strict, ESLint + Prettier, Vitest, Playwright.
   - GitHub Actions CI: typecheck, lint, test, build.
   - Scripts: `dev / build / test / e2e / typecheck / lint`.
1. **Engine and landing:**
   - Routes `/`, `/play`, `/play/:slug`, `/lab/:slug`, `/map` (placeholder).
   - World canvas, station window, master timeline, PlayerBar, Captions, YourTurn shell, CameraDirector with shots.
   - The Dust system with procedural icons for all 10 chapters, which powers the **Teaser** landing and PlayGate.
   - ChalkLine, Formula/MathLabel, PostFX tiers, design tokens and fonts, reduced‑motion and quality hooks.
   - **Audio:** AudioEngine, buses, transport sync, cue scheduler, SoundControls, `tuning.ts`.
   - Registry with all 10 entries; chapters 2–10 are "coming soon" stubs that show only their Dust icon.
2. **Vertical slice: ch.1 Pythagoras:**
   - `math.ts`: hypotenuse, areas, pour fill level, tile transforms for rearrangement layouts A and B for any (a, b),
     law of cosines, `isPythagoreanTriple`.
   - The dusk beach station: sand shader with displaced grains, a stylized low sun, Lightformer environment.
   - All beats and camera shots from §3, the Your‑turn moment, the full Lab, and the score and SFX from §4.
   - Handoff stub: the circle is carved in sand, and the flight goes to a "Chapter II — coming soon" Dust disc.
   - Ch.1 runs about 75–90 s at 1×.
   - → **Checkpoint with you** to lock the look, camera pacing and sound.

**Later sessions**
3. Ch.2 (built: the slicing and onion proofs, Your turn, Lab and score) and ch.3 (built: the crown, the overflow, the line-up).
4. Ch.4–6 (space, chase cam, the abstract realm).
5. Ch.7–9 (helix shadows, clockwork Fourier, Doppler street).
6. Ch.10, the Constellation finale and index, and the full teaser montage.
7. Polish: mobile, reduced motion, a performance budget (60 fps on a mid laptop at the default tier, ≤ 200 KB gz of
   initial JS before chapter chunks), posters, transcript, deploy (GitHub Pages or Vercel).

## Verification
- `npm run typecheck && npm run lint && npm test && npm run build` pass, locally and in CI.
- **Vitest, maths:**
  - ch.1 tile layouts tile the (a+b)² frame exactly, with no overlap and total area matching.
  - The pour fill reaches exactly 1 at the end.
  - The triple detector finds 3‑4‑5, 5‑12‑13 and 8‑15‑17.
  - Law of cosines reduces to Pythagoras at 90°.
  - Later chapters: Kepler sectors equal within 1e‑6, DFT round‑trip, Verlet energy drift < 0.1%.
- **Vitest, timeline and audio:**
  - The master timeline's labels match the beats.
  - Reading‑time hold is respected.
  - The cue scheduler fires once on forward play and never on seek or reverse.
  - `tuning.ts` ratios are correct (3:2, 3:4:5).
- **Playwright** (Chromium with autoplay allowed):
  - The landing teaser renders a non‑blank canvas.
  - ▶ Play starts ch.1, and stepping through every beat works via a test hook (`window.__journey.seek(label)`).
  - Each beat is screenshotted at 1440×900 and 390×844.
  - "Begin with sound" leaves a running AudioContext; "silent" never loads the audio chunk.
  - `/lab/pythagoras` dragging updates the areas.
  - The reduced‑motion run works.
  - No console errors.
- **Previews sent to you:** per‑beat screenshots, a ~30 s screen recording of ch.1 if feasible (Playwright video), and a
  ~60 s offline render of the ch.1 score and SFX (Tone.Offline → WAV).
- Manual: `npm run dev`, play ch.1 end to end, check r3f-perf frame time, try a phone viewport.
- Commit and push to `claude/nifty-gauss-ttjbaf`. No PR unless you ask for one.
