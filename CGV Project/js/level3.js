import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { BasicCharacterController } from './Controls.js';
import { Coins } from './Coins.js'

var isPlay = true;
class ThirdPersonCamera {
  constructor(paramaters) {
    this.params = paramaters;
    this.camera = paramaters.camera;

    this.myPosition = new THREE.Vector3();
    this.LookingAt = new THREE.Vector3();
  }

  calc_offset(View) {
    // Calculate the idea offset.
    // THis represents the angle at which the position the camera will be
    // we position the camera slightly to the right and over the shoulder of the character
    var idealOffset;
    if (View == 0) {
      idealOffset = new THREE.Vector3(-15, 20, -30);
    }
    else if (View == 1) {
      idealOffset = new THREE.Vector3(0, 20, -30);
    }
    else if (View == 2) {
      idealOffset = new THREE.Vector3(0, 15, 10);
    }
    idealOffset.applyQuaternion(this.params.target.Rotation);
    idealOffset.add(this.params.target.Position);
    return idealOffset;
  }

  calc_look() {
    //This is where the camera is looking
    // We want the camera to be looking ahead of the player
    // The camera looks at what the character is looking at but the camera is behind the character so we make it look a little ahead
    const idealLookat = new THREE.Vector3(0, 10, 50);
    idealLookat.applyQuaternion(this.params.target.Rotation);
    idealLookat.add(this.params.target.Position);
    return idealLookat;
  }

  Update(timeGone, View) {
    const idealOffset = this.calc_offset(View);
    const idealLookat = this.calc_look();
    //We are just updating the camera's position relative to the time gone.
    // we add a certain delay to have the camera have a natural adjustment as the player moves through the scene
    const t = 1.0 - Math.pow(0.001, timeGone);

    this.myPosition.lerp(idealOffset, t);
    this.LookingAt.lerp(idealLookat, t);
    this.camera.position.copy(this.myPosition);
    this.camera.lookAt(this.LookingAt);
  }
}
class ThirdPersonCameraGame {
  constructor() {
    this.discoballs = [];
    this.clock = new THREE.Clock();
    this.time = 50;
    this.init();
  }

