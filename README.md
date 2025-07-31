# 🚀 Proyecto Three.js

Un proyecto 3D interactivo creado con Three.js que incluye una escena con objetos animados, iluminación y controles de cámara.

## 📋 Características

- ✨ Escena 3D con múltiples objetos animados
- 🎮 Controles de cámara interactivos (OrbitControls)
- 💡 Sistema de iluminación avanzado con sombras
- 📱 Diseño responsive
- 🎯 Contador de FPS en tiempo real
- 🌈 Objetos con colores aleatorios y animaciones únicas

## 🛠️ Instalación

### 1. Inicializar npm e instalar dependencias

```bash
# Inicializar el proyecto (si no tienes package.json)
npm init -y

# Instalar Three.js y Vite
npm install three
npm install --save-dev vite
```

### 2. Ejecutar el proyecto

```bash
# Iniciar servidor de desarrollo
npm run dev
```

El proyecto se abrirá automáticamente en `http://localhost:3000`

## 🎮 Controles

- **🖱️ Click + arrastrar**: Rotar la cámara alrededor de la escena
- **🔍 Scroll**: Acercar/alejar la cámara
- **⌨️ WASD**: Mover la cámara (si está habilitado)

## 📁 Estructura del Proyecto

```
web-3D/
├── index.html          # Archivo HTML principal
├── main.js            # Código JavaScript con Three.js
├── package.json       # Configuración de npm
├── vite.config.js     # Configuración de Vite
└── README.md          # Este archivo
```

## 🔧 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye el proyecto para producción
- `npm run preview`: Previsualiza la versión de producción

## 🎨 Personalización

Puedes modificar el archivo `main.js` para:

- Cambiar colores y materiales
- Agregar más objetos 3D
- Modificar animaciones
- Ajustar iluminación
- Agregar efectos especiales

## 📚 Recursos

- [Documentación oficial de Three.js](https://threejs.org/docs/)
- [Manual de Three.js](https://threejs.org/manual/)
- [Ejemplos de Three.js](https://threejs.org/examples/)

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Siéntete libre de:

1. Reportar bugs
2. Sugerir nuevas características
3. Enviar pull requests

## 📄 Licencia

MIT License - ver archivo LICENSE para más detalles. 