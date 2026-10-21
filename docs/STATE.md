# Project — Derivada en un punt: living state

Agent-facing memory between sessions. English. Update in the same commit as any change.
Spec: [`SPEC.md`](SPEC.md). Where they disagree, this file wins.

## Status (2026-10-21): v1 built, not yet published

| Part | Status |
|---|---|
| Engines `perfil`, `tvm`, `terreny`, `laboratori`, `entrada`, `exercicis` (pure, Node-tested) | DONE |
| Data: 5 scenarios | DONE |
| UI: scene SVG, canvas graph, speedometer, controller, guided route G0–G4, practice P1/P2, free lab, projector, print | DONE (browser-checked only partially, see SESSION-REPORT) |
| Tests `node tests/run-all.js` | DONE, all green |
| Repo bootstrap on GitHub (workflows, `_uploads/`), Cloudflare Pages | PENDING (user, web UI) |

## Decisions and deviations (agent, 2026-10-21)

- **P1 is not generated for r2.** In r2, v is non-decreasing, so the fastest point is always the farthest one; the rule
  "largest-f point is not the fastest" has no valid triple (brute force: 0 of 680 spaced triples). The rule is kept, so
  `generaTot` yields 9 items (5 P2 + 4 P1). If a P1 for r2 is wanted, relax the rule for that scenario or change r2.
- **Reference fixture r1 f(8) = 19.537** (spec table says 19.54, rounded).
- **Knot ownership:** a knot belongs to the piece that starts there (`x < x1`), so plateau values are exact at the knot.
- **Validation of |v′| uses the analytic v′** (`perfil.acceleracio`), not a numerical derivative; the app itself never
  differentiates numerically.
- **tokens.css** is copied byte-identical from camina; new tokens (secant, tangent, terrain, observer) live in
  `css/derivada.css`.
- **`atzar.js`** is copied verbatim and exposes `window.Atzar` (not `DERIVADA.atzar`); `exercicis.js` reads it from there.
- **Attribution block** is in README.md (as in camina, and as `tests/repo.test.js` checks), not in CLAUDE.md.
- **G3 condition** = ≥ 3 correct rows at a = 5.5 whose t form a strictly decreasing subsequence in chronological
  order, with min t ≤ 0.5 (literal reading; order of measurement need not be contiguous).
- **P2 estimate is gated** by the same condition (≥ 3 correct rows, decreasing t, min t ≤ 0.5) — the spec does not say.
- **Graph secants:** all log rows with the current a are drawn; the latest while STOPPED is saturated with numeric
  triangle labels, older ones faded/dashed without numbers; the TVM label appears only on correct rows. After `S`
  nothing is saturated.
- **Beauty moment:** replay auto-advances every 700 ms (manual stepper under `prefers-reduced-motion`); the tangent
  appears when the replay ends; numeric triangle labels only for frames with t ≥ 0.1.
- **"Not a number" message has no example value** (an example such as 2,4 equals a real answer: f′(6) in r2).
- **Space on a focused button** always drives the stopwatch (per spec); Enter activates buttons.
- **URL hash is read-only** (not rewritten by the app). A badly encoded value only drops that parameter.
- `?v=0` placeholders were added to `index.html` once so `tools/versio.py` can compute the hashes.
- Open questions §11: defaults taken (notation x / f(x); programmed stop kept; no backward measurements; v ≥ 0).
