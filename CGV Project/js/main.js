import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
// import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
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
        './textures/level1/posx.jpg',
        './textures/level1/negx.jpg',
        './textures/level1/posy.jpg',
        './textures/level1/negy.jpg',
        './textures/level1/posz.jpg',
        './textures/level1/negz.jpg',
    ]);
    texture.encoding = THREE.sRGBEncoding;
    this.scene.background = texture;

    const cubeTexture = new THREE.TextureLoader().load('./textures/level1/dirtroad.jpg');
    cubeTexture.wrapS = THREE.RepeatWrapping;
    cubeTexture.wrapT = THREE.RepeatWrapping;
    cubeTexture.repeat.set(1,40);
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({map:cubeTexture});
    const floor = new THREE.Mesh( geometry, material );
    this.scene.add( floor );
    var x = 0;
    var y = 0;
    var z = 13;
    const lowPoly = './models/level1/LowPolyBarrier/scene.gltf'
    this.LoadModel(lowPoly,this.scene,x,y,z);
    this.LoadObstacles(this.scene);
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

  LoadObstacles(scene){

    const loader = new GLTFLoader();
    var Obstacles = new THREE.Object3D();
    
    var ObstaclePositions = [];

    var obj1;
    var obj2;
    var obj3;

    loader.load('./models/level1/barrels/scene.gltf',function(gltf){
      obj1 = gltf.scene;
      obj1.position.set(-40,0,-30);
      ObstaclePositions.push(new THREE.Vector3(-40,0,-30));
      //obj1.position.set(-40,0,d);
      obj1.scale.set(0.05,0.05,0.05);
      Obstacles.add(obj1);
      //scene.add(obj1);
      //group.add(obj1);
      loader.load('./models/level1/wheelbarrow/scene.gltf',function(gltf){
            obj2 = gltf.scene;
            obj2.position.set(35,0,-50);
            ObstaclePositions.push(new THREE.Vector3(35,0,-50));
          // obj2.position.set(35,0,d-20);
            obj2.rotation.y = -Math.PI/2;
            obj2.scale.set(4,4,4);
            Obstacles.add(obj2);
          // scene.add(obj2);
          // group.add(obj2);
            loader.load('./models/level1/sandbags/scene.gltf',function(gltf){
                    obj3 = gltf.scene;
                    obj3.position.set(0,0,-90);
                    ObstaclePositions.push(new THREE.Vector3(0,0,-90));
                  // obj3.position.set(0,0,d-60);
                    obj3.rotation.y = Math.PI/2;
                    obj3.scale.set(0.1,0.1,0.1);
                    Obstacles.add(obj3);
                    //scene.add(obj3);
                  //  console.log(Obstacles.clone());
                  scene.add(Obstacles);

                  var d = -300;
                  for(var i=0;i<5;i++){
                    scene.add(Obstacles.clone().translateZ(d));
                    ObstaclePositions.push(new THREE.Vector3(-40,0,-30+d));
                    ObstaclePositions.push(new THREE.Vector3(35,0,-50+d));
                    ObstaclePositions.push(new THREE.Vector3(0,0,-60+d));
                    d = d - 500;
                  }
                  
                  });
      });
     
    });
  
   
    loader.load('./models/level1/spikes/scene.gltf',function(gltf){

        var spikes = new THREE.Object3D();

        var sp = gltf.scene;
        var d = 0
        for( var i=0;i<4;i++){
          var spike = sp.clone();
          spike.position.set(0,0,d);
          spike.scale.set(125,125,125);
          spikes.add(spike);
          d = d - 60;

        }
        ObstaclePositions.push(new THREE.Vector3(0,0,-450));
        ObstaclePositions.push(new THREE.Vector3(0,0,-510));
        ObstaclePositions.push(new THREE.Vector3(0,0,-570));
        ObstaclePositions.push(new THREE.Vector3(0,0,-630));

        ObstaclePositions.push(new THREE.Vector3(0,0,-1750));
        ObstaclePositions.push(new THREE.Vector3(0,0,-1810));
        ObstaclePositions.push(new THREE.Vector3(0,0,-1870));
        ObstaclePositions.push(new THREE.Vector3(0,0,-1930));

        scene.add(spikes.clone().translateZ(-450));
        scene.add(spikes.clone().translateZ(-1750));
       

    });
  
  
    loader.load('./models/level1/Cones/scene.gltf',function(gltf){

      var Cones = new THREE.Object3D();

      var cone = gltf.scene;
      cone.position.set(0,2,-200);
      cone.scale.set(0.1,0.1,0.1);
      Cones.add(cone);
      var cone2 = cone.clone();
      cone2.position.set(0,2,-2100);
      Cones.add(cone2);
      scene.add(Cones);

      ObstaclePositions.push(new THREE.Vector3(0,2,-200));
      ObstaclePositions.push(new THREE.Vector3(0,2,-2100));
    });
    loader.load('./models/level1/hori/scene.gltf',function(gltf){

      var cement = gltf.scene;

      cement.position.set(0,15,-1000);
      cement.scale.set(0.1,0.1,0.1);
      scene.add(cement);

      ObstaclePositions.push(new THREE.Vector3(0,0,-1000));

    });
    loader.load('./models/level1/scaffolding/scene.gltf',function(gltf){

      var scaffolding = gltf.scene;

      scaffolding.position.set(0,0,-1600);
      scene.add(scaffolding);

      ObstaclePositions.push(new THREE.Vector3(0,0,-1600));
    });
    loader.load('./models/level1/crane/scene.gltf',function(gltf){

      var crane = gltf.scene;
      crane.position.set(0,100,-3000);
      crane.scale.set(0.2,0.2,0.2);
      scene.add(crane);
      ObstaclePositions.push(new THREE.Vector3(0,100,-3000));

    });
  }
  LoadModel(path,scene,x,y,z){
    var obj =  new THREE.Object3D();
    const loader = new GLTFLoader();
  
    loader.load(path, function(gltf){
      var obj1 = gltf.scene;
      obj1.position.set(x,y,z);
     //obj1.scale.set(10,10,10);
     obj1.rotation.y = Math.PI/2;
     obj1.scale.set(0.05,0.05,0.05);
     // scene.add(obj1);
      obj.add(obj1);

      var d = -50;
      for(var i=0;i<60;i++){
        var obj2 = obj1.clone();
        var obj3 = obj1.clone();
       obj2.rotation.y += Math.PI/2;
        obj2.position.set(55,0,d);
        obj2.scale.set(0.05,0.05,0.05);
        //obj2.scale.set(10,10,10);
        obj.add(obj2);
       obj3.rotation.y += Math.PI/2;
        obj3.position.set(-55,0,d);
        obj3.scale.set(0.05,0.05,0.05);
       // obj3.scale.set(10,10,10);
        obj.add(obj3);
        d = d -85;
      }
      scene.add(obj);
    });

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


