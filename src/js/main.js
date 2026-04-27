import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SobelOperatorShader } from 'three/addons/shaders/SobelOperatorShader.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 6);

const canvas = document.getElementById('bg-smoke');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Éclairage
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8888aa, 1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(20, 0, 45);
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xffffff, 3);
backLight.position.set(-20, 0, -45);
scene.add(backLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// POSTPROCESSING
const originalTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.UnsignedByteType
});

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const sobelPass = new ShaderPass(SobelOperatorShader);
sobelPass.uniforms['resolution'].value.set(window.innerWidth * 4, window.innerHeight * 4);
composer.addPass(sobelPass);

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 0;
outlinePass.edgeThickness = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
composer.addPass(outlinePass);

// SHADER DE MASQUE CARRÉ
const MaskShader = {
  uniforms: {
    tDiffuse:    { value: null },
    tOriginal:   { value: originalTarget.texture },
    uMouse:      { value: new THREE.Vector2(-999, -999) },
    uRadius:     { value: 80.0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tOriginal;
    uniform vec2 uMouse;
    uniform float uRadius;
    uniform vec2 uResolution;
    varying vec2 vUv;

    void main() {
      vec2 fragCoord = vUv * uResolution;
      vec2 d = abs(fragCoord - uMouse);
      float dist = max(d.x, d.y);
      vec4 processed = texture2D(tDiffuse, vUv);
      vec4 original  = texture2D(tOriginal, vUv);
      float mask = smoothstep(uRadius - 20.0, uRadius + 20.0, dist);
      gl_FragColor = mix(original, processed, mask);
    }
  `
};

const maskPass = new ShaderPass(MaskShader);
composer.addPass(maskPass);

// BOUTON FILTRE
const btn = document.createElement('button');
btn.textContent = 'Désactiver le filtre';
btn.style.cssText = `
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  padding: 10px 18px;
  background: #000;
  color: #fff;
  border: 1px solid #fff;
  font-family: monospace;
  font-size: 13px;
  cursor: pointer;
`;
document.body.appendChild(btn);

let filterActive = true;

btn.addEventListener('click', () => {
  filterActive = !filterActive;
  btn.textContent = filterActive ? 'Désactiver le filtre' : 'Activer le filtre';

  if (!filterActive) {
    maskPass.uniforms['uMouse'].value.set(-9999, -9999);
    maskPass.uniforms['uRadius'].value = 99999;
  } else {
    maskPass.uniforms['uRadius'].value = 80.0;
  }
});

// Suivi de la souris
window.addEventListener('mousemove', (e) => {
  if (!filterActive) return;
  maskPass.uniforms['uMouse'].value.set(
    e.clientX,
    window.innerHeight - e.clientY
  );
});

// Chargement du modèle GLB
const loader = new GLTFLoader();
loader.load(
  '/models/buste.glb',
  (gltf) => {
    scene.add(gltf.scene);

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: child.material.color ?? 0xcccccc,
          roughness: 0,
          metalness: 0.1,
        });
      }
    });

    outlinePass.selectedObjects = [gltf.scene];

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    gltf.scene.position.sub(center);
    const size = box.getSize(new THREE.Vector3()); // ✅ corrigé
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, maxDim * 0.2, maxDim * 2);
    controls.update();
  },
  (xhr) => console.log(`Загрузка: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`),
  (error) => console.error('Ошибка загрузки:', error)
);

// ATELIER 3D
const textureLoader = new THREE.TextureLoader();

const floorTex    = textureLoader.load('/src/img/wall_b.png');
const wallLeftTex = textureLoader.load('/src/img/wall_l.png');
const wallBackTex = textureLoader.load('/src/img/wall_r.png');
const ceilTex     = textureLoader.load('/src/img/wall_top.png');

floorTex.colorSpace    = THREE.SRGBColorSpace;
wallLeftTex.colorSpace = THREE.SRGBColorSpace;
wallBackTex.colorSpace = THREE.SRGBColorSpace;
ceilTex.colorSpace     = THREE.SRGBColorSpace;

const W = 160;
const H = 60;
const D = 160;

const room = new THREE.Group();

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(W, D),
  new THREE.MeshBasicMaterial({ map: floorTex })
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -H / 2, 0);
room.add(floor);

const ceil = new THREE.Mesh(
  new THREE.PlaneGeometry(W, D),
  new THREE.MeshBasicMaterial({ map: ceilTex })
);
ceil.rotation.x = Math.PI / 2;
ceil.rotation.z = Math.PI / 4;
ceil.position.set(-36, H / 2, -30);
room.add(ceil);

const wallLeft = new THREE.Mesh(
  new THREE.PlaneGeometry(D, H),
  new THREE.MeshBasicMaterial({ map: wallLeftTex })
);
wallLeft.rotation.y = Math.PI / 2;
wallLeft.position.set(-W / 2, 0, 0);
room.add(wallLeft);

const wallBack = new THREE.Mesh(
  new THREE.PlaneGeometry(W, H),
  new THREE.MeshBasicMaterial({ map: wallBackTex })
);
wallBack.position.set(0, 0, -D / 2);
room.add(wallBack);

room.rotation.y = Math.PI / -4;
room.position.z = 20;
room.position.x = 0;
room.position.y = 10;
scene.add(room);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  originalTarget.setSize(window.innerWidth, window.innerHeight);
  maskPass.uniforms['uResolution'].value.set(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // 1. Capture de la scène brute AVANT tout effet
  renderer.setRenderTarget(originalTarget);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  // 2. Réassignation explicite à chaque frame
  maskPass.uniforms['tOriginal'].value = originalTarget.texture;

  // 3. Rendu avec effets
  composer.render();
}
animate();