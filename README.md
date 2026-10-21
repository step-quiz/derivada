# Derivada en un punt

Una eina per a 4t d'ESO: un **carretó** s'allunya d'un **observador** i l'alumnat l'estudia amb un **cronòmetre**. Mesura la distància recorreguda des d'un instant `a` i calcula la **taxa de variació mitjana** (TVM) en intervals `t` cada cop més petits. Les TVM s'acosten a un valor, i aquest valor és la **velocitat just a l'instant `a`**: la derivada `f′(a)`. La gràfica és la distància entre l'observador i el carretó segons el temps; el camí és recte, així que la gràfica no és el dibuix del camí.

Web: https://derivada.step-quiz.net

## Com funciona

| Símbol | Què és | Què es veu |
|---|---|---|
| `x` | instant del rellotge de l'escena, `0 ≤ x ≤ 12` s | «x (s)» |
| `f(x)` | distància entre l'observador i el carretó, `f(0) = 0` | «f(x) (m)» |
| `a` | instant on comença el mesurament | «a» |
| `t` | lectura del cronòmetre: la llargada de l'interval | «t» |
| TVM | `(f(a + t) − f(a)) / t` | «TVM» |
| `f′(a)` | límit de la TVM quan `t` s'acosta a 0 | «f′(a)» |

- **Cronòmetre:** Espai (o el botó «Cronòmetre (Espai)») l'engega i l'atura. El temps s'arrodoneix a la dècima, mai és 0 i no passa del final de la pista (12 s).
- **Torna a a:** `S` (o el botó «Torna a a (S)») torna el carretó a `a` i descarta una mesura que corria. Espai quan ja és aturat no fa res.
- **Canviar `a`:** arrossegar el marcador de la gràfica o tocar l'eix, el camp «a (s)», els botons − i +, o les fletxes ← → (0,1 s; amb Maj, 0,5 s). `a` va a la graella de 0,1 s.
- **Temps programat:** 2, 1, 0,5, 0,2 o 0,1 s. El cronòmetre s'atura sol a aquell `t` exacte (a mà no es pot encertar 0,1 s). Per defecte és manual.
- **Instruments:** cronòmetre (segons i dècimes), comptador de **distància recorreguda des d'a** (metres, 3 decimals) i **distància a l'observador** `f(x)`. Les dues darreres són diferents a propòsit.
- **Registre:** cada aturada afegeix una fila (a, t, d). L'alumne **escriu sempre la TVM**; l'eina no la hi posa. Una resposta errònia rep un missatge que anomena l'error (ha donat la distància, ha dividit al revés, ha fet servir la distància a l'observador, ha multiplicat…).
- **Tolerància:** la TVM escrita val si és a ±0,05 m/s de la correcta; l'estimació de `f′(a)`, a ±0,15 m/s. S'accepten coma i punt decimals.

## Modes

| Mode | Valor de l'adreça | Què fa l'alumne |
|---|---|---|
| Ruta guiada | `guiada` | 5 passos amb l'escenari r1: Mira, Primera TVM, Depèn d'on mires, Interval cada cop més petit, Velocitat just ara |
| Practica | `practica` | Exercicis P1 («Qui va més de pressa?», tria entre tres punts de la gràfica) i P2 («Estima `f′(a)`» amb el laboratori) |
| Laboratori lliure | `lliure` | Tria escenari i `a`, mesura sense tasques; el velocímetre és opcional |

El **velocímetre** i la **tangent** no apareixen a la ruta guiada fins que l'alumne ha estimat el límit. Llavors surt el moment de bellesa: l'agulla a `f′(a)`, la reproducció de les TVM amb `t` = 2, 1, 0,5, 0,2, 0,1, 0,05 i 0,01 s, i la definició. Cap gamificació: res de puntuacions ni estrelles.

**Exercicis P1:** tres punts separats com a mínim 2 s, amb una diferència de velocitat d'almenys 0,4 m/s entre els dos més ràpids, on el punt més lluny **no** és el més ràpid. A r2 la velocitat no decreix mai i cap trio no compleix la regla, així que a r2 només hi ha P2 (9 exercicis en total).

## Escenaris

Cada escenari és un perfil de velocitat `v(x)` (spline cúbic monòton) i trams de terreny en segons; la distància `f(x)` se'n calcula exactament. Totes duren 12 s.

