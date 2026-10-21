/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: tests/perfil.test.js
 * ROL: Tests del perfil exacte (docs/SPEC.md §4.2, §4.5): els valors de
 *      referència a ±0,001; la integral composta de Simpson de v dona f (< 1e-6);
 *      la derivada per diferències centrals de f dona v (< 1e-6) en 200 punts
 *      aleatoris; v ≥ 0; v mínima i màxima; els trams plans són EXACTAMENT
 *      constants; f i v tallen a [0, X]; i el JS coincideix amb perfil_ref.py.
 * ÚS: node tests/perfil.test.js
 * ============================================================================
 */
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const { suite, ok, eq, finish } = require('./harness');
const Perfil = require('../js/motor/perfil.js');
const ESC = require('../data/escenaris.js');
const Atzar = require('../js/motor/atzar.js');
const FX = require('./fixtures.js');

const perfils = {};
ESC.forEach(e => (perfils[e.id] = Perfil.crea(e.nusos)));

function simpson(g, a, b, n) {
    const h = (b - a) / n;
    let s = g(a) + g(b);
    for (let i = 1; i < n; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
    return (s * h) / 3;
}

suite('1. Valors de referència de f (§4.5, ±0,001)');
for (const [id, fx] of Object.entries(FX.f)) {
    const p = perfils[id];
    [2, 5, 8, 12].forEach((x, i) =>
        ok(`${id}: f(${x}) = ${fx.f[i]}`, Math.abs(p.f(x) - fx.f[i]) <= FX.TOL, `rebut ${p.f(x).toFixed(6)}`)
    );
    ok(`${id}: fFinal = f(X)`, p.fFinal === p.f(p.X));
}

suite('2. v mínima i màxima (graella de 0,001 s)');
for (const [id, fx] of Object.entries(FX.f)) {
    const p = perfils[id];
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i <= 12000; i++) {
        const v = p.v(i / 1000);
        mn = Math.min(mn, v);
        mx = Math.max(mx, v);
    }
    ok(`${id}: v mínima ${fx.vMin}`, Math.abs(mn - fx.vMin) <= FX.TOL, `rebut ${mn}`);
    ok(`${id}: v màxima ${fx.vMax}`, Math.abs(mx - fx.vMax) <= FX.TOL, `rebut ${mx}`);
    ok(`${id}: v ≥ 0 a tota la graella`, mn >= -1e-12);
}

suite('3. La integral de v és f (Simpson, < 1e-6)');
for (const e of ESC) {
    const p = perfils[e.id];
    let acumulat = 0, maxErr = 0;
    for (let i = 0; i < e.nusos.length - 1; i++) {
        acumulat += simpson(p.v, e.nusos[i][0], e.nusos[i + 1][0], 2); // exacta per a cúbiques
        maxErr = Math.max(maxErr, Math.abs(acumulat - p.f(e.nusos[i + 1][0])));
    }
    ok(`${e.id}: Simpson per trams = f a cada nus (error ${maxErr.toExponential(1)})`, maxErr < 1e-6);
    const at = Atzar.crea('simpson-' + e.id);
    let maxG = 0;
    for (let k = 0; k < 20; k++) {
        const x = at.real() * e.X;
        maxG = Math.max(maxG, Math.abs(simpson(p.v, 0, x, 4000) - p.f(x)));
    }
    ok(`${e.id}: Simpson compost global = f en 20 punts (error ${maxG.toExponential(1)})`, maxG < 1e-6);
}

suite('4. f′ = v (diferències centrals, 200 punts aleatoris, < 1e-6)');
for (const e of ESC) {
    const p = perfils[e.id];
    const at = Atzar.crea('derivada-' + e.id);
    const h = 1e-5;
    let maxErr = 0;
    for (let k = 0; k < 200; k++) {
        const x = h + at.real() * (e.X - 2 * h);
        maxErr = Math.max(maxErr, Math.abs((p.f(x + h) - p.f(x - h)) / (2 * h) - p.v(x)));
    }
    ok(`${e.id}: error màxim ${maxErr.toExponential(1)}`, maxErr < 1e-6);
}

