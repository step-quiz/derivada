/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/motor/entrada.js
 * ROL: Llegeix i classifica el que l'alumne escriu: la TVM d'una fila del
 *      registre (docs/SPEC.md §5.5) i l'estimació del límit (§6.3). Accepta
 *      coma i punt decimals. Torna un TIPUS d'error (clau); els textos són a
 *      js/ui/textos.js. També dona format amb coma decimal.
 * ARQUITECTURA: Pur, sense DOM. window.DERIVADA.entrada (i module.exports a Node).
 *      Cap penalització ni comptador d'intents.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else {
        arrel.DERIVADA = arrel.DERIVADA || {};
        arrel.DERIVADA.entrada = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var CONFIG = {
        tolTVM: 0.05, // m/s, tolerància de la TVM escrita (§5.5)
        tolLimit: 0.15, // m/s, tolerància de l'estimació de f′(a) (§6.3)
        tolRelInvers: 0.02, // marge relatiu del cas «has dividit al revés»
    };
    var EPS = 1e-9; // contra errors de coma flotant a les vores de les toleràncies

    /** «2,4» o «2.4» → 2.4; qualsevol altra cosa → null. */
    function llegeix(text) {
        if (typeof text !== 'string') return null;
        var s = text.trim();
        if (!/^[-+]?(\d+([.,]\d*)?|[.,]\d+)$/.test(s)) return null;
        var n = parseFloat(s.replace(',', '.'));
        return isFinite(n) ? n : null;
    }

    /** Nombre amb coma decimal i `dec` decimals; mai «-0». */
    function format(x, dec) {
        var s = Number(x).toFixed(dec);
        if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
        return s.replace('.', ',');
    }

    function dins(a, b, tol) {
        return Math.abs(a - b) <= tol + EPS;
    }

    /**
     * Classifica la TVM escrita en una fila. p = { text, a, t, d, fat }:
     *   d = distància recorreguda des d'a (comptador), fat = f(a + t) (distància a l'observador).
     * → { ok, tipus }: correcte · noNumero · distancia · invertit · observador · multiplicat · altre
     */
    function classificaTVM(p) {
        var v = llegeix(p.text);
        if (v === null) return { ok: false, tipus: 'noNumero' };
        var tol = CONFIG.tolTVM;
        if (dins(v, p.d / p.t, tol)) return { ok: true, tipus: 'correcte' };
        if (dins(v, p.d, tol)) return { ok: false, tipus: 'distancia' };
        if (p.d > 0) {
            var inv = p.t / p.d;
            if (Math.abs(v - inv) <= CONFIG.tolRelInvers * inv + EPS) return { ok: false, tipus: 'invertit' };
        }
        if (dins(v, p.fat / p.t, tol) || dins(v, p.fat / (p.a + p.t), tol)) return { ok: false, tipus: 'observador' };
        if (dins(v, p.d * p.t, tol)) return { ok: false, tipus: 'multiplicat' };
        return { ok: false, tipus: 'altre' };
    }

    /**
     * Classifica l'estimació de f′(a). p = { text, derivada, messes }:
     *   derivada = f′(a) exacta; messes = [{ t, tvm }] de les mesures amb aquesta a (tvm = d/t).
     * → { ok, tipus }: correcte · noNumero · M3 · M5 · altre
     */
    function classificaLimit(p) {
        var v = llegeix(p.text);
        if (v === null) return { ok: false, tipus: 'noNumero' };
        var tol = CONFIG.tolLimit;
        if (dins(v, p.derivada, tol)) return { ok: true, tipus: 'correcte' };
        if (dins(v, 0, tol) && p.derivada > 0.3) return { ok: false, tipus: 'M3' };
        var gran = null;
        (p.messes || []).forEach(function (m) {
            if (gran === null || m.t > gran.t) gran = m;
        });
        if (gran && dins(v, gran.tvm, tol)) return { ok: false, tipus: 'M5' };
        return { ok: false, tipus: 'altre' };
    }

    return { CONFIG: CONFIG, llegeix: llegeix, format: format, classificaTVM: classificaTVM, classificaLimit: classificaLimit };
});
