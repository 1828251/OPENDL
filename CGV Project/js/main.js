import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
// import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
// import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import {BasicCharacterController} from './Controls.js';

class ThirdPersonCamera {
  constructor(paramaters) {
    this.params = paramaters;
    this.camera = paramaters.camera;

    this.myPosition = new THREE.Vector3();
    this.LookingAt = new THREE.Vector3();
  }

  calc_offset() {
    const idealOffset = new THREE.Vector3(-15, 20, -30);
    idealOffset.applyQuaternion(this.params.target.Rotation);
    idealOffset.add(this.params.target.Position);
    return idealOffset;
  }

  calc_look() {
    const idealLookat = new THREE.Vector3(0, 10, 50);
    idealLookat.applyQuaternion(this.params.target.Rotation);
    idealLookat.add(this.params.target.Position);
    return idealLookat;
  }

  Update(timeGone) {
    const idealOffset = this.calc_offset();
    const idealLookat = this.calc_look();

    const t = 1.0 - Math.pow(0.001, timeGone);

    this.myPosition.lerp(idealOffset, t);
    this.LookingAt.lerp(idealLookat, t);

    this.camera.position.copy(this.myPosition);
    this.camera.lookAt(this.LookingAt);
  }
}


class ThirdPersonCameraGame {
  constructor() {
    this.init();
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.WindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(25, 10, 25);

    this.scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    this.scene.add(light);

    light = new THREE.AmbientLight(0xFFFFFF, 0.25);
    this.scene.add(light);

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './textures/posx.jpg',
        './textures/negx.jpg',
        './textures/posy.jpg',
        './textures/negy.jpg',
        './textures/posz.jpg',
        './textures/negz.jpg',
    ]);
    texture.encoding = THREE.sRGBEncoding;
    this.scene.background = texture;

    //Coin builder
    function Coins(z){
      var coingeo=new THREE.CylinderGeometry(5,5,2,15);
      const cointexture = new THREE.TextureLoader().load( "./textures/cointexture.png" );
			cointexture.wrapS = THREE.RepeatWrapping;
			cointexture.wrapT = THREE.RepeatWrapping;
			cointexture.repeat.set( 1, 1 );
			const coinmat=new THREE.MeshBasicMaterial({map:cointexture});
      //var coinmat=new THREE.MeshPhongMaterial( {polygonOffset:true,polygonOffsetUnits:1,polygonOffsetFactor:1,color: 0xd4af37} );
      var coin= new THREE.Mesh(coingeo,coinmat);
      coin.position.y=10;   
      coin.position.z=-30*z;   
      coin.position.x=Math.floor(Math.random() * 100) -50;
      coin.rotation.y=Math.PI/2;
      coin.rotation.x=Math.PI/2;
      return coin;
    }

    //Creating all coins
    this.coinPositions=[];
    this.score=0;
    this.x=0;
    var coin;
    for (var i=0;i<20;++i){
      coin=Coins(i);
      this.coinPositions.push(coin);
      this.scene.add(coin);
    }
    
    const cubeTexture = new THREE.TextureLoader().load('./textures/dirtroad.jpg');
    cubeTexture.wrapS = THREE.RepeatWrapping;
    cubeTexture.wrapT = THREE.RepeatWrapping;
    cubeTexture.repeat.set(1,40);
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({map:cubeTexture});
    const floor = new THREE.Mesh( geometry, material );
    this.scene.add( floor );
    floor.scale.set(120,0,-10000);
    var d = -20000;
    for(var i =0;i<10;i++){
        const newFloor = new THREE.Mesh( geometry, material );
        newFloor.position.set(0,0,d);
        d = d - 10000;
        this.scene.add( newFloor );
        newFloor.scale.set(120,0,-10000);
    }

    this.mixers = [];
    this.old_animation_frames = null;

    this.LoadAnimatedModel();
    this.request_animation_frame();
  }

  LoadAnimatedModel() {
    const paramaters = {
      camera: this.camera,
      scene: this.scene,
    }
    this.control = new BasicCharacterController(paramaters);

    this.ThirdPersonCamera = new ThirdPersonCamera({
      camera: this.camera,
      target: this.control,
    });
  }

  WindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }


  request_animation_frame() {
    requestAnimationFrame((t) => {
      if (this.old_animation_frames === null) {
        this.old_animation_frames = t;
      }
      this.request_animation_frame();
      
      //checks for interaction between player and all the coins
      for (var i=0;i<this.coinPositions.length;++i){
              if (Math.abs(this.control.myPosition.z-this.coinPositions[i].position.z)<0.5 && Math.abs(this.control.myPosition.x-this.coinPositions[i].position.x)<5){
          this.score+=1;
          console.log("score: "+this.score);
          this.scene.remove(this.coinPositions[i]);
          this.coinPositions.splice(i,1);
        }
      }

      //coin jumping
      this.x+=0.2;
      for (var i=0;i<this.coinPositions.length;++i){
        this.coinPositions[i].position.y+=(Math.sin(this.x)/10);
      }
      
      this.renderer.render(this.scene, this.camera);
      this.Step(t - this.old_animation_frames);
      this.old_animation_frames = t;
    });
  }

  Step(timeGone) {
    const timeGoneS = timeGone * 0.001;
    if (this.mixers) {
      this.mixers.map(m => m.update(timeGoneS));
    }

    if (this.control) {
      this.control.Update(timeGoneS);
    }

    this.ThirdPersonCamera.Update(timeGoneS);
  }
}


let APP = null;

window.addEventListener('DOMContentLoaded', () => {
  APP = new ThirdPersonCameraGame();
});


