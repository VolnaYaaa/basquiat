import './articles.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import busteUrl    from 'url:../../public/models/export2.glb';
import cursorUrl   from 'url:../img/cursor.png';
import oeuvre1Url  from 'url:../img/oeuvre1.png';
import oeuvre2Url  from 'url:../img/oeuvre2.png';
import oeuvre3Url  from 'url:../img/oeuvre3.png';
import oeuvre4Url  from 'url:../img/oeuvre4.png';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import floorTexUrl     from 'url:../img/wall_b.png';
import wallLeftTexUrl  from 'url:../img/wall_l.png';
import wallRightTexUrl from 'url:../img/wall_r.png';
import ceilTexUrl      from 'url:../img/wall_top.png';


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 6);

const canvas = document.getElementById('bg-smoke');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ─── ÉCLAIRAGE ────────────────────────────────────────────────────────────────

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 8);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(20, 0, 45);
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(-20, 0, -45);
scene.add(backLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ─── RENDER TARGETS ───────────────────────────────────────────────────────────

const originalTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.UnsignedByteType,
});

const busteTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
busteTarget.depthTexture = new THREE.DepthTexture();
busteTarget.depthTexture.type = THREE.UnsignedShortType;

const panelsTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
panelsTarget.depthTexture = new THREE.DepthTexture();
panelsTarget.depthTexture.type = THREE.UnsignedShortType;

const wordsTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
wordsTarget.depthTexture = new THREE.DepthTexture();
wordsTarget.depthTexture.type = THREE.UnsignedShortType;

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
outlinePass.edgeGlow = 0.5;
outlinePass.edgeThickness = 5;
outlinePass.visibleEdgeColor.set(0xffffff);
composer.addPass(outlinePass);

const MaskShader = {
  uniforms: {
    tDiffuse:    { value: null },
    tOriginal:   { value: originalTarget.texture },
    uMouse:      { value: new THREE.Vector2(-999, -999) },
    uRadius:     { value: 80.0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
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
  `,
};
const maskPass = new ShaderPass(MaskShader);
composer.addPass(maskPass);

const DofShader = {
  uniforms: {
    tDiffuse:    { value: null },
    tDepthBuste: { value: null },
    uBlurRadius: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    cameraNear:  { value: camera.near },
    cameraFar:   { value: camera.far },
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
    uniform sampler2D tDepthBuste;
    uniform float uBlurRadius;
    uniform vec2 uResolution;
    uniform float cameraNear;
    uniform float cameraFar;
    varying vec2 vUv;
    float linearizeDepth(float depth) {
      float z = depth * 2.0 - 1.0;
      return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
    }
    void main() {
      float rawDepthBuste = texture2D(tDepthBuste, vUv).r;
      bool isBuste = rawDepthBuste < 0.9999;
      if (isBuste || uBlurRadius <= 0.0) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      vec4 color = vec4(0.0);
      float total = 0.0;
      vec2 texel = uBlurRadius / uResolution;
      for (int x = -4; x <= 4; x++) {
        for (int y = -4; y <= 4; y++) {
          vec2 offset = vec2(float(x), float(y)) * texel;
          float w = exp(-float(x*x + y*y) / 4.0);
          color += texture2D(tDiffuse, vUv + offset) * w;
          total += w;
        }
      }
      gl_FragColor = color / total;
    }
  `,
};
const dofPass = new ShaderPass(DofShader);
composer.addPass(dofPass);

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
      if (panel.a > 0.1 && depthPanel < depthBuste) {
        gl_FragColor = mix(base, panel, panel.a);
      } else {
        gl_FragColor = base;
      }
    }
  `,
};
const blendPass = new ShaderPass(BlendShader);
blendPass.renderToScreen = false;
composer.addPass(blendPass);

const FinalBlendShader = {
  uniforms: {
    tDiffuse:     { value: null },
    tWords:       { value: wordsTarget.texture },
    tDepthBuste:  { value: busteTarget.depthTexture },
    tDepthWords:  { value: wordsTarget.depthTexture },
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
    uniform sampler2D tWords;
    uniform sampler2D tDepthBuste;
    uniform sampler2D tDepthWords;
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
      vec4 word        = texture2D(tWords, vUv);
      float rawPanel   = texture2D(tDepthPanels, vUv).r;
      float depthBuste  = linearizeDepth(texture2D(tDepthBuste, vUv).r);
      float depthWord   = linearizeDepth(texture2D(tDepthWords, vUv).r);
      float depthPanel  = linearizeDepth(rawPanel);
      bool behindPanel = rawPanel < 0.9999 && depthWord > depthPanel;
      if (word.a > 0.05 && depthWord < depthBuste && !behindPanel) {
        gl_FragColor = mix(base, word, word.a);
      } else {
        gl_FragColor = base;
      }
    }
  `,
};
const finalBlendPass = new ShaderPass(FinalBlendShader);
finalBlendPass.renderToScreen = true;
composer.addPass(finalBlendPass);

