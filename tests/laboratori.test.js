/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: tests/laboratori.test.js
 * ROL: Tests de la màquina d'estats del laboratori (docs/SPEC.md §5.2–5.5) amb
 *      un rellotge fals: IDLE/RUNNING/STOPPED, S descarta una mesura, canviar a
 *      reinicia, l'aturada programada para a t exacta, l'aturada automàtica a X,
 *      Espai s'ignora a STOPPED, cap fila d'una mesura descartada, el registre
 *      i la comprovació de la TVM, i la traducció de tecles.
 * ÚS: node tests/laboratori.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish } = require('./harness');
const Perfil = require('../js/motor/perfil.js');
const Lab = require('../js/motor/laboratori.js');
const ESC = require('../data/escenaris.js');

const p = Perfil.crea(ESC[0].nusos); // r1
let ara = 0;
const rellotge = () => ara;
const nou = (o = {}) => {
    ara = 1000;
    return Lab.crea(Object.assign({ perfil: p, rellotge }, o));
};
const prop = (x, y, e = 1e-12) => Math.abs(x - y) <= e;

suite('1. Estat inicial (IDLE)');
{
    const lab = nou({ a: 5.5 });
    const v = lab.vista();
    eq('estat IDLE', v.estat, 'IDLE');
    ok('cronòmetre 0 i comptador 0', v.t === 0 && v.d === 0);
    ok('el carretó és a f(a): distància a l’observador', v.fx === p.f(5.5) && v.x === 5.5);
    eq('registre buit', lab.entrades().length, 0);
    eq('actualitza() en IDLE no fa res', lab.actualitza(), null);
}

suite('2. IDLE → RUNNING → STOPPED (manual, amb snap)');
{
    const lab = nou({ a: 5.5 });
    eq('Espai: engega', lab.espai().tipus, 'engega');
    eq('estat RUNNING', lab.vista().estat, 'RUNNING');
    ara += 1234;
    let v = lab.vista();
    ok('RUNNING: cronòmetre truncat a la dècima (1,2)', prop(v.t, 1.2));
    ok('RUNNING: el carretó és a a + 1,234', prop(v.x, 6.734));
    ok('RUNNING: comptador = f(x) − f(a)', prop(v.d, p.f(6.734) - p.f(5.5), 1e-12));
    ok('RUNNING: la distància a l’observador és f(x), diferent del comptador', prop(v.fx, p.f(6.734)) && Math.abs(v.fx - v.d) > 1);
    eq('actualitza() sense preset no atura abans d’hora', lab.actualitza(), null);
    const r = lab.espai();
    eq('Espai: atura', r.tipus, 'atura');
    v = lab.vista();
    eq('estat STOPPED', v.estat, 'STOPPED');
    ok('snap: t = 1,2', prop(v.t, 1.2));
    ok('comptador amb la t arrodonida: f(a+1,2) − f(a)', v.d === p.f(5.5 + 1.2) - p.f(5.5));
    ok('el carretó s’ha posat a la posició arrodonida', prop(v.x, 6.7));
    const fila = lab.entrades()[0];
    ok('fila creada amb a, t, d', fila.a === 5.5 && prop(fila.t, 1.2) && fila.d === v.d && fila.correcte === false && fila.text === '');
}
{
    const lab = nou({ a: 3 });
    lab.espai(); ara += 260; lab.espai();
    ok('0,26 s → t = 0,3', prop(lab.vista().t, 0.3));
    const lab2 = nou({ a: 3 });
    lab2.espai(); ara += 40; lab2.espai();
    ok('0,04 s → t = 0,1 (mínim: t mai pot ser 0)', prop(lab2.vista().t, 0.1));
    const lab3 = nou({ a: 3 });
    lab3.espai(); lab3.espai();
    ok('parar a l’instant: t = 0,1', prop(lab3.vista().t, 0.1));
}

suite('3. Espai a STOPPED s’ignora');
{
    const lab = nou({ a: 5.5 });
    lab.espai(); ara += 500; lab.espai();
    const abans = JSON.stringify(lab.vista());
    const n = lab.entrades().length;
    eq('Espai: ignorat', lab.espai().tipus, 'ignorat');
    eq('un altre cop', lab.espai().tipus, 'ignorat');
    ok('l’estat no canvia', JSON.stringify(lab.vista()) === abans);
    eq('cap fila nova', lab.entrades().length, n);
}

