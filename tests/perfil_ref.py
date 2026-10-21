#!/usr/bin/env python3
"""
PROJECTE: derivada (Step Quiz, vanilla JS)
FITXER: tests/perfil_ref.py
ROL: Implementació de REFERÈNCIA, independent del JavaScript (docs/SPEC.md, apèndix A),
     del perfil exacte. tests/perfil.test.js hi passa els escenaris per stdin (JSON:
     {id: nusos}) i en llegeix, per stdout, f, v i les TVM en una graella.
ÚS: echo '{"r": [[0,1],[4,1],[12,5]]}' | python3 tests/perfil_ref.py
"""
import json
import sys


def construeix(nusos):
    x = [k[0] for k in nusos]; v = [k[1] for k in nusos]; n = len(x)
    D = [x[i+1]-x[i] for i in range(n-1)]
    q = [(v[i+1]-v[i])/D[i] for i in range(n-1)]
    m = [0.0]*n; m[0] = q[0]; m[-1] = q[-1]
    for k in range(1, n-1):
        if q[k-1]*q[k] <= 0:
            m[k] = 0.0
        else:
            w1 = 2*D[k]+D[k-1]; w2 = D[k]+2*D[k-1]
            m[k] = (w1+w2)/(w1/q[k-1]+w2/q[k])
    trams = []; F = 0.0
    for i in range(n-1):
        c = (3*q[i]-2*m[i]-m[i+1])/D[i]
        e = (m[i]+m[i+1]-2*q[i])/(D[i]**2)
        trams.append((x[i], x[i+1], v[i], m[i], c, e, F))
        F += v[i]*D[i] + m[i]*D[i]**2/2 + c*D[i]**3/3 + e*D[i]**4/4
    return trams

def _tram(trams, x):
    for p in trams:
        if x <= p[1] or p is trams[-1]:
            return p

def vel(trams, x):
    x0, _, a, b, c, e, _ = _tram(trams, x); s = x-x0
    return a + b*s + c*s*s + e*s**3

def pos(trams, x):
    x0, _, a, b, c, e, F = _tram(trams, x); s = x-x0
    return F + a*s + b*s*s/2 + c*s**3/3 + e*s**4/4

def tvm(trams, a, t):
    return (pos(trams, a+t) - pos(trams, a)) / t


PRESETS = [2, 1, 0.5, 0.2, 0.1]

if __name__ == '__main__':
    escenaris = json.load(sys.stdin)
    sortida = {}
    for id_, nusos in escenaris.items():
        T = construeix(nusos)
        X = nusos[-1][0]
        xs = [i * 0.25 for i in range(int(X * 4) + 1)]
        anc = [i * 0.5 for i in range(int((X - 2) * 2) + 1)]
        sortida[id_] = {
            'x': xs,
            'f': [pos(T, x) for x in xs],
            'v': [vel(T, x) for x in xs],
            'a': anc,
            'tvm': [[tvm(T, a, t) for t in PRESETS] for a in anc],
        }
    json.dump(sortida, sys.stdout)
