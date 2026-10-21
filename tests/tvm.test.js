/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: tests/tvm.test.js
 * ROL: Tests de js/motor/tvm.js (docs/SPEC.md §4.5, §5.2): TVM[a, a+t] contra
 *      els valors de referència a ±0,001; el «snap» (0,04 → 0,1; 0,26 → 0,3; final
 *      de la pista); el comptador = f(a+t) − f(a) amb la t arrodonida; secant,
 *      triangle de pendent i tangent; reproducció final.
 * ÚS: node tests/tvm.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish } = require('./harness');
const Perfil = require('../js/motor/perfil.js');
const Tvm = require('../js/motor/tvm.js');
const ESC = require('../data/escenaris.js');
const FX = require('./fixtures.js');

const perfils = {};
ESC.forEach(e => (perfils[e.id] = Perfil.crea(e.nusos)));

suite('1. TVM[a, a+t] de referència (±0,001) i f′(a)');
for (const an of FX.ancoratges) {
    const p = perfils[an.id];
    ok(`${an.id} a=${an.a}: f(a) = ${an.fa}`, Math.abs(p.f(an.a) - an.fa) <= FX.TOL);
    FX.PRESETS.forEach((t, j) => {
        const v = Tvm.tvm(p, an.a, t);
        ok(`${an.id} a=${an.a} t=${t}: TVM = ${an.tvm[j]}`, Math.abs(v - an.tvm[j]) <= FX.TOL, `rebut ${v.toFixed(6)}`);
    });
    ok(`${an.id} a=${an.a}: f′(a) = ${an.d}`, Math.abs(p.v(an.a) - an.d) <= FX.TOL);
}
eq('els preajustos són 2, 1, 0,5, 0,2, 0,1', Tvm.PRESETS.join(' '), '2 1 0.5 0.2 0.1');

suite('2. Snap del cronòmetre (§5.2)');
{
    const X = 12;
    eq('0,04 → 0,1 (mínim)', Tvm.snapT(0.04, 0, X), 0.1);
    eq('0 → 0,1 (mínim)', Tvm.snapT(0, 0, X), 0.1);
    eq('0,26 → 0,3', Tvm.snapT(0.26, 0, X), 0.3);
    eq('0,24 → 0,2', Tvm.snapT(0.24, 0, X), 0.2);
    eq('0,15 → 0,2 (vora, sense error de coma flotant)', Tvm.snapT(0.15, 0, X), 0.2);
    eq('1,949 → 1,9', Tvm.snapT(1.949, 0, X), 1.9);
    eq('1,95 → 2', Tvm.snapT(1.95, 0, X), 2);
    eq('a = 11,5: 3 s es talla al final (0,5)', Tvm.snapT(3, 11.5, X), 0.5);
    eq('a = 11,9: el mínim 0,1 hi cap', Tvm.snapT(0.01, 11.9, X), 0.1);
    let tots = true;
    for (let i = 0; i < 1000; i++) {
        const t = Tvm.snapT(i / 100, 5.5, X);
        if (Math.abs(t * 10 - Math.round(t * 10)) > 1e-9 || t < 0.1 || 5.5 + t > X + 1e-9) tots = false;
    }
    ok('sempre a la dècima, ≥ 0,1 i dins la pista', tots);
}

suite('3. Comptador de distància = f(a+t) − f(a) amb la t arrodonida');
for (const [id, a, el] of [['r1', 5.5, 0.26], ['r1', 5.5, 0.04], ['r3', 5, 1.449], ['r4', 7.5, 2.0], ['r2', 0, 9.97]]) {
    const p = perfils[id];
    const t = Tvm.snapT(el, a, 12);
    const m = Tvm.mesura(p, a, t);
    ok(`${id} a=${a} elapsed=${el}: t=${t}, d = f(a+t) − f(a)`, m.d === p.f(a + t) - p.f(a) && m.t === t);
    ok(`${id} a=${a} elapsed=${el}: TVM = d / t`, Math.abs(m.tvm - m.d / t) < 1e-15);
    ok(`${id} a=${a} elapsed=${el}: f(a) i f(a+t)`, m.fa === p.f(a) && m.fat === p.f(a + t));
}

suite('4. Secant, triangle de pendent i tangent (M6)');
{
    const p = perfils.r1;
    const s = Tvm.secant(p, 5.5, 0.5);
    ok('la secant va de (a, f(a)) a (a+t, f(a+t))', s.x0 === 5.5 && s.x1 === 6 && s.y0 === p.f(5.5) && s.y1 === p.f(6));
    ok('triangle: alçada = d (m), base = t (s)', Math.abs(s.triangle.alcada - (p.f(6) - p.f(5.5))) < 1e-15 && s.triangle.base === 0.5);
    ok('pendent = alçada / base', Math.abs(s.pendent - s.triangle.alcada / s.triangle.base) < 1e-15);
    const tg = Tvm.tangent(p, 5.5);
    ok('tangent: pendent v(a) exacta', tg.pendent === p.v(5.5) && tg.y0 === p.f(5.5) && tg.x0 === 5.5);
    let conv = true, ant = Infinity;
    [2, 1, 0.5, 0.2, 0.1, 0.05, 0.01].forEach(t => {
        const e = Math.abs(Tvm.tvm(p, 5.5, t) - p.v(5.5));
        if (e > ant) conv = false;
        ant = e;
    });
    ok('r1 a=5,5: la TVM s’acosta a f′(a) en tota la reproducció', conv);
}

suite('5. Reproducció del moment de bellesa (§6.3)');
{
    eq('7 fotogrames', Tvm.REPRODUCCIO.join(' '), '2 1 0.5 0.2 0.1 0.05 0.01');
    eq('a = 5,5: els 7 caben', Tvm.reproduccio(5.5, 12).length, 7);
    eq('a = 11,5: només els que caben (a + t ≤ X)', Tvm.reproduccio(11.5, 12).join(' '), '0.5 0.2 0.1 0.05 0.01');
    eq('decima(0,15) = 0,2', Tvm.decima(0.15), 0.2);
}

finish('TVM');
