# Project — Derivada en un punt: specification

> Target: a static, vanilla (HTML + CSS + JS) web project that lets a 15-year-old (4t ESO) discover what the derivative of a function at a point, f'(a), is.
> Sibling of the repo `camina` (same stack, conventions, tooling). Where this file and `CLAUDE.md` disagree, `CLAUDE.md` wins. Decisions taken later live in `docs/STATE.md`, which overrides this file.
> Default repo name `derivada`, default site `derivada.step-quiz.net` (the maintainer may rename).

## 1. Pedagogical intent

### 1.1 Concept to be built (the maintainer's vision, normative)

- f'(a) is the **limit of the TVM** (average rate of change) over [a, a+t] when t → 0.
- The TVM is the **average velocity**; f'(a) is the **instantaneous velocity** at the instant x = a.
- The function is **f(x) = distance between an observer and an object, as a function of time x** (seconds), with f(0) = 0.
- **Do not use projectile motion.** Reason (keep it in `docs/STATE.md`): the graph of the trajectory of a projectile equals the graph of its height vs time (horizontal motion is linear in time, and time is linear in time), so the student cannot tell "path" from "function graph".
- The object moves along a **straight trajectory**, usually horizontal, whose ground changes (very smooth/low friction, rocks, sand, ice; sometimes a downhill slope). The motion is neither uniform nor uniformly accelerated. The graph is the set of pairs (x, f(x)); it is NOT a picture of the path (the path is a straight line), which defuses the "graph-as-picture" misconception by construction.

### 1.2 Misconceptions targeted (feedback must name them, §6.4)

