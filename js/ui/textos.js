/**
 * ============================================================================
 * PROJECTE: derivada (Step Quiz, vanilla JS)
 * FITXER: js/ui/textos.js
 * ROL: Tots els textos que veu l'alumnat, en català. Cap passa de 40 paraules
 *      (ho comprova tests/repo.test.js). Les instruccions i els missatges de
 *      les etapes són l'esborrany de docs/SPEC.md §5.5–§6.5; els missatges
 *      d'error NOMENEN l'error (M1–M6) i mai donen la resposta.
 * ARQUITECTURA: Dades (window.DERIVADA.textos); també es carrega amb Node
 *      (tests). Les funcions reben text ja formatat amb coma decimal.
 * DEPENDÈNCIES: cap
 * ============================================================================
 */
(function (arrel, fabrica) {
    'use strict';
    var api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else {
        arrel.DERIVADA = arrel.DERIVADA || {};
        arrel.DERIVADA.textos = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';
    return {
        TITOL: 'Derivada en un punt',
        MODES: {
            guiada: { nom: 'Ruta guiada' },
            practica: { nom: 'Practica' },
            lliure: { nom: 'Laboratori lliure' },
        },

        // ── Ruta guiada (§6) ─────────────────────────────────────────────
        ETAPES: {
            g0: {
                nom: 'Mira',
                instruccio: 'Prem Espai: el carretó es mou i la gràfica es dibuixa.',
                fet: [
                    'Aquesta línia és la gràfica de f: a cada instant x, la distància entre el carretó i l’observador.',
                    'El camí és recte; la gràfica no és el dibuix del camí.',
                ],
            },
            g1: {
                nom: 'Primera TVM',
                instruccio:
                    'Atura el cronòmetre quan vulguis (Espai). El comptador marca els metres des d’a. Calcula la velocitat mitjana: metres ÷ segons.',
                fet: ['Has calculat una velocitat mitjana: la TVM.'],
            },
            g2: {
                nom: 'Depèn d’on mires',
                instruccio:
                    'Fes servir t = 2 s i canvia a. Troba un moment on la velocitat mitjana sigui més gran que 2,5 m/s i un altre on sigui menor que 1,5 m/s.',
                fet: ['La velocitat mitjana depèn de l’interval que triïs.'],
            },
            g3: {
                nom: 'Interval cada cop més petit',
                instruccio:
                    'Aquí a = 5,5 s. Mesura amb t = 2, 1, 0,5, 0,2 i 0,1 s i calcula cada TVM. Què passa amb els valors?',
                fet: [],
            },
            g4: {
                nom: 'Velocitat just ara',
                instruccio: 'Mira com les TVM de t cada cop més petita arriben a un valor.',
                fet: [],
            },
        },
        ETAPA_ET: function (n, nom) {
            return 'Pas ' + n + ' · ' + nom;
        },

        // ── Instruments (§5.1) ───────────────────────────────────────────
        CRONOMETRE: 'Cronòmetre',
        COMPTADOR: 'Distància recorreguda des d’a',
        OBSERVADOR: 'Distància a l’observador',
        VELOCIMETRE: 'Velocímetre',
        VELOCIMETRE_INTERRUPTOR: 'Mostra el velocímetre',
        UNITAT_S: 's',
        UNITAT_M: 'm',
        UNITAT_MS: 'm/s',

        // ── Botons i camps ───────────────────────────────────────────────
        BTN_CRONOMETRE: 'Cronòmetre (Espai)',
        BTN_TORNA: 'Torna a a (S)',
        BTN_PROJECTOR: 'Projector',
        BTN_SEGUENT: 'Següent',
        BTN_COMPROVA: 'Comprova',
        BTN_ESBORRA: 'Esborra el progrés',
        BTN_PER_QUE: 'Per què no pot ser t = 0?',
        CAMP_A: 'a (s)',
        A_MENYS: 'a, 0,1 s menys',
        A_MES: 'a, 0,1 s més',
        TEMPS_PROGRAMAT: 'Temps programat',
        MANUAL: 'manual',
        PRESETS: ['2 s', '1 s', '0,5 s', '0,2 s', '0,1 s'],
        ESCENARI: 'Escenari',

        // ── Registre (§5.5) ──────────────────────────────────────────────
        REGISTRE_TITOL: 'Mesures',
        REGISTRE_BUIT: 'Encara no has mesurat res. Prem Espai per començar.',
        COL_A: 'a (s)',
        COL_T: 't (s)',
        COL_D: 'd (m)',
        COL_TVM: 'TVM (m/s)',
        TVM_ETIQUETA: function (n) {
            return 'TVM (m/s) de la mesura ' + n;
        },
        FILA_CORRECTA: 'correcta',

        // ── Avisos i anuncis ─────────────────────────────────────────────
        ATURAT: function (t, d) {
            return 't = ' + t + ' s, distància ' + d + ' m';
        },
        FINAL_PISTA: 'Has arribat al final.',
        ESPAI_ATURAT: 'Prem S per tornar a a.',
        A_FIXA: 'En aquest pas, a ja està fixada.',
        NO_NUMERO: 'Escriu un nombre, amb coma o punt decimal.',

        // ── Errors de la TVM (§5.5) ──────────────────────────────────────
        TVM_ERROR: {
            distancia: 'Has donat la distància. Falta dividir-la pel temps.',
            invertit: 'Has dividit el temps per la distància. És al revés: distància ÷ temps.',
            observador: 'Has fet servir la distància fins a l’observador. Fes servir el comptador de distància recorreguda.',
            multiplicat: 'Has multiplicat. Velocitat = distància ÷ temps.',
            altre: 'No coincideix. Mira les unitats: m ÷ s = m/s. Torna-ho a calcular.',
            noNumero: 'Escriu un nombre, amb coma o punt decimal.',
        },
        TVM_OK: function (v) {
            return 'Correcte: TVM = ' + v + ' m/s.';
        },

        // ── Ajuda (§6.1) ─────────────────────────────────────────────────
        PER_QUE_T0:
            'Amb t = 0 tindries 0 m ÷ 0 s, i no es pot dividir per 0. Per això mirem cap a on van les TVM quan t s’acosta a 0, sense arribar-hi.',
        PISTA_TVM: 'Mira com canvien els valors de la columna TVM.',

        // ── Estimació del límit (§6.3) ───────────────────────────────────
        ESTIMA_PREGUNTA: 'Les teves TVM s’acosten a un valor. Quin?',
        ESTIMA_ETIQUETA: 'f′(a) ≈ (m/s)',
        ESTIMA_ERROR: {
            M3: 'La distància es fa petita, però el temps també. Mira el quocient.',
            M5: 'Aquest és el valor de l’interval més gran. Mira com canvia quan t es fa petita.',
            altre: 'Mira els últims valors de la columna TVM: cap a on van?',
            noNumero: 'Escriu un nombre, amb coma o punt decimal.',
        },
        ESTIMA_OK: 'Correcte.',

        // ── Moment de bellesa (§6.3) ─────────────────────────────────────
        BELLESA_VALOR: function (a, v) {
            return (
                'Aquest valor és la velocitat del carretó just a l’instant a = ' +
                a +
                ' s: la derivada de f en a, f′(a) ≈ ' +
                v +
                ' m/s.'
            );
        },
        BELLESA_COTXE: 'El velocímetre d’un cotxe fa el mateix amb intervals de temps molt petits.',
        BELLESA_FOTOGRAMA: function (t, tvm) {
            return 't = ' + t + ' s · TVM = ' + tvm + ' m/s';
        },
        BELLESA_PRECIS: 'Amb un cronòmetre més precís',
        BELLESA_REPETEIX: 'Torna a veure-ho',
        DEFINICIO: 'f′(a) = límit de (f(a + t) − f(a)) / t quan t s’acosta a 0.',
        DEFINICIO_FRASE: 'La TVM és la velocitat mitjana; f′(a) és la velocitat en l’instant a.',

        // ── Practica (§6.5) ──────────────────────────────────────────────
        PRACTICA_TITOL: function (n, total) {
            return 'Exercici ' + n + ' de ' + total;
        },
        P1_INSTRUCCIO: 'Toca el punt on el carretó va més de pressa.',
        P1_PUNT: function (n, x) {
            return 'Punt ' + n + ' (x = ' + x + ' s)';
        },
        P1_ERROR: {
            mesLluny: 'Aquest és el punt més lluny, no el més ràpid. Mira com de dreta puja la línia, no a quina alçada és.',
            altre: 'Compara com de dreta puja la línia a cada punt.',
        },
        P1_OK: 'Correcte. Les tangents mostren la velocitat a cada punt.',
        P2_INSTRUCCIO: function (a) {
            return 'Fes servir el laboratori per estimar f′(a) a a = ' + a + ' s. Mesura amb t cada cop més petita.';
        },
        PRACTICA_FI: 'Has acabat els exercicis.',
        LLIURE_INSTRUCCIO:
            'Tria escenari i a, mesura i calcula cada TVM. El velocímetre és opcional: serveix per comprovar el que trobes.',
        BTN_FOTOGRAMA: 'Següent valor de t',
        BTN_PRACTICA: 'Practica',
        BTN_LLIURE: 'Laboratori lliure',

        // ── Terrenys (§4.3): patró + text, mai només el color ────────────
        TERRENYS: { llis: 'Terra llis', gel: 'Gel', sorra: 'Sorra', pedres: 'Pedres', baixada: 'Baixada' },

        // ── Gràfica i escena ─────────────────────────────────────────────
        EIX_X: 'x (s)',
        EIX_Y: 'f(x) (m)',
        OBSERVADOR_ET: 'Observador',
        CARRETO_ET: 'Carretó',
        ESCENA_ARIA:
            'Pista recta amb l’observador a l’esquerra i el carretó. El carretó es mou allunyant-se de l’observador.',
        GRAFICA_ARIA: 'Gràfica de la distància entre l’observador i el carretó (metres) segons el temps (segons).',
        SECANT_ET: function (tvm) {
            return 'TVM = ' + tvm + ' m/s';
        },
        TRIANGLE_T: function (t) {
            return 't = ' + t + ' s';
        },
        TRIANGLE_D: function (d) {
            return d + ' m';
        },
        TANGENT_ET: function (v) {
            return 'f′(a) = ' + v + ' m/s';
        },

        // ── Peu ──────────────────────────────────────────────────────────
        PEU_PRIVACITAT: 'Res del que fas surt d’aquest ordinador: el progrés només es desa en aquest navegador.',
        PEU_ATRIBUCIO:
            'Material desenvolupat per David Arso Civil per al Departament de Matemàtiques de l’INS Miquel Tarradell. Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT.',
    };
});
