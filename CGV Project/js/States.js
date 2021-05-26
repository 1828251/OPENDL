class stateController {
    constructor() {
      this.allStates = {};
      this.CurrentState = null;
    }
  
    addState(name, type) {
      this.allStates[name] = type;
    }
  
    setState(name) {
      const PreviousState = this.CurrentState;
      
      if (PreviousState) {
        if (PreviousState.Name == name) {
          return;
        }
        PreviousState.Exit();
      }
  
      const state = new this.allStates[name](this);
  
      this.CurrentState = state;
      state.Enter(PreviousState);
    }
  
    Update(timeGone, input) {
      if (this.CurrentState) {
        this.CurrentState.Update(timeGone, input);
      }
    }
  };
  
  
  class CharacterController extends stateController {
    constructor(proxy) {
      super();
      this._proxy = proxy;
      this.init();
    }
  
    init() {
      this.addState('idle', IdleState);
      this.addState('walk', WalkState);
      this.addState('run', RunState);
      this.addState('Taunt', TauntState);
    }
  };
  
  
  class State {
    constructor(parent) {
      this.parent = parent;
    }
  
    Enter() {}
    Exit() {}
    Update() {}
  };
  
  
  class TauntState extends State {
    constructor(parent) {
      super(parent);
  
      this.DoneCallback = () => {
        this.Done();
      }
    }
  
    get Name() {
      return 'Taunt';
    }
  
    Enter(PreviousState) {
      const CurrentAction = this.parent._proxy.allAnimations['Taunt'].action;
      const mixer = CurrentAction.getMixer();
      mixer.addEventListener('finished', this.DoneCallback);
  
      if (PreviousState) {
        const PreviousAction = this.parent._proxy.allAnimations[PreviousState.Name].action;
  
        CurrentAction.reset();  
        CurrentAction.setLoop(THREE.LoopOnce, 1);
        CurrentAction.clampWhenFinished = true;
        CurrentAction.crossFadeFrom(PreviousAction, 0.2, true);
        CurrentAction.play();
      } else {
        CurrentAction.play();
      }
    }
  
    Done() {
      this.clean();
      this.parent.setState('idle');
    }
  
    clean() {
      const action = this.parent._proxy.allAnimations['Taunt'].action;
      
      action.getMixer().removeEventListener('finished', this.cleanCallback);
    }
  
    Exit() {
      this.clean();
    }
  
    Update(_) {
    }
  };
  
  
  class WalkState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'walk';
    }
  
    Enter(PreviousState) {
      const CurrentAction = this.parent._proxy.allAnimations['walk'].action;
      if (PreviousState) {
        const PreviousAction = this.parent._proxy.allAnimations[PreviousState.Name].action;
  
        CurrentAction.enabled = true;
  
        if (PreviousState.Name == 'run') {
          const ratio = CurrentAction.getClip().duration / PreviousAction.getClip().duration;
          CurrentAction.time = PreviousAction.time * ratio;
        } else {
          CurrentAction.time = 0.0;
          CurrentAction.setEffectiveTimeScale(1.0);
          CurrentAction.setEffectiveWeight(1.0);
        }
  
        CurrentAction.crossFadeFrom(PreviousAction, 0.5, true);
        CurrentAction.play();
      } else {
        CurrentAction.play();
      }
    }
  
    Exit() {
    }
  
    Update(timeGone, input) {
      if (input.keys.forward || input.keys.backward) {
        if (input.keys.shift) {
          this.parent.setState('run');
        }
        return;
      }
  
      this.parent.setState('idle');
    }
  };
  
  
  class RunState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'run';
    }
  
    Enter(PreviousState) {
      const CurrentAction = this.parent._proxy.allAnimations['run'].action;
      if (PreviousState) {
        const PreviousAction = this.parent._proxy.allAnimations[PreviousState.Name].action;
  
        CurrentAction.enabled = true;
  
        if (PreviousState.Name == 'walk') {
          const ratio = CurrentAction.getClip().duration / PreviousAction.getClip().duration;
          CurrentAction.time = PreviousAction.time * ratio;
        } else {
          CurrentAction.time = 0.0;
          CurrentAction.setEffectiveTimeScale(1.0);
          CurrentAction.setEffectiveWeight(1.0);
        }
  
        CurrentAction.crossFadeFrom(PreviousAction, 0.5, true);
        CurrentAction.play();
      } else {
        CurrentAction.play();
      }
    }
  
    Exit() {
    }
  
    Update(timeGone, input) {
      if (input.keys.forward || input.keys.backward) {
        if (!input.keys.shift) {
          this.parent.setState('walk');
        }
        return;
      }
  
      this.parent.setState('idle');
    }
  };
  
  
  class IdleState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'idle';
    }
  
    Enter(PreviousState) {
      const idleAction = this.parent._proxy.allAnimations['idle'].action;
      if (PreviousState) {
        const PreviousAction = this.parent._proxy.allAnimations[PreviousState.Name].action;
        idleAction.time = 0.0;
        idleAction.enabled = true;
        idleAction.setEffectiveTimeScale(1.0);
        idleAction.setEffectiveWeight(1.0);
        idleAction.crossFadeFrom(PreviousAction, 0.5, true);
        idleAction.play();
      } else {
        idleAction.play();
      }
    }
  
    Exit() {
    }
  
    Update(_, input) {
      if (input.keys.forward || input.keys.backward) {
        this.parent.setState('walk');
      } else if (input.keys.space) {
        this.parent.setState('Taunt');
      }
    }
  };

  export {CharacterController}