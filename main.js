import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let scene, camera, renderer, controls;
let colorController;
let transparencyController;
const planes = [];
const planeHelpers = [];
const guiParams = { color: '#FFC107', opacity: 1, showHelpers: false };
const clipState = {};
const selectableMeshes = [];


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedMeshIndex = -1;
const meshSettings = new Map();






const projects = [
  { name: "Modelo", path: "./GLTF/modelo.gltf", type: "Craneal", date: "21/8/2025" },
  { name: "Modelo 2", path: "./GLTF/modelo 2.gltf", type: "Craneal", date: "21/8/2025" },
  { name: "Modelo 3", path: "./GLTF/modelo 3.gltf", type: "Craneal", date: "21/8/2025" }
];

function loadProjects() {
  const list = document.getElementById("projectList");
  list.innerHTML = "";

  projects.forEach((p, i) => {
    const li = document.createElement("li");
    li.style.cursor = "pointer";
    li.style.padding = "8px";
    li.style.borderBottom = "1px solid #ddd";
    li.innerHTML = `
      <strong>${p.name}</strong><br>
      <small>${p.type} • ${p.date}</small>
    `;

    li.onclick = () => {
      loadProject(i);
      highlightProject(list, li);
    };

    list.appendChild(li);
  });
}

function highlightProject(list, li) {
  [...list.children].forEach(c => c.style.background = "");
  li.style.background = "#d0ebff";
}







function loadProject(index) {
  const project = projects[index];

  // limpiar escena (manteniendo luces y helpers)
  scene.children = scene.children.filter(o => o.isLight || o.type === "PlaneHelper" || o.isCamera);

  selectableMeshes.length = 0;
  meshSettings.clear();

  loadGLTF(project.path);
}
init();
function init(){
    window.addEventListener('click', onClick, false);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.01, 1000);
  camera.position.set(5,5,5);

  renderer = new THREE.WebGLRenderer({ antialias:true, stencil:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.localClippingEnabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  const axisNames = ['-.X','+.X','-.Y','+.Y','-.Z','+.Z'];
  const normals = [
    new THREE.Vector3(-1,0,0), new THREE.Vector3(1,0,0),
    new THREE.Vector3(0,-1,0), new THREE.Vector3(0,1,0),
    new THREE.Vector3(0,0,-1), new THREE.Vector3(0,0,1)
  ];
  normals.forEach((n,i)=>{
    const pl = new THREE.Plane(n.clone(), 0);
    planes.push(pl);
    const ph = new THREE.PlaneHelper(pl, 5, new THREE.Color(0xff0000));
    ph.visible = false;
    planeHelpers.push(ph);
    scene.add(ph);
    clipState[`offset${i}`] = 0;
    clipState[`flip${i}`] = false;
  });

  // loadGLTF('/GLTF/modelo.gltf');
  loadProjects();


  window.addEventListener('resize', onResize);
  animate();
}
function onClick(event) {
    console.log('click');
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      selectableMeshes.filter(m => m.material.opacity > 0 && m.visible)
    );
  
  
    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      selectedMeshIndex = selectableMeshes.indexOf(mesh);
      guiParams.selectedMesh = selectedMeshIndex;
  
      // Recuperar color y opacidad de la malla
      const settings = meshSettings.get(mesh) || {
        name:mesh.name,
        color: '#' + mesh.material.color.getHexString(),
        opacity: mesh.material.opacity
      };

      guiParams.color = settings.color;
      guiParams.opacity = settings.opacity;

      

      colorController.setValue(guiParams.color);
      transparencyController.setValue(guiParams.opacity);
    }
    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      selectedMeshIndex = selectableMeshes.indexOf(mesh);
      guiParams.selectedMesh = selectedMeshIndex;
    
      const settings = meshSettings.get(mesh) || {
        name: mesh.name,
        color: '#' + mesh.material.color.getHexString(),
        opacity: mesh.material.opacity
      };
    
      guiParams.color = settings.color;
      guiParams.opacity = settings.opacity;
    
      // 🔑 Actualizamos los controles de GUI
      updateClippingState()
      meshSelectorController.setValue(selectedMeshIndex);
      colorController.setValue(guiParams.color);
      transparencyController.setValue(guiParams.opacity);
    }
  }
  
function loadGLTF(path){
  new GLTFLoader().load(path,
    gltf => {
        
      const root = gltf.scene;
      scene.add(root);

      root.traverse(obj => {
        if (obj.isMesh) {
          const box = new THREE.Box3().setFromObject(obj);
          console.log(box)
  const { min, max } = box;
  const localPlanes = [
    new THREE.Plane(new THREE.Vector3(1,0,0), -min.x),
    new THREE.Plane(new THREE.Vector3(-1,0,0), max.x),
    new THREE.Plane(new THREE.Vector3(0,1,0), -min.y),
    new THREE.Plane(new THREE.Vector3(0,-1,0), max.y),
    new THREE.Plane(new THREE.Vector3(0,0,1), -min.z),
    new THREE.Plane(new THREE.Vector3(0,0,-1), max.z),
  ];
          obj.material = new THREE.MeshStandardMaterial({
            color:obj.material.color,
            metalness: 0.2,
            roughness: 0.7,
            transparent: true, 
            opacity: guiParams.opacity,
            clippingPlanes: planes,
            clipShadows: true
          });
          obj.userData.localPlanes = localPlanes;
        }
      });




        frameCamera(root);
        setupStencilCaps(root);

      // initialize clipping
      root.traverse(child => {
        if (child.isMesh) {
          selectableMeshes.push(child);
        }
      });


      setupGUI();
    },
    undefined, error => console.error('GLTF load error:', error)
  );
}

