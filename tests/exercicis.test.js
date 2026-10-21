/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: tests/exercicis.test.js
 * ROL: Tests de js/motor/exercicis.js (docs/SPEC.md §6, §6.5): cada P1 generat
 *      compleix les regles (diferència ≥ 0,4, el punt de f més gran no és el més
 *      ràpid, separació ≥ 2 s) amb 200 llavors per escenari; cada P2 usa un
 *      ancoratge vàlid; les condicions G1–G3 es poden complir amb els valors de
 *      referència (simulant el laboratori); 10 exercicis, barrejats amb llavor.
 * ÚS: node tests/exercicis.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish } = require('./harness');
const ESC = require('../data/escenaris.js');
const Perfil = require('../js/motor/perfil.js');
const Exe = require('../js/motor/exercicis.js');
const Lab = require('../js/motor/laboratori.js');
const Tvm = require('../js/motor/tvm.js');
const Entrada = require('../js/motor/entrada.js');
const Atzar = require('../js/motor/atzar.js');

const perfils = {};
ESC.forEach(e => (perfils[e.id] = Perfil.crea(e.nusos)));

suite('1. P1 «Qui va més de pressa?»: les regles, 200 llavors per escenari');
// Existència de trios vàlids, comptada a part per força bruta (independent del codi)
function trios(p) {
    const g = [];
    for (let i = 1; i <= 23; i++) g.push(i / 2);
    let n = 0;
    for (let i = 0; i < g.length; i++)
        for (let j = i + 1; j < g.length; j++)
            for (let k = j + 1; k < g.length; k++) {
                const t = [g[i], g[j], g[k]];
                if (t[1] - t[0] < 2 || t[2] - t[1] < 2) continue;
                const v = t.map(p.v), f = t.map(p.f);
                const ov = [0, 1, 2].sort((a, b) => v[b] - v[a]), of = [0, 1, 2].sort((a, b) => f[b] - f[a]);
                if (v[ov[0]] - v[ov[1]] >= 0.4 - 1e-9 && f[of[0]] - f[of[1]] > 1e-9 && ov[0] !== of[0]) n++;
            }
    return n;
}
for (const e of ESC) {
    const p = perfils[e.id];
    const existents = trios(p);
    if (e.id === 'r2') {
        eq('r2: cap trio compleix la regla (v no decreix mai: el més ràpid és el més lluny)', existents, 0);
        ok('r2: generaP1 torna null (no hi ha P1 a r2)', Exe.generaP1(e, p, Atzar.crea('x')) === null);
        continue;
    }
    ok(`${e.id}: hi ha trios vàlids (${existents})`, existents > 0);
    let totBo = true, mala = '';
    for (let s = 0; s < 200; s++) {
        const it = Exe.generaP1(e, p, Atzar.crea('prova-' + s + e.id));
        if (!it) { totBo = false; mala = 'sense element, llavor ' + s; break; }
        const [x, y, z] = it.punts;
        const v = it.punts.map(p.v), f = it.punts.map(p.f);
        const graella = it.punts.every(a => a >= 0.5 && a <= 11.5 && Math.abs(a * 2 - Math.round(a * 2)) < 1e-12);
        const separats = y - x >= 2 && z - y >= 2;
        const ord = [...v].sort((a, b) => b - a);
        const dif = ord[0] - ord[1] >= 0.4 - 1e-9;
        const iRapid = v.indexOf(ord[0]);
        const iLluny = f.indexOf(Math.max(...f));
        const noEmpat = [...f].sort((a, b) => b - a)[0] - [...f].sort((a, b) => b - a)[1] > 1e-9;
        const coherent = it.rapid === iRapid && it.mesLluny === iLluny && it.tipus === 'P1' && it.escenari === e.id;
        if (!(graella && separats && dif && iRapid !== iLluny && noEmpat && coherent)) { totBo = false; mala = `llavor ${s}: ${JSON.stringify(it)}`; break; }
    }
    ok(`${e.id}: 200 P1 vàlids (graella, ≥ 2 s, diferència ≥ 0,4, el més lluny no és el més ràpid)`, totBo, mala);
}
{
    const a = Exe.generaP1(ESC[0], perfils.r1, Atzar.crea('x')), b = Exe.generaP1(ESC[0], perfils.r1, Atzar.crea('x'));
    ok('la mateixa llavor dona el mateix P1', JSON.stringify(a) === JSON.stringify(b));
    const distints = new Set();
    for (let s = 0; s < 30; s++) distints.add(JSON.stringify(Exe.generaP1(ESC[2], perfils.r3, Atzar.crea('v' + s)).punts));
    ok('llavors diferents donen P1 diferents', distints.size > 5);
    const it = { rapid: 0, mesLluny: 2 };
    eq('P1 correcte', Exe.classificaP1(it, 0), 'correcte');
    eq('P1 amb el punt més lluny (M1)', Exe.classificaP1(it, 2), 'mesLluny');
    eq('P1 altre', Exe.classificaP1(it, 1), 'altre');
    ok('el resguard determinista troba un trio a r1, r3, r4 i r5 encara que l’atzar no ajudi', ['r1', 'r3', 'r4', 'r5'].every(id => Exe.generaP1(ESC.find(e => e.id === id), perfils[id], { enter: () => 0 }) !== null));
}

