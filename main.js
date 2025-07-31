import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// Variables globales
let scene, camera, renderer, controls;
let stlMeshes = [];
let fpsElement;
let clock = new THREE.Clock();
let clippingPlanes = { xmin: null, xmax: null, ymin: null, ymax: null, zmin: null, zmax: null };
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
    stlMeshes = [];
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
            centerCameraAndSliders();
        }
    }
}

function centerCameraAndSliders() {
    if (!globalBoundingBox) return;
    const center = new THREE.Vector3();
    globalBoundingBox.getCenter(center);
    controls.target.copy(center);
    controls.update();

    // Crear los 6 clipping planes globales (Xmin, Xmax, Ymin, Ymax, Zmin, Zmax)
    const minX = globalBoundingBox.min.x;
    const maxX = globalBoundingBox.max.x;
    const minY = globalBoundingBox.min.y;
    const maxY = globalBoundingBox.max.y;
    const minZ = globalBoundingBox.min.z;
    const maxZ = globalBoundingBox.max.z;

    clippingPlanes.xmin = new THREE.Plane(new THREE.Vector3(1, 0, 0), -minX);   // X min
    clippingPlanes.xmax = new THREE.Plane(new THREE.Vector3(-1, 0, 0), maxX);   // X max
    clippingPlanes.ymin = new THREE.Plane(new THREE.Vector3(0, 1, 0), -minY);   // Y min
    clippingPlanes.ymax = new THREE.Plane(new THREE.Vector3(0, -1, 0), maxY);   // Y max
    clippingPlanes.zmin = new THREE.Plane(new THREE.Vector3(0, 0, 1), -minZ);   // Z min
    clippingPlanes.zmax = new THREE.Plane(new THREE.Vector3(0, 0, -1), maxZ);   // Z max

    // Asignar los 6 planos a todos los modelos
    stlMeshes.forEach(mesh => {
        mesh.material.clippingPlanes = [
            clippingPlanes.xmin, clippingPlanes.xmax,
            clippingPlanes.ymin, clippingPlanes.ymax,
            clippingPlanes.zmin, clippingPlanes.zmax
        ];
        mesh.material.needsUpdate = true;
    });

    createClipSliders({
        minX, maxX,
        minY, maxY,
        minZ, maxZ
    });
    createAdaptiveGround(center);
}

function createClipSliders(bounds) {
    // Eliminar sliders previos si existen
    const ids = ['clipXmin', 'clipXmax', 'clipYmin', 'clipYmax', 'clipZmin', 'clipZmax'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.parentElement.remove();
    });

    // Crear contenedor
    let slidersContainer = document.getElementById('clip-sliders');
    if (!slidersContainer) {
        slidersContainer = document.createElement('div');
        slidersContainer.id = 'clip-sliders';
        slidersContainer.style.position = 'absolute';
        slidersContainer.style.right = '20px';
        slidersContainer.style.top = '20px';
        slidersContainer.style.zIndex = 200;
        slidersContainer.style.display = 'flex';
        slidersContainer.style.flexDirection = 'column';
        slidersContainer.style.gap = '8px';
        slidersContainer.style.background = 'rgba(0,0,0,0.2)';
        slidersContainer.style.padding = '10px 12px 10px 12px';
        slidersContainer.style.borderRadius = '10px';
        document.body.appendChild(slidersContainer);
    }
    slidersContainer.innerHTML = '';

    // Helper para crear cada slider
    function addSlider(labelText, id, min, max, value, onInput) {
        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.color = 'white';
        label.style.marginRight = '8px';
        label.style.fontSize = '13px';
        label.style.width = '80px';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = id;
        slider.min = min;
        slider.max = max;
        slider.value = value;
        slider.step = 0.1;
        slider.style.width = '180px';
        slider.oninput = onInput;
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.appendChild(label);
        wrapper.appendChild(slider);
        slidersContainer.appendChild(wrapper);
    }

    // Sliders para X
    addSlider('Clip X min:', 'clipXmin', bounds.minX, bounds.maxX, bounds.minX, (e) => {
        clippingPlanes.xmin.constant = -parseFloat(e.target.value);
    });
    addSlider('Clip X max:', 'clipXmax', bounds.minX, bounds.maxX, bounds.maxX, (e) => {
        clippingPlanes.xmax.constant = parseFloat(e.target.value);
    });
    // Sliders para Y
    addSlider('Clip Y min:', 'clipYmin', bounds.minY, bounds.maxY, bounds.minY, (e) => {
        clippingPlanes.ymin.constant = -parseFloat(e.target.value);
    });
    addSlider('Clip Y max:', 'clipYmax', bounds.minY, bounds.maxY, bounds.maxY, (e) => {
        clippingPlanes.ymax.constant = parseFloat(e.target.value);
    });
    // Sliders para Z
    addSlider('Clip Z min:', 'clipZmin', bounds.minZ, bounds.maxZ, bounds.minZ, (e) => {
        clippingPlanes.zmin.constant = -parseFloat(e.target.value);
    });
    addSlider('Clip Z max:', 'clipZmax', bounds.minZ, bounds.maxZ, bounds.maxZ, (e) => {
        clippingPlanes.zmax.constant = parseFloat(e.target.value);
    });
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