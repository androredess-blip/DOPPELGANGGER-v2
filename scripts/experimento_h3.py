# Hecho con apoyo de un asistente de IA (Claude, Anthropic) y revisado por el equipo Gatitácticos.
# Written with help from an AI assistant (Claude, Anthropic) and reviewed by team Gatitácticos.
"""Experimento H3: fuerza bruta contra KD-tree para buscar análogos en una malla global.

Cada celda de la malla es un vector de k indicadores entre 0 y 1. Buscamos las
t celdas más parecidas (más cercanas) a un perfil objetivo, para varios perfiles.

Uso:
    python scripts/experimento_h3.py

Requiere numpy y scipy (pip install numpy scipy).
Los datos son sintéticos (uniformes); con datos reales, más agrupados,
el KD-tree suele rendir mejor.
"""

import time
from statistics import median

import numpy as np
from scipy.spatial import cKDTree

RNG = np.random.default_rng(14)
CONSULTAS = 100        # perfiles objetivo a buscar
T = 10                 # vecinos por perfil
REPETICIONES = 5
TAMANOS = [1_000, 10_000, 64_800, 259_200]   # 64 800 = malla de 1°, 259 200 = malla de 0.5°
DIMENSIONES = [8, 16]                        # 8 = una por dimensión, 16 = todos los indicadores


def fuerza_bruta(celdas, perfiles, t):
    """Distancia a todas las celdas y selección parcial de las t menores."""
    resultado = []
    for p in perfiles:
        d = np.sum((celdas - p) ** 2, axis=1)
        resultado.append(np.argpartition(d, t)[:t])
    return resultado


def con_kdtree(celdas, perfiles, t):
    arbol = cKDTree(celdas)
    _, idx = arbol.query(perfiles, k=t)
    return idx


def medir(funcion, *args):
    tiempos = []
    for _ in range(REPETICIONES):
        inicio = time.perf_counter()
        funcion(*args)
        tiempos.append((time.perf_counter() - inicio) * 1000)
    return median(tiempos)


def main():
    print(f"{'k':>3} {'N celdas':>10} {'fuerza bruta (ms)':>18} {'KD-tree (ms)':>14} {'aceleración':>12}")
    for k in DIMENSIONES:
        for n in TAMANOS:
            celdas = RNG.random((n, k))
            perfiles = RNG.random((CONSULTAS, k))
            bruta = medir(fuerza_bruta, celdas, perfiles, T)
            arbol = medir(con_kdtree, celdas, perfiles, T)
            print(f"{k:>3} {n:>10,} {bruta:>18.1f} {arbol:>14.1f} {bruta / arbol:>11.1f}x")


if __name__ == "__main__":
    main()
