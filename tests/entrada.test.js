/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: tests/entrada.test.js
 * ROL: Tests de js/motor/entrada.js: cada cas de classificació de la TVM (§5.5)
 *      i de l'estimació del límit (§6.3) amb valors fabricats; coma i punt
 *      decimals; vores de les toleràncies; format amb coma.
 * ÚS: node tests/entrada.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish } = require('./harness');
const E = require('../js/motor/entrada.js');

suite('1. Lectura de nombres (coma i punt)');
eq('2,4', E.llegeix('2,4'), 2.4);
eq('2.4', E.llegeix('2.4'), 2.4);
eq('espais al voltant', E.llegeix('  3,25 '), 3.25);
eq('enter', E.llegeix('7'), 7);
eq('.5', E.llegeix('.5'), 0.5);
eq(',5', E.llegeix(',5'), 0.5);
eq('negatiu', E.llegeix('-1,5'), -1.5);
eq('buit → null', E.llegeix(''), null);
eq('text → null', E.llegeix('dos'), null);
eq('dues comes → null', E.llegeix('1,2,3'), null);
eq('amb unitats → null', E.llegeix('2,4 m/s'), null);
eq('no és cadena → null', E.llegeix(undefined), null);

suite('2. Format amb coma decimal');
eq('3 decimals', E.format(0.243, 3), '0,243');
eq('1 decimal', E.format(2.3, 1), '2,3');
eq('zero', E.format(0, 3), '0,000');
eq('mai −0', E.format(-0.0001, 3), '0,000');
eq('2 decimals', E.format(2.749, 2), '2,75');

suite('3. TVM escrita (§5.5): a = 5,5, t = 0,5 → d = 1,240 m, f(a+t) = 16,863');
{
    const fila = { a: 5.5, t: 0.5, d: 1.24, fat: 16.863 }; // TVM correcta = 2,48
    const c = text => E.classificaTVM(Object.assign({ text }, fila));
    ok('2,48 és correcte', c('2,48').ok && c('2,48').tipus === 'correcte');
    ok('2,5 és correcte (dins 0,05)', c('2,5').ok);
    ok('2,53 és correcte (vora: |2,53 − 2,48| = 0,05)', c('2,53').ok);
    ok('2,54 ja no (vora)', !c('2,54').ok);
    ok('2,43 és correcte (vora inferior)', c('2,43').ok);
    ok('2,42 ja no', !c('2,42').ok);
    ok('coma i punt: 2.48', c('2.48').ok);
    eq('1. la distància sense dividir (1,24)', c('1,24').tipus, 'distancia');
    eq('1. dins la tolerància de la distància (1,26)', c('1,26').tipus, 'distancia');
    eq('2. temps ÷ distància = 0,5/1,24 = 0,403', c('0,403').tipus, 'invertit');
    eq('2. marge relatiu del 2 % (0,41)', c('0,41').tipus, 'invertit');
    eq('2. fora del marge (0,43)', c('0,43').tipus, 'altre');
    eq('3. f(a+t)/t = 33,726', c('33,726').tipus, 'observador');
    eq('3. f(a+t)/(a+t) = 16,863/6 = 2,8105', c('2,81').tipus, 'observador');
    eq('4. d·t = 0,62', c('0,62').tipus, 'multiplicat');
    eq('5. qualsevol altra cosa', c('9,9').tipus, 'altre');
    eq('no és un nombre', c('molt').tipus, 'noNumero');
    eq('buit', c('').tipus, 'noNumero');
}

