/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/motor/exercicis.js
 * ROL: Tot el que és «què s'ha de fer»: la validació dels ancoratges (§4.4) i el
 *      seu escaneig, les etapes de la ruta guiada i les seves condicions
 *      (§6, G0–G4), la generació dels exercicis P1 i P2 amb llavor (§6.5) i
 *      la classificació de la resposta de P1.
 * ARQUITECTURA: Pur, sense DOM. window.DERIVADA.exercicis (i module.exports a Node).
 *      Mai Math.random: tot amb Atzar (FNV-1a → mulberry32).
 * DEPENDÈNCIES: perfil.js, tvm.js, atzar.js (window.Atzar)
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var node = typeof module === 'object' && module.exports;
    var api = fabrica(
        node
            ? function (n) {
                  return require('./' + n + '.js');
              }
            : function (n) {
                  return n === 'atzar' ? arrel.Atzar : arrel.DERIVADA[n];
              }
    );
    if (node) module.exports = api;
    else {
        arrel.DERIVADA = arrel.DERIVADA || {};
        arrel.DERIVADA.exercicis = api;
    }
})(typeof self !== 'undefined' ? self : this, function (dep) {
    'use strict';
    var Perfil = dep('perfil');
    var Tvm = dep('tvm');
    var Atzar = dep('atzar');

    var CONFIG = {
        errorMin2: 0.2, // |TVM − f′| a t = 2 com a mínim (§4.4)
        errorMax01: 0.1, // |TVM − f′| a t = 0,1 com a màxim
        p1MinSeparacio: 2, // s entre els punts de P1
        p1MinDiferencia: 0.4, // m/s entre el primer i el segon més ràpids
        p1Graella: [0.5, 11.5], // límits dels punts de P1 (s), graella de 0,5 s
        llavorPerDefecte: 'derivada',
    };
    var EPS = 1e-9;

    // ── Ancoratges (§4.4) ────────────────────────────────────────────────
    /** → { valid, constant, errors: [|TVM − f′| per cada preset] } */
    function ancoratge(p, a) {
        var vp = p.v(a);
        var vals = Tvm.PRESETS.map(function (t) {
            return Tvm.tvm(p, a, t);
        });
        var errors = vals.map(function (v) {
            return Math.abs(v - vp);
        });
        var constant = vals.every(function (v) {
            return Math.abs(v - vals[0]) < EPS;
        });
        var noCreix = errors.every(function (e, i) {
            return i === 0 || e <= errors[i - 1] + 1e-12;
        });
        var valid =
            constant || (noCreix && errors[0] >= CONFIG.errorMin2 - EPS && errors[errors.length - 1] <= CONFIG.errorMax01 + EPS);
        return { valid: valid, constant: constant, errors: errors };
    }

    /** Tots els ancoratges vàlids de la graella de 0,5 s amb 0 ≤ a ≤ X − 2. */
    function escaneja(p) {
        var out = [];
        for (var i = 0; i * 0.5 <= p.X - 2 + EPS; i++) {
            var r = ancoratge(p, i * 0.5);
            if (r.valid) out.push({ a: i * 0.5, constant: r.constant });
        }
        return out;
    }

    // ── Ruta guiada (§6) ─────────────────────────────────────────────────
    // aLliure / presetLliure: l'alumne ho pot canviar; preset: valor inicial (null = manual).
    var ETAPES = [
        { id: 'g0', escenari: 'r1', a: 0, aLliure: false, preset: null, presetLliure: false },
        { id: 'g1', escenari: 'r1', a: 0, aLliure: false, preset: null, presetLliure: true },
        { id: 'g2', escenari: 'r1', a: 1, aLliure: true, preset: 2, presetLliure: false },
        { id: 'g3', escenari: 'r1', a: 5.5, aLliure: false, preset: 2, presetLliure: true },
        { id: 'g4', escenari: 'r1', a: 5.5, aLliure: false, preset: null, presetLliure: false },
    ];

    var correctes = function (registre) {
        return registre.filter(function (r) {
            return r.correcte;
        });
    };

    /** G1: una fila correcta. */
    function condicioG1(registre) {
        return correctes(registre).length >= 1;
    }
    /** G2: files correctes amb t = 2 i TVM > 2,5, i amb t = 2 i TVM < 1,5. */
    function condicioG2(registre) {
        var c = correctes(registre).filter(function (r) {
            return Math.abs(r.t - 2) < EPS;
        });
        var alta = c.some(function (r) {
            return r.d / r.t > 2.5;
        });
        var baixa = c.some(function (r) {
            return r.d / r.t < 1.5;
        });
        return alta && baixa;
    }
    /**
     * G3: ≥ 3 files correctes amb la mateixa a (aG3), en ordre cronològic, amb t
     * estrictament decreixent (una subseqüència), i t mínima ≤ 0,5.
     */
    function condicioG3(registre, aG3) {
        var c = correctes(registre).filter(function (r) {
            return Math.abs(r.a - aG3) < EPS;
        });
        var llarg = [];
        for (var i = 0; i < c.length; i++) {
            llarg[i] = 1;
            for (var j = 0; j < i; j++) if (c[j].t > c[i].t + EPS) llarg[i] = Math.max(llarg[i], llarg[j] + 1);
            if (llarg[i] >= 3 && c[i].t <= 0.5 + EPS) return true;
        }
        return false;
    }

    // ── P1 «Qui va més de pressa?» (§6.5) ────────────────────────────────
    function graellaP1() {
        var g = [];
        for (var i = CONFIG.p1Graella[0] * 2; i <= CONFIG.p1Graella[1] * 2; i++) g.push(i / 2);
        return g;
    }

    /** Un trio (de menor a major) compleix les regles de generació? → { rapid, mesLluny } o null. */
    function trioValid(p, trio) {
        if (trio[1] - trio[0] < CONFIG.p1MinSeparacio - EPS || trio[2] - trio[1] < CONFIG.p1MinSeparacio - EPS) return null;
        var vs = trio.map(p.v);
        var fs = trio.map(p.f);
        var ordV = [0, 1, 2].sort(function (i, j) {
            return vs[j] - vs[i];
        });
        if (vs[ordV[0]] - vs[ordV[1]] < CONFIG.p1MinDiferencia - EPS) return null;
        var ordF = [0, 1, 2].sort(function (i, j) {
            return fs[j] - fs[i];
        });
        if (fs[ordF[0]] - fs[ordF[1]] < EPS) return null; // empat de f: no val
        if (ordV[0] === ordF[0]) return null; // el més lluny no pot ser el més ràpid (M1)
        return { rapid: ordV[0], mesLluny: ordF[0] };
    }

    function generaP1(esc, p, rng) {
        var g = graellaP1();
        var n = g.length;
        for (var intent = 0; intent < 400; intent++) {
            var trio = [g[rng.enter(0, n - 1)], g[rng.enter(0, n - 1)], g[rng.enter(0, n - 1)]].sort(function (x, y) {
                return x - y;
            });
            var r = trio[0] === trio[1] || trio[1] === trio[2] ? null : trioValid(p, trio);
            if (r) return { tipus: 'P1', escenari: esc.id, punts: trio, rapid: r.rapid, mesLluny: r.mesLluny };
        }
        // Resguard determinista: el primer trio vàlid en ordre
        for (var i = 0; i < n; i++)
            for (var j = i + 1; j < n; j++)
                for (var k = j + 1; k < n; k++) {
                    var t3 = [g[i], g[j], g[k]];
                    var rr = trioValid(p, t3);
                    if (rr) return { tipus: 'P1', escenari: esc.id, punts: t3, rapid: rr.rapid, mesLluny: rr.mesLluny };
                }
        return null;
    }

    /** → 'correcte' | 'mesLluny' (M1) | 'altre' */
    function classificaP1(item, tria) {
        if (tria === item.rapid) return 'correcte';
        if (tria === item.mesLluny) return 'mesLluny';
        return 'altre';
    }

    // ── P2 «Estima f′(a)» ────────────────────────────────────────────────
    function generaP2(esc, rng) {
        var cand = esc.ancoratges.filter(function (an) {
            return !an.constant && an.tipus !== 'guiat';
        });
        if (!cand.length)
            cand = esc.ancoratges.filter(function (an) {
                return !an.constant;
            });
        return { tipus: 'P2', escenari: esc.id, a: rng.tria(cand).a };
    }

    /** Llavor de l'adreça: només lletres, xifres, guions i barra baixa (≤ 32); la resta s'ignora. */
    function llavorValida(text) {
        return typeof text === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(text) ? text : CONFIG.llavorPerDefecte;
    }

    /**
     * Els exercicis (un P2 per escenari i un P1 per escenari QUAN n'hi ha cap de vàlid), barrejats amb la llavor.
     * A r2 la velocitat no decreix mai: el punt més ràpid és sempre el més lluny, així que cap trio no compleix la
     * regla de M1 i no s'hi genera P1 (9 exercicis; vegeu docs/STATE.md).
     */
    function generaTot(escenaris, llavor) {
        var ll = llavorValida(llavor);
        var items = [];
        escenaris.forEach(function (esc) {
            var p = Perfil.crea(esc.nusos);
            var p1 = generaP1(esc, p, Atzar.crea(ll + ':' + esc.id + ':P1'));
            if (p1) items.push(p1);
            items.push(generaP2(esc, Atzar.crea(ll + ':' + esc.id + ':P2')));
        });
        return Atzar.crea(ll + ':ordre').barreja(items);
    }

    return {
        CONFIG: CONFIG,
        ancoratge: ancoratge,
        escaneja: escaneja,
        ETAPES: ETAPES,
        condicioG1: condicioG1,
        condicioG2: condicioG2,
        condicioG3: condicioG3,
        trioValid: trioValid,
        generaP1: generaP1,
        classificaP1: classificaP1,
        generaP2: generaP2,
        llavorValida: llavorValida,
        generaTot: generaTot,
    };
});