| Id | Misconception | Where it shows up |
|---|---|---|
| M1 | Height vs slope: "the highest point is the fastest" (f vs f') | Practice P1 |
| M2 | TVM computed wrongly: distance not divided, inverted ratio, distance-to-observer used instead of distance since a, product instead of quotient | Log entries (§5.5) |
| M3 | "As t → 0 the distance → 0, so the speed → 0" (ignoring that time → 0 too) | Limit estimate (§6.3) |
| M4 | "The limit means t = 0" (0 ÷ 0) | Info button «Per què no pot ser t = 0?» |
| M5 | Using the first/largest-interval TVM as the answer | Limit estimate |
| M6 | Reading visual steepness as numeric slope on unequal axis scales | Slope triangle on every secant/tangent (rise = distance, run = t, with numbers) |

### 1.3 Non-goals (v1)

No derivative-as-a-function (no graph of f'), no formulas for derivatives, no negative velocities (the object only moves away from the observer, f non-decreasing), no left-hand (backward) measurements (§11), no teacher accounts, no personal data.

## 2. Shared rules and bootstrap

Inherited from `camina` (same as all `step-quiz` repos):

- Static only, no build step, no backend. **Must work under `file://`** (double click): classic scripts with one namespace per file and the dual export wrapper (browser global + `module.exports` for Node tests); no ES modules, no `fetch`, no Workers.
- No network at runtime (no CDN, fonts, analytics). `_headers` with the strict CSP of `camina`. Privacy: no personal data; `localStorage` only, every access in `try/catch`, fully usable without storage; keys `derivada:v1:<what>`.
- Everything the student sees is in Catalan; identifiers and comments in Catalan; agent docs in English.
- Content CC BY-NC-SA 4.0, code MIT (`LICENSE`, `LLICENCIA.md`).
- **Never** `[skip ci]`, `[ci skip]` or `[cf-pages-skip]` in any commit message (Cloudflare Pages would not publish it), including commits made by workflows.
- Seeded RNG (FNV-1a → mulberry32, copy `js/motor/atzar.js` from `camina`); never `Math.random` for anything reproducible. URL readers tolerate garbage.
- Pedagogy: one action per screen state, ≤ ~40 words of instructions, feedback names the mistake (≤ 2 messages), no gamification noise, every route ends in a "beauty moment", hints never give the answer.
- Interaction: Pointer Events with `setPointerCapture`; `touch-action: none` only on the draggable board; targets ≥ 44 px touch / ≥ 24 px mouse; `aria-live` feedback; colour never the only carrier; decorative animations ≤ 300 ms and off under `prefers-reduced-motion`; dark mode via tokens (`css/tokens.css`); print black on white, A4, 15 mm margins.
- Cache busting with `?v=<content hash>` via `tools/versio.py` (copy from `camina`), checked by a test.
- Catalan maths typography: decimal comma (inputs accept `,` and `.`), `·` and `:`, `«…»`, typographic `’`.

**Copy verbatim from `camina`:** `.prettierrc.json`, `.prettierignore`, `.gitignore`, `_headers`, `LICENSE`, `LLICENCIA.md`, `css/tokens.css` (extend, do not fork), `js/motor/atzar.js`, `tools/versio.py`, and in `CLAUDE.md` the blocks between `<!-- regles-comunes:inici -->…<!-- regles-comunes:fi -->` and `<!-- atribucio-centre:inici -->…<!-- atribucio-centre:final -->`.

**Delivery protocol:**

- Deliver a ZIP whose root **is** the repo root (`js/app.js`, never `derivada/js/app.js`). The maintainer uploads it to `_uploads/` (GitHub → `_uploads/` → *Add file* → *Upload files*) and `unzip-upload.yml` unpacks and commits it.
- **Anything under `.github/` inside the ZIP is ignored.** For the new repo, give the maintainer the text of `.github/workflows/unzip-upload.yml` and `tests.yml` (copied from `camina`) as copy-paste blocks to create from the GitHub web UI.
- Give the maintainer numbered steps in Catalan with copy-paste blocks and an explanation of each step (pull, commit, push, upload…).
- Before delivering: run `node tests/run-all.js` and `python3 tools/versio.py` (after any CSS/JS change) and report the result. If behaviour changes, update README, `docs/SPEC.md` and `docs/STATE.md` in the same delivery.
- **At the end of every session, write `docs/SESSION-REPORT.md` (§12) and include it in the delivered ZIP.** It is a mandatory deliverable, not optional documentation.

## 3. Notation (decision, confirm in §11)

Following the maintainer's wording:

| Symbol | Meaning | Student-facing |
|---|---|---|
| `x` | instant on the scene clock, seconds, 0 ≤ x ≤ X (X = 12) | «x (s)» |
| `f(x)` | distance observer–cart at instant x, metres, f(0) = 0 | «f(x) (m)» |
| `a` | instant where the measurement starts (the cart is at distance f(a)) | «a» |
| `t` | stopwatch reading = length of the measuring interval, t > 0 | «t» |
| `TVM[a, a+t]` | (f(a+t) − f(a)) / t = distance covered since a ÷ stopwatch time | «TVM» |
| `f'(a)` | lim_{t→0} TVM[a, a+t] | «f′(a)» |

The lab only measures forward (t > 0). Because every f in v1 is C¹, this right-hand limit equals the derivative; student text never mentions one-sided limits.

## 4. World model and mathematics

### 4.1 Scenario data (`data/escenaris.js`)

```js
window.DERIVADA_ESCENARIS = [
  { id: 'r1', nom: 'Baixada, gel i sorra', X: 12,
    nusos: [[0, 2.0], [2, 3.0], [5, 3.0], [7, 1.2], [9, 0.8], [12, 0.6]],   // [x (s), v (m/s)]
    terrenys: [ { de: 0, a: 2, tipus: 'baixada' }, { de: 2, a: 5, tipus: 'gel' }, { de: 5, a: 12, tipus: 'sorra' } ],
    ancoratges: [ { a: 5.5, tipus: 'guiat' }, { a: 6.5 } ] }
];
```

Only the knots `(x_k, v_k)` of the **velocity** profile, the terrain spans (in seconds) and the anchor instants are authored. Everything else (positions, terrain positions in metres, stories) is **derived**, never hand-written.

Reference scenarios (must ship exactly these; terrain types: `llis`, `gel`, `sorra`, `pedres`, `baixada`):

| id | Name | Knots `[x, v]` | Terrain spans (s) |
|---|---|---|---|
| r1 | Baixada, gel i sorra | [0,2.0] [2,3.0] [5,3.0] [7,1.2] [9,0.8] [12,0.6] | baixada 0–2, gel 2–5, sorra 5–12 |
| r2 | Pla, baixada, pla | [0,1.0] [4,1.0] [9,5.0] [12,5.0] | llis 0–4, baixada 4–9, llis 9–12 |
| r3 | Pedres | [0,1.5] [2,0.4] [4,1.6] [6,0.3] [8,1.5] [10,0.5] [12,1.2] | pedres 0–12 |
| r4 | Gel, sorra i baixada | [0,3.0] [3,3.0] [5,0.8] [6.5,0.0] [8,0.0] [10,2.5] [12,4.0] | gel 0–3, sorra 3–8, baixada 8–12 |
| r5 | Terreny variat | [0,2.0] [2,2.0] [4,0.9] [5,1.4] [6,0.6] [7,1.0] [8,3.5] [10,3.5] [12,5.5] | llis 0–2, pedres 2–7, baixada 7–8, gel 8–10, baixada 10–12 |

### 4.2 Exact profile (`js/motor/perfil.js`): monotone cubic Hermite for v, closed form for f

Knots `(x_k, v_k)`, k = 0..n, `Δ_i = x_{i+1} − x_i`, `q_i = (v_{i+1} − v_i)/Δ_i`.

Tangents `μ_k` (Fritsch–Carlson, weighted harmonic mean):

- `μ_0 = q_0`, `μ_n = q_{n−1}`.
- For 0 < k < n: if `q_{k−1}·q_k ≤ 0` then `μ_k = 0`; else `w1 = 2Δ_k + Δ_{k−1}`, `w2 = Δ_k + 2Δ_{k−1}`, `μ_k = (w1 + w2) / (w1/q_{k−1} + w2/q_k)`.

On piece i, `s = x − x_i ∈ [0, Δ_i]`:

- `v(x) = v_i + μ_i·s + c_i·s² + e_i·s³`, with `c_i = (3q_i − 2μ_i − μ_{i+1})/Δ_i`, `e_i = (μ_i + μ_{i+1} − 2q_i)/Δ_i²`.
- `f(x) = F_i + v_i·s + μ_i·s²/2 + c_i·s³/3 + e_i·s⁴/4`, `F_0 = 0`, `F_{i+1} = f(x_{i+1})`.

Consequences (all asserted by tests): `f' = v` exactly (no numerical differentiation anywhere in the app); `v ≥ 0` (each piece is monotone); equal adjacent knot speeds give an exactly constant piece (`μ = 0` at both ends: plateaus and stops are exact); `v` is C¹ and `f` is C². API: `perfil.crea(nusos) → { X, f(x), v(x), fFinal }`; `f` and `v` clamp `x` to `[0, X]`.

### 4.3 Terrain in metres

For each span `{de, a, tipus}`, the drawn span is `[f(de), f(a)]`. The scene is drawn with the horizontal coordinate proportional to `f` (distance along the track). `baixada` is drawn as a downward incline of a fixed visual angle ≤ 8° (cos 8° ≈ 0.99, so the difference between distance along the track and horizontal distance is ignored; say so in `docs/STATE.md`). Terrain textures: `llis` (plain), `gel` (light blue, glints), `sorra` (dotted), `pedres` (pebbles), `baixada` (incline). Never rely on colour alone (distinct patterns + a text label).

### 4.4 Validation of scenario data (tests, §9)

- `x_0 = 0`, `x_n = X = 12`, strictly increasing, ≥ 3 knots; `0 ≤ v_k ≤ 6`; terrain spans tile `[0, X]` without gaps or overlaps.
- `max |v'| ≤ 4.0 m/s²` (measured on a 0.01 s grid); `f(X) ≤ 40 m`.
- **Anchors** (instants `a` offered to the student, on the 0.5 s grid, `0 ≤ a ≤ X − 2`). For the TVM presets `t ∈ {2, 1, 0.5, 0.2, 0.1}` an anchor is valid iff the error `|TVM[a, a+t] − f'(a)|` is non-increasing across the presets, `≥ 0.2` at `t = 2`, and `≤ 0.1` at `t = 0.1`; **or** it is flagged `constant: true` (TVM identical for every t, used only to show "constant speed").

### 4.5 Reference fixtures (computed independently, Python + Simpson cross-check; tests must reproduce them to ±0.001)

`f(x)` and speed range:

| id | f(2) | f(5) | f(8) | f(12) | v min | v max |
|---|---|---|---|---|---|---|
| r1 | 5.167 | 14.167 | 19.54 | 22.474 | 0.6 | 3.0 |
| r2 | 2.000 | 5.144 | 14.144 | 34.000 | 1.0 | 5.0 |
| r3 | 1.717 | 5.073 | 7.417 | 11.000 | 0.3 | 1.6 |
| r4 | 6.000 | 13.036 | 13.503 | 22.253 | 0.0 | 4.0 |
| r5 | 4.000 | 8.050 | 12.100 | 27.767 | 0.6 | 5.5 |

Anchors: `TVM[a, a+t]` for `t = 2, 1, 0.5, 0.2, 0.1`, and `f'(a)`:

| id | a | f(a) | TVM t=2 | t=1 | t=0.5 | t=0.2 | t=0.1 | f'(a) |
|---|---|---|---|---|---|---|---|---|
| r1 | 5.5 | 15.623 | 1.708 | 2.175 | 2.481 | 2.651 | 2.702 | 2.749 |
| r1 | 6.5 | 17.798 | 1.094 | 1.240 | 1.356 | 1.473 | 1.521 | 1.573 |
| r2 | 5.0 | 5.144 | 2.440 | 1.880 | 1.630 | 1.497 | 1.455 | 1.416 |
| r2 | 6.0 | 7.024 | 3.560 | 3.000 | 2.702 | 2.524 | 2.466 | 2.408 |
| r3 | 2.0 | 1.717 | 1.000 | 0.625 | 0.466 | 0.411 | 0.403 | 0.400 |
| r3 | 5.0 | 5.073 | 0.534 | 0.544 | 0.716 | 0.853 | 0.901 | 0.950 |
| r4 | 4.0 | 11.661 | 0.910 | 1.374 | 1.705 | 1.928 | 2.003 | 2.077 |
| r4 | 7.5 | 13.503 | 0.544 | 0.052 | 0.000 | 0.000 | 0.000 | 0.000 |
| r5 | 6.0 | 9.050 | 1.525 | 0.743 | 0.639 | 0.607 | 0.602 | 0.600 |
| r5 | 7.0 | 9.793 | 2.904 | 2.307 | 1.548 | 1.142 | 1.054 | 1.000 |

Other valid anchors exist on the 0.5 s grid (scan with the §4.4 rule). Notes: r1 a = 5.5 is the guided anchor of §6; r4 a = 7.5 is the "stopped" case (practice only: the answer 0 there is right for the right reason, so it must not be a guided anchor because of M3); r2 `a ∈ [0, 3]` and r1 `a ∈ [2, 3]` have constant speed (TVM independent of t).

Appendix A holds a reference implementation to copy into `tests/perfil_ref.py`.

## 5. The lab (the measuring instrument)

The core interaction. The scene shows: the observer (left, original simple figure, never a known character) with a rangefinder beam; the straight track with its terrain; the cart (original simple figure); the HUD below.

### 5.1 Instruments

- **Stopwatch (cronòmetre):** shows seconds and tenths only, decimal comma: «2,3 s». While running, it shows the elapsed time floored to the tenth.
- **Odometer (comptador de distància recorreguda):** distance covered **since the starting position x = a**: `f(a + t) − f(a)`, shown in metres with **3 decimals** («0,243 m»), so that the student can compute a TVM even for t = 0,1 s without losing precision.
- **Observer distance (rangefinder):** `f(x)` at the current instant, 3 decimals, labelled «Distància a l’observador». It is a different quantity from the odometer; M2 case 3 depends on it.
- **Speedometer (velocímetre):** hidden by default. It is revealed in the beauty moment (§6.3) and available as a "check" toggle only in free mode (§6.5); never in guided steps before the limit is estimated (it would give the answer away). It shows `v(x)`.

### 5.2 State machine

States: `IDLE` (cart at distance `f(a)`, stopwatch `0,0 s`, odometer `0,000 m`), `RUNNING`, `STOPPED`.

| From | Event | To | Effect |
|---|---|---|---|
| IDLE | Space / button «Cronòmetre» | RUNNING | the cart starts moving from `f(a)` along the true motion; stopwatch counts from 0 in real time (`requestAnimationFrame` + `performance.now()`, speed ×1); a point `(a + elapsed, f(a + elapsed))` moves along the graph |
| RUNNING | Space / button | STOPPED | **snap**: `t = max(0.1, round(elapsed / 0.1) · 0.1)`; stopwatch and odometer show values computed from this snapped `t` (`d = f(a + t) − f(a)`); the cart eases to the snapped position (≤ 150 ms; instant under reduced motion); a log entry is created (§5.5); the secant of the graph is drawn |
| RUNNING | `a + elapsed ≥ X` | STOPPED | automatic stop at the end of the track with `t = X − a` (rounded to the tenth); notice «Has arribat al final.» |
| RUNNING | auto-stop at the programmed `t` (§5.3) | STOPPED | `t` = programmed value exactly; same effects as a manual stop |
| STOPPED | Space / button | STOPPED | ignored; `aria-live` hint «Prem S per tornar a a.» |
| any | **S** / button «Torna a a» | IDLE | cart back at `f(a)`, stopwatch `0,0 s`, odometer `0,000 m`; if RUNNING, the run is discarded (no log entry); graph secants of the current attempt are cleared (log keeps its rows) |
| any | change of `a` (§5.4) | IDLE | same as above, at the new `a` |

Keyboard: a global `keydown` handler calls `preventDefault()` for Space and S unless the target is an `<input>`/`<textarea>`/`<select>` (so typing a TVM in the log is never hijacked, and Space on a focused `<button>` does not fire twice). The buttons are `type="button"` with the same actions; handlers are idempotent. Space is only handled while the lab is visible.

### 5.3 Programmed stop (recommended, normative for guided steps)

A selector «Temps programat» with options `manual` (default), `2 s`, `1 s`, `0,5 s`, `0,2 s`, `0,1 s`. When not `manual`, pressing Space/the button in IDLE starts the run and the stopwatch stops by itself at exactly the chosen `t`. Reason: human reaction time makes `t = 0,1 s` practically unreachable by hand, and the guided steps need reproducible t values. In manual mode the minimum reachable `t` is 0,1 s by design: the student sees that t cannot be made 0 (M4).

### 5.4 Changing a

`a` lives on the 0.1 s grid, `0 ≤ a ≤ X − 0.1` (below `X − 2` the longest presets simply auto-stop at the end of the track, with the notice of §5.2). Ways to change it:

- drag a marker on the graph's x axis (Pointer Events + `setPointerCapture`, snapping to 0.1 s);
- tap/click the x axis to jump the marker;
- number field «a» with `−` / `+` buttons (±0,1 s);
- keyboard: ← / → ±0,1 s (Shift: ±0,5 s), when the lab has focus and the target is not a text input.

The cart is always redrawn at `f(a)` after a change. The marker, the cart and the point on the graph stay in sync.

### 5.5 Measurement log and TVM entry

Every STOPPED creates a row (newest on top, max 12 visible): `a`, `t`, `d` (odometer), and an input «TVM (m/s)» **the student fills in** (accepts `,` and `.`; checked on Enter/blur). The app never fills it in.

Correct iff `|typed − d/t| ≤ 0.05` m/s (config `tolTVM`). Correct → ✓, row locked, and the secant of that row is labelled with its TVM and a **slope triangle** (rise = `d` m, run = `t` s, with the numbers; M6). Previous secants with the same `a` stay drawn with lower opacity, so the student sees them rotate as `t` shrinks. Wrong → ≤ 1 message, first match in this order (`v̂` = typed value):

1. `|v̂ − d| ≤ tol` → «Has donat la distància. Falta dividir-la pel temps.»
2. `|v̂ − t/d| ≤ 0.02·(t/d)` → «Has dividit el temps per la distància. És al revés: distància ÷ temps.»
3. `|v̂ − f(a+t)/t| ≤ tol` or `|v̂ − f(a+t)/(a+t)| ≤ tol` → «Has fet servir la distància fins a l’observador. Fes servir el comptador de distància recorreguda.»
4. `|v̂ − d·t| ≤ tol` → «Has multiplicat. Velocitat = distància ÷ temps.»
5. otherwise → «No coincideix. Mira les unitats: m ÷ s = m/s. Torna-ho a calcular.»

Input not parseable → «Escriu un nombre, per exemple 2,4.» The row stays editable; no penalty counters.

## 6. Guided route

Linear steps, each with one action and ≤ 40 words of instructions (all copy below is a Catalan draft; word limits are normative, wording is reviewed by the maintainer). Steps can be jumped to by URL (`#etapa=g3`) for teacher use; progress in `localStorage` (`derivada:v1:progres`). Guided steps G0–G4 use scenario `r1`.

| Step | Setup | Instruction (draft) | Done when |
|---|---|---|---|
| G0 Mira | `a = 0`, programmed stop off, whole track, graph drawn live as the cart runs | «Prem Espai: el carretó es mou i la gràfica es dibuixa.» | run reaches the end. Then: «Aquesta línia és la gràfica de f: a cada instant x, la distància entre el carretó i l’observador.» and, because the track has a slope: «El camí és recte; la gràfica no és el dibuix del camí.» |
| G1 Primera TVM | `a = 0` fixed, manual or preset stop | «Atura el cronòmetre quan vulguis (Espai). El comptador marca els metres des d’a. Calcula la velocitat mitjana: metres ÷ segons.» | one correct log row |
| G2 Depèn d’on mires | `a` free, preset locked to `2 s` | «Fes servir t = 2 s i canvia a. Troba un moment on la velocitat mitjana sigui més gran que 2,5 m/s i un altre on sigui menor que 1,5 m/s.» | correct rows with `t = 2` and TVM > 2.5, and with TVM < 1.5 (r1: e.g. a = 1 and a = 6.5). Closing text: «La velocitat mitjana depèn de l’interval que triïs.» |
| G3 Interval cada cop més petit | `a = 5,5` fixed, presets unlocked | «Fixa a = 5,5 s. Mesura amb t = 2, 1, 0,5, 0,2 i 0,1 s i calcula cada TVM. Què passa amb els valors?» | ≥ 3 correct rows with the same `a`, strictly decreasing `t`, min `t ≤ 0,5`. Then the estimate prompt (§6.3). |
| G4 Velocitat just ara | after the estimate | beauty moment (§6.3) | replay finished |

### 6.1 Always-available help in the lab

Button «Per què no pot ser t = 0?» (M4): «Amb t = 0 tindries 0 m ÷ 0 s, i no es pot dividir per 0. Per això mirem cap a on van les TVM quan t s’acosta a 0, sense arribar-hi.» The student acts first; hints (e.g. «Mira com canvien els valors de la columna TVM») never state the result.

### 6.2 Graph overlays

Axes «x (s)» 0–X and «f(x) (m)» 0–`ceil(f(X))` with gridlines every 1 s / nice metre step and decimal-comma labels; one `<canvas>` scaled by `devicePixelRatio`. Elements: full curve, marker `a`, moving point while running, secants (most recent saturated, older ones faded, each with its slope triangle), and — only after §6.3 — the tangent at `a`. The cart/scene is one SVG.

### 6.3 Estimate and beauty moment

After G3's condition, prompt: «Les teves TVM s’acosten a un valor. Quin?» (number input, tolerance 0.15 m/s, config `tolLimit`). Wrong answers, ≤ 1 message, first match:

- answer ≈ 0 and `f'(a)` > 0.3 (M3) → «La distància es fa petita, però el temps també. Mira el quocient.»
- answer within `tolLimit` of the TVM with the largest `t` in the log, but not of `f'(a)` (M5) → «Aquest és el valor de l’interval més gran. Mira com canvia quan t es fa petita.»
- otherwise → «Mira els últims valors de la columna TVM: cap a on van?»

Correct → **beauty moment** (G4):

1. The speedometer appears with the needle at `v(a)`; text: «Aquest valor és la velocitat del carretó just a l’instant a = 5,5 s: la derivada de f en a, f′(a) ≈ 2,75 m/s.» (value from `v(a)`, 2 decimals, decimal comma; note «El velocímetre d’un cotxe fa el mateix amb intervals de temps molt petits.»)
2. The tangent line at `a` is drawn with its slope triangle.
3. A 7-frame stepper replays the secants for `t = 2, 1, 0,5, 0,2, 0,1, 0,05, 0,01` with TVM to 3 decimals converging to `f'(a)`; the last two frames are labelled «Amb un cronòmetre més precís». Auto-advance every 700 ms, and manual «Següent» only under `prefers-reduced-motion`.
4. Definition box (concreteness fading): «f′(a) = límit de (f(a + t) − f(a)) / t quan t s’acosta a 0.» and the sentence «La TVM és la velocitat mitjana; f′(a) és la velocitat en l’instant a.»

### 6.4 Feedback discipline

Feedback appears only after an action (stop, entry, estimate, pick), never while the cart is running; ≤ 2 messages at a time; messages name the mistake and the interval/quantity involved; `aria-live="polite"`.

### 6.5 Practice and free lab

After G4: «Practica» and «Laboratori lliure».

**Free lab:** any scenario, any `a`, any preset, optional speedometer toggle, the same log; no tasks. Reachable also by `#mode=lliure&escenari=r3&a=5`.

**Practice items** (generated from scenario + seeded RNG; tests check every item):

- **P1 «Qui va més de pressa?»** The graph shows three marked points; the student taps the one where the cart is fastest. Generation rule on the 0.5 s grid within `[0.5, 11.5]`: points ≥ 2 s apart; top `f'` exceeds the second by ≥ 0.4 m/s; the point with the largest `f` is **not** the fastest (targets M1). Wrong with the largest-`f` point → «Aquest és el punt més lluny, no el més ràpid. Mira com de dreta puja la línia, no a quina alçada és.»; other wrong → «Compara com de dreta puja la línia a cada punt.» Correct → tangents with numeric slopes at the three points are drawn.
- **P2 «Estima f′(a)»** Given scenario and anchor `a` (r2–r5 anchors of §4.5, r4 a = 7.5 included), the student uses the lab and types an estimate (tolerance `tolLimit`); same feedback as §6.3; correct → beauty moment (§6.3 without the definition box).

One P1 and one P2 per scenario r1–r5 (10 items), order shuffled with the seeded RNG (`#llavor=` URL parameter, garbage ignored).

## 7. Rendering, layout, accessibility

- Mobile-first, 16 px gutters, no horizontal page scroll. Narrow: scene, graph, instrument panel (stopwatch, odometer, buttons, `a` control, preset), instruction card, log, stacked in this order. Wide (≥ 900 px): scene on top full width; graph left; panel right.
- Stopwatch, odometer and observer distance in large tabular digits, labels always visible, units always shown.
- Buttons «Cronòmetre (Espai)» and «Torna a a (S)» ≥ 44 px; focus-visible styling; all functions reachable by keyboard alone, mouse alone and touch alone.
- `aria-live="polite"` region for: stop results («t = 0,5 s, distància 1,240 m»), log feedback, hints; the moving cart is not announced continuously.
- Playback is user-initiated content, not decoration: it still works under `prefers-reduced-motion`, but nothing starts by itself (G4's replay switches to the manual stepper).
- Colour never the only carrier: terrain patterns + text labels; secants differ by opacity and label, not only hue.
- Projector mode (`#projector=1` or button): graph full width, large type.
- Dark mode via tokens; print stylesheet: black on white, graph + log table only.

## 8. Files and architecture

```
index.html
css/tokens.css          colours (light/dark), graph and terrain tokens (extends camina's)
css/derivada.css        styles, projector mode, print
data/escenaris.js       the 5 scenarios (knots, terrain spans, anchors)
js/motor/atzar.js       seeded RNG (copied from camina)
js/motor/perfil.js      §4.2: exact v(x), f(x); validation
js/motor/tvm.js         TVM, secant data, slope triangle, preset sequences, snapping
js/motor/laboratori.js  §5 state machine (pure logic, injectable clock)
js/motor/entrada.js     §5.5 parsing and classification of typed answers; §6.3 estimate classification
js/motor/exercicis.js   §6.5 generation of P1/P2 items; anchor scanning (§4.4)
js/motor/terreny.js     §4.3 terrain spans in metres
js/ui/textos.js         every student-facing string
js/ui/escena.js         SVG: observer, track, terrain, cart, beam, HUD
js/ui/grafica.js        canvas graph, secants, tangent, marker
js/ui/velocimetre.js    SVG speedometer
js/ui/app.js            controller, keyboard, URL hash, localStorage
tests/…                 §9
tools/versio.py         copied from camina
docs/SPEC.md            this file; docs/STATE.md decisions (update at every change)
docs/SESSION-REPORT.md  per-session record of what was actually achieved (§12)
CLAUDE.md, README.md, LICENSE, LLICENCIA.md, _headers, favicon.svg, _uploads/
```

- Scripts are classic, in dependency order in `index.html`; each file exposes one namespace `window.DERIVADA.<nom>` with the dual export wrapper.
- `laboratori.js` takes a clock function (`() => ms`) so tests can drive it deterministically; the UI passes `performance.now`.
- URL state after `#`: `etapa`, `mode`, `escenari`, `a`, `llavor`, `projector`; unknown or invalid values are ignored.
- URL hash and `localStorage` never contain personal data.

## 9. Tests (`node tests/run-all.js`; only Node and Python 3)

Tests recompute results independently of the code under test.

| File | Checks |
|---|---|
| `tests/perfil.test.js` | §4.5 fixtures within ±0.001; composite Simpson of `v` equals `f` (< 1e-6); central-difference derivative of `f` equals `v` (< 1e-6) at 200 random points; `v ≥ 0`; `v_min`/`v_max` of the table; plateau pieces exactly constant; JS values equal `tests/perfil_ref.py` (Appendix A) output |
| `tests/tvm.test.js` | `TVM[a,a+t]` fixtures of §4.5; snapping (`0,04 → 0,1`, `0,26 → 0,3`, end of track); odometer equals `f(a+t) − f(a)` for the snapped `t` |
| `tests/laboratori.test.js` | the full state machine of §5.2 with a fake clock: IDLE/RUNNING/STOPPED, S discards a run, changing `a` resets, programmed stop stops at exactly `t`, automatic stop at `X`, Space ignored in STOPPED, no log entry for a discarded run |
| `tests/entrada.test.js` | every classification case of §5.5 and §6.3 with crafted values; decimal comma and point; tolerance edges |
| `tests/escenaris.test.js` | §4.4 validation for all scenarios; every declared anchor valid or `constant`; terrain tiles `[0, X]`; terrain metre spans equal `[f(de), f(a)]`; slope angle ≤ 8° |
| `tests/exercicis.test.js` | every generated P1 respects the generation rules (gap ≥ 0.4, largest-`f` point not fastest, spacing ≥ 2 s) for 200 seeds; every P2 anchor passes; guided conditions G1–G3 are satisfiable with the fixtures (e.g. r1: a = 1 → TVM[1,3] > 2.5 and a = 6.5 → TVM[6.5,8.5] < 1.5) |
| `tests/repo.test.js` | every cited file exists; script order; no external URL; no ES modules, no `fetch`; instruction strings ≤ 40 words; no forbidden commit-skip strings in workflows; no `Math.random` |
| `tools/versio.py --comprova` | no stale `?v=` |
| `tests/docs_vs_codi.py` | README states the same presets, tolerances, scenarios and anchors as the code |

GitHub runs them on every push to `main` (`.github/workflows/tests.yml`).

## 10. Acceptance criteria

- [ ] Works by double click (`file://`), with touch, mouse and keyboard only; no external requests.
- [ ] Space starts/stops the stopwatch; S returns to a; both also have buttons; `a` can be changed by drag, field, buttons and arrows.
- [ ] Stopwatch shows seconds and tenths; odometer shows metres since `a` with 3 decimals; both consistent with the snapped `t`.
- [ ] The student always types the TVM; wrong answers get the specific message of §5.5.
- [ ] Guided route G0–G4 works end to end on r1; feedback appears only after actions; ≤ 2 messages; instructions ≤ 40 words.
- [ ] The speedometer and tangent never appear before the limit estimate in guided mode.
- [ ] No projectile example anywhere; no scenario's drawn path is curved.
- [ ] All tests pass; README, SPEC and STATE are consistent with the code.
- [ ] `docs/SESSION-REPORT.md` exists, follows §12, and every status in it is backed by evidence.

## 11. Open questions for the maintainer

1. **Notation.** I used `x` for the instant, `a` for the starting instant and `t` for the stopwatch increment (as in your last message, TVM[a, a+t], t → 0). Earlier you also wrote f(t) and (t, f(t)). Confirm that axes read «x (s)» and «f(x) (m)».
2. **Programmed stop.** Added to your Space-bar design because t = 0,1 s cannot be hit by hand; manual mode stays the default and shows that t can never be 0. Keep?
3. **Backward measurements** (TVM[a−t, a], to show both sides of the limit) are not possible with a forward-only stopwatch. Leave for phase 2?
4. **Velocity ≥ 0** in v1 (object only moves away). A phase 2 could allow returning (negative f') — wanted?

## 12. Session report (mandatory deliverable)

At the end of the session, write `docs/SESSION-REPORT.md` (English, highly technical) and ship it inside the ZIP. Purpose: an exact record of what this session achieved, so that the maintainer or another AI can resume without re-deriving anything. It differs from `docs/STATE.md`, which holds the standing decisions and the current state of the project; the report is the log of one session.

### 12.1 Rules

- **Truthful and evidence-based.** Never claim something that was not run, opened or read. If a check could not be done (no browser, no network, no Node), say so and why. Phrases such as "should work", "is expected to" or "likely" are forbidden as status; use the status vocabulary below.
- **Status vocabulary** (one per item, nothing else):
  - `DONE (verified)`: implemented and checked; cite the evidence (test file and result, command output, or a precise description of the manual check).
  - `DONE (unverified)`: implemented but not checked; say what prevented the check.
  - `PARTIAL`: say exactly which part works and which does not.
  - `NOT DONE`: not implemented in this session.
  - `DEVIATION`: implemented differently from this spec; give the reason and the impact.
- No marketing tone, no padding, no recap of the spec. Numbers, file paths, command lines and results only.
- When a later session delivers again, **append** a new dated section; never overwrite earlier history.

### 12.2 Required sections, in this order

1. **Header.** Date, repo name, ZIP file name, scope of the session, and the environment actually available: Node and Python versions, whether the network and a browser were reachable, whether `camina` was available as a ZIP or by URL.
2. **Requirements matrix.** One row per spec item: §4.1–4.5 (data, profile, terrain, validation, fixtures), §5.1–5.5 (instruments, state machine, programmed stop, changing `a`, log and TVM entry), §6 (G0–G4, help, graph overlays, estimate and beauty moment, feedback discipline, practice P1/P2, free lab), §7 (layout, accessibility), §8 (architecture), §9 (each test file) and every acceptance criterion of §10. Columns: item, status, evidence.
3. **Test results.** Exact outcome of `node tests/run-all.js` (passed/failed counts per test file), of `tools/versio.py --comprova` and of `tests/docs_vs_codi.py`. Paste the real summary lines. If a test was skipped or failed, list it with the reason.
4. **Numerical verification.** Whether the §4.5 fixtures (f values, speed ranges, anchor TVM and f'(a) tables) were reproduced by the JavaScript engine and by `tests/perfil_ref.py`, with the maximum observed deviation.
5. **File inventory.** Every file created, modified or copied, with a one-line purpose, marked `written` or `copied from camina` (give the source path and state whether it was left byte-identical or how it was changed).
6. **Deviations and defaults.** Every deviation from this spec, and the default taken for each open question of §11, with reason and impact.
7. **Known issues and untested paths.** Real bugs, limitations, browsers and devices actually tested (list them; if none, say "none"), accessibility checks done versus not done (keyboard-only, screen reader, reduced motion, dark mode, print, projector mode, `file://`).
8. **Pending manual steps for the maintainer**, numbered, in exact order: the workflows to create from the GitHub web UI, the ZIP upload to `_uploads/`, the Cloudflare Pages settings, anything else that cannot be done from the ZIP.
9. **Next steps.** What remains, ordered by priority, including the phase 2 ideas of §1.3 and §11 that were not implemented.

### 12.3 Closing the session

In the final message to the maintainer (Catalan), give at most five lines: where the report is (`docs/SESSION-REPORT.md`), how many matrix items are `DONE (verified)`, `PARTIAL` and `NOT DONE`, and the single most important pending manual step. Do not repeat the report's content in the chat.

## Appendix A — reference implementation for `tests/perfil_ref.py`

```python
def construeix(nusos):
    x = [k[0] for k in nusos]; v = [k[1] for k in nusos]; n = len(x)
    D = [x[i+1]-x[i] for i in range(n-1)]
    q = [(v[i+1]-v[i])/D[i] for i in range(n-1)]
    m = [0.0]*n; m[0] = q[0]; m[-1] = q[-1]
    for k in range(1, n-1):
        if q[k-1]*q[k] <= 0:
            m[k] = 0.0
        else:
            w1 = 2*D[k]+D[k-1]; w2 = D[k]+2*D[k-1]
            m[k] = (w1+w2)/(w1/q[k-1]+w2/q[k])
    trams = []; F = 0.0
    for i in range(n-1):
        c = (3*q[i]-2*m[i]-m[i+1])/D[i]
        e = (m[i]+m[i+1]-2*q[i])/(D[i]**2)
        trams.append((x[i], x[i+1], v[i], m[i], c, e, F))
        F += v[i]*D[i] + m[i]*D[i]**2/2 + c*D[i]**3/3 + e*D[i]**4/4
    return trams

def _tram(trams, x):
    for p in trams:
        if x <= p[1] or p is trams[-1]:
            return p

def vel(trams, x):
    x0, _, a, b, c, e, _ = _tram(trams, x); s = x-x0
    return a + b*s + c*s*s + e*s**3

def pos(trams, x):
    x0, _, a, b, c, e, F = _tram(trams, x); s = x-x0
    return F + a*s + b*s*s/2 + c*s**3/3 + e*s**4/4

def tvm(trams, a, t):
    return (pos(trams, a+t) - pos(trams, a)) / t
```
