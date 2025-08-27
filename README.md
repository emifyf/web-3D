# 🚀 Lambda Viewer (Three.js)

Aplicación web para visualizar modelos 3D con Three.js, selección de meshes, clipping interactivo en 6 planos, gizmo de vista y GUI para editar propiedades.

## 📋 Características

- **Carga de proyectos** desde `projects.json` con nombre, tipo, fecha y ruta GLTF
- **Loader GLTF** con materiales estándar y clipping habilitado
- **Selección de mallas** por clic con raycasting y sincronización con GUI
- **GUI (lil-gui)** para:
  - Seleccionar mesh objetivo
  - Cambiar color (color picker)
  - Cambiar opacidad (0–1) con manejo de transparencia y depthWrite
  - Alternar “Clip Only Target” para aplicar clipping solo a la malla seleccionada
  - Ajustar 6 planos de corte: offset y flip por eje
- **Gizmo de vista** (`three-viewport-gizmo`) acoplado a `OrbitControls`
- **Controles de cámara** Orbit (damping, sin pan)
- **Iluminación** ambiente + direccional
- **Reset de vista** al encuadrar el modelo
- **Screenshot** del canvas (descarga PNG)
- **Responsive** y layout con panel lateral de proyectos

## 🛠️ Requisitos

- Node.js 18+

## 🧩 Instalación

```bash
npm install
```

Esto instalará:
- `three`
- `three-viewport-gizmo`
- `vite` (dev)

## ▶️ Desarrollo

```bash
npm run dev
```

- Abre automáticamente en `http://localhost:3000` (ver `vite.config.js`).

## 🏗️ Producción

```bash
npm run build
npm run preview
```

## 📁 Estructura del proyecto

```
web-3D/
├── index.html          # Layout, estilos y importmap (CDN) + main.js
├── main.js             # Lógica Three.js, loaders, GUI, gizmo, clipping
├── projects.json       # Lista de proyectos GLTF (ruta relativa)
├── public/GLTF/        # Modelos GLTF de ejemplo
├── logo.png / logo.svg # Logotipos UI
├── package.json        # Scripts y dependencias
├── vite.config.js      # Puerto 3000 y open
└── README.md
```

## 📦 Proyectos (projects.json)

Define la lista de proyectos visibles en la barra lateral. Ejemplo mínimo:

```json
[
  {
    "name": "Modelo 1",
    "type": "GLTF",
    "date": "2024-11-01",
    "path": "public/GLTF/modelo 2.gltf"
  }
]
```

- El campo `path` debe ser accesible por Vite. Coloca los GLTF en `public/GLTF/` o ajusta la ruta.
- Al hacer clic en un proyecto se limpia la escena y se carga el GLTF correspondiente.

## 🎮 Controles

- **Mouse (OrbitControls)**
  - Arrastrar: orbitar
  - Rueda: zoom
- **Botones UI**
  - `Resetear Vista` / `Home`: encuadrar el modelo actual
  - `Tomar Captura`: descargar `screenshot.png`
- **GUI (panel flotante)**
  - `Target Mesh`: cambiar malla activa
  - `Color`: cambiar color de material
  - `Opacity`: transparencia 0–1 (ajusta `transparent` y `depthWrite`)
  - `Clip Only Target`: aplicar clipping solo a malla activa
  - Carpetas `-X, +X, -Y, +Y, -Z, +Z`: controlar `Offset` y `Flip` de cada plano

## 🔌 Integración y notas

- En `index.html` se usa `importmap` para CDN de Three.js, `OrbitControls`, `GLTFLoader`, `lil-gui`, `CSS2DRenderer` y `three-viewport-gizmo`.
- En `main.js` se importan módulos Three y addons; el gizmo se acopla a los controles.
- El clipping usa 6 planos globales y planos locales por malla para tapas; se exponen controles de offset/flip.
- El botón `Home` restablece la vista y reencuadra el modelo actual.

## ❗ Problemas comunes

- Si no ves modelos, revisa las rutas `path` en `projects.json` y que los archivos existan en `public/GLTF/`.
- Si el gizmo no aparece, verifica la importación de `three-viewport-gizmo` y que `animate()` llame a `gizmo.render()`.
- Transparencias: valores de opacidad < 1 activan `transparent` y desactivan `depthWrite` para orden correcto.

## 📚 Recursos

- Documentación Three.js: https://threejs.org/docs/
- Manual Three.js: https://threejs.org/manual/
- Ejemplos Three.js: https://threejs.org/examples/
- three-viewport-gizmo: https://www.npmjs.com/package/three-viewport-gizmo

## 📄 Licencia

MIT 