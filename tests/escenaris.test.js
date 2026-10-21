/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: tests/escenaris.test.js
 * ROL: Tests de les dades (docs/SPEC.md §4.1, §4.3, §4.4): els 5 escenaris
 *      exactament com els defineix l'especificació (còpia independent), validació
 *      de cada escenari, ancoratges vàlids o `constant` (i la marca constant és
 *      certa), terrenys que cobreixen [0, X], metres = [f(de), f(a)], angle ≤ 8°.
 * ÚS: node tests/escenaris.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish } = require('./harness');
const ESC = require('../data/escenaris.js');
const Perfil = require('../js/motor/perfil.js');
const Terreny = require('../js/motor/terreny.js');
const Exe = require('../js/motor/exercicis.js');

// Còpia independent de la taula del §4.1
const REF = {
    r1: ['Baixada, gel i sorra', [[0, 2.0], [2, 3.0], [5, 3.0], [7, 1.2], [9, 0.8], [12, 0.6]], [['baixada', 0, 2], ['gel', 2, 5], ['sorra', 5, 12]]],
    r2: ['Pla, baixada, pla', [[0, 1.0], [4, 1.0], [9, 5.0], [12, 5.0]], [['llis', 0, 4], ['baixada', 4, 9], ['llis', 9, 12]]],
    r3: ['Pedres', [[0, 1.5], [2, 0.4], [4, 1.6], [6, 0.3], [8, 1.5], [10, 0.5], [12, 1.2]], [['pedres', 0, 12]]],
    r4: ['Gel, sorra i baixada', [[0, 3.0], [3, 3.0], [5, 0.8], [6.5, 0.0], [8, 0.0], [10, 2.5], [12, 4.0]], [['gel', 0, 3], ['sorra', 3, 8], ['baixada', 8, 12]]],
    r5: ['Terreny variat', [[0, 2.0], [2, 2.0], [4, 0.9], [5, 1.4], [6, 0.6], [7, 1.0], [8, 3.5], [10, 3.5], [12, 5.5]], [['llis', 0, 2], ['pedres', 2, 7], ['baixada', 7, 8], ['gel', 8, 10], ['baixada', 10, 12]]],
};
// Ancoratges que l'especificació cita (§4.5)
const CITATS = { r1: [5.5, 6.5], r2: [5, 6], r3: [2, 5], r4: [4, 7.5], r5: [6, 7] };

suite('1. Els 5 escenaris de referència, tal com diu l’especificació');
eq('hi ha exactament 5 escenaris r1…r5', ESC.map(e => e.id).join(' '), 'r1 r2 r3 r4 r5');
for (const e of ESC) {
    const [nom, nusos, terrenys] = REF[e.id];
    eq(`${e.id}: nom`, e.nom, nom);
    eq(`${e.id}: nusos`, JSON.stringify(e.nusos), JSON.stringify(nusos));
    eq(`${e.id}: terrenys`, JSON.stringify(e.terrenys.map(t => [t.tipus, t.de, t.a])), JSON.stringify(terrenys));
    eq(`${e.id}: X = 12`, e.X, 12);
}
ok('r1: l’ancoratge guiat és a = 5,5', ESC[0].ancoratges.some(a => a.a === 5.5 && a.tipus === 'guiat'));
ok('r4: a = 7,5 NO és guiat (M3)', !ESC[3].ancoratges.some(a => a.a === 7.5 && a.tipus === 'guiat'));
ok('només r1 a = 5,5 és guiat', ESC.every(e => e.ancoratges.filter(a => a.tipus === 'guiat').length === (e.id === 'r1' ? 1 : 0)));

suite('2. Validació de cada escenari (§4.4)');
for (const e of ESC) {
    const errs = Perfil.valida(e);
    ok(`${e.id}: perfil.valida sense errors`, errs.length === 0, errs.join('; '));
    const p = Perfil.crea(e.nusos);
    let maxA = 0;
    for (let i = 0; i <= 1200; i++) {
        // |v′| independent: diferència central de v (no de l’analítica)
        const x = Math.min(12 - 1e-4, Math.max(1e-4, i / 100));
        maxA = Math.max(maxA, Math.abs((p.v(x + 1e-4) - p.v(x - 1e-4)) / 2e-4));
    }
    ok(`${e.id}: max |v′| ≤ 4,0 m/s² (${maxA.toFixed(3)})`, maxA <= 4.0 + 1e-3);
    ok(`${e.id}: f(X) ≤ 40 m (${p.fFinal.toFixed(3)})`, p.fFinal <= 40);
    ok(`${e.id}: 0 ≤ v ≤ 6`, e.nusos.every(([, v]) => v >= 0 && v <= 6));
    ok(`${e.id}: ≥ 3 nusos, x estrictament creixent`, e.nusos.length >= 3 && e.nusos.every((n, i) => i === 0 || n[0] > e.nusos[i - 1][0]));
}

