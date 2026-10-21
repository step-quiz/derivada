#!/usr/bin/env python3
"""
PROJECTE: derivada (Step Quiz, vanilla JS)
FITXER: tests/docs_vs_codi.py
ROL: Que el README diu el mateix que el codi:
  - les rutes entre `cometes` del README existeixen;
  - els modes són els de js/ui/textos.js (nom i valor de l'adreça);
  - els preajustos, les toleràncies, l'angle de la baixada, els passos d'a, la
    reproducció final i les condicions de P1 són els de la configuració;
  - els 5 escenaris (nom, terrenys) i els ancoratges (i quins són constants) són
    els de data/escenaris.js;
  - els paràmetres de l'adreça i la clau de localStorage.
ÚS: python3 tests/docs_vs_codi.py   (només biblioteca estàndard)
"""
import pathlib
import re
import sys

ARREL = pathlib.Path(__file__).resolve().parent.parent
llegeix = lambda rel: (ARREL / rel).read_text(encoding='utf-8')
errors = []


def comprova(cond, msg):
    if not cond:
        errors.append(msg)


def coma(x):
    """2.0 → '2,0'; 0.5 → '0,5'; 5 → '5'."""
    return str(x).replace('.', ',')


readme = llegeix('README.md')

# 1. Rutes citades
for ruta in re.findall(r'`([^`\s#]+\.(?:js|css|html|py|yml|md))(?:\?[^`]*)?`', readme):
    if ruta.startswith('.github/'):
        continue  # els workflows es creen des del web de GitHub
    comprova((ARREL / ruta).exists(), f'README.md cita `{ruta}`, que no existeix')

# 2. Modes
textos = llegeix('js/ui/textos.js')
mode_blk = re.search(r'MODES: \{(.*?)\n        \},', textos, re.S).group(1)
modes = re.findall(r"(\w+): \{ nom: '([^']+)' \}", mode_blk)
comprova(len(modes) == 3, f'textos.js: s’esperaven 3 modes, n’hi ha {len(modes)}')
for clau, nom in modes:
    comprova(f'| {nom} |' in readme, f'README.md: la taula de modes no té «{nom}»')
    comprova(f'`{clau}`' in readme, f'README.md: no diu el valor `{clau}` de l’adreça')

# 3. Preajustos, toleràncies i altres nombres de la configuració
tvm = llegeix('js/motor/tvm.js')
presets = re.search(r'PRESETS = \[([\d., ]+)\]', tvm).group(1).split(',')
presets = [p.strip() for p in presets]
comprova(presets == ['2', '1', '0.5', '0.2', '0.1'], f'tvm.js: preajustos inesperats {presets}')
frase = ', '.join(coma(p) for p in presets[:-1]) + ' o ' + coma(presets[-1]) + ' s'
comprova(frase in readme, f'README.md: els preajustos haurien de dir «{frase}»')
repro = re.search(r'REPRODUCCIO = \[([\d., ]+)\]', tvm).group(1).split(',')
for t in repro:
    comprova(coma(t.strip()) in readme, f'README.md: falta el valor {t.strip()} de la reproducció final')
comprova('2, 1, 0,5, 0,2, 0,1, 0,05 i 0,01 s' in readme, 'README.md: la llista de la reproducció final és diferent de la del codi')

entrada = llegeix('js/motor/entrada.js')
tol_tvm = re.search(r'tolTVM: ([\d.]+)', entrada).group(1)
tol_lim = re.search(r'tolLimit: ([\d.]+)', entrada).group(1)
comprova(f'±{coma(tol_tvm)} m/s' in readme, f'README.md: la tolerància de la TVM és ±{coma(tol_tvm)} m/s')
comprova(f'±{coma(tol_lim)} m/s' in readme, f'README.md: la tolerància del límit és ±{coma(tol_lim)} m/s')

angle = re.search(r'angleBaixada: (\d+)', llegeix('js/motor/terreny.js')).group(1)
comprova(f'{angle}°' in readme, f'README.md: l’angle de la baixada és {angle}°')