suite('4. Prioritat de les regles i casos límit de la TVM');
{
    // t = 1: d·t = d = d/t → correcte (la primera regla guanya)
    ok('t = 1: la distància és la TVM correcta', E.classificaTVM({ text: '2,175', a: 5.5, t: 1, d: 2.175, fat: 17.8 }).ok);
    // a = 0: f(a+t) = d → «observador» coincideix amb la correcta; la correcta guanya
    ok('a = 0: f(a+t)/t = d/t és correcte', E.classificaTVM({ text: '3', a: 0, t: 2, d: 6, fat: 6 }).ok);
    // d = 0 (cotxe parat): no hi ha divisió per zero
    const z = E.classificaTVM({ text: '5', a: 7.5, t: 0.1, d: 0, fat: 13.503 });
    ok('d = 0: no peta i dona un error', !z.ok && typeof z.tipus === 'string');
    ok('d = 0, resposta 0 és correcta', E.classificaTVM({ text: '0', a: 7.5, t: 0.1, d: 0, fat: 13.503 }).ok);
    ok('«distància» només si no és ja correcta (t petita)', E.classificaTVM({ text: '0,24', a: 5.5, t: 0.1, d: 0.27, fat: 15.9 }).tipus === 'distancia');
    eq('tolTVM = 0,05', E.CONFIG.tolTVM, 0.05);
    eq('tolLimit = 0,15', E.CONFIG.tolLimit, 0.15);
}

suite('5. Estimació del límit (§6.3): r1 a = 5,5, f′(a) = 2,749');
{
    const messes = [
        { t: 2, tvm: 1.708 },
        { t: 1, tvm: 2.175 },
        { t: 0.5, tvm: 2.481 },
        { t: 0.2, tvm: 2.651 },
        { t: 0.1, tvm: 2.702 },
    ];
    const c = (text, extra) => E.classificaLimit(Object.assign({ text, derivada: 2.749, messes }, extra));
    ok('2,75 és correcte', c('2,75').ok && c('2,75').tipus === 'correcte');
    ok('2,7 és correcte', c('2,7').ok);
    ok('vora: 2,9 (|2,9 − 2,749| = 0,151) falla', !c('2,9').ok);
    ok('vora: 2,89 (0,141) val', c('2,89').ok);
    ok('2.75 amb punt', c('2.75').ok);
    eq('M3: 0 → «la distància es fa petita…»', c('0').tipus, 'M3');
    eq('M3: 0,1 també (≈ 0)', c('0,1').tipus, 'M3');
    eq('M5: 1,7 (la TVM de t = 2)', c('1,7').tipus, 'M5');
    eq('M5: 1,8 (dins 0,15 de 1,708)', c('1,8').tipus, 'M5');
    eq('altre: 4', c('4').tipus, 'altre');
    eq('altre: 2,0 (entre les mesures, lluny de totes)', c('2').tipus, 'altre');
    eq('no és un nombre', c('?').tipus, 'noNumero');
    // M3 no s'activa si f′(a) ≤ 0,3 (cas «parat» de r4: 0 és la resposta correcta)
    const parat = E.classificaLimit({ text: '0', derivada: 0, messes: [{ t: 2, tvm: 0.544 }] });
    ok('f′(a) = 0: la resposta 0 és correcta', parat.ok);
    const poc = E.classificaLimit({ text: '0', derivada: 0.4, messes: [{ t: 2, tvm: 1.0 }] });
    ok('f′(a) = 0,4 (> 0,3): 0 és M3', poc.tipus === 'M3');
    const baix = E.classificaLimit({ text: '0,6', derivada: 0.3, messes: [{ t: 2, tvm: 0.9 }] });
    ok('f′(a) = 0,3 (no > 0,3): cap M3 per a 0,6', baix.tipus !== 'M3');
    // M5 usa la t més gran del registre, no la primera
    const m5 = E.classificaLimit({ text: '1,0', derivada: 2.0, messes: [{ t: 0.5, tvm: 1.0 }, { t: 2, tvm: 3.5 }, { t: 0.1, tvm: 1.9 }] });
    ok('M5 mira la TVM de la t més gran (3,5), no la de 0,5', m5.tipus === 'altre');
    const m5b = E.classificaLimit({ text: '3,5', derivada: 2.0, messes: [{ t: 0.5, tvm: 1.0 }, { t: 2, tvm: 3.5 }] });
    ok('i la reconeix quan hi coincideix', m5b.tipus === 'M5');
    ok('sense mesures: cap M5', E.classificaLimit({ text: '1,7', derivada: 2.749, messes: [] }).tipus === 'altre');
}

finish('ENTRADA');