suite('4. S (Torna a a)');
{
    const lab = nou({ a: 5.5 });
    lab.espai(); ara += 700;
    eq('S mentre corre: torna', lab.torna().tipus, 'torna');
    let v = lab.vista();
    ok('IDLE, cronòmetre 0, comptador 0, carretó a f(a)', v.estat === 'IDLE' && v.t === 0 && v.d === 0 && v.fx === p.f(5.5));
    eq('la mesura descartada no crea cap fila', lab.entrades().length, 0);
    lab.espai(); ara += 700; lab.espai();
    eq('una mesura completa', lab.entrades().length, 1);
    lab.torna();
    v = lab.vista();
    ok('S a STOPPED: IDLE i zeros', v.estat === 'IDLE' && v.t === 0 && v.d === 0 && v.ultima === null);
    eq('el registre conserva les files', lab.entrades().length, 1);
    lab.espai(); ara += 300; lab.torna();
    eq('un altre cop descartada: encara 1 fila', lab.entrades().length, 1);
}

suite('5. Canvi d’a');
{
    const lab = nou({ a: 5.5 });
    lab.espai(); ara += 500; lab.espai();
    lab.canviaA(2);
    let v = lab.vista();
    ok('STOPPED + canvi d’a → IDLE a la nova posició', v.estat === 'IDLE' && v.a === 2 && v.fx === p.f(2) && v.t === 0 && v.d === 0);
    lab.espai(); ara += 500;
    lab.canviaA(3);
    ok('RUNNING + canvi d’a → IDLE, mesura descartada', lab.vista().estat === 'IDLE' && lab.entrades().length === 1);
    eq('graella de 0,1 s: 5,55 → 5,6', lab.canviaA(5.55).a, 5.6);
    eq('graella: 5,04 → 5', lab.canviaA(5.04).a, 5);
    eq('mínim 0', lab.canviaA(-4).a, 0);
    eq('màxim X − 0,1', lab.canviaA(99).a, 11.9);
    eq('opció a fora de rang al crear es talla', nou({ a: 50 }).vista().a, 11.9);
}

suite('6. Aturada programada: t exacta');
for (const preset of [2, 1, 0.5, 0.2, 0.1]) {
    const lab = nou({ a: 5.5, preset });
    lab.espai();
    ara += preset * 1000 - 1;
    eq(`t = ${preset}: un ms abans, encara corre`, lab.actualitza(), null);
    ara += 2;
    const r = lab.actualitza();
    eq(`t = ${preset}: s’atura sol`, r && r.tipus, 'programat');
    const v = lab.vista();
    ok(`t = ${preset}: t exactament ${preset} i comptador f(a+t) − f(a)`, v.t === preset && v.d === p.f(5.5 + preset) - p.f(5.5) && v.estat === 'STOPPED');
    eq(`t = ${preset}: una fila`, lab.entrades().length, 1);
}
{
    const lab = nou({ a: 5.5, preset: 2 });
    lab.espai(); ara += 5000;
    lab.actualitza();
    ok('un fotograma molt tardà atura igualment a t = 2 exacta', lab.vista().t === 2);
    const lab2 = nou({ a: 5.5, preset: 2 });
    lab2.posaPreset(0.5);
    lab2.espai(); ara += 600; lab2.actualitza();
    ok('posaPreset canvia el temps programat', lab2.vista().t === 0.5);
    const lab3 = nou({ a: 5.5, preset: 0.5 });
    lab3.espai(); ara += 300; lab3.espai();
    ok('amb temps programat, l’Espai també pot aturar abans (snap)', prop(lab3.vista().t, 0.3));
}

