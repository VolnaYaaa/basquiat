import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SobelOperatorShader } from 'three/addons/shaders/SobelOperatorShader.js';


console.log("✅  et also", OrbitControls, GLTFLoader);


const scene = new THREE.Scene();


// CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 3);

const canvas = document.getElementById('bg-smoke'); // ← берём твой canvas из HTML
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// éclairage
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8888aa, 1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(20, 0, 45);
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xffffff, 3); // intensité réduite
backLight.position.set(-20, 0, -45);
scene.add(backLight);

// le contrôle de la souris
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Chargement du modèle GLB
const loader = new GLTFLoader();
loader.load(
  '/models/buste.glb', // 👈 Remplacer par le nom de votre fichier
  (gltf) => {
    scene.add(gltf.scene);
     gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: child.material.color ?? 0xcccccc, // conserve la couleur d'origine si elle existe
          roughness: 0,  // 0 = miroir, 1 = mat
          metalness: 0.1,  // 0 = non-métallique, 1 = métal pur
        });
      }
    });

    // Centrage automatique et mise à l'échelle
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    gltf.scene.position.sub(center);
    const maxDim = Math.max(6, 2, 2);
    camera.position.set(0, maxDim * 0.2, maxDim * 1);
    controls.update();
    loader.colorSpace = THREE.SRGBColorSpace;
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

const W = 160; // largeur
const H = 60; // hauteur des murs
const D = 160; // profondeur

const room = new THREE.Group();

// Sol
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(W, D),
  new THREE.MeshBasicMaterial({ map: floorTex })
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -H / 2, 0);
room.add(floor);

// Plafond
const ceil = new THREE.Mesh(
  new THREE.PlaneGeometry(W, D),
  new THREE.MeshBasicMaterial({ map: ceilTex })
);
ceil.rotation.x = Math.PI / 2;  // 👈 retourné vers le bas (opposé au sol)
ceil.rotation.z = Math.PI / 4;
ceil.position.set(-36, H / 2, -30); // 👈 symétrique du sol en Y
room.add(ceil);

// Mur gauche
const wallLeft = new THREE.Mesh(
  new THREE.PlaneGeometry(D, H),
  new THREE.MeshBasicMaterial({ map: wallLeftTex })
);
wallLeft.rotation.y = Math.PI / 2;
wallLeft.position.set(-W / 2, 0, 0);
room.add(wallLeft);

// Mur du fond
const wallBack = new THREE.Mesh(
  new THREE.PlaneGeometry(W, H),
  new THREE.MeshBasicMaterial({ map: wallBackTex })
);
wallBack.position.set(0, 0, -D / 2);
room.add(wallBack);

// Rotation du coin à 45° / positionnement de la pièce
room.rotation.y = Math.PI / -4;
room.position.z = 20;
room.position.x = 0;
room.position.y = 10;

scene.add(room);

// Adaptation à la taille de la fenêtre
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  placeElements();
});
// À initialiser UNE SEULE FOIS, en dehors de animate()
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const sobelPass = new ShaderPass(SobelOperatorShader);
sobelPass.uniforms['resolution'].value.set(window.innerWidth * 4, window.innerHeight);
composer.addPass(sobelPass);

// Ces propriétés s'appliquent sur le renderer, pas le composer
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render(); // 👈 remplace renderer.render(scene, camera)
}
animate();