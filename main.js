import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// Variables globales
let scene, camera, renderer, controls;
let stlMeshes = [];
let fpsElement;
let clock = new THREE.Clock();
// --- CLIPPING PLANE (PLANO DE CORTE) ---

// Esta variable global almacenará el plano de corte que se aplicará a todos los modelos STL
let clippingPlane;
let globalBoundingBox = null;
let stlFilesLoaded = 0;
let stlFilesAttempted = 0;

// Colores posibles: azul, rojo, blanco, gris, amarillo
const COLORS = [0x1976d2, 0xd32f2f, 0xffffff, 0x888888, 0xffeb3b];

// Lista de archivos STL a cargar
const STL_FILES = [
  'modelo.stl',
  'vertebrae_C1.stl',
  'vertebrae_C2.stl',
  'vertebrae_C3.stl',
  'vein.stl'
];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.localClippingEnabled = true; // Habilitar clipping local
    document.getElementById('container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Luz ambiental fuerte para ver relieve
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    // El piso se crea después de cargar los modelos
    stlFilesLoaded = 0;
    stlFilesAttempted = 0;
    STL_FILES.forEach(filename => {
        loadSTL(`/STL/${filename}`, () => {
            stlFilesLoaded++;
            stlFilesAttempted++;
            checkSTLLoadingComplete();
        }, () => {
            stlFilesAttempted++;
            checkSTLLoadingComplete();
        });
    });

    window.addEventListener('resize', onWindowResize);
    fpsElement = document.getElementById('fps');
    animate();
}

// Cargar archivo STL y respetar su posición original
function loadSTL(path, onSuccess, onError) {
    const loader = new STLLoader();
    loader.load(path, function (geometry) {
        geometry.computeBoundingBox();
        // Color aleatorio para cada modelo
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const material = new THREE.MeshLambertMaterial({
            color: color,
            side: THREE.DoubleSide,
            clippingPlanes: [] // Se setea después
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        stlMeshes.push(mesh);

        // Actualizar bounding box global
        if (!globalBoundingBox) {
            globalBoundingBox = geometry.boundingBox.clone();
        } else {
            globalBoundingBox.union(geometry.boundingBox);
        }

        if (onSuccess) onSuccess();
    }, undefined, function (err) {
        if (onError) onError(err);
    });
}

function checkSTLLoadingComplete() {
    if (stlFilesAttempted === STL_FILES.length) {
        if (stlMeshes.length > 0) {
            centerCameraAndSlider();
            createClippingSlider();
        } else {
            removeClippingSlider();
        }
    }
}

// Centrar la cámara y ajustar el slider y el piso
function centerCameraAndSlider() {
    if (!globalBoundingBox) return;
    const center = new THREE.Vector3();
    globalBoundingBox.getCenter(center);
    controls.target.copy(center);
    controls.update();

    // Definimos el rango del slider y el valor inicial del plano de corte
    const minY = globalBoundingBox.min.y;
    const maxY = globalBoundingBox.max.y;
    const centerY = center.y;

    // --- CREACIÓN DEL PLANO DE CORTE ---
    // El plano de corte se define con una normal apuntando hacia arriba (eje Y negativo)
    // y pasa por el centro vertical del bounding box global de los modelos
    clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -centerY);

    // --- ASIGNACIÓN DEL PLANO DE CORTE A LOS MODELOS ---
    // Recorremos todos los modelos STL y les asignamos el plano de corte
    // Esto permite que el corte afecte a todos los modelos simultáneamente
    stlMeshes.forEach(mesh => {
        mesh.material.clippingPlanes = [clippingPlane]; // Asignar el plano
        mesh.material.needsUpdate = true; // Forzar actualización del material
    });

    // Actualizamos el slider para que controle el plano de corte
    updateClippingSliderRange(minY, maxY, centerY);

    // Crear el piso adaptativo
    createAdaptiveGround(center);
}

function createAdaptiveGround(center) {
    // Elimina el piso anterior si existe
    const prev = scene.getObjectByName('adaptiveGround');
    if (prev) scene.remove(prev);
    if (!globalBoundingBox) return;

    const width = globalBoundingBox.max.x - globalBoundingBox.min.x;
    const depth = globalBoundingBox.max.z - globalBoundingBox.min.z;
    const groundWidth = width * 1.2;
    const groundDepth = depth * 1.2;
    const groundY = globalBoundingBox.min.y - 0.01;

    const groundGeometry = new THREE.PlaneGeometry(groundWidth, groundDepth);
    const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x2c3e50,
        transparent: true,
        opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = groundY;
    ground.name = 'adaptiveGround';
    scene.add(ground);
}

function createClippingSlider() {
    let slider = document.getElementById('clipY');
    if (!slider) {
        slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'clipY';
        slider.step = 0.1;
        slider.style.position = 'absolute';
        slider.style.right = '20px';
        slider.style.top = '20px';
        slider.style.zIndex = 200;
        document.body.appendChild(slider);
    }
    slider.style.display = '';
    // --- CONTROL DEL PLANO DE CORTE POR SLIDER ---
    // Cada vez que el usuario mueve el slider, se actualiza la posición del plano de corte
    slider.addEventListener('input', (e) => {
        // El valor del slider se usa para mover el plano de corte en Y
        // (el signo menos es porque el plano está definido con normal hacia -Y)
        clippingPlane.constant = -parseFloat(e.target.value);
    });
}

function removeClippingSlider() {
    let slider = document.getElementById('clipY');
    if (slider) {
        slider.style.display = 'none';
    }
}

function updateClippingSliderRange(min, max, center) {
    let slider = document.getElementById('clipY');
    if (slider) {
        slider.min = min;
        slider.max = max;
        slider.value = center;
        clippingPlane.constant = -center;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    controls.update();
    renderer.render(scene, camera);
    const fps = Math.round(1 / deltaTime);
    if (fpsElement) {
        fpsElement.textContent = fps;
    }
}

document.addEventListener('DOMContentLoaded', init); 