/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/ui/grafica.js
 * ROL: La gràfica de f (canvas, docs/SPEC.md §6.2): eixos «x (s)» i «f(x) (m)»
 *      amb coma decimal, la corba (també a mesura que corre el carretó), el
 *      marcador d'a (es pot arrossegar o tocar a l'eix), el punt mòbil, les
 *      secants (la més recent saturada, les velles esvaïdes i a ratlles) amb el
 *      TRIANGLE DE PENDENT (alçada = d, base = t, amb nombres: M6), la tangent
 *      (només després del límit) i els punts de l'exercici P1.
 * ARQUITECTURA: No sap res d'etapes. El controlador crida dibuixa(model) i rep
 *      onA(a) i onPunt(i). Pointer Events amb setPointerCapture; touch-action:
 *      none només a aquest canvas (el tauler arrossegable). Els colors surten
 *      dels tokens CSS (--g-…, --d-…), també en mode fosc; la impressió usa
 *      negre sobre blanc. L'escala es multiplica per DPR.
 * DEPENDÈNCIES: DERIVADA.entrada (format amb coma), DERIVADA.textos
 * ============================================================================
 */
(function (arrel) {
    'use strict';
    var MARGE = { e: 58, d: 18, a: 16, b: 50 };

    function crea(canvas) {
        var ctx = canvas.getContext('2d');
        var amplada = 0,
            alcada = 0,
            ultim = null;
        var cb = { a: null, punt: null };
        var config = { aEditable: false, puntsEditable: false };
        var arrossega = false;
        var lay = null; // { x0, y0, w, h, X, Y } de l'últim dibuix

        var fmt = function (x, d) {
            return arrel.DERIVADA.entrada.format(x, d);
        };

        function colors(impressio) {
            if (impressio) {
                return { fons: '#ffffff', quadricula: '#cccccc', eix: '#000000', text: '#000000', corba: '#000000', secant: '#000000', tangent: '#000000', marcador: '#000000', punt: '#000000', destacat: '#000000' };
            }
            var cs = getComputedStyle(document.documentElement);
            var v = function (n, d) {
                var x = cs.getPropertyValue(n).trim();
                return x || d;
            };
            return {
                fons: v('--g-fons', '#ffffff'),
                quadricula: v('--g-quadricula', '#e5e7eb'),
                eix: v('--g-eix', '#334155'),
                text: v('--g-text', '#334155'),
                corba: v('--g-alumne', '#4338ca'),
                secant: v('--d-secant', '#db2777'),
                tangent: v('--d-tangent', '#047857'),
                marcador: v('--d-marcador', '#b45309'),
                punt: v('--g-cursor', '#db2777'),
                destacat: v('--g-destacat-text', '#92400e'),
            };
        }

        function redimensiona() {
            var r = canvas.getBoundingClientRect();
            var dpr = window.devicePixelRatio || 1;
            amplada = Math.max(1, r.width);
            alcada = Math.max(1, r.height);
            canvas.width = Math.round(amplada * dpr);
            canvas.height = Math.round(alcada * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (ultim) dibuixa(ultim);
        }

        function pasY(ymax) {
            return ymax <= 8 ? 1 : ymax <= 16 ? 2 : ymax <= 40 ? 5 : 10;
        }

        function dibuixa(m) {
            ultim = m;
            if (!amplada) return;
            var C = colors(m.impressio);
            var esc = m.escalaText || 1;
            var p = m.perfil,
                X = p.X,
                Y = Math.ceil(p.fFinal);
            var x0 = MARGE.e * (esc > 1 ? 1.15 : 1),
                y0 = alcada - MARGE.b * (esc > 1 ? 1.1 : 1);
            var w = amplada - x0 - MARGE.d,
                h = y0 - MARGE.a;
            lay = { x0: x0, y0: y0, w: w, h: h, X: X, Y: Y };
            var cx = function (x) {
                return x0 + (x / X) * w;
            };
            var cy = function (y) {
                return y0 - (y / Y) * h;
            };
            var fam = getComputedStyle(canvas).fontFamily || 'sans-serif';
            var font = function (px, pes) {
                return (pes || '') + ' ' + Math.round(px * esc) + 'px ' + fam;
            };

            ctx.clearRect(0, 0, amplada, alcada);
            ctx.fillStyle = C.fons;
            ctx.fillRect(0, 0, amplada, alcada);

            // Quadrícula i etiquetes (coma decimal)
            ctx.lineWidth = 1;
            ctx.strokeStyle = C.quadricula;
            ctx.fillStyle = C.text;
            ctx.font = font(12);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            var salt = amplada / X < 34 * esc ? 2 : 1;
            for (var x = 0; x <= X; x++) {
                ctx.beginPath();
                ctx.moveTo(Math.round(cx(x)) + 0.5, y0);
                ctx.lineTo(Math.round(cx(x)) + 0.5, cy(Y));
                ctx.stroke();
                if (x % salt === 0) ctx.fillText(fmt(x, 0), cx(x), y0 + 6);
            }
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            var py = pasY(Y);
            for (var y = 0; y <= Y; y += py) {
                ctx.beginPath();
                ctx.moveTo(x0, Math.round(cy(y)) + 0.5);
                ctx.lineTo(x0 + w, Math.round(cy(y)) + 0.5);
                ctx.stroke();
                ctx.fillText(fmt(y, 0), x0 - 6, cy(y));
            }
            // Eixos i títols
            ctx.strokeStyle = C.eix;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x0, cy(Y));
            ctx.lineTo(x0, y0);
            ctx.lineTo(x0 + w, y0);
            ctx.stroke();
            var T = arrel.DERIVADA.textos;
            ctx.fillStyle = C.text;
            ctx.font = font(13, 'bold');
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(T.EIX_X, x0 + w, alcada - 4);
            ctx.save();
            ctx.translate(14, cy(Y) + 4);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(T.EIX_Y, 0, -4);
            ctx.restore();

            // Corba (fins a revelatFins, si el carretó la va dibuixant)
            var fins = m.revelatFins === undefined || m.revelatFins === null ? X : Math.min(X, m.revelatFins);
            if (fins > 0) {
                ctx.strokeStyle = C.corba;
                ctx.lineWidth = 2.6;
                ctx.beginPath();
                var n = Math.max(2, Math.ceil((fins / X) * 360));
                for (var i = 0; i <= n; i++) {
                    var xx = (fins * i) / n;
                    if (i === 0) ctx.moveTo(cx(xx), cy(p.f(xx)));
                    else ctx.lineTo(cx(xx), cy(p.f(xx)));
                }
                ctx.stroke();
            }

            // Secants amb el triangle de pendent
            (m.secants || []).forEach(function (s) {
                ctx.globalAlpha = s.opacitat === undefined ? 1 : s.opacitat;
                ctx.strokeStyle = C.secant;
                ctx.fillStyle = C.secant;
                ctx.lineWidth = s.actual ? 3 : 2;
                ctx.setLineDash(s.actual ? [] : [6, 4]);
                ctx.beginPath();
                ctx.moveTo(cx(s.x0), cy(s.y0));
                ctx.lineTo(cx(s.x1), cy(s.y1));
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.lineWidth = 1.2;
                ctx.beginPath(); // triangle: base t (horitzontal) i alçada d (vertical)
                ctx.moveTo(cx(s.x0), cy(s.y0));
                ctx.lineTo(cx(s.x1), cy(s.y0));
                ctx.lineTo(cx(s.x1), cy(s.y1));
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx(s.x1), cy(s.y1), 3.5, 0, 6.2832);
                ctx.fill();
                if (s.etiquetes) {
                    ctx.font = font(12, 'bold');
                    var prop = cy(s.y0) > y0 - 26; // base enganxada a l'eix: l'etiqueta va a sobre
                    ctx.textBaseline = prop ? 'bottom' : 'top';
                    ctx.textAlign = 'center';
                    ctx.fillText(T.TRIANGLE_T(fmt(s.triangle.base, s.triangle.base < 0.1 ? 2 : 1)), (cx(s.x0) + cx(s.x1)) / 2 + (prop ? 18 : 0), cy(s.y0) + (prop ? -6 : 4));
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(T.TRIANGLE_D(fmt(s.triangle.alcada, 3)), cx(s.x1) + 6, (cy(s.y0) + cy(s.y1)) / 2);
                }
                if (s.etiqueta) {
                    ctx.font = font(13, 'bold');
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(s.etiqueta, cx(s.x0) - 8, cy(s.y1) - 6);
                }
                ctx.globalAlpha = 1;
            });

            // Tangent (només després del límit) amb el seu triangle (base 1 s)
            if (m.tangent) {
                var tg = m.tangent;
                ctx.strokeStyle = C.tangent;
                ctx.fillStyle = C.tangent;
                ctx.lineWidth = 2.4;
                var xa = Math.max(0, tg.x0 - 1.5),
                    xb = Math.min(X, tg.x0 + 1.5);
                ctx.beginPath();
                ctx.moveTo(cx(xa), cy(tg.y0 + tg.pendent * (xa - tg.x0)));
                ctx.lineTo(cx(xb), cy(tg.y0 + tg.pendent * (xb - tg.x0)));
                ctx.stroke();
                var run = Math.min(1, X - tg.x0);
                if (run > 0.2) {
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(cx(tg.x0), cy(tg.y0));
                    ctx.lineTo(cx(tg.x0 + run), cy(tg.y0));
                    ctx.lineTo(cx(tg.x0 + run), cy(tg.y0 + tg.pendent * run));
                    ctx.stroke();
                    ctx.font = font(12, 'bold');
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(T.TRIANGLE_T(fmt(run, 1)), cx(tg.x0 + run / 2), cy(tg.y0) + 4);
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(T.TRIANGLE_D(fmt(tg.pendent * run, 2)), cx(tg.x0 + run) + 6, cy(tg.y0 + (tg.pendent * run) / 2));
                }
                if (tg.etiqueta) {
                    ctx.font = font(13, 'bold');
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(tg.etiqueta, cx(tg.x0) + 8, cy(tg.y0) - 10);
                }
            }

            // Tangents de P1 (amb pendent numèric)
            (m.tangents || []).forEach(function (tg) {
                ctx.strokeStyle = C.tangent;
                ctx.fillStyle = C.tangent;
                ctx.lineWidth = 2.2;
                var xa = Math.max(0, tg.x0 - 1.2),
                    xb = Math.min(X, tg.x0 + 1.2);
                ctx.beginPath();
                ctx.moveTo(cx(xa), cy(tg.y0 + tg.pendent * (xa - tg.x0)));
                ctx.lineTo(cx(xb), cy(tg.y0 + tg.pendent * (xb - tg.x0)));
                ctx.stroke();
                ctx.font = font(12, 'bold');
                var dreta = tg.x0 > X - 2.2; // prop del final: l'etiqueta es posa a l'esquerra
                ctx.textAlign = dreta ? 'right' : 'left';
                ctx.textBaseline = 'bottom';
                ctx.fillText(tg.etiqueta, cx(tg.x0) + (dreta ? -6 : 6), cy(tg.y0) - 22);
            });

            // Marcador d'a: línia fins a la corba i triangle a l'eix x
            if (m.a !== undefined && m.a !== null && !m.sensePunts) {
                ctx.strokeStyle = C.marcador;
                ctx.fillStyle = C.marcador;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(cx(m.a), y0);
                ctx.lineTo(cx(m.a), cy(p.f(m.a)));
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(cx(m.a), y0 + 3);
                ctx.lineTo(cx(m.a) - 9, y0 + 18);
                ctx.lineTo(cx(m.a) + 9, y0 + 18);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx(m.a), cy(p.f(m.a)), 5, 0, 6.2832);
                ctx.fill();
                ctx.font = font(12, 'bold');
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText('a = ' + fmt(m.a, 1), cx(m.a), y0 + 20);
            }

            // Punt mòbil mentre corre el carretó
            if (m.puntMobil !== undefined && m.puntMobil !== null) {
                ctx.fillStyle = C.punt;
                ctx.strokeStyle = C.fons;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx(m.puntMobil), cy(p.f(m.puntMobil)), 6.5, 0, 6.2832);
                ctx.fill();
                ctx.stroke();
            }

            // Punts de P1: cercles numerats (el número, no el color, els distingeix)
            (m.punts || []).forEach(function (q, i) {
                var px = cx(q.x),
                    pyy = cy(p.f(q.x));
                ctx.beginPath();
                ctx.arc(px, pyy, 13, 0, 6.2832);
                ctx.fillStyle = C.fons;
                ctx.fill();
                ctx.lineWidth = m.seleccio === i ? 4 : 2.2;
                ctx.strokeStyle = m.seleccio === i ? C.destacat : C.marcador;
                ctx.stroke();
                ctx.fillStyle = C.text;
                ctx.font = font(14, 'bold');
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(i + 1), px, pyy + 1);
            });
        }

        // ── Pointer Events (§5.4): arrossegar el marcador o tocar l'eix x ──
        function posicio(e) {
            var r = canvas.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        }
        function xDes(pxx) {
            if (!lay) return 0;
            return Math.max(0, Math.min(lay.X, ((pxx - lay.x0) / lay.w) * lay.X));
        }
        function alaBanda(pt) {
            return lay && pt.y >= lay.y0 - 14 && pt.y <= lay.y0 + 34 && pt.x >= lay.x0 - 12 && pt.x <= lay.x0 + lay.w + 12;
        }
        function puntProper(pt) {
            if (!ultim || !ultim.punts || !lay) return -1;
            var millor = -1,
                dmin = 30;
            ultim.punts.forEach(function (q, i) {
                var dx = lay.x0 + (q.x / lay.X) * lay.w - pt.x;
                var dy = lay.y0 - (ultim.perfil.f(q.x) / lay.Y) * lay.h - pt.y;
                var d = Math.sqrt(dx * dx + dy * dy);
                if (d < dmin) {
                    dmin = d;
                    millor = i;
                }
            });
            return millor;
        }
        canvas.addEventListener('pointerdown', function (e) {
            var pt = posicio(e);
            if (config.puntsEditable) {
                var i = puntProper(pt);
                if (i >= 0 && cb.punt) cb.punt(i);
                return;
            }
            if (config.aEditable && alaBanda(pt)) {
                arrossega = true;
                try {
                    canvas.setPointerCapture(e.pointerId);
                } catch (err) {
                    /* sense captura: el ratolí encara funciona dins el canvas */
                }
                if (cb.a) cb.a(xDes(pt.x));
                e.preventDefault();
            }
        });
        canvas.addEventListener('pointermove', function (e) {
            if (arrossega && cb.a) cb.a(xDes(posicio(e).x));
        });
        var acaba = function () {
            arrossega = false;
        };
        canvas.addEventListener('pointerup', acaba);
        canvas.addEventListener('pointercancel', acaba);
        canvas.addEventListener('lostpointercapture', acaba);

        window.addEventListener('resize', redimensiona);

        return {
            dibuixa: dibuixa,
            redimensiona: redimensiona,
            onA: function (f) {
                cb.a = f;
            },
            onPunt: function (f) {
                cb.punt = f;
            },
            configura: function (c) {
                config.aEditable = !!c.aEditable;
                config.puntsEditable = !!c.puntsEditable;
                canvas.classList.toggle('arrossegable', config.aEditable);
                canvas.classList.toggle('seleccionable', config.puntsEditable);
            },
        };
    }

    arrel.DERIVADA = arrel.DERIVADA || {};
    arrel.DERIVADA.grafica = { crea: crea };
})(typeof self !== 'undefined' ? self : this);
