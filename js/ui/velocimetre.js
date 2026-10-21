/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/ui/velocimetre.js
 * ROL: El velocímetre (SVG, docs/SPEC.md §5.1): un semicercle de 0 a 6 m/s amb
 *      una agulla a v(x) i la lectura en nombres. Amagat per defecte; el
 *      controlador el mostra només al moment de bellesa o al laboratori lliure.
 * ARQUITECTURA: crea(svg) → { posa(v, text) }. L'agulla és a v(a) EXACTA (el
 *      motor no deriva mai numèricament). Cap atribut style.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel) {
    'use strict';
    var CX = 100,
        CY = 100,
        R = 78,
        VMAX = 6;

    function angle(v) {
        return Math.PI * (1 - Math.max(0, Math.min(VMAX, v)) / VMAX); // 180° → 0°
    }

    function crea(svg) {
        svg.setAttribute('viewBox', '0 0 200 130');
        var h = '<path class="vel-arc" d="M ' + (CX - R) + ' ' + CY + ' A ' + R + ' ' + R + ' 0 0 1 ' + (CX + R) + ' ' + CY + '"/>';
        for (var m = 0; m <= VMAX; m++) {
            var a = angle(m);
            var c = Math.cos(a),
                s = Math.sin(a);
            h += '<line class="vel-marca" x1="' + (CX + (R - 8) * c).toFixed(2) + '" y1="' + (CY - (R - 8) * s).toFixed(2) + '" x2="' + (CX + R * c).toFixed(2) + '" y2="' + (CY - R * s).toFixed(2) + '"/>';
            h += '<text class="vel-num" x="' + (CX + (R - 18) * c).toFixed(2) + '" y="' + (CY - (R - 18) * s + 4).toFixed(2) + '" text-anchor="middle">' + m + '</text>';
        }
        h += '<line id="vel-agulla" class="vel-agulla" x1="' + CX + '" y1="' + CY + '" x2="' + (CX - R + 12) + '" y2="' + CY + '"/>';
        h += '<circle class="vel-eix" cx="' + CX + '" cy="' + CY + '" r="5"/>';
        h += '<text id="vel-lectura" class="vel-lectura" x="' + CX + '" y="' + (CY + 24) + '" text-anchor="middle"></text>';
        svg.innerHTML = h;

        function posa(v, text) {
            var a = angle(v);
            var ag = svg.querySelector('#vel-agulla');
            ag.setAttribute('x2', (CX + (R - 12) * Math.cos(a)).toFixed(2));
            ag.setAttribute('y2', (CY - (R - 12) * Math.sin(a)).toFixed(2));
            svg.querySelector('#vel-lectura').textContent = text;
        }
        return { posa: posa };
    }

    arrel.DERIVADA = arrel.DERIVADA || {};
    arrel.DERIVADA.velocimetre = { crea: crea };
})(typeof self !== 'undefined' ? self : this);