suite('7. Aturada automàtica al final de la pista');
{
    const lab = nou({ a: 11 });
    lab.espai(); ara += 999;
    eq('a l’últim ms encara corre', lab.actualitza(), null);
    ara += 2;
    const r = lab.actualitza();
    ok('s’atura sol amb final = true', r && r.final === true);
    const v = lab.vista();
    ok('t = X − a = 1,0 i arribat', prop(v.t, 1.0) && v.arribat === true && prop(v.x, 12));
    ok('comptador = f(X) − f(a)', v.d === p.f(12) - p.f(11));
    const lab0 = nou({ a: 0 });
    lab0.espai(); ara += 12500;
    const r0 = lab0.actualitza();
    ok('a = 0: la pista sencera, t = 12', r0.final && prop(lab0.vista().t, 12));
    const labP = nou({ a: 11.5, preset: 2 });
    labP.espai(); ara += 700;
    const rP = labP.actualitza();
    ok('preset 2 s a a = 11,5: s’atura al final amb t = 0,5', rP.tipus === 'final' && prop(labP.vista().t, 0.5));
    const labM = nou({ a: 11.9 });
    labM.espai(); ara += 5;
    const rM = labM.espai();
    ok('Espai a l’últim instant (a = 11,9): t = 0,1 i final', rM.final === true && prop(labM.vista().t, 0.1));
    const labR = nou({ a: 11 });
    labR.espai(); ara += 5000;
    eq('Espai molt després del final: final i t = 1', labR.espai().final, true);
}

suite('8. Registre i comprovació de la TVM (§5.5)');
{
    const lab = nou({ a: 5.5, preset: 0.5 });
    lab.espai(); ara += 600; lab.actualitza();
    const f1 = lab.entrades()[0];
    const tvmBona = (p.f(6) - p.f(5.5)) / 0.5;
    const mal = lab.comprovaTVM(f1.id, '1,24');
    ok('una distància sense dividir no és correcta', !mal.ok && mal.tipus === 'distancia' && f1.correcte === false);
    ok('la fila continua editable (text desat, no bloquejada)', f1.text === '1,24');
    eq('un text no numèric', lab.comprovaTVM(f1.id, 'a').tipus, 'noNumero');
    const b = lab.comprovaTVM(f1.id, String(tvmBona.toFixed(2)).replace('.', ','));
    ok('la TVM correcta (coma decimal) la dona per bona', b.ok && f1.correcte === true);
    const b2 = lab.comprovaTVM(f1.id, '99');
    ok('una fila correcta queda bloquejada', b2.ok && b2.tipus === 'bloquejat' && f1.correcte === true && f1.text !== '99');
    eq('un id que no existeix', lab.comprovaTVM(999, '1'), null);
    ok('l’aplicació no omple mai la TVM: text buit en crear', (() => {
        const l = nou({ a: 5.5 });
        l.espai(); ara += 400; l.espai();
        return l.entrades()[0].text === '';
    })());
    // el registre és cronològic, amb ids creixents
    const l2 = nou({ a: 5.5, preset: 0.5 });
    for (let i = 0; i < 3; i++) { l2.espai(); ara += 600; l2.actualitza(); l2.torna(); }
    ok('3 mesures: ids 1, 2, 3 en ordre', l2.entrades().map(r => r.id).join() === '1,2,3');
}

suite('9. Teclat (§5.2, §5.4)');
{
    const t = (k, maj, et) => Lab.accioTecla(k, maj, et);
    ok('Espai → espai, previnguda', t(' ', false, 'BODY').accio === 'espai' && t(' ', false, 'BODY').previnguda);
    ok('Espai en un <button>: s’intercepta (no es dispara dos cops)', t(' ', false, 'BUTTON').previnguda === true);
    ok('s i S → torna', t('s', false, 'DIV').accio === 'torna' && t('S', true, 'DIV').accio === 'torna');
    for (const et of ['INPUT', 'TEXTAREA', 'SELECT', 'input'])
        ok(`dins d’un ${et}: res no s’intercepta`, t(' ', false, et).accio === null && !t(' ', false, et).previnguda && t('s', false, et).accio === null && t('ArrowLeft', false, et).accio === null);
    eq('← → ±0,1 s', t('ArrowLeft', false, 'DIV').accio + ' ' + t('ArrowRight', false, 'DIV').accio, 'a-petit- a-petit+');
    eq('Maj + fletxes → ±0,5 s', t('ArrowLeft', true, 'DIV').accio + ' ' + t('ArrowRight', true, 'DIV').accio, 'a-gran- a-gran+');
    ok('una altra tecla no fa res', t('x', false, 'DIV').accio === null && !t('x', false, 'DIV').previnguda);
    eq('passos', Lab.PAS_A + ' ' + Lab.PAS_A_GRAN, '0.1 0.5');
}

finish('LABORATORI');
