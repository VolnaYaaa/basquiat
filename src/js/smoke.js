import * as THREE from 'three';

const canvas = document.getElementById('popup-smoke');
const popup = document.getElementById('article-popup');

const smokeScene = new THREE.Scene();

const smokeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
smokeCamera.position.z = 1000;

const smokeRenderer = new THREE.WebGLRenderer({ antialias: false, canvas, alpha: true, powerPreference: 'low-power' });
smokeRenderer.setPixelRatio(1);
smokeRenderer.setSize(window.innerWidth * 0.5, window.innerHeight * 0.5);

// Procedural smoke texture
const texCanvas = document.createElement('canvas');
texCanvas.width = 128;
texCanvas.height = 128;
const ctx = texCanvas.getContext('2d');
const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
gradient.addColorStop(0,   'rgba(30, 30, 30, 0.9)');
gradient.addColorStop(0.5, 'rgba(60, 60, 60, 0.4)');
gradient.addColorStop(1,   'rgba(0,  0,  0,  0)');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 128, 128);

const smokeTexture = new THREE.CanvasTexture(texCanvas);
smokeTexture.colorSpace = THREE.SRGBColorSpace;

const smokeMaterial = new THREE.MeshBasicMaterial({
  map: smokeTexture,
  opacity: 0.4,
  transparent: true,
  depthWrite: false,
});
const smokeGeo = new THREE.PlaneGeometry(300, 300);

const smokeParticles = [];
for (let i = 0; i < 12; i++) {
  const mesh = new THREE.Mesh(smokeGeo, smokeMaterial);
  mesh.scale.set(2, 2, 2);
  // Keep particles in FOV: at z=200 (800 units from camera), half-width ≈ 600
  mesh.position.set(
    (Math.random() - 0.5) * 800,
    (Math.random() - 0.5) * 800,
    Math.random() * 600 - 200
  );
  mesh.rotation.z = Math.random() * Math.PI * 2;
  smokeScene.add(mesh);
  smokeParticles.push(mesh);
}

let rafId = null;
let lastTime = 0;

function animateSmoke(now) {
  rafId = requestAnimationFrame(animateSmoke);
  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  smokeParticles.forEach(p => { p.rotation.z += delta * 0.12; });
  smokeRenderer.render(smokeScene, smokeCamera);
}

function startSmoke() {
  if (rafId === null) {
    lastTime = performance.now();
    requestAnimationFrame(animateSmoke);
  }
}

function stopSmoke() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

const observer = new MutationObserver(() => {
  if (popup.classList.contains('active')) {
    startSmoke();
  } else {
    stopSmoke();
  }
});
observer.observe(popup, { attributes: true, attributeFilter: ['class'] });

if (popup.classList.contains('active')) {
  startSmoke();
}

window.addEventListener('resize', () => {
  smokeCamera.aspect = window.innerWidth / window.innerHeight;
  smokeCamera.updateProjectionMatrix();
  smokeRenderer.setSize(window.innerWidth, window.innerHeight);
});