  init() {

    // defining a rendererPhongMat for the scene
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      depthTest: true,
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
    // using a PerspectiveCamera as our primary camera
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(25, 10, 25);

    // creating the scene
    this.scene = new THREE.Scene();

    //Audio listener to facilitate coin sound effects
    this.coinListener = new THREE.AudioListener();
    this.camera.add(this.coinListener);

    this.coinSound = new THREE.Audio(this.coinListener);
    this.audioLoader = new THREE.AudioLoader().load('./audio/coin-touch.wav', (buffer) => {
      this.coinSound.setBuffer(buffer);
      this.coinSound.setVolume(1.5);
    });
    //Audio listener to facilitate jump sound effects  
    this.jumpListener = new THREE.AudioListener();
    this.camera.add(this.jumpListener);

    this.jumpSound = new THREE.Audio(this.jumpListener);
    this.audioLoader2 = new THREE.AudioLoader().load('./audio/player-jumping.wav', (buffer) => {
      this.jumpSound.setBuffer(buffer);
      this.jumpSound.setVolume(1.5);
    });



    //Creating a loading manager which we will use for  a loading screen while the scene loads.
    this.manager = new THREE.LoadingManager(() => {
      const loadingScreen = document.getElementById('loading-screen');
      loadingScreen.classList.add('fade-out');

      // optional: remove loader from DOM via event listener
      loadingScreen.addEventListener('transitionend', this.onTransitionEnd);

    });


    // we add DirectionalLight to the scene
    let light = new THREE.DirectionalLight('#800080', 1.0);
    light.position.set(-100, 100, 100);
    light.target.position.set(0, 0, 0);
    this.scene.add(light);

    //adding ambient light so all objects are lit up better
    light = new THREE.AmbientLight(0xFFFFFF, 0.25);
    this.scene.add(light);

    //Loading the texture for the scene background
    this.texture = new THREE.CubeTextureLoader(this.manager).load([
      './textures/level3/posx.png',
      './textures/level3/negx.png',
      './textures/level3/posy.png',
      './textures/level3/negy.png',
      './textures/level3/posz.png',
      './textures/level3/negz.png',
    ]);
    this.texture.format = THREE.RGBFormat;
    this.texture.encoding = THREE.sRGBEncoding;
    this.scene.background = this.texture;


    //Creating all coins
    this.coinPositions = [];
    this.score = 0;
    // setting DOM elements to display the score, time left.
    this.scorekeeper = document.getElementById("Score");
    this.timekeeper = document.getElementById("time");
    var pauseBtn = document.getElementById('pause');
    pauseBtn.onclick = () => {
      if (isPlay === true) {
        isPlay = false;
        document.getElementById('pause-menu').classList.toggle('active');
      }
    };
    var resumeBtn = document.getElementById('resume');
    resumeBtn.onclick = () => {
      if (isPlay === false) {
        isPlay = true;
        document.getElementById('pause-menu').classList.toggle('active');
      }
    };
    var exitBtn = document.getElementById('exit');
    exitBtn.onclick = () => {
      window.location.replace("index.html");
    }
    var muteBtn = document.getElementById('mute');
    muteBtn.onclick = () => {
      if (window.localStorage.getItem('mute') === 'true') {
        window.localStorage.setItem('mute', 'false');
        document.getElementById('level-music').muted = !(document.getElementById('level-music').muted);
      } else {
        window.localStorage.setItem('mute', 'true');
        document.getElementById('level-music').muted = !(document.getElementById('level-music').muted);
      }
    }
    this.x = 0;
    var coin;
    //looping and creating coins in the scene
    for (var i = 0; i < 100; ++i) {
      coin = Coins(i);
      this.coinPositions.push(coin);

      this.scene.add(coin);
    }

    var x = 0;
    var y = 0;
    var z = 13;
    // //Loading the barriers on the side
    // //loading all our obstacles into the scene

    this.hit = false;
    this.Obstacles = [];
    this.Dimensions = [];
    this.LoadObstacles(this.scene, this.Obstacles, this.manager);
    this.LoadModel(this.scene, x, y, z, this.manager, this.Obstacles, this.Dimensions);
    var division = 2000;
    var limit = 10000;
    this.grid = new THREE.GridHelper(limit * 2, division, "blue", "blue");

    // 
    this.scene.add(this.grid);



    this.mixers = [];
    this.old_animation_frames = null;
    //Loading our animated character
    this.LoadAnimatedModel();
    document.addEventListener("keydown", (e) => this.onDocumentKeyDown(e), false);
    this.ChangeView = 0;
    if (isPlay) {
      this.request_animation_frame();
    }

  }
  onDocumentKeyDown(e) {
    var code = e.keyCode;
    if (code == 86) {
      if (this.ChangeView == 2) {
        this.ChangeView = -1;
      }
      this.ChangeView += 1;
    }
  }
  //Event listener which will remove the dom element once everything is loaded.
  onTransitionEnd(event) {

    event.target.remove();

  }

  ObstacleCollision(currPosition) {
    //detects if characters comes into contact with an obstacle
    var forward = this.control.UserInput.keys.forward;
    var backward = this.control.UserInput.keys.backward;
    var detected = false;
    for (var k = 0; k < this.Obstacles.length; ++k) {
      if (Math.abs(currPosition.z - this.Obstacles[k].position.z) < (this.Dimensions[k][1] / 2) + 2 && Math.abs(currPosition.x - this.Obstacles[k].position.x) < (this.Dimensions[k][0] / 2) + 2 && currPosition.y < 10) {
        detected = true;
      }
    }
    return detected;
  }

  CreateDiscoBall(z, textureLoader) {
    const discogeom = new THREE.SphereGeometry(10, 32, 32);
    var discotext = textureLoader.load('./textures/level3/discoball.jpg');
    discotext.wrapS = THREE.RepeatWrapping;
    discotext.wrapT = THREE.RepeatWrapping;
    discotext.repeat.set(2, 2);
    var material;
    if (z % 2 == 0) {
      material = new THREE.MeshPhongMaterial({ map: discotext });
    }
    else {
      material = new THREE.MeshPhongMaterial({ envMap: this.texture, color: "white" });
    }
    var discoball = new THREE.Mesh(discogeom, material);
    // discoball.material.flatShading = false;
    discoball.position.set(Math.floor(Math.random() * 100) - 50, 15, -60 * z - 15);
    discoball.scale.set(0.75, 0.75, 0.75);
    return discoball;
  }


