import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import {BasicCharacterController} from './Controls.js';
import {Coins} from './Coins.js'


class ThirdPersonCamera {
  constructor(paramaters) {
    this.params = paramaters;
    this.camera = paramaters.camera;
   
    this.myPosition = new THREE.Vector3();
    this.LookingAt = new THREE.Vector3();
  }

  calc_offset() {
    // Calculate the idea offset.
    // THis represents the angle at which the position the camera will be
    // we position the camera slightly to the right and over the shoulder of the character
    const idealOffset = new THREE.Vector3(-15, 20, -30);
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

  Update(timeGone) {
    const idealOffset = this.calc_offset();
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
    this.discoballs = [];
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
        './textures/level3/posx.png',
        './textures/level3/negx.png',
        './textures/level3/posy.png',
        './textures/level3/negy.png',
        './textures/level3/posz.png',
        './textures/level3/negz.png',
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
    this.x=0;
    var coin;
    //looping and creating coins in the scene
    for (var i=0;i<100;++i){
      coin=Coins(i);
      this.coinPositions.push(coin);
      this.scene.add(coin);
    }


    //Loading a texture to apply as the "floor"
    // const cubeTexture = new THREE.TextureLoader().load('./textures/level3/discofloor.jpg');
    // const cubeTexture = new THREE.TextureLoader().load('./textures/level3/grid.jpeg');
    // cubeTexture.wrapS = THREE.RepeatWrapping;
    // cubeTexture.wrapT = THREE.RepeatWrapping;
    // cubeTexture.repeat.set(10,100);
    // //Platform which is a floor is represented by a cube
    // var geometry = new THREE.BoxGeometry();
    // const material = new THREE.MeshBasicMaterial({map:cubeTexture});
    // const floor = new THREE.Mesh( geometry, material );
    // this.scene.add( floor );
    var x = 0;
    var y = 0;
    var z = 13;
    const lowPoly = './models/level1/LowPolyBarrier/scene.gltf'
    // //Loading the barriers on the side
    this.LoadModel(lowPoly,this.scene,x,y,z,this.manager);
     this.Obstacles = [];
    // //loading all our obstacles into the scene
    this.LoadObstacles(this.scene,this.Obstacles,this.manager);
    
    // floor.scale.set(120,0,-10000);
    // var d = -20000;
    // //looping and ensuring our floor is long enough for the round.
    // for(var i =0;i<10;i++){
    //     const newFloor = new THREE.Mesh( geometry, material );
    //     newFloor.position.set(0,0,d);
    //     d = d - 10000;
    //     this.scene.add( newFloor );
    //     newFloor.scale.set(120,0,-10000);
    // }
    var division = 2000;
    var limit = 10000;
    this.grid = new THREE.GridHelper(limit * 2, division, "blue", "blue");

// 

    this.scene.add(this.grid);
    


    this.mixers = [];
    this.old_animation_frames = null;
    //Loading our animated character
    this.LoadAnimatedModel();
    
    this.request_animation_frame();
    
    
  }
  //Event listener which will remove the dom element once everything is loaded.
  onTransitionEnd( event ) {

    event.target.remove();
    
  }

  ObstacleCollision(currPosition){
  //detects if characters comes into contact with an obstacle
  if (this.Obstacles.length>30){
  for (var k=0;k<this.Obstacles.length;++k){
     if (Math.abs(currPosition.z-this.Obstacles[k].z)<5 && Math.abs(currPosition.x-this.Obstacles[k].x)<5 && currPosition.y < 10){
        this.control.UserInput.keys.backward = true
     }
  }
  }
  //console.log(this.Obstacles);
  }

  CreateDiscoBall(z,textureLoader){
      const discogeom = new THREE.SphereGeometry(10,32,32);
      var discotext;
      if(z%2 == 0){
         discotext = textureLoader.load('./textures/level3/discoball.jpg');
      }
      else{
        discotext = textureLoader.load('./textures/level3/discoball.jpeg');
      }
      
      discotext.wrapS=THREE.RepeatWrapping;
      discotext.wrapT=THREE.RepeatWrapping;
      discotext.repeat.set(2,2);
      const material = new THREE.MeshBasicMaterial( {map:discotext} );
      var discoball = new THREE.Mesh(discogeom,material)
      discoball.position.set(Math.floor(Math.random() * 100) -50,15,-60*z-15);
      discoball.scale.set(0.75,0.75,0.75);
      return discoball;
  }

  CreatePyramid(z,textureLoader){
    const geometry = new THREE.ConeGeometry( 20, 40,4 );
    const material = new THREE.MeshStandardMaterial( {color: 0xffff00} );
    // material.wireframe = true;
    const pyramid = new THREE.Mesh( geometry, material );
    pyramid.position.set(Math.floor(Math.random() * 100)+75,20,-60*z-15);
    // pyramid.scale.set()
    return pyramid;

  }
  CreateTree(z){
    const mat  =  new THREE.MeshStandardMaterial({color:0x00ff00});
    // mat.wireframe = true;
    const group = new THREE.Group();
    const level1 = new THREE.Mesh(
        new THREE.ConeGeometry(1.5,2,8),
        mat
    )
    level1.position.y = 4
    group.add(level1)
    const level2 = new THREE.Mesh(
        new THREE.ConeGeometry(2,2,8),
        mat
    )
    level2.position.y = 3
    group.add(level2)
    const level3 = new THREE.Mesh(
        new THREE.ConeGeometry(3,2,8),
        mat
    )
    level3.position.y = 2
    group.add(level3)
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5,0.5,2),
        new THREE.MeshLambertMaterial({color:0xbb6600})
    )
    trunk.position.y = 0
    group.add(trunk)
    group.scale.set(4,8,4);
    group.position.set(Math.floor(Math.random() * 100) -50,5,-60*z-15);
    