// ─── SCÈNE PAROIS ────────────────────────────────────────────────────────────

const textureLoaderRoom = new THREE.TextureLoader();

const floorTex     = textureLoaderRoom.load(floorTexUrl);
const wallLeftTex  = textureLoaderRoom.load(wallLeftTexUrl);
const wallRightTex = textureLoaderRoom.load(wallRightTexUrl);
const ceilTex      = textureLoaderRoom.load(ceilTexUrl);

floorTex.colorSpace     = THREE.SRGBColorSpace;
wallLeftTex.colorSpace  = THREE.SRGBColorSpace;
wallRightTex.colorSpace = THREE.SRGBColorSpace;
ceilTex.colorSpace      = THREE.SRGBColorSpace;

const W = 24; // largeur (axe X) — assez étroit pour que les murs latéraux soient bien visibles
const D = 32; // profondeur (axe Z) — la caméra sera près du bord avant
const H = 14; // hauteur (axe Y)

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
ceil.rotation.x = Math.PI / 2;
ceil.position.set(0, H / 2, 0);
room.add(ceil);

// Mur gauche — face intérieure vers +X
const wallLeft = new THREE.Mesh(
  new THREE.PlaneGeometry(D, H),
  new THREE.MeshBasicMaterial({ map: wallLeftTex })
);
wallLeft.rotation.y = Math.PI / 2;
wallLeft.position.set(-W / 2, 0, 0);
room.add(wallLeft);

// Mur droit — face intérieure vers -X
const wallRight = new THREE.Mesh(
  new THREE.PlaneGeometry(D, H),
  new THREE.MeshBasicMaterial({ map: wallRightTex })
);
wallRight.rotation.y = -Math.PI / 2;
wallRight.position.set(W / 2, 0, 0);
room.add(wallRight);

// Mur du fond — face intérieure vers +Z
const wallBack = new THREE.Mesh(
  new THREE.PlaneGeometry(W, H),
  new THREE.MeshBasicMaterial({ map: wallLeftTex })
);
wallBack.rotation.y = Math.PI;
wallBack.position.set(0, 0, -D / 2);
room.add(wallBack);

scene.add(room);
// Pas de décalage X — la salle est centrée sur le buste.
// On décale en Z pour que la caméra (z≈6) soit près du bord avant (D/2 = 16),
// et que le mur du fond soit bien devant.
room.position.set(0, 0, -D / 2 + 10);

const mouse2D = new THREE.Vector2(-999, -999);

// ─── CURSEUR PERSONNALISÉ ─────────────────────────────────────────────────────

document.body.style.cursor = 'none';

const cursorEl = document.createElement('div');
cursorEl.style.cssText = `
  position: fixed;
  pointer-events: none;
  mix-blend-mode: difference;
  z-index: 9999;
  transform: translate(-50%, -50%);
`;
const cursorImg = document.createElement('img');
cursorImg.src = cursorUrl;
cursorImg.style.width = '40px';
cursorEl.appendChild(cursorImg);
document.body.appendChild(cursorEl);

