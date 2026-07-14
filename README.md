# Dashboard — Test de Aprendizaje

Dashboard institucional de resultados de los Test de Aprendizaje (TA1 / TA2), vista global y por carrera.

## Estructura

```
index.html           # documento principal, ábrelo directo en el navegador (doble clic)
css/styles.css        # estilos
js/data.js            # datos agregados (por curso/competencia/ítem, sin datos de estudiantes)
js/app.js             # lógica de renderizado del dashboard
scripts/
  extract_data.py            # regenera js/data.js desde informe_test_aprendizaje.xlsx
  build_cuadros_oficiales.py # regenera Cuadros_oficiales_por_carrera.xlsx (formato oficial, 6 hojas)
```

Los archivos `.xlsx` (datos crudos con nombres y calificaciones de estudiantes) **no se versionan** — están en `.gitignore` porque contienen información personal. Deben mantenerse solo localmente.

## Ver el dashboard

**En línea:** https://evelyngarcia02.github.io/test_aprendizaje_FACSECYD/

> Nota: esta URL es **pública** — cualquiera con el enlace puede verla (el repositorio también es público). El dashboard no expone nombres de estudiantes, solo agregados por carrera/competencia.

Si el enlace todavía no carga, falta activar GitHub Pages una sola vez (ver abajo).

**En local:** abre `index.html` con doble clic en el explorador de archivos. No necesita servidor ni instalación: los datos están embebidos en `js/data.js`, así que funciona directo desde el disco.

### Activar GitHub Pages (una sola vez)

1. En GitHub, entra al repo → **Settings** → **Pages**.
2. En "Build and deployment" → Source: **Deploy from a branch**.
3. Branch: **master**, carpeta: **/ (root)** → **Save**.
4. Espera 1-2 minutos; el sitio queda publicado en la URL de arriba. Cada `git push` a `master` lo actualiza automáticamente.

## Actualizar los datos (nuevo TA3, correcciones, etc.)

1. Reemplaza/actualiza `informe_test_aprendizaje.xlsx` en la raíz del proyecto con la versión nueva.
2. Instala dependencias una vez: `pip install pandas openpyxl`
3. Corre: `python scripts/extract_data.py` → regenera `js/data.js` (dashboard). Recarga `index.html` para ver los cambios.
4. Corre: `python scripts/build_cuadros_oficiales.py` → regenera `Cuadros_oficiales_por_carrera.xlsx` (6 hojas, una por carrera, con el mismo formato oficial). Este archivo se queda solo en tu máquina, no se sube a git.
