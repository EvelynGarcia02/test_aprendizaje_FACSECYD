"""
Regenera js/data.js a partir de data/informe_test_aprendizaje.xlsx.

Uso:
    python scripts/extract_data.py

Requiere: pandas, openpyxl  (pip install pandas openpyxl)

Lee las hojas Cohorte_Global, Cohorte_x_Competencia, Aciertos_x_Item,
Estudiante_Global y Estudiante_x_Competencia de data/informe_test_aprendizaje.xlsx
y escribe un unico archivo JS con "const DATA = {...};" que el dashboard
carga directamente (sin fetch, para que funcione abriendo index.html sin
necesidad de un servidor local).
"""
import json
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
XLS = ROOT / "data" / "informe_test_aprendizaje.xlsx"
OUT = ROOT / "js" / "data.js"


def r1(x):
    """Redondea a 1 decimal con 'mitad hacia arriba' (como Excel), evitando
    el error de punto flotante de round() built-in (ej. round(64.35, 1) == 64.3
    porque 64.35 no es representable exacto en binario)."""
    return float(Decimal(str(float(x))).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def main():
    cg = pd.read_excel(XLS, sheet_name="Cohorte_Global")
    cc = pd.read_excel(XLS, sheet_name="Cohorte_x_Competencia")
    ai = pd.read_excel(XLS, sheet_name="Aciertos_x_Item")
    eg = pd.read_excel(XLS, sheet_name="Estudiante_Global")
    ec = pd.read_excel(XLS, sheet_name="Estudiante_x_Competencia")

    nitems = ec.groupby(["nombre_test", "competencia"])["n_items"].first().to_dict()

    courses = []
    for _, r in cg.iterrows():
        nt = r["nombre_test"]
        counts = eg[eg["nombre_test"] == nt]["nivel_global"].value_counts().to_dict()

        def cnt(prefix):
            for k, v in counts.items():
                if k.startswith(prefix):
                    return int(v)
            return 0

        courses.append({
            "id": nt,
            "carrera": r["carrera_nombre"],
            "modalidad": r["modalidad_nombre"],
            "ta": int(r["nro_test"]),
            "n": int(r["n_estudiantes_unicos"]),
            "prom": r1(r["promedio_global"]),
            "mediana": r1(r["mediana_global"]),
            "min": r1(r["minimo_global"]),
            "max": r1(r["maximo_global"]),
            "sd": r1(r["sd_global"]),
            "nivel": r["nivel_global"],
            "pct": {
                "insuf": r1(r["pct_insuficiente"]),
                "ed": r1(r["pct_en_desarrollo"]),
                "sat": r1(r["pct_satisfactorio"]),
                "sob": r1(r["pct_sobresaliente"]),
            },
            "counts": {
                "insuf": cnt("Insuf"),
                "ed": cnt("En des"),
                "sat": cnt("Satisf"),
                "sob": cnt("Sobres"),
            },
        })

    competencias = []
    for _, r in cc.iterrows():
        key = (r["nombre_test"], r["competencia"])
        competencias.append({
            "curso_id": r["nombre_test"],
            "competencia": r["competencia"],
            "tipo": "Específica" if r["competencia"].startswith("CE") else "Transversal",
            "n_items": int(nitems.get(key, 0)),
            "prom": r1(r["promedio_logro"]),
            "nivel": r["nivel_cohorte"],
            "pct": {
                "insuf": r1(r["pct_insuficiente"]),
                "ed": r1(r["pct_en_desarrollo"]),
                "sat": r1(r["pct_satisfactorio"]),
                "sob": r1(r["pct_sobresaliente"]),
            },
        })

    items = []
    for _, r in ai.iterrows():
        items.append({
            "curso_id": r["nombre_test"],
            "codigo": r["codigo_item"],
            "pct": r1(r["pct_aciertos"]),
            "competencias": r["competencias_evaluadas"],
        })

    data = {"courses": courses, "competencias": competencias, "items": items}

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("const DATA = ")
        json.dump(data, f, ensure_ascii=False)
        f.write(";\n")

    print(f"Escrito {OUT} — {len(courses)} aplicaciones del test, {len(competencias)} filas de competencia, {len(items)} items.")


if __name__ == "__main__":
    main()