lab = llegeix('js/motor/laboratori.js')
pas = re.search(r'PAS_A = ([\d.]+)', lab).group(1)
pas_gran = re.search(r'PAS_A_GRAN = ([\d.]+)', lab).group(1)
comprova(f'{coma(pas)} s' in readme and f'{coma(pas_gran)} s' in readme, f'README.md: els passos d’a són {coma(pas)} s i {coma(pas_gran)} s')

exe = llegeix('js/motor/exercicis.js')
sep = re.search(r'p1MinSeparacio: ([\d.]+)', exe).group(1)
dif = re.search(r'p1MinDiferencia: ([\d.]+)', exe).group(1)
comprova(f'{coma(sep)} s' in readme, f'README.md: la separació mínima de P1 és {coma(sep)} s')
comprova(f'{coma(dif)} m/s' in readme, f'README.md: la diferència mínima de P1 és {coma(dif)} m/s')
n_etapes = len(re.findall(r"\{ id: 'g\d'", exe))
comprova(f'{n_etapes} passos' in readme, f'README.md: la ruta guiada té {n_etapes} passos')

perfil = llegeix('js/motor/perfil.js')
vmax = re.search(r'vMax: (\d+)', perfil).group(1)
comprova(f'{vmax} m/s' in readme, f'README.md: la velocitat màxima és {vmax} m/s')

# 4. Escenaris i ancoratges
dades = llegeix('data/escenaris.js')
blocs = re.split(r"\n        \{\n            id: '", dades)[1:]
comprova(len(blocs) == 5, f'data/escenaris.js: s’esperaven 5 escenaris, n’hi ha {len(blocs)}')
for b in blocs:
    id_ = b.split("'")[0]
    nom = re.search(r"nom: '([^']+)'", b).group(1)
    tipus = re.findall(r"tipus: '(\w+)' \}", b.split('ancoratges')[0])
    anc = re.search(r'ancoratges: \[(.*?)\],\n        \}', b, re.S).group(1)
    fila = next((l for l in readme.splitlines() if l.startswith(f'| {id_} |')), None)
    comprova(fila is not None, f'README.md: la taula d’escenaris no té {id_}')
    if not fila:
        continue
    comprova(nom in fila, f'README.md: {id_} hauria de dir «{nom}»')
    comprova(', '.join(dict.fromkeys(tipus)) in fila, f'README.md: {id_}: els terrenys haurien de ser «{", ".join(dict.fromkeys(tipus))}»')
    pecas = []
    for m in re.finditer(r'\{ ([^}]+) \}', anc):
        cos = m.group(1)
        a = re.search(r'a: ([\d.]+)', cos).group(1)
        txt = coma(float(a) if '.' in a else a)
        txt = coma(a if '.' in a else a + '')
        if "tipus: 'guiat'" in cos:
            txt += ' (guiat)'
        if "tipus: 'aturat'" in cos:
            txt += ' (aturat)'
        if 'constant: true' in cos:
            txt += ' (constant)'
        pecas.append(txt)
    # el README escriu 5,0 / 6,0 / 1,0 amb un decimal: ho normalitzem
    norm = lambda s: re.sub(r'(\d+),0\b', r'\1', s)
    comprova(norm(' · '.join(pecas)) in norm(fila), f'README.md: {id_}: els ancoratges haurien de ser «{" · ".join(pecas)}»')

# 5. Adreça i emmagatzematge
app = llegeix('js/ui/app.js')
for p in ('etapa', 'mode', 'escenari', 'a', 'llavor', 'projector'):
    comprova(f'`{p}`' in readme or f'`{p}=1`' in readme, f'README.md: no diu el paràmetre `{p}` de l’adreça')
    comprova(f'h.{p}' in app, f'app.js: no llegeix el paràmetre `{p}` de l’adreça')
clau = re.search(r"CLAU = '([^']+)'", app).group(1)
comprova(f'`{clau}`' in readme, f'README.md: no diu la clau de localStorage `{clau}`')

if errors:
    print(f'✗ derivada: {len(errors)} discrepàncies entre la documentació i el codi:')
    for e in errors:
        print('  - ' + e)
    sys.exit(1)
print('✓ derivada: la documentació quadra amb el codi.')
