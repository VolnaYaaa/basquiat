import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


console.log("✅  et also", OrbitControls, GLTFLoader);


const scene = new THREE.Scene();
const texture = await new THREE.TextureLoader().loadAsync('/src/img/bg_placeholder.jpg');
texture.colorSpace = THREE.SRGBColorSpace;
scene.background = texture;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 3);

const canvas = document.getElementById('bg-smoke'); // ← берём твой canvas из HTML
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// éclairage
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(0, 10, 5);
scene.add(dirLight);

// le contrôle de la souris
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Chargement du modèle GLB
const loader = new GLTFLoader();
loader.load(
  'public/models/model.glb', // 👈 Remplacer par le nom de votre fichier
  (gltf) => {
    scene.add(gltf.scene);

    // Centrage automatique et mise à l'échelle
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    gltf.scene.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, maxDim * 0.5, maxDim * 2);
    controls.update();
  },
  (xhr) => console.log(`Загрузка: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`),
  (error) => console.error('Ошибка загрузки:', error)
);

// Adaptation à la taille de la fenêtre
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  placeElements(); 
});
// Animation
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();













