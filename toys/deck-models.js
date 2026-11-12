import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

// Inline base64 GLBs (injected at build) so the page runs from file:// with no server.
const SOURCES = {
  bolanggu: window.__GLB_BOLANGGU,
  xiaoniren: window.__GLB_XIAONIREN,
  xiaofengche: window.__GLB_XIAOFENGCHE,
};

// Soft warm studio lighting so the textured toys read like a painted still-life.
class Viewer {
  constructor(id, element) {
    this.id = id;
    this.el = element;
    this.canvas = element.querySelector('canvas');
    this.x = 0.08;          // pitch (drag vertical)
    this.y = -0.35;         // yaw (drag horizontal)
    this.playUntil = 0;
    this.ready = false;
    this.smileBusy = false;
    this.last = 0;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5.4);

    const amb = new THREE.AmbientLight(0xfff6e6, 1.25);
    const key = new THREE.DirectionalLight(0xfff0d2, 2.4);
    key.position.set(2.5, 3.5, 4);
    const fill = new THREE.DirectionalLight(0xbfd2e6, 0.8);
    fill.position.set(-3, -1, 2.5);
    this.scene.add(amb, key, fill);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.mixer = null;
    this.clips = {};

    const loader = new GLTFLoader();
    const bytes = Uint8Array.from(atob(SOURCES[id]), c => c.charCodeAt(0)).buffer;
    loader.parse(bytes, '', (gltf) => {
      const model = gltf.scene;
      // Centre the model and frame it large.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const s = 3.35 / maxDim;
      model.scale.setScalar(s);
      model.position.set(-center.x * s, -center.y * s, -center.z * s);
      this.root.add(model);
      this.model = model;

      this.mixer = new THREE.AnimationMixer(model);
      for (const clip of gltf.animations) {
        this.clips[clip.name] = this.mixer.clipAction(clip);
      }
      // Idle loops: windmill blades always spin; drum gently sways on its own.
      if (id === 'xiaofengche') {
        const c = this.clips['Windmill_SlowSpin_12s'] || Object.values(this.clips)[0];
        if (c) c.play();
      } else if (id === 'bolanggu') {
        const c = Object.values(this.clips)[0];
        if (c) c.play();
      }
      this.ready = true;
      this.draw(performance.now());
    }, undefined, (err) => {
      console.warn('模型加载失败', id, err);
      const m = element.querySelector('.model');
      if (m) m.textContent = '模型暂未载入';
    });
  }

  // Doll: play the open-mouth smile clip once (morph Smile_Open).
  smile() {
    if (!this.ready || this.smileBusy) return false;
    const clip = this.clips['ClickSmile'];
    if (!clip) return false;
    this.smileBusy = true;
    clip.reset().setLoop(THREE.LoopOnce, 1);
    clip.clampWhenFinished = false;
    clip.play();
    this.mixer.addEventListener('finished', (e) => {
      if (e.action === clip) this.smileBusy = false;
    });
    return true;
  }

  draw(ms) {
    if (!this.ready) return;
    const dt = this.last ? Math.min(0.05, (ms - this.last) / 1000) : 0;
    this.last = ms;
    if (this.mixer) this.mixer.update(dt);

    // Doll breathes / drifts slightly when idle.
    let yaw = this.y;
    if (this.id === 'xiaoniren' && !this.smileBusy) yaw += Math.sin(ms / 1000 * 1.3) * 0.07;
    this.root.rotation.set(this.x, yaw, 0);

    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const pr = this.renderer.getPixelRatio();
    if (w > 0 && h > 0 && (this.canvas.width !== Math.round(w * pr) || this.canvas.height !== Math.round(h * pr))) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    try {
      this.mixer?.stopAllAction();
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
    } catch (_) {}
  }
}

window.Viewer = Viewer;
