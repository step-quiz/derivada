/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/ui/escena.js
 * ROL: L'escena (SVG, docs/SPEC.md §5, §7): l'observador amb el seu telèmetre
 *      a l'esquerra, la pista recta amb els terrenys (patró + text, mai només
 *      color), el carretó (dibuix propi i senzill) i el raig que els uneix.
 *      L'abscissa és proporcional a f (distància) i la baixada es dibuixa com un
 *      pla inclinat d'angle visual fix (§4.3).
 * ARQUITECTURA: No sap res d'etapes ni de puntuació. El controlador crida
 *      dibuixa(escenari, perfil, terrenys) un cop i posa(x, a) a cada fotograma.
 *      Es construeix amb innerHTML (SVG de text) i no usa cap atribut style.
 * DEPENDÈNCIES: DERIVADA.textos (llegit en crear)
 * ============================================================================
 */
(function (arrel) {
    'use strict';
    var W = 800,
        H = 250,
        X0 = 104,
        X1 = 780; // abscissa (px) de f = 0 i de f = f(X)
    var SUPERFICIE = 120; // y (px) de la superfície a f = 0
    var GRUIX = 50; // gruix del terreny (px)
    var REGLE_Y = 236;

    function crea(svg) {
        var T = arrel.DERIVADA.textos;
        var perfil = null,
            punts = [], // vèrtexs de la superfície [{ x, y }] en px
            escala = 1;

        function px(m) {
            return X0 + m * escala;
        }
        // y de la superfície i angle (graus) a l'abscissa x (px)
        function superficie(xpx) {
            for (var i = 0; i < punts.length - 1; i++) {
                var a = punts[i],
                    b = punts[i + 1];
                if (xpx <= b.x || i === punts.length - 2) {
                    var u = b.x === a.x ? 0 : Math.max(0, Math.min(1, (xpx - a.x) / (b.x - a.x)));
                    return { y: a.y + u * (b.y - a.y), angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
                }
            }
            return { y: SUPERFICIE, angle: 0 };
        }

        function dibuixa(escenari, p, terrenys) {
            perfil = p;
            escala = (X1 - X0) / Math.max(1, p.fFinal);
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', T.ESCENA_ARIA);

            // Vèrtexs de la superfície: la baixada baixa tan(angle) per cada px recorregut
            punts = [{ x: X0, y: SUPERFICIE }];
            terrenys.forEach(function (t) {
                var u = punts[punts.length - 1];
                var xf = px(t.x1);
                punts.push({ x: xf, y: u.y + (xf - u.x) * Math.tan((t.angle * Math.PI) / 180) });
            });

            var h = '<defs>';
            h += '<pattern id="pt-llis" width="12" height="12" patternUnits="userSpaceOnUse"><rect class="t-fons t-llis" width="12" height="12"/></pattern>';
            h += '<pattern id="pt-gel" width="16" height="16" patternUnits="userSpaceOnUse"><rect class="t-fons t-gel" width="16" height="16"/><path class="t-linia" d="M2 12 L8 6 M9 14 L13 10"/></pattern>';
            h += '<pattern id="pt-sorra" width="10" height="10" patternUnits="userSpaceOnUse"><rect class="t-fons t-sorra" width="10" height="10"/><circle class="t-punt" cx="2.5" cy="2.5" r="1.1"/><circle class="t-punt" cx="7.5" cy="7" r="1.1"/></pattern>';
            h += '<pattern id="pt-pedres" width="18" height="14" patternUnits="userSpaceOnUse"><rect class="t-fons t-pedres" width="18" height="14"/><ellipse class="t-pedra" cx="5" cy="4" rx="3.4" ry="2.4"/><ellipse class="t-pedra" cx="13" cy="10" rx="3" ry="2.2"/></pattern>';
            h += '<pattern id="pt-baixada" width="14" height="14" patternUnits="userSpaceOnUse"><rect class="t-fons t-baixada" width="14" height="14"/><path class="t-linia" d="M3 3 L8 7 L3 11"/></pattern>';
            h += '</defs>';

            // Terrenys: polígon + text (si és estret, el text va girat)
            terrenys.forEach(function (t, i) {
                var a = punts[i],
                    b = punts[i + 1];
                h += '<polygon class="t-terreny" fill="url(#pt-' + t.tipus + ')" points="' + a.x + ',' + a.y + ' ' + b.x + ',' + b.y + ' ' + b.x + ',' + (b.y + GRUIX) + ' ' + a.x + ',' + (a.y + GRUIX) + '"/>';
                h += '<polyline class="t-vora" fill="none" points="' + a.x + ',' + a.y + ' ' + b.x + ',' + b.y + '"/>';
                var nom = T.TERRENYS[t.tipus];
                var cx = (a.x + b.x) / 2,
                    cy = (a.y + b.y) / 2 + GRUIX / 2 + 4;
                var estret = b.x - a.x < nom.length * 6.6 + 8;
                h += '<text class="t-nom" x="' + cx + '" y="' + cy + '" text-anchor="middle"' + (estret ? ' transform="rotate(-90 ' + cx + ' ' + (cy - 4) + ')"' : '') + '>' + nom + '</text>';
            });

            // Regle en metres (cada 5 m, marques cada metre)
            var fF = Math.floor(p.fFinal);
            for (var m = 0; m <= fF; m++) {
                var gran = m % 5 === 0;
                h += '<line class="r-marca" x1="' + px(m) + '" y1="' + (REGLE_Y - (gran ? 9 : 5)) + '" x2="' + px(m) + '" y2="' + REGLE_Y + '"/>';
                if (gran) h += '<text class="r-num" x="' + px(m) + '" y="' + (REGLE_Y + 11) + '" text-anchor="middle">' + m + (m === 0 ? ' m' : '') + '</text>';
            }

            // Observador (figura pròpia i senzilla) just a l'esquerra de l'origen, amb el telèmetre
            var oy = SUPERFICIE;
            h += '<g class="obs" aria-hidden="true">' +
                '<circle class="obs-cap" cx="76" cy="' + (oy - 52) + '" r="9"/>' +
                '<line class="obs-cos" x1="76" y1="' + (oy - 43) + '" x2="76" y2="' + (oy - 16) + '"/>' +
                '<line class="obs-cos" x1="76" y1="' + (oy - 16) + '" x2="68" y2="' + oy + '"/>' +
                '<line class="obs-cos" x1="76" y1="' + (oy - 16) + '" x2="85" y2="' + oy + '"/>' +
                '<line class="obs-cos" x1="76" y1="' + (oy - 38) + '" x2="94" y2="' + (oy - 34) + '"/>' +
                '<rect class="obs-telemetre" x="92" y="' + (oy - 38) + '" width="10" height="7" rx="1"/>' +
                '</g>';
            h += '<text class="et" x="76" y="' + (oy + 16) + '" text-anchor="middle">' + T.OBSERVADOR_ET + '</text>';

            // Marcador d'a, raig i carretó (es mouen amb posa)
            h += '<line id="marca-a" class="marca-a" x1="0" y1="' + (SUPERFICIE - 70) + '" x2="0" y2="' + (SUPERFICIE + 6) + '"/>';
            h += '<text id="marca-a-text" class="marca-a-text" x="0" y="' + (SUPERFICIE - 74) + '" text-anchor="middle">a</text>';
            h += '<line id="raig" class="raig" x1="102" y1="' + (oy - 34) + '" x2="102" y2="' + (oy - 12) + '"/>';
            h += '<text id="raig-text" class="et" x="0" y="0" text-anchor="middle">f(x)</text>';
            h += '<g id="carreto" class="carreto" aria-hidden="true">' +
                '<rect class="carreto-cos" x="-20" y="-24" width="40" height="16" rx="3"/>' +
                '<rect class="carreto-carga" x="-12" y="-31" width="16" height="8" rx="1"/>' +
                '<circle class="carreto-roda" cx="-11" cy="-5" r="5"/>' +
                '<circle class="carreto-roda" cx="11" cy="-5" r="5"/>' +
                '</g>';
            svg.innerHTML = h;
        }

        // x: instant de l'escena (s); a: instant on comença el mesurament
        function posa(x, a) {
            if (!perfil) return;
            var xc = px(perfil.f(x));
            var s = superficie(xc);
            var carreto = svg.querySelector('#carreto');
            carreto.setAttribute('transform', 'translate(' + xc.toFixed(2) + ' ' + s.y.toFixed(2) + ') rotate(' + s.angle.toFixed(2) + ')');
            var raig = svg.querySelector('#raig');
            var yo = SUPERFICIE - 34;
            var yc = s.y - 14;
            raig.setAttribute('x2', (xc - 20).toFixed(2));
            raig.setAttribute('y1', yo);
            raig.setAttribute('y2', yc.toFixed(2));
            var rt = svg.querySelector('#raig-text');
            rt.setAttribute('x', ((102 + xc - 20) / 2).toFixed(2));
            rt.setAttribute('y', ((yo + yc) / 2 - 6).toFixed(2));
            rt.setAttribute('display', xc - 20 - 102 > 60 ? 'inline' : 'none');
            var xa = px(perfil.f(a));
            var ma = svg.querySelector('#marca-a');
            ma.setAttribute('x1', xa.toFixed(2));
            ma.setAttribute('x2', xa.toFixed(2));
            var mt = svg.querySelector('#marca-a-text');
            mt.setAttribute('x', xa.toFixed(2));
        }

        return { dibuixa: dibuixa, posa: posa };
    }

    arrel.DERIVADA = arrel.DERIVADA || {};
    arrel.DERIVADA.escena = { crea: crea };
})(typeof self !== 'undefined' ? self : this);