  CreateTree(manager) {
    const textureLoader = new THREE.TextureLoader(manager);
    var gridTexture = textureLoader.load('./textures/level3/grid-texture.png');
    const mat = new THREE.MeshStandardMaterial({ map: gridTexture });
    const group = new THREE.Group();
    const triangle1 = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 2, 8),
      mat
    )
    triangle1.position.y = 4
    group.add(triangle1)
    const triangle2 = new THREE.Mesh(
      new THREE.ConeGeometry(2, 2, 8),
      mat
    )
    triangle2.position.y = 3
    group.add(triangle2)
    const triangle3 = new THREE.Mesh(
      new THREE.ConeGeometry(3, 2, 8),
      mat
    )
    triangle3.position.y = 2
    group.add(triangle3)
    const treeTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 2),
      new THREE.MeshLambertMaterial({ color: 0xbb6600 })
    )
    treeTrunk.position.y = 0
    group.add(treeTrunk)
    group.scale.set(4, 8, 4);

    return group
  }

  CreateCassettes(z, textureLoader) {
    const geom = new THREE.BoxGeometry(10, 10, 2);
    const mat = textureLoader.load('./textures/level3/casette.jpeg');
    const material = new THREE.MeshBasicMaterial({ map: mat });
    var casette = new THREE.Mesh(geom, material);
    casette.position.set(Math.floor(Math.random() * 100) - 50, 5, -60 * z - 15);

    return casette;

  }

  LoadObstacles(scene, ObstaclePositions, manager) {
    // Using the loading manager to return the ObstaclePositions once they are all loaded 
    //the onload function will executed once all the models are loaded.
    //Defining a gltf loader
    const textureLoader = new THREE.TextureLoader(manager);
    for (var i = 0; i < 500; i++) {
      var discoball = this.CreateDiscoBall(i, textureLoader);
      this.discoballs.push(discoball);
      this.Dimensions[i * 2] = [new THREE.Box3().setFromObject(discoball).max.x - new THREE.Box3().setFromObject(discoball).min.x, new THREE.Box3().setFromObject(discoball).max.z - new THREE.Box3().setFromObject(discoball).min.z];
      ObstaclePositions.push(discoball);
      this.scene.add(discoball);
      var casette = this.CreateCassettes(i, textureLoader);
      this.Dimensions[i * 2 + 1] = [new THREE.Box3().setFromObject(casette).max.x - new THREE.Box3().setFromObject(casette).min.x, new THREE.Box3().setFromObject(casette).max.z - new THREE.Box3().setFromObject(casette).min.z];
      ObstaclePositions.push(casette);
      this.scene.add(casette);
    }



  }
  LoadModel(scene, x, y, z, manager, Obstacles, Dimensions) {

    // this obj will act as the parent for the barriers on the side to prevent user from falling off
    var obj = new THREE.Object3D();
    const loader = new THREE.FontLoader(manager);

    loader.load('./js/fonts.json', function (font) {

      const geometry = new THREE.TextGeometry('Turn Around !', {
        font: font,
        size: 10,
        height: 5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.5,
        bevelOffset: 0,
        bevelSegments: 3
      });
      var textMaterial = new THREE.MeshPhongMaterial({ color: '#bc12fe' , specular: 0x050505,
      shininess: 400});

      var mesh = new THREE.Mesh(geometry, textMaterial);
      mesh.position.set(40, 10, 30);
      mesh.rotation.y += Math.PI;

      Dimensions[Dimensions.length] = [new THREE.Box3().setFromObject(mesh).max.x - new THREE.Box3().setFromObject(mesh).min.x, new THREE.Box3().setFromObject(mesh).max.z - new THREE.Box3().setFromObject(mesh).min.z];
      Obstacles.push(mesh);
      scene.add(mesh);
    });

    var Tree1 = this.CreateTree(manager);
    Tree1.position.set(x, y + 8, 10);
    var d = 30;

    //we loop since we need the barries throughout the scene
    for (var i = 0; i < 200; i++) {
      // we clone objects and then adjust their scale and position and place them into the scene 
      var obj2 = Tree1.clone();
      var obj3 = Tree1.clone();
      obj2.position.set(60, 8, d);

      // we always add the object as a child of the parent object obj
      obj3.position.set(-60, 8, d);
      // we always add the object as a child of the parent object obj
      Dimensions[Dimensions.length] = [new THREE.Box3().setFromObject(obj2).max.x - new THREE.Box3().setFromObject(obj2).min.x, new THREE.Box3().setFromObject(obj2).max.z - new THREE.Box3().setFromObject(obj2).min.z];
      Obstacles.push(obj2);
      Dimensions[Dimensions.length] = [new THREE.Box3().setFromObject(obj3).max.x - new THREE.Box3().setFromObject(obj3).min.x, new THREE.Box3().setFromObject(obj3).max.z - new THREE.Box3().setFromObject(obj3).min.z];
      Obstacles.push(obj3);
      this.scene.add(obj2);
      this.scene.add(obj3);
      d = d - 22;
    }
  }

  LoadAnimatedModel() {
    //Load our animated character aj
    //The params are the camera and scene since we center the camera around AJ
    const paramaters = {
      camera: this.camera,
      scene: this.scene,
    }
    this.control = new BasicCharacterController(paramaters, this.manager);

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
      this.counter
      this.request_animation_frame();
      if (isPlay) {
        //checks for interaction between player and all the coins
        for (var i = 0; i < this.coinPositions.length; ++i) {
          if (Math.abs(this.control.myPosition.z - this.coinPositions[i].position.z) < 1.5 && Math.abs(this.control.myPosition.x - this.coinPositions[i].position.x) < 7) {
            this.coinSound.play();
            this.score += 1;
            this.scene.remove(this.coinPositions[i]);
            this.coinPositions.splice(i, 1);
          }
        }

        this.discoballs.forEach(rotateDiscoBall);

        function rotateDiscoBall(obj) {
          obj.rotation.y += 0.02;
        }


        //coin jumping
        this.x += 0.2;
        for (var i = 0; i < this.coinPositions.length; ++i) {
          this.coinPositions[i].position.y += (Math.sin(this.x) / 10);
        }

        //enables jump sound to play
        if (this.control.UserInput.keys.space && this.control.myPosition.y < 0.5) {
          this.jumpSound.play();
        }

        //Update the score of the player
        this.scorekeeper.innerHTML = "Score: " + this.score;
        //Check if the player has moved and start clock
        if (!this.isPlayerMoved()) {
          this.clock.start();
        }

        if (this.time > 0) {
          if (this.time < 20) {
            this.timekeeper.style.color = 'red';
          }
          this.time -= (this.clock.getElapsedTime() / 1000);
        }

        this.timekeeper.innerHTML = "Time Left: " + this.time;
        //Check if time finished

        //Detecting collision and reacting
        this.forward = this.control.UserInput.keys.forward;
        this.backward = this.control.UserInput.keys.backward;
        var detected = this.ObstacleCollision(this.control.myPosition);
        if (this.hit == true && detected == false) {
          this.control.UserInput.keys.backward = false;
          this.control.UserInput.keys.forward = false;
          this.hit = false;

        }
        if (detected == true) {
          if (this.forward == true && this.hit == false) {
            this.control.UserInput.keys.forward = false;
            this.control.UserInput.keys.backward = true;
            this.hit = true;
          }
          if (this.backward == true && this.hit == false) {
            this.control.UserInput.keys.forward = true;
            this.control.UserInput.keys.backward = false;
            this.hit = true;
          }
          this.hit = true;
        }
        this.renderer.setClearColor(0x000000);
        this.renderer.render(this.scene, this.camera);
        if (this.time < 0) {
          //Call EndGame function
          this.EndGame();
        } else {
          this.Step(t - this.old_animation_frames);
          this.old_animation_frames = t;
        }
      }
    });


  }

  isPlayerMoved() {
    //Check if the player is still at the origin and hasn't moved
    if (this.control.myPosition.x == 0 && this.control.myPosition.y == 0 && this.control.myPosition.z == 0) {
      return false;
    }

    return true;

  }

  Step(timeGone) {

    // we get the time that has elapsed and update our mixers so the animations can also get updated accordingly
    const timeGoneS = timeGone * 0.001;
    if (this.mixers) {
      this.mixers.map(m => m.update(timeGoneS));
    }

    if (this.control) {
      this.control.Update(timeGoneS);
    }

    this.ThirdPersonCamera.Update(timeGoneS, this.ChangeView);
  }
  EndGame() {
    //get the players score and store it in local storage
    var playerScore = this.score;
    localStorage.setItem("playerScore", playerScore);

    //Check if the player scored high enough to be considered a pass and store in local storage
    var passed = "Failed";
    if (playerScore >= 25) {
      passed = "Passed";
    }
    localStorage.setItem("outcome", passed);
    //Change the page to the end page which shows summary of details
    this.clock.stop();
    this.time = 0;
    if (passed == "Failed") {
      window.location.replace("failed.html");
    } else {
      window.location.replace("winning.html");
    }
  }

}


let APP = null;

window.addEventListener('DOMContentLoaded', () => {
  APP = new ThirdPersonCameraGame();
});


