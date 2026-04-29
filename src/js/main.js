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

// ─── RENDER TARGETS ───────────────────────────────────────────────────────────

// Scène principale → post-processing + masque circulaire
const originalTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.UnsignedByteType,
});

// Buste seul → pour isoler son depth
const busteTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
busteTarget.depthTexture = new THREE.DepthTexture();
busteTarget.depthTexture.type = THREE.UnsignedShortType;

// Panneaux seuls → depth isolé
const panelsTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
panelsTarget.depthTexture = new THREE.DepthTexture();
panelsTarget.depthTexture.type = THREE.UnsignedShortType;

// ─── POST-PROCESSING ──────────────────────────────────────────────────────────

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

// Masque circulaire
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
      float dist = distance(fragCoord, uMouse);
      vec4 processed = texture2D(tDiffuse, vUv);
      vec4 original  = texture2D(tOriginal, vUv);
      float mask = smoothstep(uRadius - 100.0, uRadius + 100.0, dist);
      gl_FragColor = mix(original, processed, mask);
    }
  `
};
const maskPass = new ShaderPass(MaskShader);
composer.addPass(maskPass);

// Blend final : panneaux par-dessus, masqués par le depth du buste
const BlendShader = {
  uniforms: {
    tDiffuse:     { value: null },
    tPanels:      { value: panelsTarget.texture },
    tDepthBuste:  { value: busteTarget.depthTexture },
    tDepthPanels: { value: panelsTarget.depthTexture },
    cameraNear:   { value: camera.near },
    cameraFar:    { value: camera.far },
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
    uniform sampler2D tPanels;
    uniform sampler2D tDepthBuste;
    uniform sampler2D tDepthPanels;
    uniform float cameraNear;
    uniform float cameraFar;
    varying vec2 vUv;

    float linearizeDepth(float depth) {
      float z = depth * 2.0 - 1.0;
      return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
    }

    void main() {
      vec4 base        = texture2D(tDiffuse, vUv);
      vec4 panel       = texture2D(tPanels, vUv);
      float depthBuste = linearizeDepth(texture2D(tDepthBuste, vUv).r);
      float depthPanel = linearizeDepth(texture2D(tDepthPanels, vUv).r);

      // Affiche le panneau uniquement s'il est devant le buste
      if (panel.a > 0.1 && depthPanel < depthBuste) {
        gl_FragColor = mix(base, panel, panel.a);
      } else {
        gl_FragColor = base;
      }
    }
  `
};
const blendPass = new ShaderPass(BlendShader);
blendPass.renderToScreen = true;
composer.addPass(blendPass);

// ─── BOUTON FILTRE ────────────────────────────────────────────────────────────

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

window.addEventListener('mousemove', (e) => {
  if (!filterActive) return;
  maskPass.uniforms['uMouse'].value.set(e.clientX, window.innerHeight - e.clientY);
});

// ─── SCÈNE BUSTE (isolée pour le depth) ───────────────────────────────────────

const sceneBuste = new THREE.Scene();
sceneBuste.add(new THREE.HemisphereLight(0xffffff, 0x8888aa, 1));
const dirLight2 = new THREE.DirectionalLight(0xffffff, 3);
dirLight2.position.set(20, 0, 45);
sceneBuste.add(dirLight2);
const backLight2 = new THREE.DirectionalLight(0xffffff, 3);
backLight2.position.set(-20, 0, -45);
sceneBuste.add(backLight2);

const loader = new GLTFLoader();

loader.load(
  '/models/buste.glb',
  (gltf) => {
    // Buste dans la scène principale (post-processing + Sobel)
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

    const box    = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    gltf.scene.position.sub(center);

    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, maxDim * 0.2, maxDim * 1.4);
    controls.update();

    // Clone dans sceneBuste pour capturer son depth isolément
    const busteClone = gltf.scene.clone(true);
    busteClone.position.copy(gltf.scene.position);
    busteClone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          roughness: 0,
          metalness: 0.1,
        });
      }
    });
    sceneBuste.add(busteClone);
  },
  (xhr) => console.log(`Chargement: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`),
  (error) => console.error('Erreur de chargement:', error)
);

