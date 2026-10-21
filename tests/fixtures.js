/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: tests/fixtures.js
 * ROL: Els valors de referència de docs/SPEC.md §4.5, copiats com a NOMBRES
 *      (calculats a part amb Python + Simpson). Els tests els comparen amb el
 *      codi: no es calculen mai amb el codi que es prova.
 *      Nota: l'especificació diu f(8) de r1 = 19.54 (dos decimals); el valor a
 *      tres decimals és 19.537 (vegeu docs/SESSION-REPORT.md, desviacions).
 * ============================================================================
 */
'use strict';
module.exports = {
    // [f(2), f(5), f(8), f(12)], vMin, vMax
    f: {
        r1: { f: [5.167, 14.167, 19.537, 22.474], vMin: 0.6, vMax: 3.0 },
        r2: { f: [2.0, 5.144, 14.144, 34.0], vMin: 1.0, vMax: 5.0 },
        r3: { f: [1.717, 5.073, 7.417, 11.0], vMin: 0.3, vMax: 1.6 },
        r4: { f: [6.0, 13.036, 13.503, 22.253], vMin: 0.0, vMax: 4.0 },
        r5: { f: [4.0, 8.05, 12.1, 27.767], vMin: 0.6, vMax: 5.5 },
    },
    // TVM per a t = 2, 1, 0.5, 0.2, 0.1 i f'(a)
    ancoratges: [
        { id: 'r1', a: 5.5, fa: 15.623, tvm: [1.708, 2.175, 2.481, 2.651, 2.702], d: 2.749 },
        { id: 'r1', a: 6.5, fa: 17.798, tvm: [1.094, 1.24, 1.356, 1.473, 1.521], d: 1.573 },
        { id: 'r2', a: 5.0, fa: 5.144, tvm: [2.44, 1.88, 1.63, 1.497, 1.455], d: 1.416 },
        { id: 'r2', a: 6.0, fa: 7.024, tvm: [3.56, 3.0, 2.702, 2.524, 2.466], d: 2.408 },
        { id: 'r3', a: 2.0, fa: 1.717, tvm: [1.0, 0.625, 0.466, 0.411, 0.403], d: 0.4 },
        { id: 'r3', a: 5.0, fa: 5.073, tvm: [0.534, 0.544, 0.716, 0.853, 0.901], d: 0.95 },
        { id: 'r4', a: 4.0, fa: 11.661, tvm: [0.91, 1.374, 1.705, 1.928, 2.003], d: 2.077 },
        { id: 'r4', a: 7.5, fa: 13.503, tvm: [0.544, 0.052, 0.0, 0.0, 0.0], d: 0.0 },
        { id: 'r5', a: 6.0, fa: 9.05, tvm: [1.525, 0.743, 0.639, 0.607, 0.602], d: 0.6 },
        { id: 'r5', a: 7.0, fa: 9.793, tvm: [2.904, 2.307, 1.548, 1.142, 1.054], d: 1.0 },
    ],
    PRESETS: [2, 1, 0.5, 0.2, 0.1],
    TOL: 0.001,
};
