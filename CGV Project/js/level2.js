import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import {BasicCharacterController} from './Controls.js';
import {Coins} from './Coins.js'

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
    if(View ==0){
      idealOffset = new THREE.Vector3(-15, 20, -30);
    }
    else if(View ==1){
      idealOffset = new THREE.Vector3(0, 20, -30);
    }
    else if(View == 2){
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

  Update(timeGone,View) {
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
    this.Lives = 3;
    this.conesPos = [new THREE.Vector3(0,2,-200),new THREE.Vector3(0,2,-2100)];
    this.spikesPos = [new THREE.Vector3(0,0,-450),new THREE.Vector3(0,0,-510),new THREE.Vector3(0,0,-570),new THREE.Vector3(0,0,-630),new THREE.Vector3(0,0,-1750),new THREE.Vector3(0,0,-1810),new THREE.Vector3(0,0,-1870),new THREE.Vector3(0,0,-1930)];
    this.sandbagsPos = [new THREE.Vector3(0,0,-90), new THREE.Vector3(0,0,-360), new THREE.Vector3(0,0,-860), new THREE.Vector3(0,0,-1360), new THREE.Vector3(0,0,-1860), new THREE.Vector3(0,0,-2360)];
    this.wheelbarrowsPos = [new THREE.Vector3(35,0,-50), new THREE.Vector3(35,0,-350), new THREE.Vector3(35,0,-850), new THREE.Vector3(35,0,-1350), new THREE.Vector3(35,0,-1850), new THREE.Vector3(35,0,-2350)];
    this.barrelsPos = [new THREE.Vector3(-40,0,-30), new THREE.Vector3(-40,0,-330), new THREE.Vector3(-40,0,-830), new THREE.Vector3(-40,0,-1330), new THREE.Vector3(-40,0,-1830), new THREE.Vector3(-40,0,-2330)];
    this.cementPos = [new THREE.Vector3(0,0,-1000)];
    this.scaffoldingPos = [new THREE.Vector3(0,0,-1600)];
    this.cranePos = [new THREE.Vector3(0,100,-3000)];
    this.clock = new THREE.Clock();
    this.time = 70;
    this.init();
  }

  

  init() {

    // defining a renderer for the scene
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
    this.manager =  new THREE.LoadingManager(()=>{ 
      const loadingScreen = document.getElementById( 'loading-screen' );
      loadingScreen.classList.add( 'fade-out' );
    
      // optional: remove loader from DOM via event listener
      loadingScreen.addEventListener( 'transitionend', this.onTransitionEnd );

    });
    

    // we add DirectionalLight to the scene
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
    //adding ambient light so all objects are lit up better
    light = new THREE.AmbientLight(0xFFFFFF, 0.25);
    this.scene.add(light);

    //Loading the texture for the scene background
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './textures/level2/posx.jpg',
        './textures/level2/negx.jpg',
        './textures/level2/posy.jpg',
        './textures/level2/negy.jpg',
        './textures/level2/posz.jpg',
        './textures/level2/negz.jpg',
    ]);
    texture.encoding = THREE.sRGBEncoding;
    this.scene.background = texture;
    

    //Creating all coins
    this.coinPositions=[];
    this.score=0;
    // setting DOM elements to display the score, time left and lives left.
    this.scorekeeper=document.getElementById("Score");
    this.liveskeeper = document.getElementById("Lives");
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
        window.localStorage.setItem('mute','false');
        document.getElementById('level-music').muted = !(document.getElementById('level-music').muted);
      } else {
        window.localStorage.setItem('mute','true');
        document.getElementById('level-music').muted = !(document.getElementById('level-music').muted);
      }
    }
    this.x=0;
    var coin;
    //looping and creating coins in the scene
    for (var i=0;i<100;++i){
      coin=Coins(i);
      this.coinPositions.push(coin);
      this.scene.add(coin);
    }


    //Loading a texture to apply as the "floor"
    const cubeTexture = new THREE.TextureLoader().load('./textures/level2/lavafloor.jpg');
    cubeTexture.wrapS = THREE.RepeatWrapping;
    cubeTexture.wrapT = THREE.RepeatWrapping;
    cubeTexture.repeat.set(2,200);
    //Platform which is a floor is represented by a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({map:cubeTexture});
    const floor = new THREE.Mesh( geometry, material );
    this.scene.add( floor );
    var x = 0;
    var y = 0;
    var z = 13;
    const lowPoly = './models/level1/LowPolyBarrier/scene.gltf'
    //Loading the barriers on the side
    this.LoadModel(lowPoly,this.scene,x,y,z,this.manager);

    this.clearPosition=[];
    this.movement=0;
    this.hit=false;
    this.Obstacles = [];
    this.Dimensions=[];
    //loading all our obstacles into the scene
    this.LoadObstacles(this.scene,this.Obstacles,this.manager);
    
    console.log(this.Obstacles);
    console.log(this.Dimensions);

    floor.scale.set(120,0,-10000);
    var d = -20000;
    //looping and ensuring our floor is long enough for the round.
    for(var i =0;i<10;i++){
        const newFloor = new THREE.Mesh( geometry, material );
        newFloor.position.set(0,0,d);
        d = d - 10000;
        this.scene.add( newFloor );
        newFloor.scale.set(120,0,-10000);
    }



    this.mixers = [];
    this.old_animation_frames = null;
    //Loading our animated character
    this.LoadAnimatedModel();
    document.addEventListener("keydown",(e) =>  this.onDocumentKeyDown(e), false);
    this.ChangeView = 0;
    if (isPlay) {
      this.request_animation_frame();
    } else {
      this.clock.stop();
    }
    
    
  }
  //Event listener which will remove the dom element once everything is loaded.
  onTransitionEnd( event ) {

    event.target.remove();
    
  }
  onDocumentKeyDown(e) {
    var code = e.keyCode;
     if(code ==86){
       if(this.ChangeView==2){
         this.ChangeView = -1;
       }
       this.ChangeView+=1;
     }
   }


  ObstacleCollision(currPosition){
  //detects if characters comes into contact with an obstacle
    
    var forward=this.control.UserInput.keys.forward;
    var backward=this.control.UserInput.keys.backward;
    var detected=false;
    for (var k=0;k<this.Obstacles.length;++k){
      if (Math.abs(currPosition.z-this.Obstacles[k].position.z)<(this.Dimensions[k][1]/2)+2 && Math.abs(currPosition.x-this.Obstacles[k].position.x)<(this.Dimensions[k][0]/2)+2 && currPosition.y < 10){
        console.log("hit");  
        detected=true;
      }
    }
    return detected;
  }


  //Loading,creating and placing obstacles
  LoadObstacles(scene,ObstaclePositions,manager){


    //Create spike obstacles function
    function Spikes(z){
      var spikegeo = new THREE.ConeGeometry( 5, 20, 32 );
      const spiketexture = new THREE.TextureLoader().load("./textures/level2/lavaspike.jpg");
            spiketexture.wrapS=THREE.RepeatWrapping;
            spiketexture.wrapT=THREE.RepeatWrapping;
            spiketexture.repeat.set(1,1);
      const spikemat = new THREE.MeshBasicMaterial( {map: spiketexture} );
      var spike = new THREE.Mesh( spikegeo, spikemat);
      spike.position.y=10;
      spike.position.z=-60*z-15;
      spike.position.x=Math.floor(Math.random() * 100) -50;
      //scene.add( cone );
      return spike;
    }

    //Creating spikes and adding to the scene
    var spike;
    for (var i=0;i<10;++i){
      spike=Spikes(i);
      //console.log(spike.max.z);
      //console.log(new THREE.Box3().setFromObject(spike).max.z-new THREE.Box3().setFromObject(spike).min.z);
      this.Dimensions[i]=[new THREE.Box3().setFromObject(spike).max.x-new THREE.Box3().setFromObject(spike).min.x,new THREE.Box3().setFromObject(spike).max.z-new THREE.Box3().setFromObject(spike).min.z];
      ObstaclePositions.push(spike);
      scene.add(spike);
    }
   
    //Creating Blitz obstacles function 
    function Blitz(z){
      var blitzgeo = new THREE.BoxGeometry( 20, 15, 2 );
      const blitztexture = new THREE.TextureLoader().load("./textures/level2/blitz.jpeg");
            blitztexture.wrapS=THREE.RepeatWrapping;
            blitztexture.wrapT=THREE.RepeatWrapping;
            blitztexture.repeat.set(1,1);
      const blitzmat = new THREE.MeshBasicMaterial( {map: blitztexture} );
      var blitz = new THREE.Mesh( blitzgeo, blitzmat);
      blitz.position.z=-60*z-15;
      blitz.position.y=5;
      blitz.position.x=Math.floor(Math.random() * 100) -50;
      //blitz.rotation.z=90;
      return blitz;
    }

    //Creating blitz and adding to the scene 
    var blitz;
    for (var i=10;i<20;++i){
      blitz=Blitz(i);
      this.Dimensions[i]=[new THREE.Box3().setFromObject(blitz).max.x-new THREE.Box3().setFromObject(blitz).min.x,new THREE.Box3().setFromObject(blitz).max.z-new THREE.Box3().setFromObject(blitz).min.z];
      ObstaclePositions.push(blitz);
      scene.add(blitz);
    }

    //Creating cylinder obstacles function 
    function Cylinder(z){
      var cylindergeo = new THREE.CylinderGeometry( 5,5,20,32 );
      const cylindertexture = new THREE.TextureLoader().load("./textures/level2/lavaspike.jpeg");
            cylindertexture.wrapS=THREE.RepeatWrapping;
            cylindertexture.wrapT=THREE.RepeatWrapping;
            cylindertexture.repeat.set(1,1);
      const cylindermat = new THREE.MeshBasicMaterial( {map: cylindertexture} );
      var cylinder = new THREE.Mesh( cylindergeo, cylindermat);
      cylinder.position.z=-60*z-15;
      cylinder.position.y=5;
      cylinder.position.x=Math.floor(Math.random() * 100) -50;
      return cylinder;
    }

    //Creating cylinders and adding to the scene 
    var cylinder;
    for (var i=20;i<30;++i){
      cylinder=Cylinder(i);
      this.Dimensions[i]=[new THREE.Box3().setFromObject(blitz).max.x-new THREE.Box3().setFromObject(blitz).min.x,new THREE.Box3().setFromObject(blitz).max.z-new THREE.Box3().setFromObject(blitz).min.z];
      ObstaclePositions.push(cylinder);
      scene.add(cylinder);
    }

    return ObstaclePositions;
    
  }

  LoadModel(path,scene,x,y,z,manager){

    // this obj will act as the parent for the barriers on the side to prevent user from falling off
    var obj =  new THREE.Object3D();
    const loader = new GLTFLoader(manager);
  
    loader.load(path, function(gltf){
      //Load the model 
      var obj1 = gltf.scene;

      //placing the model into the scene 
      obj1.position.set(x,y,z);
      obj1.rotation.y = Math.PI/2;
      obj1.scale.set(0.05,0.05,0.05);
      obj.add(obj1);

      var d = -50;

      //we loop since we need the barries throughout the scene
      for(var i=0;i<60;i++){
        // we clone objects and then adjust their scale and position and place them into the scene 
        var obj2 = obj1.clone();
        var obj3 = obj1.clone();
        obj2.rotation.y += Math.PI/2;
        obj2.position.set(55,0,d);
        obj2.scale.set(0.05,0.05,0.05);
        // we always add the object as a child of the parent object obj
        obj.add(obj2);
        obj3.rotation.y += Math.PI/2;
        obj3.position.set(-55,0,d);
        obj3.scale.set(0.05,0.05,0.05);
         // we always add the object as a child of the parent object obj
        obj.add(obj3);
        d = d -85;
      }
      // Now it's as simple as adding obj to the scene and all it's children will be placed as well.
      scene.add(obj);
    });

  }

  LoadAnimatedModel() {
    //Load our animated character aj
    //The params are the camera and scene since we center the camera around AJ
    const paramaters = {
      camera: this.camera,
      scene: this.scene,
    }
    this.control = new BasicCharacterController(paramaters,this.manager);
    
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
      if (isPlay === true) {

       //checks for interaction between player and all the coins
       for (var i=0;i<this.coinPositions.length;++i){
        if (Math.abs(this.control.myPosition.z-this.coinPositions[i].position.z)<0.5 && Math.abs(this.control.myPosition.x-this.coinPositions[i].position.x)<5){
          this.coinSound.play();
          this.score+=1;
          this.scene.remove(this.coinPositions[i]);
          this.coinPositions.splice(i,1);
        }
      }

      //Rotates Cone objects
      this.movement+=0.2;
      for (var i=0; i<10;++i){
        this.Obstacles[i].rotation.y=this.movement/8;
      }
      
      //enables jump sound to play    
      if (this.control.UserInput.keys.space && this.control.myPosition.y < 0.5) {
        this.jumpSound.play();
      }
     
      //coin jumping
      this.x+=0.2;
      for (var i=0;i<this.coinPositions.length;++i){
        this.coinPositions[i].position.y+=(Math.sin(this.x)/10);
      }

      //Update the score of the player
      this.scorekeeper.innerHTML = "Score: "+this.score;
      //Check if the player has moved and start clock
      if(!this.isPlayerMoved()){
            this.clock.start();
      }
   
      this.time = this.time-(this.clock.getElapsedTime()/1000)
      if(this.time<20){
        this.timekeeper.style.color = 'red';
      }

      this.timekeeper.innerHTML = "Time Left: "+this.time;
      //Check if time is up or lives are finished
      if(this.time <0 || this.Lives ==0){
        //Call EndGame function
         this.EndGame();
      }

      //Detecting collision and reacting
      this.forward=this.control.UserInput.keys.forward;
      this.backward=this.control.UserInput.keys.backward;
      var detected=this.ObstacleCollision(this.control.myPosition);
      if (this.hit==true && detected==false){
        // this.control.UserInput.keys.forward=true;
        this.control.UserInput.keys.backward=false;
        this.hit=false;
        
      }
      if (detected==true){
            this.control.UserInput.keys.forward=false;
            this.control.UserInput.keys.backward=true;
            this.hit=true;
      }

      
      

      //this.scorekeeper.innerHTML += "Lives: "+this.Lives+"\n";
      this.liveskeeper.innerHTML="Lives Left: "+this.Lives;
      this.renderer.render(this.scene, this.camera);
      this.Step(t - this.old_animation_frames);
      this.old_animation_frames = t;
      }
    });

    
  }

  isPlayerMoved(){
    //Check if the player is still at the origin and hasn't moved
    if(this.control.myPosition.x == 0 && this.control.myPosition.y==0 && this.control.myPosition.z==0){
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

    this.ThirdPersonCamera.Update(timeGoneS,this.ChangeView);
  }
  EndGame(){
    //get the players score and store it in local storage
    var playerScore = this.score;
    localStorage.setItem("playerScore", playerScore);

    //Check if the player scored high enough to be considered a pass and store in local storage
    var passed = "Failed";
    if(playerScore>=20){
      passed = "Passed";
      localStorage.setItem('Level2',true);
    }
    localStorage.setItem("outcome",passed);
    //Change the page to the end page which shows summary of details
    window.location.replace("endPage.html");
  }
  
}


let APP = null;

window.addEventListener('DOMContentLoaded', () => {
  APP = new ThirdPersonCameraGame();
});