| Escenari | Nom | Terrenys | Ancoratges `a` |
|---|---|---|---|
| r1 | Baixada, gel i sorra | baixada, gel, sorra | 5,5 (guiat) · 6,5 · 2,5 (constant) |
| r2 | Pla, baixada, pla | llis, baixada, llis | 5,0 · 6,0 · 1,0 (constant) |
| r3 | Pedres | pedres | 2,0 · 5,0 |
| r4 | Gel, sorra i baixada | gel, sorra, baixada | 4,0 · 7,5 (aturat) |
| r5 | Terreny variat | llis, pedres, baixada, gel, baixada | 6,0 · 7,0 |

Un ancoratge «constant» és un instant on la velocitat és constant en tot l'interval, de manera que la TVM no depèn de `t`. El terreny es distingeix per **patró i text**, mai només pel color. La baixada es dibuixa com un pla inclinat de 8°.

## Adreces

L'estat va a l'adreça, després del `#`, i es pot compartir: `index.html#mode=lliure&escenari=r4&a=7.5`. Paràmetres: `etapa` (`g0` a `g4`), `mode`, `escenari` (`r1` a `r5`), `a`, `llavor` (la de la barreja dels exercicis) i `projector=1`. Els valors estranys s'ignoren.

## Mode projector i impressió

Botó «Projector» (o `#projector=1`): gràfica a tota l'amplada i lletra gran. La impressió és en blanc i negre, A4, marges de 15 mm, només amb la gràfica i la taula de mesures.

## Com provar-ho a l'ordinador

No cal instal·lar res: **obre `index.html` amb doble clic**. No fa cap petició a internet. El progrés es desa en aquest navegador (`derivada:v1:progres`) i, si no es pot, s'hi treballa igual. Cap dada personal.

## Com està fet

HTML, CSS i JavaScript sense compilació, amb scripts clàssics perquè funcioni amb doble clic.

```
index.html               la pàgina
css/tokens.css           colors (clar i fosc), el de camina sense tocar
css/derivada.css         estils propis, escena, mode projector i impressió
data/escenaris.js        els 5 escenaris: nusos de velocitat, terrenys i ancoratges
js/motor/atzar.js        atzar amb llavor (el de camina)
js/motor/perfil.js       v(x) i f(x) exactes, i la validació de les dades
js/motor/tvm.js          TVM, secant, triangle de pendent, tangent, snap del cronòmetre
js/motor/terreny.js      els terrenys en metres
js/motor/laboratori.js   la màquina d'estats del laboratori i el teclat
js/motor/entrada.js      lectura i classificació del que escriu l'alumne
js/motor/exercicis.js    ancoratges, ruta guiada, exercicis P1 i P2
js/ui/textos.js          tots els textos
js/ui/escena.js          l'escena (SVG)
js/ui/grafica.js         la gràfica (canvas)
js/ui/velocimetre.js     el velocímetre (SVG)
js/ui/app.js             el controlador
tools/versio.py          posa al dia els ?v= dels CSS i JS
```

La velocitat és un spline cúbic d'Hermite monòton (Fritsch–Carlson) i la distància en surt per integració exacta: `f′ = v` sense derivar mai numèricament. La velocitat màxima és 6 m/s i el carretó no va mai enrere.

## Tests

```
node tests/run-all.js
```

| Fitxer | Què comprova |
|---|---|
| `tests/perfil.test.js` | Els valors de referència a ±0,001; que la integral de `v` dona `f` i la derivada de `f` dona `v`; que els trams plans són constants; que el JavaScript coincideix amb `tests/perfil_ref.py` |
| `tests/tvm.test.js` | Les TVM de referència; el «snap» del cronòmetre; el comptador de distància |
| `tests/laboratori.test.js` | La màquina d'estats amb un rellotge fals; el teclat |
| `tests/entrada.test.js` | Cada cas d'error de la TVM i del límit; coma i punt; vores de la tolerància |
| `tests/escenaris.test.js` | Les dades dels 5 escenaris, els ancoratges i els terrenys |
| `tests/exercicis.test.js` | Els exercicis P1 i P2 amb 200 llavors; les condicions de la ruta guiada |
| `tests/repo.test.js` | Fitxers citats, ordre dels scripts, cap adreça externa, cap mòdul ES ni `fetch`, textos curts |
| `tools/versio.py --comprova` | Que cap `?v=` és vell |
| `tests/docs_vs_codi.py` | Que aquest README diu el mateix que el codi |

GitHub els passa a cada pujada a `main` (`.github/workflows/tests.yml`).

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
