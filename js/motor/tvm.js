/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/motor/tvm.js
 * ROL: La taxa de variació mitjana TVM[a, a+t] = (f(a+t) − f(a)) / t, les dades
 *      d'una secant (amb el triangle de pendent: alçada = distància, base = t),
 *      de la tangent, el «snap» del cronòmetre a la dècima i les seqüències de
 *      valors de t (preajustos i reproducció final).
 * ARQUITECTURA: Pur, sense DOM. window.DERIVADA.tvm (i module.exports a Node).
 *      Rep un perfil (DERIVADA.perfil.crea). La tangent usa v(a) EXACTA.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else {
        arrel.DERIVADA = arrel.DERIVADA || {};
        arrel.DERIVADA.tvm = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var PRESETS = [2, 1, 0.5, 0.2, 0.1]; // «Temps programat» (§5.3), de gran a petit
    var REPRODUCCIO = [2, 1, 0.5, 0.2, 0.1, 0.05, 0.01]; // els 7 fotogrames de la bellesa (§6.3)
    var T_MIN = 0.1;

    /** Arrodoneix a la dècima (amb un epsilon contra 0,15 → 1,4999…). */
    function decima(x) {
        return Math.round(x * 10 + 1e-9) / 10;
    }

    /** t que mostra el cronòmetre en aturar-lo a mà: dècima més propera, mínim 0,1, i mai més enllà del final de la pista. */
    function snapT(elapsed, a, X) {
        var t = Math.max(T_MIN, decima(elapsed));
        var tMax = decima(X - a);
        if (t > tMax) t = tMax;
        return t;
    }

    function tvm(p, a, t) {
        return (p.f(a + t) - p.f(a)) / t;
    }

    /** Mesura completa de l'interval [a, a+t]: el comptador de distància recorreguda és d = f(a+t) − f(a). */
    function mesura(p, a, t) {
        var fa = p.f(a);
        var fat = p.f(a + t);
        return { a: a, t: t, fa: fa, fat: fat, d: fat - fa, tvm: (fat - fa) / t };
    }

    /** Secant [a, a+t]: dos punts de la gràfica i el triangle de pendent (alçada d, base t). */
    function secant(p, a, t) {
        var m = mesura(p, a, t);
        return {
            x0: a,
            y0: m.fa,
            x1: a + t,
            y1: m.fat,
            pendent: m.tvm,
            triangle: { alcada: m.d, base: t },
        };
    }

    /** Tangent en a: pendent v(a) exacta. */
    function tangent(p, a) {
        return { x0: a, y0: p.f(a), pendent: p.v(a) };
    }

    /** Valors de t de la reproducció que caben a la pista (a + t ≤ X). */
    function reproduccio(a, X) {
        return REPRODUCCIO.filter(function (t) {
            return a + t <= X + 1e-9;
        });
    }

    return {
        PRESETS: PRESETS,
        REPRODUCCIO: REPRODUCCIO,
        T_MIN: T_MIN,
        decima: decima,
        snapT: snapT,
        tvm: tvm,
        mesura: mesura,
        secant: secant,
        tangent: tangent,
        reproduccio: reproduccio,
    };
});
