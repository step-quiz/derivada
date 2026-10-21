/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/motor/terreny.js
 * ROL: Els trams de terreny en METRES (docs/SPEC.md §4.3): el tram de segons
 *      [de, a] es dibuixa a [f(de), f(a)]. La baixada es dibuixa com un pla
 *      inclinat d'un angle visual fix ≤ 8° (cos 8° ≈ 0,99: s'ignora la diferència
 *      entre distància pel camí i distància horitzontal; vegeu docs/STATE.md).
 * ARQUITECTURA: Pur, sense DOM. window.DERIVADA.terreny (i module.exports a Node).
 * DEPENDÈNCIES: cap (rep el perfil ja creat)
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else {
        arrel.DERIVADA = arrel.DERIVADA || {};
        arrel.DERIVADA.terreny = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var CONFIG = { angleBaixada: 8 }; // graus, angle visual de la baixada

    /** esc: escenari; perfil: DERIVADA.perfil.crea(esc.nusos). → [{ tipus, de, a, x0, x1, angle }] */
    function metres(esc, perfil) {
        return esc.terrenys.map(function (t) {
            return {
                tipus: t.tipus,
                de: t.de,
                a: t.a,
                x0: perfil.f(t.de),
                x1: perfil.f(t.a),
                angle: t.tipus === 'baixada' ? CONFIG.angleBaixada : 0,
            };
        });
    }

    return { metres: metres, CONFIG: CONFIG };
});