window.addEventListener('mousemove', (e) => {
  mouse2D.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse2D.y = -(e.clientY / window.innerHeight) * 2 + 1;
  maskPass.uniforms['uMouse'].value.set(e.clientX, window.innerHeight - e.clientY);
  cursorEl.style.left = e.clientX + 'px';
  cursorEl.style.top  = e.clientY + 'px';
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
  busteUrl,
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

    const box    = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    gltf.scene.position.sub(center);

    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(0, maxDim * 0.2, maxDim * 1.4);
    controls.update();

    // Synchronise la salle avec la position Y de la caméra
    // et place le bord avant de la salle juste derrière la caméra
    room.position.y = camera.position.y;
    room.position.z = -D / 2 + camera.position.z + 4;

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

// ─── ŒUVRES SUR CYLINDRE ──────────────────────────────────────────────────────

const textureLoader = new THREE.TextureLoader();
const sceneUI = new THREE.Scene();

const cylinderRadius = 8;
const workCount      = 4;
const PANEL_H        = 4.0;

const panelMeshes = [];

const works = [
  { src: oeuvre1Url },
  { src: oeuvre2Url },
  { src: oeuvre3Url },
  { src: oeuvre4Url },
].map((w, i) => ({
  ...w,
  angle: (i / workCount) * Math.PI * 2,
}));

works.forEach(({ src, angle }) => {
  textureLoader.load(src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;

    const panelW    = PANEL_H * (tex.image.width / tex.image.height);
    const wavePhase = Math.random() * Math.PI * 2;

    const geo = new THREE.PlaneGeometry(panelW, PANEL_H, 40, 40);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: tex },
        uTime:    { value: 0.0 },
        uOpacity: { value: 0.0 },
        uPhase:   { value: wavePhase },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPhase;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave =
            sin(pos.x * 2.0 + uTime * 0.9 + uPhase) * 0.14
            + sin(pos.y * 1.5 + uTime * 0.7 + uPhase * 1.2) * 0.09
            + sin(pos.x * 1.0 + pos.y * 1.3 + uTime * 1.1 + uPhase * 0.8) * 0.05;
          pos.z += wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uPhase;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv;
          uv.x += sin(uv.y * 10.0 + uTime * 1.0 + uPhase) * 0.005;
          uv.y += sin(uv.x * 8.0  + uTime * 0.8 + uPhase) * 0.004;
          vec4 col = texture2D(uTexture, uv);
          gl_FragColor = vec4(col.rgb, col.a * uOpacity);
        }
      `,
      transparent: true,
      depthTest:   true,
      depthWrite:  true,
      side:        THREE.DoubleSide,
    });

    const panel = new THREE.Mesh(geo, mat);
    panel.visible = false;

    const x = cylinderRadius * Math.cos(angle);
    const z = cylinderRadius * Math.sin(angle);
    panel.position.set(x, 1.2, z);
    panel.rotation.y = Math.PI / 2 - angle;

    panelMeshes.push(panel);
    sceneUI.add(panel);
  });
});

// ─── NUAGE DE MOTS ────────────────────────────────────────────────────────────

const sceneWords = new THREE.Scene();

const GRAFFITI_COLORS = [
  '#D7261E',
  '#D96C1A',
  '#F2D21B',
  '#6E7B3A',
  '#1F5AA6',
  '#6E3BB8',
  '#8A5A32',
  '#1CA7A6',
];

const GRAFFITI_FONT = getComputedStyle(document.documentElement).getPropertyValue('--graffiti-font').trim().replace(/['"]/g, '');

function makeWordTexture(text, { color, fontSize, font, skew, grayscale = false, strikethrough = false }) {
  const cvs = document.createElement('canvas');
  const ctx = cvs.getContext('2d');

  ctx.font = `${fontSize}px ${font}`;
  const metrics  = ctx.measureText(text);
  const textW    = Math.ceil(metrics.width) + 20;
  const textH    = fontSize + 16;
  const skewPad  = Math.abs(skew) * textH;

  cvs.width  = textW + skewPad * 2;
  cvs.height = textH + 4;

  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.save();
  ctx.transform(1, 0, skew, 1, skewPad, 0);

  ctx.font        = `${fontSize}px ${font}`;
  ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
  ctx.lineWidth   = fontSize * 0.02;
  ctx.lineJoin    = 'round';
  ctx.strokeText(text, 8, fontSize);

  ctx.fillStyle = grayscale ? '#ffffff' : color;
  ctx.fillText(text, 4, fontSize);

  if (strikethrough) {
    const lineY = fontSize
      - metrics.actualBoundingBoxAscent / 2
      + metrics.actualBoundingBoxDescent / 2;
    ctx.strokeStyle = color;
    ctx.lineWidth   = fontSize * 0.07;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(10, lineY);
    ctx.lineTo(10 + Math.ceil(metrics.width), lineY);
    ctx.stroke();
  }

  ctx.restore();

  const tex = new THREE.CanvasTexture(cvs);
  tex.needsUpdate = true;
  return { texture: tex, aspect: cvs.width / cvs.height };
}

function createCurvedPlaneGeometry(worldW, worldH, radius, segmentsW = 24) {
  const arcAngle = worldW / radius;
  const segH     = 2;
  const positions = [], normals = [], uvs = [], indices = [];

  for (let j = 0; j <= segH; j++) {
    for (let i = 0; i <= segmentsW; i++) {
      const u     = i / segmentsW;
      const v     = j / segH;
      const alpha = (u - 0.5) * arcAngle;

      positions.push(
        radius * Math.sin(alpha),
        (v - 0.5) * worldH,
        radius * (Math.cos(alpha) - 1),
      );
      normals.push(-Math.sin(alpha), 0, Math.cos(alpha));
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < segH; j++) {
    for (let i = 0; i < segmentsW; i++) {
      const a = j * (segmentsW + 1) + i;
      const b = a + 1;
      const c = a + (segmentsW + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
  geo.setIndex(indices);
  return geo;
}

function createWordSprite(text, radius) {
  const color    = GRAFFITI_COLORS[Math.floor(Math.random() * GRAFFITI_COLORS.length)];
  const font     = GRAFFITI_FONT;
  const fontSize = 100 + Math.floor(Math.random() * 28);
  const skew     = (Math.random() - 0.5) * 0.4;

  const { texture: textureBW, aspect } = makeWordTexture(text, { color, fontSize, font, skew, grayscale: true });
  const { texture: textureHover }      = makeWordTexture(text, { color, fontSize, font, skew, strikethrough: true });

  const worldH = 0.5 + Math.random() * 0.25;
  const worldW = worldH * aspect;

  const geo = createCurvedPlaneGeometry(worldW, worldH, radius);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMap:     { value: textureBW },
      uOpacity: { value: 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        if (gl_FrontFacing) uv.x = 1.0 - uv.x;
        vec4 col = texture2D(uMap, uv);
        if (col.a < 0.1) discard;
        gl_FragColor = vec4(col.rgb, col.a * uOpacity);
      }
    `,
    transparent: true,
    depthTest:   true,
    depthWrite:  true,
    side:        THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.textureBW    = textureBW;
  mesh.userData.textureHover = textureHover;
  mesh.userData.worldW       = worldW;
  mesh.userData.worldH       = worldH;
  return mesh;
}

function buildWordCloud() {
  const words = Array.from(
    document.querySelectorAll('.article p')
  ).map(p => p.textContent.trim()).filter(Boolean);

  const HEIGHT = 4.5;
  const placed = [];

  words.forEach((word) => {
    const wordRadius = 1.8 + Math.random() * 2.4;
    const sprite = createWordSprite(word, wordRadius);
    const hw = sprite.userData.worldW / 2;
    const hh = sprite.userData.worldH / 2;

    let theta, y;

    for (let attempt = 0; attempt < 60; attempt++) {
      theta = Math.random() * Math.PI * 2;
      y     = (Math.random() - 0.5) * HEIGHT;

      let dThetaFace = Math.abs(theta - Math.PI / 2);
      if (dThetaFace > Math.PI) dThetaFace = Math.PI * 2 - dThetaFace;
      if (dThetaFace < Math.PI / 3 && y > -0.5 && y < 2.5) continue;

      const overlaps = placed.some(p => {
        let dTheta = Math.abs(theta - p.theta);
        if (dTheta > Math.PI) dTheta = Math.PI * 2 - dTheta;
        const arc = dTheta * wordRadius;
        return arc < (hw + p.hw) * 1.1 && Math.abs(y - p.y) < (hh + p.hh) * 1.1;
      });

      if (!overlaps) break;
    }

    const x = wordRadius * Math.cos(theta);
    const z = wordRadius * Math.sin(theta);

    sprite.rotation.y = Math.PI / 2 - theta;
    sprite.position.set(x, y, z);

    sprite.userData.word        = word;
    sprite.userData.baseY       = y;
    sprite.userData.floatSpeed  = 0.9;
    sprite.userData.floatAmpY   = 0.04 + Math.random() * 0.04;
    sprite.userData.floatOffset = Math.random() * Math.PI * 2;

    placed.push({ theta, y, hw, hh });
    sceneWords.add(sprite);
  });
}

document.fonts.load(`100px ${GRAFFITI_FONT}`).then(() => buildWordCloud()).catch(() => buildWordCloud());

// ─── RESIZE ───────────────────────────────────────────────────────────────────

window.addEventListener('click', () => {
  if (hoveredWord) {
    window.dispatchEvent(new CustomEvent('word-click', { detail: { word: hoveredWord.userData.word } }));
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  originalTarget.setSize(window.innerWidth, window.innerHeight);
  busteTarget.setSize(window.innerWidth, window.innerHeight);
  panelsTarget.setSize(window.innerWidth, window.innerHeight);
  wordsTarget.setSize(window.innerWidth, window.innerHeight);
  maskPass.uniforms['uResolution'].value.set(window.innerWidth, window.innerHeight);
  dofPass.uniforms['uResolution'].value.set(window.innerWidth, window.innerHeight);
  sobelPass.uniforms['resolution'].value.set(window.innerWidth * 4, window.innerHeight * 4);
});

// ─── ANIMATE ──────────────────────────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
let hoveredWord = null;

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const t = clock.getElapsedTime();

  sceneWords.children.forEach((obj) => {
    const { baseY, floatSpeed, floatAmpY, floatOffset } = obj.userData;
    if (baseY === undefined) return;
    obj.position.y = baseY + Math.sin(t * floatSpeed + floatOffset) * floatAmpY;
  });

  raycaster.setFromCamera(mouse2D, camera);
  const hit = raycaster.intersectObjects(sceneWords.children)[0]?.object ?? null;
  if (hit !== hoveredWord) {
    if (hoveredWord) hoveredWord.material.uniforms.uMap.value = hoveredWord.userData.textureBW;
    if (hit)         hit.material.uniforms.uMap.value = hit.userData.textureHover;
    hoveredWord = hit;
  }

  renderer.setRenderTarget(originalTarget);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  renderer.setRenderTarget(busteTarget);
  renderer.clear();
  renderer.render(sceneBuste, camera);
  renderer.setRenderTarget(null);

  renderer.setRenderTarget(panelsTarget);
  renderer.setClearColor(0x000000, 0);
  renderer.clear(true, true, false);
  renderer.render(sceneUI, camera);
  renderer.setClearColor(0x000000, 1);
  renderer.setRenderTarget(null);

  renderer.setRenderTarget(wordsTarget);
  renderer.setClearColor(0x000000, 0);
  renderer.clear(true, true, false);
  renderer.render(sceneWords, camera);
  renderer.setClearColor(0x000000, 1);
  renderer.setRenderTarget(null);

  const camDist = camera.position.length();

  const panelFadeStart = 9;
  const panelFadeEnd   = 13;
  const panelOpacity   = Math.max(0, Math.min(1, (camDist - panelFadeStart) / (panelFadeEnd - panelFadeStart)));
  panelMeshes.forEach(mesh => {
    mesh.visible = panelOpacity > 0;
    mesh.material.uniforms.uOpacity.value = panelOpacity;
    mesh.material.uniforms.uTime.value    = t;
  });

  const wordFadeStart = 6.0;
  const wordFadeEnd   = 5.0;
  const wordOpacity   = Math.max(0, Math.min(1, (camDist - wordFadeEnd) / (wordFadeStart - wordFadeEnd)));
  sceneWords.children.forEach(mesh => {
    mesh.visible = wordOpacity > 0;
    if (mesh.material?.uniforms) mesh.material.uniforms.uOpacity.value = wordOpacity;
  });

  const dofNear = 3;
  const dofFar  = 12;
  const dofT    = Math.max(0, Math.min(1, (camDist - dofNear) / (dofFar - dofNear)));
  const maxBlur = 3.0;
  dofPass.uniforms['uBlurRadius'].value = maxBlur * dofT;
  dofPass.uniforms['tDepthBuste'].value = busteTarget.depthTexture;

  maskPass.uniforms['tOriginal'].value      = originalTarget.texture;
  blendPass.uniforms['tPanels'].value       = panelsTarget.texture;
  blendPass.uniforms['tDepthBuste'].value   = busteTarget.depthTexture;
  blendPass.uniforms['tDepthPanels'].value  = panelsTarget.depthTexture;
  finalBlendPass.uniforms['tWords'].value       = wordsTarget.texture;
  finalBlendPass.uniforms['tDepthBuste'].value  = busteTarget.depthTexture;
  finalBlendPass.uniforms['tDepthWords'].value  = wordsTarget.depthTexture;
  finalBlendPass.uniforms['tDepthPanels'].value = panelsTarget.depthTexture;
  composer.render();
}

animate();