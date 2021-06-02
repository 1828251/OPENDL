import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
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


    //Creating a loading manager which we will use for  a loading screen while the scene loads.
    const manager =  new THREE.LoadingManager(()=>{ 
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
        './textures/level1/posx.jpg',
        './textures/level1/negx.jpg',
        './textures/level1/posy.jpg',
        './textures/level1/negy.jpg',
        './textures/level1/posz.jpg',
        './textures/level1/negz.jpg',
    ]);
    texture.encoding = THREE.sRGBEncoding;
    this.scene.background = texture;
    //Coin builder
    function Coins(z){
      var coingeo=new THREE.CylinderGeometry(5,5,2,15);
      const cointexture = new THREE.TextureLoader().load( "./textures/level1/cointexture.png" );
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
    const cubeTexture = new THREE.TextureLoader().load('./textures/level1/dirtroad.jpg');
    cubeTexture.wrapS = THREE.RepeatWrapping;
    cubeTexture.wrapT = THREE.RepeatWrapping;
    cubeTexture.repeat.set(1,40);
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
    this.LoadModel(lowPoly,this.scene,x,y,z,manager);
    var Obstacles = [];
    //loading all our obstacles into the scene
    this.LoadObstacles(this.scene,Obstacles,manager);
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
    this.request_animation_frame();
    
    
  }
  //Event listener which will remove the dom element once everything is loaded.
  onTransitionEnd( event ) {

    event.target.remove();
    
  }

  ObstacleCollision(currPosition){

    
    
  }

  LoadObstacles(scene,ObstaclePositions,manager){
    //var ObstaclePositions = [];

    // Using the loading manager to return the ObstaclePositions once they are all loaded 
    //the onload function will executed once all the models are loaded.
    //Defining a gltf loader
    const loader = new GLTFLoader(manager);
    var Obstacles = new THREE.Object3D();
    

    var obj1;
    var obj2;
    var obj3;

    //All gltf model loading will follow this format 
    loader.load('./models/level1/barrels/scene.gltf',function(gltf){
      obj1 = gltf.scene;
      obj1.position.set(-40,0,-30);
      //Adding the position of the model to ObstaclePositions
      ObstaclePositions.push(new THREE.Vector3(-40,0,-30));
      obj1.scale.set(0.05,0.05,0.05);

      //Obstacles is a 3d Object so we add these 3 sub-objects as its children and then add this whole Obstacles object to the scene
      Obstacles.add(obj1);
      loader.load('./models/level1/wheelbarrow/scene.gltf',function(gltf){
            obj2 = gltf.scene;
            obj2.position.set(35,0,-50);
              //Adding the position of the model to ObstaclePositions
            ObstaclePositions.push(new THREE.Vector3(35,0,-50));
         
            obj2.rotation.y = -Math.PI/2;
            obj2.scale.set(4,4,4);
            Obstacles.add(obj2);
            loader.load('./models/level1/sandbags/scene.gltf',function(gltf){
                    obj3 = gltf.scene;
                    obj3.position.set(0,0,-90);
                      //Adding the position of the model to ObstaclePositions
                    ObstaclePositions.push(new THREE.Vector3(0,0,-90));
                    obj3.rotation.y = Math.PI/2;
                    obj3.scale.set(0.1,0.1,0.1);
                    Obstacles.add(obj3);
                    scene.add(Obstacles);

                  var d = -300;
                  //Looping and adding the obstacles along the z axis so it occurs multiple times
                  for(var i=0;i<5;i++){
                    scene.add(Obstacles.clone().translateZ(d));
                    //Adding the position of the model to ObstaclePositions
                    // d is just use to translate the object along the  z axis
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
        //Adding the position of the model to ObstaclePositions
        // I add twice since the objects are translated along the z axis as well and are duplicated 
        //The z value is just the value of d + the translation applied. 
        // d takes on the values {0,-60,-120,-180}

        ObstaclePositions.push(new THREE.Vector3(0,0,-450));
        ObstaclePositions.push(new THREE.Vector3(0,0,-510));
        ObstaclePositions.push(new THREE.Vector3(0,0,-570));
        ObstaclePositions.push(new THREE.Vector3(0,0,-630));
        
        
        ObstaclePositions.push(new THREE.Vector3(0,0,-1750));
        ObstaclePositions.push(new THREE.Vector3(0,0,-1810));
        ObstaclePositions.push(new THREE.Vector3(0,0,-1870));
        ObstaclePositions.push(new THREE.Vector3(0,0,-1930));

        //Cloning the spikes object twice and applying two different Z translations
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
      //Adding the position of the model to ObstaclePositions
      // We have two duplicates of this obstacle so it is added twice to ObstaclePositions
      ObstaclePositions.push(new THREE.Vector3(0,2,-200));
      ObstaclePositions.push(new THREE.Vector3(0,2,-2100));
    });
    loader.load('./models/level1/hori/scene.gltf',function(gltf){
      //this is the cement mixer obstacle
      var cement = gltf.scene;

      cement.position.set(0,15,-1000);
      cement.scale.set(0.1,0.1,0.1);
      scene.add(cement);
     //Adding the position of the model to ObstaclePositions
      ObstaclePositions.push(new THREE.Vector3(0,0,-1000));

    });
    loader.load('./models/level1/scaffolding/scene.gltf',function(gltf){

      var scaffolding = gltf.scene;

      scaffolding.position.set(0,0,-1600);
      scene.add(scaffolding);
        //Adding the position of the model to ObstaclePositions
      ObstaclePositions.push(new THREE.Vector3(0,0,-1600));
    });
    loader.load('./models/level1/crane/scene.gltf',function(gltf){
      
      var crane = gltf.scene;
      crane.position.set(0,100,-3000);
      crane.scale.set(0.2,0.2,0.2);
      scene.add(crane);
      //Adding the position of the model to ObstaclePositions
      ObstaclePositions.push(new THREE.Vector3(0,100,-3000));

    });

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
          //console.log("score: "+this.score);
          this.scene.remove(this.coinPositions[i]);
          this.coinPositions.splice(i,1);
        }
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