    return group
  }

  LoadObstacles(scene,ObstaclePositions,manager){
    // Using the loading manager to return the ObstaclePositions once they are all loaded 
    //the onload function will executed once all the models are loaded.
    //Defining a gltf loader
    const textureLoader  = new THREE.TextureLoader(manager);
    for(var i =0; i<100;i++){
      var discoball = this.CreateDiscoBall(i,textureLoader);
      this.discoballs.push(discoball);
      this.scene.add(discoball);
      var pyramid = this.CreatePyramid(i,textureLoader)
      var pyramid2 = pyramid.clone();
      pyramid2.position.x = -1*pyramid.position.x;
      this.scene.add(pyramid);
      this.scene.add(pyramid2);
      var tree = this.CreateTree(i);
      this.scene.add(tree);
    }
    
   
    
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
      // scene.add(obj);
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

       //checks for interaction between player and all the coins
       for (var i=0;i<this.coinPositions.length;++i){
        if (Math.abs(this.control.myPosition.z-this.coinPositions[i].position.z)<0.5 && Math.abs(this.control.myPosition.x-this.coinPositions[i].position.x)<5){
          this.score+=1;
          //console.log("score: "+this.score);
          this.scene.remove(this.coinPositions[i]);
          this.coinPositions.splice(i,1);
        }
      }

      this.discoballs.forEach(rotateDiscoBall);

      function rotateDiscoBall(obj){
        // obj.rotateOnAxis(new THREE.Vector3(0,1,0),Math.PI);
        obj.rotation.y += 0.02;
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
      //console.log(ObstaclePositions);
      this.ObstacleCollision(this.control.myPosition);

      //this.scorekeeper.innerHTML += "Lives: "+this.Lives+"\n";
      this.liveskeeper.innerHTML="Lives Left: "+this.Lives;
      this.renderer.render(this.scene, this.camera);
      this.Step(t - this.old_animation_frames);
      this.old_animation_frames = t;
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

    this.ThirdPersonCamera.Update(timeGoneS);
  }
  EndGame(){
    //get the players score and store it in local storage
    var playerScore = this.score;
    localStorage.setItem("playerScore", playerScore);

    //Check if the player scored high enough to be considered a pass and store in local storage
    var passed = "Failed";
    if(playerScore>=20){
      passed = "Passed";
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


