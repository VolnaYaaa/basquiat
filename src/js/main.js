import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

console.log("✅  et also", OrbitControls, GLTFLoader);


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Освещение
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Управление мышью
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Загрузка GLB модели
const loader = new GLTFLoader();
loader.load(
  '/models/test.glb', // 👈 замени на имя своего файла
  (gltf) => {
    scene.add(gltf.scene);

    // Авто-центрирование и масштаб
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

// Адаптация под размер окна
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Анимация
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();