suite('2. P2 «Estima f′(a)»: ancoratges');
for (const e of ESC) {
    const p = perfils[e.id];
    const vistos = new Set();
    let totBo = true;
    for (let s = 0; s < 60; s++) {
        const it = Exe.generaP2(e, Atzar.crea('p2-' + s));
        const r = Exe.ancoratge(p, it.a);
        vistos.add(it.a);
        if (!(r.valid && !r.constant && e.ancoratges.some(an => an.a === it.a) && it.tipus === 'P2' && it.escenari === e.id)) totBo = false;
    }
    ok(`${e.id}: tots els P2 usen un ancoratge declarat, vàlid i no constant`, totBo);
    if (e.id === 'r1') ok('r1: el P2 no repeteix l’ancoratge guiat (5,5)', !vistos.has(5.5) && vistos.has(6.5));
    if (e.id === 'r4') ok('r4: a = 7,5 (parat) pot sortir', vistos.has(7.5) && vistos.has(4));
}

suite('3. Els 9 exercicis, barrejats amb llavor');
{
    const t = Exe.generaTot(ESC, 'abc');
    eq('9 exercicis (5 P2 + 4 P1: a r2 no n’hi ha cap de vàlid)', t.length, 9);
    ok('un P2 per escenari', ESC.every(e => t.filter(i => i.escenari === e.id && i.tipus === 'P2').length === 1));
    ok('un P1 per escenari excepte r2', ESC.every(e => t.filter(i => i.escenari === e.id && i.tipus === 'P1').length === (e.id === 'r2' ? 0 : 1)));
    ok('determinista', JSON.stringify(t) === JSON.stringify(Exe.generaTot(ESC, 'abc')));
    const ordres = new Set();
    for (let s = 0; s < 20; s++) ordres.add(Exe.generaTot(ESC, 'o' + s).map(i => i.tipus + i.escenari).join());
    ok('llavors diferents donen ordres diferents', ordres.size > 10);
    eq('llavor bruta ignorada (accents i símbols)', Exe.llavorValida('a b<>é'), 'derivada');
    eq('llavor buida ignorada', Exe.llavorValida(''), 'derivada');
    eq('llavor massa llarga ignorada', Exe.llavorValida('x'.repeat(40)), 'derivada');
    eq('llavor no text ignorada', Exe.llavorValida(undefined), 'derivada');
    eq('llavor bona', Exe.llavorValida('clase-4B_2'), 'clase-4B_2');
    ok('llavor bruta = llavor per defecte', JSON.stringify(Exe.generaTot(ESC, '%%%')) === JSON.stringify(Exe.generaTot(ESC, 'derivada')));
}

