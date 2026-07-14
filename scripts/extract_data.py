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
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
XLS = ROOT / "data" / "informe_test_aprendizaje.xlsx"
OUT = ROOT / "js" / "data.js"


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
            "prom": round(float(r["promedio_global"]), 1),
            "mediana": round(float(r["mediana_global"]), 1),
            "min": round(float(r["minimo_global"]), 1),
            "max": round(float(r["maximo_global"]), 1),
            "sd": round(float(r["sd_global"]), 1),
            "nivel": r["nivel_global"],
            "pct": {
                "insuf": round(float(r["pct_insuficiente"]), 1),
                "ed": round(float(r["pct_en_desarrollo"]), 1),
                "sat": round(float(r["pct_satisfactorio"]), 1),
                "sob": round(float(r["pct_sobresaliente"]), 1),
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
            "prom": round(float(r["promedio_logro"]), 1),
            "nivel": r["nivel_cohorte"],
            "pct": {
                "insuf": round(float(r["pct_insuficiente"]), 1),
                "ed": round(float(r["pct_en_desarrollo"]), 1),
                "sat": round(float(r["pct_satisfactorio"]), 1),
                "sob": round(float(r["pct_sobresaliente"]), 1),
            },
        })

    items = []
    for _, r in ai.iterrows():
        items.append({
            "curso_id": r["nombre_test"],
            "codigo": r["codigo_item"],
            "pct": round(float(r["pct_aciertos"]), 1),
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
