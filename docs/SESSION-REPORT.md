# Session report — derivada

## 2026-10-21 · session 1

### 1. Header
- Repo: `derivada`. ZIP: `derivada.zip` (root = repo root, no `.github/`).
- Scope: build the whole v1 from `docs/SPEC.md` using `camina-main.zip` as template; engine + tests first, then UI.
- Environment: Node v22.22.2, Python 3.12.3. Network not used. Chromium 141 headless via Playwright (python) was
  available and used against `file://`. `camina` available as the uploaded ZIP.

### 2. Requirements matrix
| Item | Status | Evidence |
|---|---|---|
| §4.1 scenario data | DONE (verified) | `tests/escenaris.test.js` 113 passed; data compared to an independent copy of the table |
| §4.2 exact profile | DONE (verified) | `tests/perfil.test.js` 103 passed (Simpson, central difference, plateaus exact, JS = Python) |
| §4.3 terrain in metres | DONE (verified) | `escenaris.test.js` §4 |
| §4.4 validation | DONE (verified) | `perfil.valida` + `escenaris.test.js` (all scenarios, anchors, negatives) |
| §4.5 fixtures | DONE (verified) | `tvm.test.js` 105 + `perfil.test.js`; r1 f(8) tested as 19.537 (see deviations) |
| §5.1 instruments | DONE (verified) | `laboratori.test.js`; Chromium: stopwatch/odometer/observer values, 3 decimals |
| §5.2 state machine | DONE (verified) | `laboratori.test.js` 89 passed, fake clock |
| §5.3 programmed stop | DONE (verified) | `laboratori.test.js` §6 (t exact for 2, 1, 0.5, 0.2, 0.1); Chromium G3 run with all presets |
| §5.4 changing a | PARTIAL | verified in Chromium: drag marker, field, arrow keys, Shift+arrows, grid 0.1; −/+ buttons and tap-on-axis not exercised |
| §5.5 log and TVM entry | DONE (verified) | `entrada.test.js` 60 passed; Chromium: typed TVM accepted, row locked |
| §6 G0 | DONE (verified) | Chromium: Space, curve drawn live, closing messages, Següent |
| §6 G1 | PARTIAL | Chromium: row created and focus in TVM field; completion not exercised; `condicioG1` unit-tested |
| §6 G2 | PARTIAL | not run in Chromium (only layout loaded); `condicioG2` tested with simulated lab |
| §6 G3 → estimate → G4 | DONE (verified) | Chromium: 5 presets, M3/M5/not-a-number messages, correct 2,75 → speedometer, 7 frames, definition |
| §6.1 help (t = 0) | DONE (unverified) | button and text exist; click not exercised |
| §6.2 graph overlays | DONE (verified) | screenshots inspected (secant+triangle, tangent, P1 tangents) |
| §6.3 estimate and beauty | DONE (verified) | see G3 row |
| §6.4 feedback discipline | DONE (verified) | `repo.test.js`: ≤ 40 words, no digits in error texts; code caps at 2 messages |
| §6.5 P1 | DONE (verified) | Chromium: wrong (M1 message), compare message, correct → tangents; `exercicis.test.js` 200 seeds |
| §6.5 P2 | PARTIAL | loads with fixed a and free preset; estimate gate end-to-end not exercised |
| §6.5 free lab | DONE (verified) | Chromium: scenario/a from URL, arrows, field, speedometer toggle |
| §7 layout | PARTIAL | wide (1280) and 375 px: no horizontal scroll (scrollWidth 375). Dark-mode screenshot taken, not inspected. Projector and print not checked |
| §7 accessibility | DONE (unverified) | aria-live regions, labels, focus-visible, 44 px targets written; no screen reader, no reduced-motion run, no keyboard-only pass |
| §8 architecture | DONE (verified) | `repo.test.js` (order, wrapper, headers) |
| §9 `perfil.test.js` | DONE (verified) | 103 passed |
| §9 `tvm.test.js` | DONE (verified) | 105 passed |
| §9 `laboratori.test.js` | DONE (verified) | 89 passed |
| §9 `entrada.test.js` | DONE (verified) | 60 passed |
| §9 `escenaris.test.js` | DONE (verified) | 113 passed |
| §9 `exercicis.test.js` | DONE (verified) | 54 passed |
| §9 `repo.test.js` | DONE (verified) | 35 passed; workflow check ran over 0 workflows (none in repo) |
| §9 `versio.py --comprova` | DONE (verified) | "Tots els ?v= són al dia." |
| §9 `docs_vs_codi.py` | DONE (verified) | "la documentació quadra amb el codi." |
| §10 works by double click | DONE (verified) | all browser checks ran from `file://` |
| §10 touch | NOT DONE | touch input never tested |
| §10 Space/S/buttons/a-controls | PARTIAL | see §5.4 row |
| §10 guided route end to end | PARTIAL | see G1/G2 rows |
| §10 speedometer/tangent not before the limit | DONE (verified) | Chromium at G3: velocímetre, estimate, escenari hidden until the limit |
| §10 no projectile, no curved path | DONE (verified) | `repo.test.js` §8; path is piecewise straight |
| §10 all tests pass | DONE (verified) | below |
| §10 SESSION-REPORT | DONE (verified) | this file |

