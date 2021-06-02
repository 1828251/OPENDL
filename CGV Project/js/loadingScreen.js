import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

class LoadModelDemo {
  constructor() {
    this.init();
  }

  // we are defining a scene just like the actual game just to load our character onto the loading screen.

  init() {
    // getting the canvas to which we will draw the character
    const mycanvas = document.getElementById('charac');

    // defining a renderer to render the scene
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: mycanvas
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.ResizeWindow();
    }, false);
    // Defining a camera so we can actually see the character
    // perspective camera 
    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(-20, 5, 60);

    this.scene = new THREE.Scene();
    // lights to light up the canvas 
    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this.scene.add(light);
    this.scene.background = new THREE.Color('rgb(9,30,46)');
    // AmbientLight to add better lighting to the characters face
    light = new THREE.AmbientLight(0xFFFFFF, 2.5);
    this.scene.add(light);

    this.mixers = [];
    this.previousRAF = null;

    this.LoadAnimatedModel();
    this.RAF();
  }

// Loading our animated model AJ.
// FBX loader since our model is .fbx format
  LoadAnimatedModel() {
    const loader = new FBXLoader();
    loader.setPath('./models/Character/');
    loader.load('aj.fbx', (fbx) => {
      // Scale the character so he can fit into the scene
      fbx.scale.setScalar(0.1);
      fbx.traverse(c => {
        c.castShadow = true;
      });
      // define another FBX loader to load the Taunting animation
      // We need a mixer for this.
      const anim = new FBXLoader();
      anim.setPath('./models/Character/');
      anim.load('Taunt.fbx', (anim) => {
        const m = new THREE.AnimationMixer(fbx);
        this.mixers.push(m);
        const idle = m.clipAction(anim.animations[0]);
        idle.play();
      });
      this.scene.add(fbx);
    });
  }

  ResizeWindow() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Update the animation with every new frame
  // Frame updates and not real time updates are fine
  RAF() {
    requestAnimationFrame((t) => {
      if (this.previousRAF === null) {
        this.previousRAF = t;
      }

      this.RAF();

      this.renderer.render(this.scene, this.camera);
      this.Step(t - this.previousRAF);
      this.previousRAF = t;
    });
  }

  Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this.mixers) {
      this.mixers.map(m => m.update(timeElapsedS));
    }

    
  }
}
let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new LoadModelDemo();
});