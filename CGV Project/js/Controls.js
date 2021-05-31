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
    constructor(paramaters) {
      this.init(paramaters);
    }
  
    init(paramaters) {
      this.params = paramaters;
      this.Decrease = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      this.acceleration = new THREE.Vector3(1, 0.25, 50.0);
      this.speed = new THREE.Vector3(0, 0, 0);
      this.myPosition = new THREE.Vector3();
  
      this.allAnimations = {};
      this.UserInput = new BasicCharacterControllerInput();
      this.myState = new CharacterController(
          new BasicCharacterControllerProxy(this.allAnimations));
  
      this.LoadModels();
    }
  
    LoadModels() {
      const loader = new FBXLoader();
      loader.setPath('./models/Character/');
      loader.load('aj.fbx', (fbx) => {
        fbx.scale.setScalar(0.1);
        fbx.traverse(c => {
          c.castShadow = true;
        });
  
        this.target = fbx;
        this.params.scene.add(this.target);
  
        this.Mixer = new THREE.AnimationMixer(this.target);
  
        this.loadingManager = new THREE.LoadingManager();
        this.loadingManager.onLoad = () => {
          this.myState.setState('idle');
        };
  
        const OnLoad = (animName, anim) => {
          const clip = anim.animations[0];
          const action = this.Mixer.clipAction(clip);
    
          this.allAnimations[animName] = {
            clip: clip,
            action: action,
          };
        };
  
        const loader = new FBXLoader(this.loadingManager);
        loader.setPath('./models/Character/');
        loader.load('walk.fbx', (a) => { OnLoad('walk', a); });
        loader.load('run.fbx', (a) => { OnLoad('run', a); });
        loader.load('idle.fbx', (a) => { OnLoad('idle', a); });
        loader.load('Jumping Up.fbx', (a) => { OnLoad('Jumping Up', a); });
      });
    }
  
    get Position() {
      return this.myPosition;
    }
  
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
  
      this.myState.Update(timeInSeconds, this.UserInput);
  
      const velocity = this.speed;
      const frameDecceleration = new THREE.Vector3(
          velocity.x * this.Decrease.x,
          velocity.y * this.Decrease.y,
          velocity.z * this.Decrease.z
      );
      frameDecceleration.multiplyScalar(timeInSeconds);
      frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
          Math.abs(frameDecceleration.z), Math.abs(velocity.z));
  
      velocity.add(frameDecceleration);
  
      const controlObject = this.target;
      const quaternion = new THREE.Quaternion();
      const a = new THREE.Vector3();
      const r = controlObject.quaternion.clone();
  
      const acc = this.acceleration.clone();
      if (this.UserInput.keys.shift) {
        acc.multiplyScalar(4.0);
      }
  
      if (this.UserInput.keys.space) {
        //acc.multiplyScalar(0.0);
        if (this.myPosition.y >= -0.1 && this.myPosition.y < 0.5) {
          velocity.y = 30;
          console.log("seconds: " + timeInSeconds, "velocity: " + velocity.y, )
        }  
      }
  

      if (this.UserInput.keys.forward) {
        velocity.z += acc.z * timeInSeconds;
      }
      if (this.UserInput.keys.backward) {
        velocity.z -= acc.z * timeInSeconds;
      }
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

      const gravity = -75 * timeInSeconds;
      if (velocity.y < -30) {
        velocity.y = 0
      }
  
      sideways.multiplyScalar(velocity.x * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);
      (this.myPosition.y > 0.0) ? space.multiplyScalar(timeInSeconds * (velocity.y + gravity * 0.05)) : space.multiplyScalar(velocity.y * timeInSeconds);
      console.log("y velocity: ", velocity.y)
     // space.setY(timeInSeconds * (velocity.y + gravity * 0.05));

  
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
      console.log(this.myPosition)
      if (this.Mixer) {
        this.Mixer.update(timeInSeconds);
      }
    }
  };
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
      document.addEventListener('keydown', (e) => this.OnKeyDown(e), false);
      document.addEventListener('keyup', (e) => this.OnKeyUp(e), false);
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
        case 17: // SPACE
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
        case 17: // SPACE
          this.keys.space = false;
          break;
        case 16: // SHIFT
          this.keys.shift = false;
          break;
      }
    }
  };
  

  export{BasicCharacterController}