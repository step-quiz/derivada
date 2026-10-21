/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/ui/app.js
 * ROL: El controlador: modes (ruta guiada G0–G4, practica P1/P2, laboratori
 *      lliure), teclat (Espai, S, fletxes), adreça (#etapa, #mode, #escenari,
 *      #a, #llavor, #projector), progrés a localStorage (derivada:v1:progres),
 *      registre de mesures i comprovació de la TVM escrita, estimació del límit
 *      i moment de bellesa. Tota la lògica de maths és als motors.
 * ARQUITECTURA: Un únic estat S. Les accions (executa) canvien l'estat del
 *      laboratori; el bucle requestAnimationFrame només corre mentre el carretó
 *      es mou. El feedback surt DESPRÉS d'una acció, mai mentre corre el
 *      carretó, i són com a molt 2 missatges. El velocímetre i la tangent no
 *      apareixen a la ruta guiada abans d'estimar el límit.
 * DEPENDÈNCIES: tots els motors, textos.js, escena.js, grafica.js, velocimetre.js
 * ============================================================================
 */
(function (arrel) {
    'use strict';
    var D = arrel.DERIVADA; // espai de noms comú; aquest fitxer hi afegeix DERIVADA.app
    var T = D.textos,
        Perfil = D.perfil,
        Tvm = D.tvm,
        Terreny = D.terreny,
        Entrada = D.entrada,
        Lab = D.laboratori,
        Exe = D.exercicis;
    var ESC = arrel.DERIVADA_ESCENARIS;
    var fmt = Entrada.format;
    var $ = function (id) {
        return document.getElementById(id);
    };
    var CLAU = 'derivada:v1:progres';
    var MAX_FILES = 12;
    var A_GUIADA = 5.5;

    // ── localStorage: tot en try/catch; sense emmagatzematge també es pot usar ──
    function llegeixProgres() {
        try {
            var o = JSON.parse(localStorage.getItem(CLAU));
            if (o && typeof o === 'object' && o.fet && typeof o.fet === 'object') return o;
        } catch (e) {
            /* sense emmagatzematge */
        }
        return { fet: {} };
    }
    function desaProgres() {
        try {
            localStorage.setItem(CLAU, JSON.stringify(progres));
        } catch (e) {
            /* sense emmagatzematge */
        }
    }
    var progres = llegeixProgres();

    var escena = D.escena.crea($('escena'));
    var grafica = D.grafica.crea($('grafica'));
    var velo = D.velocimetre.crea($('velocimetre'));
    var movimentReduit = !!(arrel.matchMedia && arrel.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var S = {
        mode: 'guiada',
        etapa: 0,
        fase: 'treball', // treball | fet | estima | bellesa
        escenari: null,
        perfil: null,
        terrenys: null,
        lab: null,
        aEditable: false,
        presetEditable: true,
        revelatFins: null,
        raf: null,
        llavor: Exe.llavorValida(),
        practica: null, // { items, i, p1: {tria, resolt} }
        bellesa: null, // { a, frames, idx, definicio, timer, fi }
        velocimetreLliure: false,
        impressio: false,
        projector: false,
        versioRegistre: 0,
    };

    // ── Feedback (≤ 2 missatges, només després d'una acció) ──────────────
    function feedback(missatges, tipus) {
        var f = $('feedback');
        f.textContent = '';
        missatges.slice(0, 2).forEach(function (m) {
            var p = document.createElement('p');
            p.className = tipus || '';
            p.textContent = m;
            f.appendChild(p);
        });
    }
    function netejaFeedback() {
        $('feedback').textContent = '';
    }
    function anuncia(text) {
        $('anunci').textContent = '';
        $('anunci').textContent = text;
    }

    // ── Escenaris ────────────────────────────────────────────────────────
    function escenariPerId(id) {
        for (var i = 0; i < ESC.length; i++) if (ESC[i].id === id) return ESC[i];
        return null;
    }
    function carregaEscenari(id, a, preset) {
        S.escenari = escenariPerId(id) || ESC[0];
        S.perfil = Perfil.crea(S.escenari.nusos);
        S.terrenys = Terreny.metres(S.escenari, S.perfil);
        escena.dibuixa(S.escenari, S.perfil, S.terrenys);
        S.lab = Lab.crea({ perfil: S.perfil, rellotge: arrel.performance.now.bind(arrel.performance), a: a || 0, preset: preset === undefined ? null : preset });
        S.versioRegistre++;
        S.revelatFins = null;
        S.bellesa = null;
        aturaTemporitzador();
    }

    function labVisible() {
        return !(S.mode === 'practica' && S.practica && S.practica.items[S.practica.i].tipus === 'P1');
    }
    function etapaActual() {
        return Exe.ETAPES[S.etapa];
    }
    function exerciciActual() {
        return S.practica ? S.practica.items[S.practica.i] : null;
    }

    // ── Mode guiat ───────────────────────────────────────────────────────
    function primeraSenseFer() {
        for (var i = 0; i < Exe.ETAPES.length; i++) if (!progres.fet[Exe.ETAPES[i].id]) return i;
        return -1;
    }
    function iniciaEtapa(idx) {
        S.mode = 'guiada';
        S.practica = null;
        S.etapa = idx;
        var e = etapaActual();
        carregaEscenari(e.escenari, e.a, e.preset);
        S.aEditable = e.aLliure;
        S.presetEditable = e.presetLliure;
        S.fase = 'treball';
        S.revelatFins = e.id === 'g0' ? 0 : null;
        netejaFeedback();
        if (e.id === 'g4') iniciaBellesa(true);
        renderEstructura();
        renderViu();
    }
    function completaEtapa() {
        var e = etapaActual();
        S.fase = 'fet';
        progres.fet[e.id] = true;
        desaProgres();
        feedback(T.ETAPES[e.id].fet, 'ok');
        renderEstructura();
    }
    function revisaCondicions() {
        if (S.mode !== 'guiada' || S.fase !== 'treball') return;
        var id = etapaActual().id;
        var reg = S.lab.entrades();
        if (id === 'g1' && Exe.condicioG1(reg)) completaEtapa();
        else if (id === 'g2' && Exe.condicioG2(reg)) completaEtapa();
        else if (id === 'g3' && Exe.condicioG3(reg, A_GUIADA)) {
            S.fase = 'estima';
            renderEstructura();
        }
    }
    function revisaCondicionsP2() {
        var it = exerciciActual();
        if (S.mode !== 'practica' || !it || it.tipus !== 'P2' || S.fase !== 'treball') return;
        if (Exe.condicioG3(S.lab.entrades(), it.a)) {
            S.fase = 'estima';
            renderEstructura();
        }
    }

    // ── Estimació del límit (§6.3) ───────────────────────────────────────
    function estimaA() {
        return S.lab.vista().a;
    }
    function comprovaEstimacio() {
        var a = estimaA();
        var messes = S.lab
            .entrades()
            .filter(function (r) {
                return Math.abs(r.a - a) < 1e-9;
            })
            .map(function (r) {
                return { t: r.t, tvm: r.d / r.t };
            });
        var res = Entrada.classificaLimit({ text: $('camp-estimacio').value, derivada: S.perfil.v(a), messes: messes });
        if (res.ok) {
            $('camp-estimacio').value = '';
            iniciaBellesa(S.mode === 'guiada');
        } else feedback([T.ESTIMA_ERROR[res.tipus]], 'error');
    }

    // ── Moment de bellesa (§6.3) ─────────────────────────────────────────
    function aturaTemporitzador() {
        if (S.bellesa && S.bellesa.timer) clearTimeout(S.bellesa.timer);
        if (S.bellesa) S.bellesa.timer = null;
    }
    function iniciaBellesa(definicio) {
        aturaTemporitzador();
        var a = S.mode === 'guiada' ? A_GUIADA : estimaA();
        if (S.mode === 'guiada' && S.etapa < 4) {
            progres.fet[etapaActual().id] = true;
            S.etapa = 4;
        }
        S.fase = 'bellesa';
        S.bellesa = { a: a, frames: Tvm.reproduccio(a, S.perfil.X), idx: 0, definicio: definicio, timer: null, fi: false };
        netejaFeedback();
        renderEstructura();
        programaFotograma();
        renderViu();
    }
    function programaFotograma() {
        var b = S.bellesa;
        if (!b || b.fi) return;
        if (b.idx >= b.frames.length - 1) {
            finalitzaBellesa();
            return;
        }
        if (movimentReduit) return; // sota prefers-reduced-motion: només manual
        b.timer = setTimeout(function () {
            avancaFotograma();
        }, 700);
    }
    function avancaFotograma() {
        var b = S.bellesa;
        if (!b || b.fi) return;
        if (b.idx < b.frames.length - 1) b.idx++;
        renderEstructura();
        renderViu();
        programaFotograma();
    }
    function finalitzaBellesa() {
        var b = S.bellesa;
        b.fi = true;
        if (S.mode === 'guiada') {
            progres.fet.g4 = true;
            desaProgres();
        }
        renderEstructura();
    }

    // ── Practica (§6.5) ──────────────────────────────────────────────────
    function iniciaPractica(i) {
        S.mode = 'practica';
        if (!S.practica) S.practica = { items: Exe.generaTot(ESC, S.llavor), i: 0, p1: { tria: null, resolt: false } };
        S.practica.i = i || 0;
        mostraExercici();
    }
    function mostraExercici() {
        var it = exerciciActual();
        S.practica.p1 = { tria: null, resolt: false };
        S.fase = 'treball';
        S.etapa = 0;
        if (it.tipus === 'P2') {
            carregaEscenari(it.escenari, it.a, null);
            S.aEditable = false;
            S.presetEditable = true;
        } else {
            carregaEscenari(it.escenari, 0, null);
            S.aEditable = false;
            S.presetEditable = false;
        }
        netejaFeedback();
        renderEstructura();
        renderViu();
    }
    function triaP1(k) {
        var it = exerciciActual();
        if (!it || it.tipus !== 'P1' || S.practica.p1.resolt) return;
        S.practica.p1.tria = k;
        var r = Exe.classificaP1(it, k);
        if (r === 'correcte') {
            S.practica.p1.resolt = true;
            feedback([T.P1_OK], 'ok');
        } else feedback([T.P1_ERROR[r]], 'error');
        renderEstructura();
        renderViu();
    }

    // ── Laboratori lliure ────────────────────────────────────────────────
    function iniciaLliure(id, a) {
        S.mode = 'lliure';
        S.practica = null;
        carregaEscenari(id || 'r1', a || 0, null);
        S.aEditable = true;
        S.presetEditable = true;
        S.fase = 'treball';
        netejaFeedback();
        renderEstructura();
        renderViu();
    }

    // ── Accions del laboratori ───────────────────────────────────────────
    function alAturar(ev) {
        var f = ev.entrada;
        anuncia(T.ATURAT(fmt(f.t, 1), fmt(f.d, 3)));
        S.versioRegistre++;
        if (S.mode === 'guiada' && etapaActual().id === 'g0') {
            S.revelatFins = null;
            if (ev.final && S.fase === 'treball') {
                completaEtapa();
                return;
            }
        }
        if (ev.final) feedback([T.FINAL_PISTA], 'info');
        else netejaFeedback();
        renderEstructura();
        var inp = document.querySelector('#registre-cos tr[data-id="' + f.id + '"] input');
        if (inp && S.fase !== 'bellesa' && !(S.mode === 'guiada' && etapaActual().id === 'g0')) inp.focus();
    }

    function bucle() {
        S.raf = null;
        var ev = S.lab.actualitza();
        if (ev) alAturar(ev);
        renderViu();
        if (S.lab.vista().estat === 'RUNNING') S.raf = arrel.requestAnimationFrame(bucle);
    }
    function assegura() {
        if (!S.raf) S.raf = arrel.requestAnimationFrame(bucle);
    }

    function canviaA(valor) {
        if (!S.aEditable) {
            feedback([T.A_FIXA], 'info');
            return;
        }
        S.lab.canviaA(valor);
        netejaFeedback();
        S.versioRegistre++;
        renderEstructura();
        renderViu();
    }

    function executa(accio) {
        if (!labVisible() || S.fase === 'bellesa') return;
        var v = S.lab.vista();
        if (accio === 'espai') {
            var ev = S.lab.espai();
            if (ev.tipus === 'engega') {
                netejaFeedback();
                renderEstructura();
                assegura();
            } else if (ev.tipus === 'ignorat') feedback([T.ESPAI_ATURAT], 'info');
            else alAturar(ev);
            renderViu();
        } else if (accio === 'torna') {
            S.lab.torna();
            if (S.revelatFins !== null) S.revelatFins = 0;
            netejaFeedback();
            renderEstructura();
            renderViu();
        } else if (accio === 'a-petit-') canviaA(v.a - Lab.PAS_A);
        else if (accio === 'a-petit+') canviaA(v.a + Lab.PAS_A);
        else if (accio === 'a-gran-') canviaA(v.a - Lab.PAS_A_GRAN);
        else if (accio === 'a-gran+') canviaA(v.a + Lab.PAS_A_GRAN);
    }

    // ── Registre ─────────────────────────────────────────────────────────
    function comprovaFila(id, input) {
        var text = input.value;
        if (!text.trim()) return;
        var fila = S.lab.entrades().filter(function (r) {
            return r.id === id;
        })[0];
        if (!fila || fila.correcte) return;
        var res = S.lab.comprovaTVM(id, text);
        var marca = input.parentNode.querySelector('.marca-fila');
        if (res.ok) {
            input.readOnly = true;
            input.removeAttribute('aria-invalid');
            marca.className = 'marca-fila ok';
            marca.textContent = '✓';
            feedback([T.TVM_OK(fmt(fila.d / fila.t, 2))], 'ok');
            var tornaBtn = $('btn-torna');
            if (tornaBtn) tornaBtn.focus();
            revisaCondicions();
            revisaCondicionsP2();
        } else {
            input.setAttribute('aria-invalid', 'true');
            marca.className = 'marca-fila error';
            marca.textContent = '✗';
            feedback([T.TVM_ERROR[res.tipus]], 'error');
        }
        renderViu();
    }

    var registreVist = -1;
    function renderRegistre() {
        var tots = S.lab.entrades();
        var cos = $('registre-cos');
        var hiHa = tots.length > 0;
        var amagat = S.mode === 'guiada' && etapaActual().id === 'g0';
        $('registre-zona').hidden = amagat || !labVisible();
        $('registre').hidden = !hiHa;
        $('registre-buit').hidden = hiHa;
        if (registreVist === S.versioRegistre) return;
        registreVist = S.versioRegistre;
        cos.textContent = '';
        var visibles = tots.slice(-MAX_FILES).reverse();
        visibles.forEach(function (r) {
            var tr = document.createElement('tr');
            tr.setAttribute('data-id', String(r.id));
            var cel = function (txt) {
                var td = document.createElement('td');
                td.textContent = txt;
                tr.appendChild(td);
                return td;
            };
            cel(fmt(r.a, 1));
            cel(fmt(r.t, 1));
            cel(fmt(r.d, 3));
            var td = document.createElement('td');
            var inp = document.createElement('input');
            inp.type = 'text';
            inp.setAttribute('inputmode', 'decimal');
            inp.setAttribute('autocomplete', 'off');
            inp.setAttribute('aria-label', T.TVM_ETIQUETA(String(r.id)));
            inp.value = r.text;
            var marca = document.createElement('span');
            marca.className = 'marca-fila';
            marca.setAttribute('aria-hidden', 'true');
            if (r.correcte) {
                inp.readOnly = true;
                marca.className = 'marca-fila ok';
                marca.textContent = '✓';
                inp.setAttribute('aria-label', T.TVM_ETIQUETA(String(r.id)) + ', ' + T.FILA_CORRECTA);
            } else if (r.tipusError) {
                inp.setAttribute('aria-invalid', 'true');
                marca.className = 'marca-fila error';
                marca.textContent = '✗';
            }
            inp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    comprovaFila(r.id, inp);
                }
            });
            inp.addEventListener('blur', function () {
                comprovaFila(r.id, inp);
            });
            td.appendChild(inp);
            td.appendChild(marca);
            tr.appendChild(td);
            cos.appendChild(tr);
        });
    }

    // ── Dibuix per fotograma ─────────────────────────────────────────────
    function modelGrafica() {
        var v = S.lab.vista();
        var m = { perfil: S.perfil, a: v.a, impressio: S.impressio, escalaText: S.projector ? 1.35 : 1, secants: [], tangent: null };
        var it = exerciciActual();
        if (S.mode === 'practica' && it.tipus === 'P1') {
            m.sensePunts = true;
            m.punts = it.punts.map(function (x) {
                return { x: x };
            });
            m.seleccio = S.practica.p1.tria;
            if (S.practica.p1.resolt)
                m.tangents = it.punts.map(function (x) {
                    return { x0: x, y0: S.perfil.f(x), pendent: S.perfil.v(x), etiqueta: fmt(S.perfil.v(x), 2) + ' m/s' };
                });
            return m;
        }
        if (S.revelatFins !== null) {
            if (v.estat === 'RUNNING') S.revelatFins = Math.max(S.revelatFins, v.x);
            m.revelatFins = S.fase === 'fet' ? null : S.revelatFins;
        }
        if (v.estat === 'RUNNING') m.puntMobil = v.x;
        var b = S.bellesa;
        if (b) {
            m.secants = b.frames.slice(0, b.idx + 1).map(function (t, i) {
                var s = Tvm.secant(S.perfil, b.a, t);
                s.actual = i === b.idx && !b.fi;
                s.opacitat = i === b.idx && !b.fi ? 1 : 0.35;
                s.etiquetes = i === b.idx && !b.fi && t >= 0.1 - 1e-9;
                return s;
            });
            if (b.fi) {
                // la tangent apareix quan s'acaba la reproducció (després d'estimar el límit)
                m.tangent = Tvm.tangent(S.perfil, b.a);
                m.tangent.etiqueta = T.TANGENT_ET(fmt(S.perfil.v(b.a), 2));
            }
            return m;
        }
        if (!(S.mode === 'guiada' && etapaActual().id === 'g0')) {
            var files = S.lab
                .entrades()
                .filter(function (r) {
                    return Math.abs(r.a - v.a) < 1e-9;
                })
                .slice(-MAX_FILES);
            files.forEach(function (r, i) {
                var s = Tvm.secant(S.perfil, r.a, r.t);
                var actual = v.ultima && v.ultima.id === r.id;
                s.actual = !!actual;
                s.opacitat = actual ? 1 : 0.4;
                s.etiquetes = !!actual;
                if (r.correcte) s.etiqueta = T.SECANT_ET(fmt(r.tvmExacta, 3));
                m.secants.push(s);
            });
        }
        return m;
    }

    function renderViu() {
        var v = S.lab.vista();
        $('v-cronometre').textContent = fmt(v.t, 1) + ' s';
        $('v-comptador').textContent = fmt(v.d, 3) + ' m';
        $('v-observador').textContent = fmt(v.fx, 3) + ' m';
        escena.posa(v.x, v.a);
        var b = S.bellesa;
        if (b) velo.posa(S.perfil.v(b.a), fmt(S.perfil.v(b.a), 2) + ' m/s');
        else if (S.velocimetreLliure) velo.posa(S.perfil.v(v.x), fmt(S.perfil.v(v.x), 2) + ' m/s');
        grafica.dibuixa(modelGrafica());
    }

    // ── Estructura (instrucció, panells, controls) ───────────────────────
    function boto(text, fn, primari) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn' + (primari ? ' btn-primari' : '');
        b.textContent = text;
        b.addEventListener('click', fn);
        return b;
    }
    function renderModes() {
        var nav = $('modes');
        nav.textContent = '';
        [['guiada', function () {
            var i = primeraSenseFer();
            iniciaEtapa(i < 0 ? 0 : S.mode === 'guiada' ? S.etapa : i);
        }], ['practica', function () {
            iniciaPractica(0);
        }], ['lliure', function () {
            iniciaLliure('r1', 0);
        }]].forEach(function (par) {
            var b = boto(T.MODES[par[0]].nom, par[1], false);
            b.setAttribute('aria-pressed', S.mode === par[0] ? 'true' : 'false');
            nav.appendChild(b);
        });
    }
    function renderEtapes() {
        var ol = $('etapes');
        ol.hidden = S.mode !== 'guiada';
        ol.textContent = '';
        Exe.ETAPES.forEach(function (e, i) {
            var li = document.createElement('li');
            li.textContent = T.ETAPA_ET(i + 1, T.ETAPES[e.id].nom);
            if (progres.fet[e.id]) li.className = 'fet';
            if (S.mode === 'guiada' && i === S.etapa) li.setAttribute('aria-current', 'step');
            ol.appendChild(li);
        });
    }

    function renderEstructura() {
        renderModes();
        renderEtapes();
        var it = exerciciActual();
        var p1 = S.mode === 'practica' && it && it.tipus === 'P1';
        var v = S.lab.vista();
        var g0 = S.mode === 'guiada' && etapaActual().id === 'g0';

        $('zona-escena').hidden = p1;
        $('panell').hidden = p1;
        $('btn-per-que').hidden = p1 || g0;
        $('control-escenari').hidden = S.mode !== 'lliure';
        $('control-velocimetre').hidden = S.mode !== 'lliure';
        S.velocimetreLliure = S.mode === 'lliure' && $('interruptor-velocimetre').checked;
        $('zona-velocimetre').hidden = !(S.bellesa || S.velocimetreLliure);
        $('btn-cronometre').disabled = S.fase === 'bellesa';
        $('btn-torna').disabled = S.fase === 'bellesa';

        // Controls
        $('camp-a').value = fmt(v.a, 1);
        $('camp-a').disabled = !S.aEditable;
        $('a-menys').disabled = !S.aEditable;
        $('a-mes').disabled = !S.aEditable;
        var sel = $('tria-preset');
        sel.textContent = '';
        var opcio = function (valor, text) {
            var o = document.createElement('option');
            o.value = valor;
            o.textContent = text;
            sel.appendChild(o);
        };
        opcio('manual', T.MANUAL);
        Tvm.PRESETS.forEach(function (t, i) {
            opcio(String(t), T.PRESETS[i]);
        });
        sel.value = v.preset === null ? 'manual' : String(v.preset);
        sel.disabled = !S.presetEditable;
        if (S.mode === 'lliure') {
            var se = $('tria-escenari');
            if (!se.options.length)
                ESC.forEach(function (e) {
                    var o = document.createElement('option');
                    o.value = e.id;
                    o.textContent = e.id + ' · ' + e.nom;
                    se.appendChild(o);
                });
            se.value = S.escenari.id;
        }

        grafica.configura({ aEditable: S.aEditable && S.fase !== 'bellesa' && !p1, puntsEditable: p1 && !S.practica.p1.resolt });

        // Instrucció
        var instr = '';
        if (S.mode === 'guiada') instr = S.fase === 'estima' ? T.ESTIMA_PREGUNTA : T.ETAPES[etapaActual().id].instruccio;
        else if (S.mode === 'practica') instr = it.tipus === 'P1' ? T.P1_INSTRUCCIO : S.fase === 'estima' ? T.ESTIMA_PREGUNTA : T.P2_INSTRUCCIO(fmt(it.a, 1));
        else instr = T.LLIURE_INSTRUCCIO;
        if (S.fase === 'bellesa') instr = '';
        $('instruccio').textContent = instr;
        $('instruccio').hidden = !instr;

        // P1: un botó per punt (alternativa de teclat a tocar la gràfica)
        var cp = $('p1-botons');
        cp.hidden = !p1;
        cp.textContent = '';
        if (p1)
            it.punts.forEach(function (x, k) {
                var b = boto(T.P1_PUNT(String(k + 1), fmt(x, 1)), function () {
                    triaP1(k);
                }, false);
                b.disabled = S.practica.p1.resolt;
                cp.appendChild(b);
            });

        // Estimació
        var est = S.fase === 'estima';
        $('estimacio').hidden = !est;
        $('et-estimacio').textContent = T.ESTIMA_ETIQUETA;

        // Bellesa
        var b = S.bellesa;
        $('bellesa').hidden = !b;
        if (b) {
            $('bellesa-valor').textContent = T.BELLESA_VALOR(fmt(b.a, 1), fmt(S.perfil.v(b.a), 2));
            $('bellesa-cotxe').textContent = T.BELLESA_COTXE;
            var ll = $('bellesa-llista');
            ll.textContent = '';
            b.frames.slice(0, b.idx + 1).forEach(function (t, i) {
                var li = document.createElement('li');
                var precis = t < 0.1 - 1e-9;
                li.textContent = T.BELLESA_FOTOGRAMA(fmt(t, t < 0.1 ? 2 : 1), fmt(Tvm.tvm(S.perfil, b.a, t), 3)) + (precis ? ' · ' + T.BELLESA_PRECIS : '');
                if (precis) li.className = 'precis';
                ll.appendChild(li);
            });
            $('btn-fotograma').hidden = !(movimentReduit && !b.fi);
            $('definicio').hidden = !(b.fi && b.definicio);
            $('definicio-1').textContent = T.DEFINICIO;
            $('definicio-2').textContent = T.DEFINICIO_FRASE;
        }

        // Accions de navegació
        var ac = $('accions');
        ac.textContent = '';
        if (S.mode === 'guiada' && S.fase === 'fet' && S.etapa < 3) ac.appendChild(boto(T.BTN_SEGUENT, function () {
            iniciaEtapa(S.etapa + 1);
        }, true));
        if (S.mode === 'guiada' && S.fase === 'bellesa' && b && b.fi) {
            ac.appendChild(boto(T.BELLESA_REPETEIX, function () {
                iniciaBellesa(true);
            }, false));
            ac.appendChild(boto(T.BTN_PRACTICA, function () {
                iniciaPractica(0);
            }, true));
            ac.appendChild(boto(T.BTN_LLIURE, function () {
                iniciaLliure('r1', 0);
            }, false));
        }
        if (S.mode === 'practica') {
            var fet = (it.tipus === 'P1' && S.practica.p1.resolt) || (it.tipus === 'P2' && S.fase === 'bellesa' && b && b.fi);
            if (fet) {
                if (S.practica.i + 1 < S.practica.items.length) ac.appendChild(boto(T.BTN_SEGUENT, function () {
                    iniciaPractica(S.practica.i + 1);
                }, true));
                else {
                    feedback([T.PRACTICA_FI], 'ok');
                    ac.appendChild(boto(T.BTN_LLIURE, function () {
                        iniciaLliure('r1', 0);
                    }, true));
                }
            }
        }
        renderRegistre();
    }

    // ── Adreça (#etapa, #mode, #escenari, #a, #llavor, #projector) ───────
    function llegeixHash() {
        var o = {};
        location.hash
            .replace(/^#/, '')
            .split('&')
            .forEach(function (p) {
                var kv = p.split('=');
                try {
                    if (kv.length === 2 && /^[a-z]+$/.test(kv[0])) o[kv[0]] = decodeURIComponent(kv[1]);
                } catch (e) {
                    /* un valor mal codificat s'ignora; els altres paràmetres es mantenen */
                }
            });
        return o;
    }
    function aplicaHash() {
        var h = llegeixHash();
        S.llavor = Exe.llavorValida(h.llavor);
        S.practica = null;
        if (h.projector === '1') posaProjector(true);
        if (h.mode === 'lliure') {
            var esc = escenariPerId(h.escenari);
            var a = parseFloat((h.a || '').replace(',', '.'));
            iniciaLliure(esc ? esc.id : 'r1', isFinite(a) && a >= 0 && a <= 11.9 ? Math.round(a * 10) / 10 : 0);
            return;
        }
        if (h.mode === 'practica') {
            iniciaPractica(0);
            return;
        }
        var idx = -1;
        Exe.ETAPES.forEach(function (e, i) {
            if (e.id === h.etapa) idx = i;
        });
        if (idx < 0) idx = primeraSenseFer();
        if (idx < 0) {
            iniciaPractica(0);
            return;
        }
        iniciaEtapa(idx);
    }

    function posaProjector(si) {
        S.projector = si;
        document.body.classList.toggle('projector', si);
        $('btn-projector').setAttribute('aria-pressed', si ? 'true' : 'false');
        grafica.redimensiona();
    }

    // ── Esdeveniments ────────────────────────────────────────────────────
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (!labVisible()) return;
        var r = Lab.accioTecla(e.key, e.shiftKey, e.target && e.target.tagName);
        if (!r.accio) return;
        if (r.previnguda) e.preventDefault();
        if (e.repeat) return;
        executa(r.accio);
    });
    $('btn-cronometre').addEventListener('click', function () {
        executa('espai');
    });
    $('btn-torna').addEventListener('click', function () {
        executa('torna');
    });
    $('a-menys').addEventListener('click', function () {
        canviaA(S.lab.vista().a - Lab.PAS_A);
    });
    $('a-mes').addEventListener('click', function () {
        canviaA(S.lab.vista().a + Lab.PAS_A);
    });
    $('camp-a').addEventListener('change', function () {
        var n = Entrada.llegeix($('camp-a').value);
        if (n === null) {
            $('camp-a').value = fmt(S.lab.vista().a, 1);
            feedback([T.NO_NUMERO], 'error');
        } else canviaA(n);
    });
    $('tria-preset').addEventListener('change', function () {
        var val = $('tria-preset').value;
        S.lab.posaPreset(val === 'manual' ? null : parseFloat(val));
        netejaFeedback();
        renderViu();
    });
    $('tria-escenari').addEventListener('change', function () {
        iniciaLliure($('tria-escenari').value, 0);
    });
    $('interruptor-velocimetre').addEventListener('change', function () {
        renderEstructura();
        renderViu();
    });
    $('btn-estimacio').addEventListener('click', comprovaEstimacio);
    $('camp-estimacio').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            comprovaEstimacio();
        }
    });
    $('btn-per-que').addEventListener('click', function () {
        feedback([T.PER_QUE_T0], 'info');
    });
    $('btn-fotograma').addEventListener('click', avancaFotograma);
    $('btn-projector').addEventListener('click', function () {
        posaProjector(!S.projector);
        renderViu();
    });
    $('btn-esborra-progres').addEventListener('click', function () {
        progres = { fet: {} };
        desaProgres();
        iniciaEtapa(0);
    });
    grafica.onA(function (a) {
        if (S.fase === 'bellesa') return;
        var nou = Math.round(a * 10) / 10;
        if (S.lab && Math.abs(nou - S.lab.vista().a) > 1e-9) canviaA(nou);
    });
    grafica.onPunt(triaP1);
    arrel.addEventListener('hashchange', aplicaHash);
    document.addEventListener('visibilitychange', function () {
        if (document.hidden && S.lab && S.lab.vista().estat === 'RUNNING') {
            S.lab.torna();
            renderEstructura();
            renderViu();
        }
    });
    arrel.addEventListener('beforeprint', function () {
        S.impressio = true;
        grafica.redimensiona();
        renderViu();
    });
    arrel.addEventListener('afterprint', function () {
        S.impressio = false;
        grafica.redimensiona();
        renderViu();
    });

    D.app = { executa: executa };

    grafica.redimensiona();
    aplicaHash();
    grafica.redimensiona();
    renderViu();
})(typeof self !== 'undefined' ? self : this);