function setupStencilCaps(root){
    const box = new THREE.Box3().setFromObject(root);
    console.log(box)
    const def = [
      {n:new THREE.Vector3(1,0,0),c:-box.min.x},
      {n:new THREE.Vector3(-1,0,0),c:box.max.x},
      {n:new THREE.Vector3(0,1,0),c:-box.min.y},
      {n:new THREE.Vector3(0,-1,0),c:box.max.y},
      {n:new THREE.Vector3(0,0,1),c:-box.min.z},
      {n:new THREE.Vector3(0,0,-1),c:box.max.z},
    ];
    def.forEach((d,i)=>{
      planes[i].normal.copy(d.n); 
      planes[i].constant = d.c; 
  
      // 👇 inicializamos los offsets con los valores correctos
      clipState[`offset${i}`] = d.c;
    });
}

function frameCamera(root){
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    camera.position.copy(center).add(new THREE.Vector3(1,1,1).multiplyScalar(size));
    controls.target.copy(center); controls.update();
}




let meshSelectorController; // 👉 declaramos global
guiParams.clipSelectedOnly = false;

function setupGUI(){
  const gui = new GUI();

  // gui.add(guiParams, 'showHelpers').name('Show Planes')
  //   .onChange(v => planeHelpers.forEach(ph => ph.visible = v));

  const meshOptions = {};
  selectableMeshes.forEach((mesh, i) => {
    meshOptions[mesh.name || `Mesh_${i}`] = i;
  });

  guiParams.selectedMesh = 0;
    
  meshSelectorController = gui.add(guiParams, 'selectedMesh', meshOptions)
    .name('Target Mesh')
    .onChange(i => {
      const target = selectableMeshes[i];
      const settings = meshSettings.get(target) || {
        color: '#' + target.material.color.getHexString(),
        opacity: target.material.opacity
      };
      guiParams.color = settings.color;
      guiParams.opacity = settings.opacity;
      colorController.setValue(guiParams.color);
      transparencyController.setValue(guiParams.opacity);
      updateClippingState()
    });

    
  // gui.add({ screenshot: takeScreenshot }, 'screenshot').name('📷 Screenshot');

  gui.add(guiParams, 'clipSelectedOnly').name('Clip Only Target').onChange(v => {
      selectableMeshes.forEach((mesh, i) => {
        if (v) {
          // Solo el seleccionado se clipea
          mesh.material.clippingPlanes = (i === guiParams.selectedMesh) ? planes : [];
        } else {
          // Todos se clipean
          mesh.material.clippingPlanes = planes;
        }
      });
    });


  colorController = gui.addColor(guiParams, 'color').name('Color').onChange(c => {
    const mesh = selectableMeshes[guiParams.selectedMesh];
    mesh.material.color.set(c);
    saveMeshSettings(mesh);
  });

  transparencyController = gui.add(guiParams, 'opacity', 0,1,0.01).name('Opacity').onChange(v => {
    const mesh = selectableMeshes[guiParams.selectedMesh];
    mesh.material.opacity = v;
    mesh.material.transparent = v < 1;
    // importante para translucidez correcta:
    mesh.material.depthWrite = (v === 1); // si es transparente, desactivar depthWrite
    mesh.material.needsUpdate = true;
    saveMeshSettings(mesh);
  });

  // planos
  const axisNames = ['-X','+X','-Y','+Y','-Z','+Z'];
  planes.forEach((pl,i)=>{
    const folder = gui.addFolder(axisNames[i]);
    folder.add(clipState, `offset${i}`, -0.1, 0.1, 0.001).name('Offset').onChange(v => pl.constant = v);
    folder.add(clipState, `flip${i}`, false).name('Flip').onChange(()=>{
      pl.negate(); 
      clipState[`offset${i}`]=pl.constant;
    });
    folder.open();
  });
}



function updateClippingState() {
  selectableMeshes.forEach((mesh, i) => {
    mesh.material.clippingPlanes = (guiParams.clipSelectedOnly && i !== guiParams.selectedMesh) 
      ? [] 
      : planes;
  });
}


function saveMeshSettings(mesh) {
    meshSettings.set(mesh, {
      color: '#' + mesh.material.color.getHexString(),
      opacity: mesh.material.opacity
    });
}
 

function getMesh(mesh){
  selectableMeshes.forEach((mesh, i) => {
  meshOptions[mesh.name] = i;
});
}

function onResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}


function takeScreenshot() {
  const dataURL = renderer.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'screenshot.png';
  link.click();
}