/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/motor/perfil.js
 * ROL: El perfil exacte d'un escenari (docs/SPEC.md §4.2): la velocitat v(x) és
 *      un spline cúbic d'Hermite monòton (Fritsch–Carlson) i la distància f(x)
 *      en surt per primitiva EXACTA (forma tancada). Per tant f' = v exactament:
 *      l'aplicació no deriva mai numèricament. També hi és la validació de les
 *      dades d'un escenari (§4.4, sense els ancoratges: són a exercicis.js).
 * ARQUITECTURA: Pur, sense DOM. window.DERIVADA.perfil (i module.exports a Node).
 *      f i v tallen x a [0, X]. acceleracio(x) = v'(x) analítica (només per validar).
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else {
        arrel.DERIVADA = arrel.DERIVADA || {};
        arrel.DERIVADA.perfil = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var LIMITS = { X: 12, vMax: 6, acelMax: 4.0, fMax: 40, nusosMin: 3, graella: 0.01 };
    var TERRENYS = ['llis', 'gel', 'sorra', 'pedres', 'baixada'];

    /** nusos: [[x, v], …] amb x estrictament creixent. Retorna { X, f, v, acceleracio, fFinal, trams }. */
    function crea(nusos) {
        var n = nusos.length - 1;
        var x = [], v = [], D = [], q = [], mu = [], i, k;
        for (i = 0; i <= n; i++) {
            x.push(nusos[i][0]);
            v.push(nusos[i][1]);
        }
        for (i = 0; i < n; i++) {
            D.push(x[i + 1] - x[i]);
            q.push((v[i + 1] - v[i]) / D[i]);
        }
        mu[0] = q[0];
        mu[n] = q[n - 1];
        for (k = 1; k < n; k++) {
            if (q[k - 1] * q[k] <= 0) mu[k] = 0;
            else {
                var w1 = 2 * D[k] + D[k - 1];
                var w2 = D[k] + 2 * D[k - 1];
                mu[k] = (w1 + w2) / (w1 / q[k - 1] + w2 / q[k]);
            }
        }
        var trams = [];
        var F = 0;
        for (i = 0; i < n; i++) {
            var c = (3 * q[i] - 2 * mu[i] - mu[i + 1]) / D[i];
            var e = (mu[i] + mu[i + 1] - 2 * q[i]) / (D[i] * D[i]);
            trams.push({ x0: x[i], x1: x[i + 1], v0: v[i], mu: mu[i], c: c, e: e, F: F });
            F += v[i] * D[i] + (mu[i] * D[i] * D[i]) / 2 + (c * D[i] * D[i] * D[i]) / 3 + (e * D[i] * D[i] * D[i] * D[i]) / 4;
        }
        var X = x[n];

        // Un nus pertany al tram que COMENÇA en ell (s = 0 dona v i f exactes); x = X, a l'últim.
        function tram(xx) {
            for (var j = 0; j < n; j++) if (xx < trams[j].x1) return trams[j];
            return trams[n - 1];
        }
        function talla(xx) {
            return xx < 0 ? 0 : xx > X ? X : xx;
        }
        function vel(xx) {
            xx = talla(xx);
            var p = tram(xx);
            var s = xx - p.x0;
            return p.v0 + s * (p.mu + s * (p.c + s * p.e));
        }
        function pos(xx) {
            xx = talla(xx);
            var p = tram(xx);
            var s = xx - p.x0;
            return p.F + s * (p.v0 + s * (p.mu / 2 + s * (p.c / 3 + (s * p.e) / 4)));
        }
        function acel(xx) {
            xx = talla(xx);
            var p = tram(xx);
            var s = xx - p.x0;
            return p.mu + s * (2 * p.c + 3 * p.e * s);
        }
        return { X: X, f: pos, v: vel, acceleracio: acel, fFinal: pos(X), trams: trams };
    }

    /** Errors de les dades d'un escenari (§4.4, sense ancoratges). Llista buida = correcte. */
    function valida(esc) {
        var err = [];
        var nu = esc.nusos || [];
        var i;
        if (nu.length < LIMITS.nusosMin) err.push('menys de 3 nusos');
        if (!nu.length) return err.concat('sense nusos');
        if (nu[0][0] !== 0) err.push('x_0 ≠ 0');
        if (nu[nu.length - 1][0] !== LIMITS.X) err.push('x_n ≠ ' + LIMITS.X);
        if (esc.X !== LIMITS.X) err.push('X ≠ ' + LIMITS.X);
        for (i = 1; i < nu.length; i++) if (!(nu[i][0] > nu[i - 1][0])) err.push('x no estrictament creixent al nus ' + i);
        for (i = 0; i < nu.length; i++) if (!(nu[i][1] >= 0 && nu[i][1] <= LIMITS.vMax)) err.push('v fora de [0, 6] al nus ' + i);
        var tr = esc.terrenys || [];
        if (!tr.length) err.push('sense terrenys');
        else {
            if (tr[0].de !== 0) err.push('el terreny no comença a 0');
            if (tr[tr.length - 1].a !== esc.X) err.push('el terreny no acaba a X');
            for (i = 0; i < tr.length; i++) {
                if (!(tr[i].a > tr[i].de)) err.push('terreny buit o invertit ' + i);
                if (i > 0 && tr[i].de !== tr[i - 1].a) err.push('forat o solapament entre terrenys ' + (i - 1) + '/' + i);
                if (TERRENYS.indexOf(tr[i].tipus) < 0) err.push('tipus de terreny desconegut: ' + tr[i].tipus);
            }
        }
        if (err.length) return err;
        var p = crea(nu);
        var maxA = 0;
        for (var s = 0; s <= esc.X * 100 + 0.5; s++) {
            var a = Math.abs(p.acceleracio(s * LIMITS.graella));
            if (a > maxA) maxA = a;
            if (p.v(s * LIMITS.graella) < -1e-12) err.push('v < 0 a x = ' + s * LIMITS.graella);
        }
        if (maxA > LIMITS.acelMax) err.push('max |v′| = ' + maxA.toFixed(3) + ' > ' + LIMITS.acelMax);
        if (p.fFinal > LIMITS.fMax) err.push('f(X) = ' + p.fFinal.toFixed(3) + ' > ' + LIMITS.fMax);
        return err;
    }

    return { crea: crea, valida: valida, LIMITS: LIMITS, TERRENYS: TERRENYS };
});