suite('3. Ancoratges: vàlids o constants');
for (const e of ESC) {
    const p = Perfil.crea(e.nusos);
    ok(`${e.id}: cada ancoratge és a la graella de 0,5 s amb 0 ≤ a ≤ X − 2`, e.ancoratges.every(an => Math.abs(an.a * 2 - Math.round(an.a * 2)) < 1e-12 && an.a >= 0 && an.a <= e.X - 2));
    for (const an of e.ancoratges) {
        const r = Exe.ancoratge(p, an.a);
        ok(`${e.id} a = ${an.a}: ${an.constant ? 'constant' : 'error monòton, ≥ 0,2 a t = 2 i ≤ 0,1 a t = 0,1'}`, r.valid && r.constant === !!an.constant, JSON.stringify(r));
    }
    for (const a of CITATS[e.id]) ok(`${e.id}: inclou l’ancoratge citat a = ${a}`, e.ancoratges.some(an => an.a === a));
    ok(`${e.id}: l’escaneig troba tots els ancoratges declarats`, e.ancoratges.every(an => Exe.escaneja(p).some(s => s.a === an.a)));
}
{
    // Les marques `constant` són certes: la TVM no depèn de t
    const r1 = Perfil.crea(ESC[0].nusos), r2 = Perfil.crea(ESC[1].nusos);
    const tvm = (p, a, t) => (p.f(a + t) - p.f(a)) / t;
    ok('r1 a = 2,5: TVM = 3 per a tot t', [2, 1, 0.5, 0.2, 0.1].every(t => Math.abs(tvm(r1, 2.5, t) - 3) < 1e-9));
    ok('r2 a = 1: TVM = 1 per a tot t', [2, 1, 0.5, 0.2, 0.1].every(t => Math.abs(tvm(r2, 1, t) - 1) < 1e-9));
    ok('r1 a = 5,5 no és constant', !Exe.ancoratge(r1, 5.5).constant);
    ok('r1: un a no vàlid existeix (a = 7,5: poc error a t = 2)', !Exe.ancoratge(r1, 7.5).valid || Exe.ancoratge(r1, 7.5).errors[0] >= 0.2);
}

suite('4. Terreny en metres (§4.3)');
for (const e of ESC) {
    const p = Perfil.crea(e.nusos);
    const m = Terreny.metres(e, p);
    ok(`${e.id}: els trams cobreixen [0, X] sense forats ni solapaments`, e.terrenys[0].de === 0 && e.terrenys[e.terrenys.length - 1].a === e.X && e.terrenys.every((t, i) => i === 0 || t.de === e.terrenys[i - 1].a));
    ok(`${e.id}: metres = [f(de), f(a)]`, m.every((t, i) => t.x0 === p.f(e.terrenys[i].de) && t.x1 === p.f(e.terrenys[i].a)));
    ok(`${e.id}: els metres són contigus, de 0 a f(X)`, m[0].x0 === 0 && m[m.length - 1].x1 === p.fFinal && m.every((t, i) => i === 0 || t.x0 === m[i - 1].x1));
    ok(`${e.id}: angle de la baixada ≤ 8°, la resta 0`, m.every(t => (t.tipus === 'baixada' ? t.angle > 0 && t.angle <= 8 : t.angle === 0)));
    ok(`${e.id}: només tipus coneguts`, m.every(t => Perfil.TERRENYS.includes(t.tipus)));
}
eq('angle visual configurat', Terreny.CONFIG.angleBaixada, 8);
ok('cos 8° ≈ 0,99', Math.abs(Math.cos((8 * Math.PI) / 180) - 0.99) < 0.001);
eq('els 5 tipus de terreny', Perfil.TERRENYS.join(' '), 'llis gel sorra pedres baixada');

finish('ESCENARIS');
