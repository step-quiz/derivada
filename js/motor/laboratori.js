/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/motor/laboratori.js
 * ROL: La màquina d'estats del laboratori (docs/SPEC.md §5.2–5.5): IDLE → RUNNING
 *      → STOPPED, el «snap» a la dècima, l'aturada programada, l'aturada
 *      automàtica al final, el canvi d'a, el registre de mesures i la
 *      comprovació de la TVM escrita. També la traducció tecla → acció.
 * ARQUITECTURA: Pur, sense DOM. Rep un rellotge `() => ms` (la UI passa
 *      performance.now; els tests, un de fals). window.DERIVADA.laboratori (i
 *      module.exports a Node). El registre és cronològic (la UI l'inverteix).
 *      Cada fila guarda `tvmExacta` només per comprovar: la UI no la mostra mai.
 * DEPENDÈNCIES: tvm.js, entrada.js
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
                  return arrel.DERIVADA[n];
              }
    );
    if (node) module.exports = api;
    else {
        arrel.DERIVADA = arrel.DERIVADA || {};
        arrel.DERIVADA.laboratori = api;
    }
})(typeof self !== 'undefined' ? self : this, function (dep) {
    'use strict';
    var Tvm = dep('tvm');
    var Entrada = dep('entrada');

    var EPS = 1e-9;
    var PAS_A = 0.1; // graella d'a (s)
    var PAS_A_GRAN = 0.5; // Maj + fletxes

    var limita = function (x, lo, hi) {
        return x < lo ? lo : x > hi ? hi : x;
    };

    /**
     * Tecla → acció (§5.2, §5.4). etiqueta = nom de l'etiqueta de l'objectiu de l'esdeveniment.
     * Mai no s'intercepta res dins d'un camp de text.
     */
    function accioTecla(tecla, majuscula, etiqueta) {
        if (/^(input|textarea|select)$/i.test(etiqueta || '')) return { accio: null, previnguda: false };
        switch (tecla) {
            case ' ':
            case 'Spacebar':
                return { accio: 'espai', previnguda: true };
            case 's':
            case 'S':
                return { accio: 'torna', previnguda: true };
            case 'ArrowLeft':
                return { accio: majuscula ? 'a-gran-' : 'a-petit-', previnguda: true };
            case 'ArrowRight':
                return { accio: majuscula ? 'a-gran+' : 'a-petit+', previnguda: true };
        }
        return { accio: null, previnguda: false };
    }

    /**
     * opcions: { perfil, rellotge, a (0), preset (null = manual, o un nombre de segons) }
     */
    function crea(opcions) {
        var p = opcions.perfil;
        var rellotge = opcions.rellotge;
        var X = p.X;
        var estat = 'IDLE';
        var a = Tvm.decima(limita(opcions.a || 0, 0, X - PAS_A));
        var preset = opcions.preset === undefined ? null : opcions.preset;
        var t0 = 0;
        var tAturat = 0;
        var dAturat = 0;
        var arribat = false; // l'última aturada ha estat al final de la pista
        var ultima = null; // la fila de l'últim intent (null si s'ha tornat a a)
        var registre = [];
        var seguent = 1;

        function transcorregut() {
            return estat === 'RUNNING' ? Math.max(0, (rellotge() - t0) / 1000) : 0;
        }
        function reinicia() {
            estat = 'IDLE';
            tAturat = 0;
            dAturat = 0;
            arribat = false;
            ultima = null;
        }
        function atura(t, final, tipus) {
            estat = 'STOPPED';
            tAturat = t;
            arribat = final;
            var m = Tvm.mesura(p, a, t);
            dAturat = m.d;
            var fila = {
                id: seguent++,
                a: a,
                t: t,
                d: m.d,
                fat: m.fat,
                tvmExacta: m.tvm,
                text: '',
                correcte: false,
                tipusError: null,
            };
            registre.push(fila);
            ultima = fila;
            return { tipus: tipus, final: final, entrada: fila };
        }

        /** Espai o botó «Cronòmetre»: engega (IDLE), atura (RUNNING) o s'ignora (STOPPED). */
        function espai() {
            if (estat === 'IDLE') {
                t0 = rellotge();
                estat = 'RUNNING';
                return { tipus: 'engega' };
            }
            if (estat === 'RUNNING') {
                var el = transcorregut();
                if (a + el >= X - EPS) return atura(Tvm.decima(X - a), true, 'final');
                var tSnap = Tvm.snapT(el, a, X);
                var alFinal = a + tSnap >= X - EPS; // l'arrodoniment ha arribat al final de la pista
                return atura(tSnap, alFinal, alFinal ? 'final' : 'atura');
            }
            return { tipus: 'ignorat' };
        }

        /** Un fotograma: aturada programada o automàtica al final. → esdeveniment o null. */
        function actualitza() {
            if (estat !== 'RUNNING') return null;
            var el = transcorregut();
            var tFinal = X - a;
            var tParada = preset === null ? tFinal : Math.min(preset, tFinal);
            if (el + EPS >= tParada) {
                if (preset !== null && preset < tFinal - EPS) return atura(preset, false, 'programat');
                return atura(Tvm.decima(tFinal), true, 'final');
            }
            return null;
        }

        /** S o botó «Torna a a»: tornada a IDLE; si corria, la mesura es descarta (cap fila). */
        function torna() {
            reinicia();
            return { tipus: 'torna' };
        }

        /** Canvi d'a (graella de 0,1 s dins [0, X − 0,1]); torna a IDLE. */
        function canviaA(nou) {
            a = Tvm.decima(limita(nou, 0, X - PAS_A));
            reinicia();
            return { tipus: 'canviaA', a: a };
        }

        function posaPreset(valor) {
            preset = valor;
            reinicia();
            return { tipus: 'preset', preset: preset };
        }

        /** Instantània per dibuixar: instrument per instrument (§5.1). */
        function vista() {
            var el = transcorregut();
            var xActual, t, d;
            if (estat === 'RUNNING') {
                xActual = Math.min(X, a + el);
                t = Math.floor(el * 10 + EPS) / 10;
                d = p.f(xActual) - p.f(a);
            } else if (estat === 'STOPPED') {
                xActual = a + tAturat;
                t = tAturat;
                d = dAturat;
            } else {
                xActual = a;
                t = 0;
                d = 0;
            }
            return {
                estat: estat,
                a: a,
                preset: preset,
                x: xActual, // instant de l'escena
                t: t, // cronòmetre
                d: d, // comptador de distància recorreguda
                fx: p.f(xActual), // distància a l'observador
                arribat: arribat,
                ultima: ultima,
            };
        }

        /** Escriu una TVM en una fila i la comprova. Una fila correcta queda bloquejada. */
        function comprovaTVM(id, text) {
            var fila = registre.filter(function (r) {
                return r.id === id;
            })[0];
            if (!fila) return null;
            if (fila.correcte) return { ok: true, tipus: 'bloquejat' };
            fila.text = text;
            var res = Entrada.classificaTVM({ text: text, a: fila.a, t: fila.t, d: fila.d, fat: fila.fat });
            fila.correcte = res.ok;
            fila.tipusError = res.ok ? null : res.tipus;
            return res;
        }

        return {
            espai: espai,
            actualitza: actualitza,
            torna: torna,
            canviaA: canviaA,
            posaPreset: posaPreset,
            vista: vista,
            comprovaTVM: comprovaTVM,
            entrades: function () {
                return registre.slice();
            },
            perfil: p,
        };
    }

    return { crea: crea, accioTecla: accioTecla, PAS_A: PAS_A, PAS_A_GRAN: PAS_A_GRAN };
});
