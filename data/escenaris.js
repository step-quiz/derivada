/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: data/escenaris.js
 * ROL: Els 5 escenaris de referència (docs/SPEC.md §4.1). NOMÉS s'hi escriu el
 *      perfil de VELOCITAT (nusos [x (s), v (m/s)]), els trams de terreny (en
 *      segons) i els instants d'ancoratge. Les posicions, els metres de cada
 *      terreny i les històries es DERIVEN (js/motor/perfil.js, terreny.js).
 * ARQUITECTURA: Dades. Global window.DERIVADA_ESCENARIS; també es carrega amb
 *      Node (tests). Tipus de terreny: llis, gel, sorra, pedres, baixada.
 *      ancoratges: { a, tipus: 'guiat' | 'aturat', constant: true }.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else arrel.DERIVADA_ESCENARIS = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';
    return [
        {
            id: 'r1',
            nom: 'Baixada, gel i sorra',
            X: 12,
            nusos: [[0, 2.0], [2, 3.0], [5, 3.0], [7, 1.2], [9, 0.8], [12, 0.6]],
            terrenys: [
                { de: 0, a: 2, tipus: 'baixada' },
                { de: 2, a: 5, tipus: 'gel' },
                { de: 5, a: 12, tipus: 'sorra' },
            ],
            ancoratges: [{ a: 5.5, tipus: 'guiat' }, { a: 6.5 }, { a: 2.5, constant: true }],
        },
        {
            id: 'r2',
            nom: 'Pla, baixada, pla',
            X: 12,
            nusos: [[0, 1.0], [4, 1.0], [9, 5.0], [12, 5.0]],
            terrenys: [
                { de: 0, a: 4, tipus: 'llis' },
                { de: 4, a: 9, tipus: 'baixada' },
                { de: 9, a: 12, tipus: 'llis' },
            ],
            ancoratges: [{ a: 5.0 }, { a: 6.0 }, { a: 1.0, constant: true }],
        },
        {
            id: 'r3',
            nom: 'Pedres',
            X: 12,
            nusos: [[0, 1.5], [2, 0.4], [4, 1.6], [6, 0.3], [8, 1.5], [10, 0.5], [12, 1.2]],
            terrenys: [{ de: 0, a: 12, tipus: 'pedres' }],
            ancoratges: [{ a: 2.0 }, { a: 5.0 }],
        },
        {
            id: 'r4',
            nom: 'Gel, sorra i baixada',
            X: 12,
            nusos: [[0, 3.0], [3, 3.0], [5, 0.8], [6.5, 0.0], [8, 0.0], [10, 2.5], [12, 4.0]],
            terrenys: [
                { de: 0, a: 3, tipus: 'gel' },
                { de: 3, a: 8, tipus: 'sorra' },
                { de: 8, a: 12, tipus: 'baixada' },
            ],
            ancoratges: [{ a: 4.0 }, { a: 7.5, tipus: 'aturat' }],
        },
        {
            id: 'r5',
            nom: 'Terreny variat',
            X: 12,
            nusos: [[0, 2.0], [2, 2.0], [4, 0.9], [5, 1.4], [6, 0.6], [7, 1.0], [8, 3.5], [10, 3.5], [12, 5.5]],
            terrenys: [
                { de: 0, a: 2, tipus: 'llis' },
                { de: 2, a: 7, tipus: 'pedres' },
                { de: 7, a: 8, tipus: 'baixada' },
                { de: 8, a: 10, tipus: 'gel' },
                { de: 10, a: 12, tipus: 'baixada' },
            ],
            ancoratges: [{ a: 6.0 }, { a: 7.0 }],
        },
    ];
});