suite('5. Trams plans exactament constants; C¹; tall a [0, X]');
for (const e of ESC) {
    const p = perfils[e.id];
    let plans = 0, tots = true;
    for (let i = 0; i < e.nusos.length - 1; i++) {
        if (e.nusos[i][1] !== e.nusos[i + 1][1]) continue;
        plans++;
        for (let s = 0; s <= 100; s++) {
            const x = e.nusos[i][0] + ((e.nusos[i + 1][0] - e.nusos[i][0]) * s) / 100;
            if (p.v(x) !== e.nusos[i][1]) tots = false;
        }
    }
    ok(`${e.id}: ${plans} tram(s) pla(ns), v exactament constant`, tots);
    let maxSalt = 0;
    for (let i = 1; i < e.nusos.length - 1; i++) {
        const x = e.nusos[i][0];
        maxSalt = Math.max(maxSalt, Math.abs(p.v(x - 1e-9) - p.v(x + 1e-9)), Math.abs(p.acceleracio(x - 1e-9) - p.acceleracio(x + 1e-9)));
    }
    ok(`${e.id}: v i v′ contínues als nusos (salt ${maxSalt.toExponential(1)})`, maxSalt < 1e-6);
    ok(`${e.id}: passa pels nusos`, e.nusos.every(([x, v]) => Math.abs(p.v(x) - v) < 1e-12));
    ok(`${e.id}: f(0) = 0`, p.f(0) === 0);
    ok(`${e.id}: f i v tallen a [0, X]`, p.f(-3) === p.f(0) && p.f(99) === p.f(p.X) && p.v(-3) === p.v(0) && p.v(99) === p.v(p.X));
    let creix = true;
    for (let i = 1; i <= 1200; i++) if (p.f(i / 100) < p.f((i - 1) / 100) - 1e-12) creix = false;
    ok(`${e.id}: f no decreixent`, creix);
}

suite('6. El JavaScript coincideix amb perfil_ref.py (apèndix A)');
{
    const entrada = {};
    ESC.forEach(e => (entrada[e.id] = e.nusos));
    const r = spawnSync('python3', [path.join(__dirname, 'perfil_ref.py')], { input: JSON.stringify(entrada), encoding: 'utf8' });
    ok('python3 tests/perfil_ref.py s’executa', r.status === 0, r.stderr);
    if (r.status === 0) {
        const ref = JSON.parse(r.stdout);
        let maxDev = 0;
        for (const e of ESC) {
            const p = perfils[e.id], R = ref[e.id];
            let dev = 0;
            R.x.forEach((x, i) => {
                dev = Math.max(dev, Math.abs(p.f(x) - R.f[i]), Math.abs(p.v(x) - R.v[i]));
            });
            R.a.forEach((a, i) =>
                FX.PRESETS.forEach((t, j) => {
                    dev = Math.max(dev, Math.abs((p.f(a + t) - p.f(a)) / t - R.tvm[i][j]));
                })
            );
            maxDev = Math.max(maxDev, dev);
            ok(`${e.id}: f, v i TVM = Python (desviació ${dev.toExponential(1)})`, dev < 1e-9);
        }
        console.log(`  · desviació màxima JS ↔ Python: ${maxDev.toExponential(2)}`);
    }
}

suite('7. Validació de dades (perfil.valida)');
{
    const base = { id: 'x', X: 12, nusos: [[0, 1], [6, 2], [12, 3]], terrenys: [{ de: 0, a: 12, tipus: 'llis' }] };
    eq('un escenari correcte no dona errors', Perfil.valida(base).length, 0);
    const malament = (nom, canvi) => ok(nom, Perfil.valida(Object.assign({}, base, canvi)).length > 0);
    malament('menys de 3 nusos', { nusos: [[0, 1], [12, 2]] });
    malament('x_0 ≠ 0', { nusos: [[1, 1], [6, 2], [12, 3]] });
    malament('x_n ≠ 12', { nusos: [[0, 1], [6, 2], [11, 3]] });
    malament('x no creixent', { nusos: [[0, 1], [6, 2], [6, 3], [12, 3]] });
    malament('v > 6', { nusos: [[0, 1], [6, 7], [12, 3]] });
    malament('v < 0', { nusos: [[0, 1], [6, -1], [12, 3]] });
    malament('forat de terreny', { terrenys: [{ de: 0, a: 5, tipus: 'llis' }, { de: 6, a: 12, tipus: 'gel' }] });
    malament('terreny solapat', { terrenys: [{ de: 0, a: 7, tipus: 'llis' }, { de: 6, a: 12, tipus: 'gel' }] });
    malament('terreny desconegut', { terrenys: [{ de: 0, a: 12, tipus: 'lava' }] });
    malament('|v′| > 4 (salt massa brusc)', { nusos: [[0, 0], [5.9, 0], [6, 6], [12, 6]] });
    malament('f(X) > 40', { nusos: [[0, 5], [6, 6], [12, 6]] });
}

finish('PERFIL');
