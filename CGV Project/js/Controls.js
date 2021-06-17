import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {CharacterController} from './States.js';
class BasicCharacterControllerProxy {
    constructor(animations) {
      this.allAnimations = animations;
    }
  
    get animations() {
      return this.allAnimations;
    }
  };
  
  
  class BasicCharacterController {
    constructor(paramaters,manager) {
      this.init(paramaters,manager);
    }
    
    // in the init function we initialise the following:
    // Decrease which will be the rate at which we decrease the movement of the player in order to change states from running to walking or idle
    // Acceleration is used to increase the speed if the user if they press shift to bring about running etc
    // Speed is used to represent the idle velocity 
    // myPosition will store the value of the characters current position in the scene
    // allAnimations just contains the animations for each state
    // UserInput is an instance of the controller input which enables the player to move around
    // State instantiates the current state of the character
    init(paramaters,manager) {
      this.params = paramaters;
      this.Decrease = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      this.acceleration = new THREE.Vector3(1, 0.25, 50.0);
      this.speed = new THREE.Vector3(0, 0, 0);
      this.myPosition = new THREE.Vector3();
      this.allAnimations = {};
      this.UserInput = new BasicCharacterControllerInput();
      this.myState = new CharacterController(
          new BasicCharacterControllerProxy(this.allAnimations));
  
      this.LoadModels(manager);
    }

    // We are loading the character models and all the animations related to the character.
    // We use and FBX loader since the models are .fbx files
    LoadModels(manager) {
      const loader = new FBXLoader(manager);
      loader.setPath('./models/Character/');
      loader.load('aj.fbx', (fbx) => {
        fbx.scale.setScalar(0.1);
        fbx.traverse(c => {
          c.castShadow = true;
        });
        // we rotate the character by 180 degrees to face the correct direction
        this.target = fbx.rotateY(Math.PI);
        // add AJ to the scene
        this.params.scene.add(this.target);
        
        //Create an animation mixer
        this.Mixer = new THREE.AnimationMixer(this.target);
        //Loading manager to control the progress of models being loaded
        this.loadingManager = new THREE.LoadingManager();
        this.loadingManager.onLoad = () => {
          this.myState.setState('idle');
        };
        //Defining the onload function to load the users animations
        const OnLoad = (animName, anim) => {
          const clip = anim.animations[0];
          const action = this.Mixer.clipAction(clip);
    
          this.allAnimations[animName] = {
            clip: clip,
            action: action,
          };
        };
        //Loading the additional animations that are used in the game
        const loader = new FBXLoader(this.loadingManager);
        loader.setPath('./models/Character/');
        loader.load('walk.fbx', (a) => { OnLoad('walk', a); });
        loader.load('run.fbx', (a) => { OnLoad('run', a); });
        loader.load('idle.fbx', (a) => { OnLoad('idle', a); });
        loader.load('Jumping Up.fbx', (a) => { OnLoad('Jumping Up', a); });
      });
    }
   
  
    // Return the current position of the character
    get Position() {
      return this.myPosition;
    }
    
    // Get what direction the character is facing
    get Rotation() {
      if (!this.target) {
        return new THREE.Quaternion();
      }
      return this.target.quaternion;
    }
  
    Update(timeInSeconds) {
      if (!this.myState.CurrentState) {
        return;
      }
      if (timeInSeconds > 0.5) {
        timeInSeconds = 0.020840000000003783;
      }
      //Update the state every time to check if there was a transitions
      this.myState.Update(timeInSeconds, this.UserInput);
      
      //depending if there was a transition we will adjust the velocity of the character accordingly
      const velocity = this.speed;
      const frameDecceleration = new THREE.Vector3(
          velocity.x * this.Decrease.x,
          velocity.y * this.Decrease.y,
          velocity.z * this.Decrease.z
      );
      //Decrease the frame rate accordingly
      frameDecceleration.multiplyScalar(timeInSeconds);
      frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
          Math.abs(frameDecceleration.z), Math.abs(velocity.z));
  
      velocity.add(frameDecceleration);
  
      const controlObject = this.target;
      const quaternion = new THREE.Quaternion();
      const a = new THREE.Vector3();
      const r = controlObject.quaternion.clone();
  
      const acc = this.acceleration.clone();
      //Depending on the user input, adjust the velocity of the user input
      //IF shift is pressed, increase velocity by 4 x
      if (this.UserInput.keys.shift) {
        acc.multiplyScalar(4.0);
      }

      // Create a variable to mimic gravity 
      // Use this for character to always be in falling state until interacting with a surface in the scene.
      const gravity = -85 * timeInSeconds;
      if (velocity.y < -45.5 || this.myPosition.y < -0.1) {
        velocity.y = 0
      }
  
      if (this.UserInput.keys.space) {
        //acc.multiplyScalar(0.0);
        if (this.myPosition.y < 0.5) {
          velocity.y = 45;
        } else if (this.myPosition.y < 0.5 && this.myPositiony > -1) {
          velocity = 30;
        }
      }
      //Moves user forward 
      if (this.UserInput.keys.forward) {
        velocity.z += acc.z * timeInSeconds;

      }
      // Moves user backward
      if (this.UserInput.keys.backward) {
        velocity.z -= acc.z * timeInSeconds;
      }
      // Rotate camera if user moves and rotates
      if (this.UserInput.keys.left) {
        a.set(0, 1, 0);
        quaternion.setFromAxisAngle(a, 4.0 * Math.PI * timeInSeconds * this.acceleration.y);
        r.multiply(quaternion);
      }
      if (this.UserInput.keys.right) {
        a.set(0, 1, 0);
        quaternion.setFromAxisAngle(a, 4.0 * -Math.PI * timeInSeconds * this.acceleration.y);
        r.multiply(quaternion);
      }

      // if (this.myPosition.y == 0.0) {
      //     velocity.y = 0;
      //   }
  
      controlObject.quaternion.copy(r);
  
      const oldPosition = new THREE.Vector3();
      oldPosition.copy(controlObject.position);
  
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(controlObject.quaternion);
      forward.normalize();

      const space =  new THREE.Vector3(0,1,0);
      space.applyQuaternion(controlObject.quaternion);
      space.normalize();
  
      const sideways = new THREE.Vector3(1, 0, 0);
      sideways.applyQuaternion(controlObject.quaternion);
      sideways.normalize();

      
  
      sideways.multiplyScalar(velocity.x * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);
      //(this.canMove) ? (this.myPosition.y > 0.0) ? space.multiplyScalar(timeInSeconds * (velocity.y + gravity * 0.05)) : space.multiplyScalar(velocity.y * timeInSeconds) : space.multiplyScalar(0);
      (this.myPosition.y > 0.0) ? space.multiplyScalar(timeInSeconds * (velocity.y + gravity * 0.05)) : space.multiplyScalar(velocity.y * timeInSeconds)
     

  
      controlObject.position.add(forward);
      controlObject.position.add(sideways);
      controlObject.position.add(space);

      //controlObject.position.add(space.y < 0 ? space : THREE.Vector3(0,1,0));
      if (this.myPosition.y > -0.1 && velocity.y != 0) {
        velocity.y += gravity;
      } 
      // else if (this.myPosition.y == 0.0 && velocity.y !== 0) {
      //   velocity.y = 0;
      // }
      //velocity.y += gravity;
      // if (velocity.y < -100) {
      //   velocity.y = 0;
      // }
       
      this.myPosition.copy(controlObject.position);
      if (this.Mixer) {
        this.Mixer.update(timeInSeconds);
      }
    }
  };

  // define onkeydown and onkeyup event listeners 
  //  w,a,s,d,shift and space as player controls
  class BasicCharacterControllerInput {
    constructor() {
      this.init();    
    }
  
    init() {
      this.keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        space: false,
        shift: false,
      };
     // this.move = true;
      //if (this.move === true) {
        document.addEventListener('keydown', (e) => this.OnKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.OnKeyUp(e), false);
      //}
    }
  
    OnKeyDown(event) {
      switch (event.keyCode) {
        case 87: // w
          this.keys.forward = true;
          break;
        case 65: // a
          this.keys.left = true;
          break;
        case 83: // s
          this.keys.backward = true;
          break;
        case 68: // d
          this.keys.right = true;
          break;
        case 32: // SPACE
          this.keys.space = true;
          break;
        case 16: // SHIFT
          this.keys.shift = true;
          break;
      }
    }
  
    OnKeyUp(event) {
      switch(event.keyCode) {
        case 87: // w
          this.keys.forward = false;
          break;
        case 65: // a
          this.keys.left = false;
          break;
        case 83: // s
          this.keys.backward = false;
          break;
        case 68: // d
          this.keys.right = false;
          break;
        case 32: // SPACE
          this.keys.space = false;
          break;
        case 16: // SHIFT
          this.keys.shift = false;
          break;
      }
    }
  };
  

  export{BasicCharacterController}