### 3. Test results (final run, after the last edit)
```
node tests/run-all.js  → exit 0, "Tot correcte."
PERFIL: 103 correctes, 0 errors      TVM: 105 correctes, 0 errors
LABORATORI: 89 correctes, 0 errors   ENTRADA: 60 correctes, 0 errors
ESCENARIS: 113 correctes, 0 errors   EXERCICIS: 54 correctes, 0 errors
REPOSITORI: 35 correctes, 0 errors
python3 tools/versio.py --comprova → ✓ Tots els ?v= són al dia.
python3 tests/docs_vs_codi.py      → ✓ derivada: la documentació quadra amb el codi.
```
Browser checks were ad-hoc Playwright scripts, **not** part of the repo. They were last run before three small edits
(neutral not-a-number text, `D.app` export, repo-test regex); those were covered only by the Node tests.

### 4. Numerical verification
All §4.5 fixtures reproduced within ±0.001 by the JS engine (`tvm.test.js`, `perfil.test.js`) and by
`tests/perfil_ref.py` (Appendix A). Max JS↔Python deviation (f, v, TVM): 3.6e-14. Max Simpson error 1.2e-8 (global
composite), 0 to 3.6e-15 per piece; max central-difference error 5.4e-10; max |v′| 3.587 (r5, limit 4.0).

### 5. File inventory
Copied from camina, byte-identical (`cmp` checked): `.prettierrc.json`, `.prettierignore`, `.gitignore`, `_headers`,
`LICENSE`, `LLICENCIA.md`, `css/tokens.css`, `js/motor/atzar.js`, `tools/versio.py`, `favicon.svg`; also
`tests/harness.js` (not in the spec list, needed by the tests). `CLAUDE.md`: common-rules block copied from camina,
rest written. `docs/SPEC.md`: the uploaded spec. Written: `index.html`, `README.md`, `css/derivada.css`,
`data/escenaris.js`, `js/motor/{perfil,tvm,terreny,laboratori,entrada,exercicis}.js`,
`js/ui/{textos,escena,grafica,velocimetre,app}.js`, `tests/{run-all,repo.test,perfil,tvm,laboratori,entrada,escenaris,exercicis}.js`,
`tests/{fixtures.js,perfil_ref.py,docs_vs_codi.py}`, `docs/STATE.md`, this report, `_uploads/.gitkeep`.
Modelled on camina (not copied): `run-all.js`, `repo.test.js`, `docs_vs_codi.py`.

### 6. Deviations and defaults
- DEVIATION: no P1 for r2 (9 exercises, not 10): the spec rule is unsatisfiable there (0 of 680 triples). Impact: r2 has only P2.
- DEVIATION: fixture r1 f(8) tested as 19.537; the spec table says 19.54 (differs by 0.003 > ±0.001).
- DEVIATION: attribution block in README.md, not CLAUDE.md (as camina does). `tokens.css` verbatim; new tokens in `derivada.css`.
- DEVIATION: `atzar.js` verbatim exposes `window.Atzar`, not `DERIVADA.atzar`.
- Defaults: G3 condition as a decreasing subsequence; P2 estimate gated; secant/tangent display rules; replay timing;
  "not a number" text without an example (it would leak f′(6)=2.408 in r2); hash read-only; see `docs/STATE.md`.
- Student copy is my draft in Catalan (spec says drafts); the G3 text starts "Aquí a = 5,5 s." because a is already fixed.
- §11 open questions: defaults kept (x/f(x) notation, programmed stop kept, no backward measurements, v ≥ 0).

### 7. Known issues and untested paths
- Browsers tested: Chromium 141 headless only. Firefox, Safari, mobile devices: none. Touch: none.
- Not done: screen reader, reduced motion, keyboard-only full pass, print preview, projector mode, inspection of the dark-mode screenshot.
- The wide layout puts the graph below the scene (scene capped at 250 px); not tuned for short screens.
- Labels on the graph can overlap when secants are very small.
- `repo.test.js` checks workflows only if `.github/workflows` exists (not shipped); the two workflow texts were not scanned by a test.

### 8. Pending manual steps for the maintainer
1. Create the GitHub repo `derivada`.
2. Create `.github/workflows/tests.yml` and `.github/workflows/unzip-upload.yml` from the GitHub web UI (texts given in chat).
3. Upload `derivada.zip` to `_uploads/` (Add file → Upload files).
4. Check Actions: unzip run, then Tests green.
5. Cloudflare Pages: connect the repo, no build command, output directory `/`; custom domain `derivada.step-quiz.net`.
6. Open the site once from a phone/tablet and check touch.

### 9. Next steps
1. Browser pass for the NOT DONE / PARTIAL items above (touch, G1/G2, P2 gate, print, projector, dark, reduced motion).
2. Decide the r2 P1 question (relax the rule for r2 or change the scenario).
3. Phase 2 (spec §1.3, §11): backward measurements, negative velocities.