// ─── ATELIER 3D ───────────────────────────────────────────────────────────────

const textureLoader = new THREE.TextureLoader();

const floorTex    = textureLoader.load('/src/img/wall_b.png');
const wallLeftTex = textureLoader.load('/src/img/wall_l.png');
const wallBackTex = textureLoader.load('/src/img/wall_r.png');
const ceilTex     = textureLoader.load('/src/img/wall_top.png');

floorTex.colorSpace    = THREE.SRGBColorSpace;
wallLeftTex.colorSpace = THREE.SRGBColorSpace;
wallBackTex.colorSpace = THREE.SRGBColorSpace;
ceilTex.colorSpace     = THREE.SRGBColorSpace;

const W = 160, H = 60, D = 160;
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
room.position.set(0, 10, 20);
scene.add(room);

// ─── ŒUVRES SUR CYLINDRE ──────────────────────────────────────────────────────

const sceneUI = new THREE.Scene();

const cylinderRadius = 4;
const cylinderHeight = 4;
const arcAngle       = Math.PI / 6;
const segments       = 20;
const workCount      = 4;
const panelWidth     = cylinderRadius * arcAngle;
const panelHeight    = cylinderHeight;

const works = [
  { src: '/src/img/oeuvre1.png' },
  { src: '/src/img/oeuvre2.png' },
  { src: '/src/img/oeuvre3.png' },
  { src: '/src/img/oeuvre4.png' },
].map((w, i) => ({
  ...w,
  angle: (i / workCount) * Math.PI * 2
}));

works.forEach(({ src, angle }) => {
  const texture = textureLoader.load(src, (tex) => {
    const imgRatio   = tex.image.width / tex.image.height;
    const panelRatio = panelWidth / panelHeight;

    if (imgRatio > panelRatio) {
      const scale = panelRatio / imgRatio;
      tex.repeat.set(scale, 1);
      tex.offset.set((1 - scale) / 2, 0);
    } else {
      const scale = imgRatio / panelRatio;
      tex.repeat.set(1, scale);
      tex.offset.set(0, (1 - scale) / 2);
    }
    tex.needsUpdate = true;
  });

  texture.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.CylinderGeometry(
    cylinderRadius, cylinderRadius, cylinderHeight,
    segments, 1, true,
    angle - arcAngle * 2, arcAngle
  );

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.2,
    depthTest: true,
    depthWrite: true,
  });

  const panel = new THREE.Mesh(geo, mat);
  panel.position.set(0, 0.35, 0);
  sceneUI.add(panel);
});

// ─── RESIZE ───────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  originalTarget.setSize(window.innerWidth, window.innerHeight);
  busteTarget.setSize(window.innerWidth, window.innerHeight);
  panelsTarget.setSize(window.innerWidth, window.innerHeight);
  maskPass.uniforms['uResolution'].value.set(window.innerWidth, window.innerHeight);
  sobelPass.uniforms['resolution'].value.set(window.innerWidth * 4, window.innerHeight * 4);
});

// ─── ANIMATE ──────────────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // 1. Scène principale → originalTarget (masque circulaire + post-processing)
  renderer.setRenderTarget(originalTarget);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  // 2. Buste seul → busteTarget (depth isolé)
  renderer.setRenderTarget(busteTarget);
  renderer.clear();
  renderer.render(sceneBuste, camera);
  renderer.setRenderTarget(null);

  // 3. Panneaux seuls → panelsTarget (depth isolé, color transparent)
  renderer.setRenderTarget(panelsTarget);
  renderer.setClearColor(0x000000, 0);
  renderer.clear(true, true, false); // efface color + depth uniquement
  renderer.render(sceneUI, camera);
  renderer.setClearColor(0x000000, 1);
  renderer.setRenderTarget(null);

  // 4. Mise à jour des uniforms et rendu final
  maskPass.uniforms['tOriginal'].value     = originalTarget.texture;
  blendPass.uniforms['tPanels'].value      = panelsTarget.texture;
  blendPass.uniforms['tDepthBuste'].value  = busteTarget.depthTexture;
  blendPass.uniforms['tDepthPanels'].value = panelsTarget.depthTexture;
  composer.render();
}

animate();