import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader }   from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI }          from 'three/examples/jsm/libs/lil-gui.module.min.js';

let scene, camera, renderer, controls;
const planes = [];
const planeHelpers = [];
const guiParams = {};
const clipState = {};

init();
function init(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.01, 1000);
  camera.position.set(5,5,5);
  renderer = new THREE.WebGLRenderer({ antialias:true, stencil:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.localClippingEnabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping=true;
  scene.add(new THREE.AmbientLight(0xffffff,0.6));
  scene.add((() => {const l=new THREE.DirectionalLight(0xffffff,1);l.position.set(5,10,7);return l;})());

  const normals = [
    new THREE.Vector3(-1,0,0),new THREE.Vector3(1,0,0),
    new THREE.Vector3(0,-1,0),new THREE.Vector3(0,1,0),
    new THREE.Vector3(0,0,-1),new THREE.Vector3(0,0,1)
  ];
  normals.forEach((n,i)=>{
    const p = new THREE.Plane(n.clone(),0);
    planes.push(p);
    const h = new THREE.PlaneHelper(p,5,0xff0000);
    h.visible=false;
    planeHelpers.push(h);
    scene.add(h);
    guiParams[`plane${i}`] = 0;
    clipState[`neg${i}`] = false;
  });

  loadGLTF('/GLTF/modelo.gltf');
  window.addEventListener('resize', onResize);
  animate();
}

function loadGLTF(path){
  new GLTFLoader().load(path, gltf => {
    const root = gltf.scene;
    scene.add(root);
    root.traverse(mesh => {
      if(!mesh.isMesh) return;
      mesh.material = new THREE.MeshStandardMaterial({
        color: mesh.material.color || 0xffc107,
        metalness:0.2, roughness:0.7,
        clippingPlanes:planes,
        clipShadows:true
      });
    });
    frameCamera(root);
    setupStencilCaps(root);
    setupGUI();
  },undefined,err=>console.error('Load error',err));
}

function frameCamera(root){
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  camera.position.copy(center).add(new THREE.Vector3(1,1,1).multiplyScalar(size));
  controls.target.copy(center); controls.update();
}

function setupStencilCaps(root){
  const box = new THREE.Box3().setFromObject(root);
  const def = [
    {n:new THREE.Vector3(1,0,0),c:-box.min.x},
    {n:new THREE.Vector3(-1,0,0),c:box.max.x},
    {n:new THREE.Vector3(0,1,0),c:-box.min.y},
    {n:new THREE.Vector3(0,-1,0),c:box.max.y},
    {n:new THREE.Vector3(0,0,1),c:-box.min.z},
    {n:new THREE.Vector3(0,0,-1),c:box.max.z},
  ];
  def.forEach((d,i)=>{
    planes[i].normal.copy(d.n); planes[i].constant = d.c;
  });
}

function setupGUI(){
  const gui = new GUI();
  gui.add({showPlane:false}, 'showPlane').name('Show planes').onChange(v => planeHelpers.forEach(h=>h.visible=v));
  planes.forEach((p,i)=>{
    gui.add(guiParams, `plane${i}`, -10,10,0.1).name(`Plane ${i}`).onChange(v=>p.constant = v);
    gui.add(clipState, `neg${i}`, false).name(`Flip ${i}`).onChange(()=>{
      p.negate();
      guiParams[`plane${i}`] = p.constant;
    });
  });
}

function onResize(){
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