suite('4. Ruta guiada: les condicions G1–G3 són complibles amb els valors de referència');
{
    let ara = 0;
    const p = perfils.r1;
    // Un alumne perfecte: mesura amb el laboratori i escriu la TVM correcta amb dues xifres
    const mesura = (lab, preset, a) => {
        lab.canviaA(a);
        lab.posaPreset(preset);
        lab.espai();
        ara += preset * 1000 + 5;
        lab.actualitza();
        const f = lab.entrades().slice(-1)[0];
        lab.comprovaTVM(f.id, Entrada.format(f.d / f.t, 2));
        return f;
    };
    const nou = () => Lab.crea({ perfil: p, rellotge: () => ara, a: 0 });
    const et = Exe.ETAPES;
    eq('etapes g0…g4', et.map(x => x.id).join(' '), 'g0 g1 g2 g3 g4');
    ok('totes usen r1', et.every(x => x.escenari === 'r1'));
    ok('g0, g1: a = 0 fix; g3: a = 5,5 fix; g2: a lliure amb 2 s fix', !et[0].aLliure && !et[1].aLliure && et[3].a === 5.5 && !et[3].aLliure && et[2].aLliure && et[2].preset === 2 && !et[2].presetLliure);

    const l1 = nou();
    ok('G1 no es compleix sense files', !Exe.condicioG1(l1.entrades()));
    const f1 = mesura(l1, 1, 0);
    ok('G1: una fila correcta', f1.correcte && Exe.condicioG1(l1.entrades()));
    const l1b = nou();
    l1b.canviaA(0); l1b.espai(); ara += 1005; l1b.espai();
    l1b.comprovaTVM(l1b.entrades()[0].id, '123');
    ok('G1: una fila incorrecta no val', !Exe.condicioG1(l1b.entrades()));

    // G2: r1 a = 1 → TVM[1,3] > 2,5 i a = 6,5 → TVM[6,5; 8,5] < 1,5
    const tvm = (a, t) => (p.f(a + t) - p.f(a)) / t;
    ok('r1: TVM[1,3] > 2,5', tvm(1, 2) > 2.5, String(tvm(1, 2)));
    ok('r1: TVM[6,5; 8,5] < 1,5', tvm(6.5, 2) < 1.5, String(tvm(6.5, 2)));
    const l2 = nou();
    mesura(l2, 2, 1);
    ok('G2: només la TVM alta no n’hi ha prou', !Exe.condicioG2(l2.entrades()));
    mesura(l2, 2, 6.5);
    ok('G2: alta (a = 1) i baixa (a = 6,5), amb t = 2', Exe.condicioG2(l2.entrades()));
    const l2b = nou();
    mesura(l2b, 1, 1); mesura(l2b, 1, 6.5);
    ok('G2: amb t = 1 no val (cal t = 2)', !Exe.condicioG2(l2b.entrades()));
    const l2c = nou();
    mesura(l2c, 2, 1);
    l2c.comprovaTVM(l2c.entrades()[0].id, '9');
    mesura(l2c, 2, 6.5);
    ok('G2: només compten les files correctes', Exe.condicioG2(l2c.entrades()));

    // G3: a = 5,5, t = 2, 1, 0,5, 0,2, 0,1
    const l3 = nou();
    [2, 1].forEach(t => mesura(l3, t, 5.5));
    ok('G3: 2 files no n’hi ha prou', !Exe.condicioG3(l3.entrades(), 5.5));
    mesura(l3, 0.5, 5.5);
    ok('G3: 3 files, t = 2, 1, 0,5 (mínim 0,5)', Exe.condicioG3(l3.entrades(), 5.5));
    const l3b = nou();
    [2, 1, 0.7].forEach(t => { const f = mesura(l3b, t, 5.5); void f; });
    ok('G3: t mínima 0,7 > 0,5 no val', !Exe.condicioG3(l3b.entrades(), 5.5));
    const l3c = nou();
    [0.5, 1, 2].forEach(t => mesura(l3c, t, 5.5));
    ok('G3: t creixent (0,5, 1, 2) no és «cada cop més petit»', !Exe.condicioG3(l3c.entrades(), 5.5));
    const l3d = nou();
    [2, 1, 0.5].forEach(t => mesura(l3d, t, 6));
    ok('G3: altra a (6) no val', !Exe.condicioG3(l3d.entrades(), 5.5));
    const l3e = nou();
    [2, 0.5, 1, 0.2].forEach(t => mesura(l3e, t, 5.5));
    ok('G3: subseqüència decreixent 2, 1, 0,2 dins un ordre barrejat', Exe.condicioG3(l3e.entrades(), 5.5));
    const l3f = nou();
    [2, 1, 0.5, 0.2, 0.1].forEach(t => mesura(l3f, t, 5.5));
    ok('G3: els 5 preajustos', Exe.condicioG3(l3f.entrades(), 5.5));
    ok('G3 i el límit: la TVM mínima s’acosta a f′(5,5) = 2,749 (±0,15) amb t = 0,1', Math.abs(l3f.entrades()[4].d / 0.1 - p.v(5.5)) <= 0.15);
}

finish('EXERCICIS');
