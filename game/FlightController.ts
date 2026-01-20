import * as THREE from 'three';
import { 
  PlayerAircraftConfig, 
  getDefaultPlayerAircraft,
  getPlayerEffectiveSpeed,
  getPlayerEffectiveTurnRate,
  getPlayerEffectiveHealth,
  PLAYER_BASE_STATS
} from './data/playerAircraftConfigs';

export enum ControlStyle {
  BEGINNER = 'HERO',
  MEDIUM = 'ACE',
  ADVANCED = 'SIM'
}

export interface InputState {
  pitchUp: boolean;
  pitchDown: boolean;
  rollLeft: boolean;
  rollRight: boolean;
  yawLeft: boolean;
  yawRight: boolean;
  boost: boolean;
  brake: boolean;
}

interface ControlProfile {
  pitchRate: number;
  rollRate: number;
  yawRate: number;
  pitchAccel: number;
  rollAccel: number;
  yawAccel: number;
  stabilizationStrength: number;
  inputSmoothing: number;
  maxTurnRateMultiplier: number;
  // HERO-specific: use yaw for left/right instead of roll
  flatTurnMode: boolean;
}

const PROFILES: Record<ControlStyle, ControlProfile> = {
  [ControlStyle.BEGINNER]: {
    pitchRate: 1.0,
    rollRate: 1.5,
    yawRate: 1.2,  // Increased for responsive flat turns
    pitchAccel: 8.0,
    rollAccel: 10.0,
    yawAccel: 6.0,  // Faster yaw acceleration
    stabilizationStrength: 3.0,  // Strong auto-level
    inputSmoothing: 0.7,
    maxTurnRateMultiplier: 1.0,
    flatTurnMode: true,  // HERO uses flat turns (yaw only)
  },
  [ControlStyle.MEDIUM]: {
    pitchRate: 1.2,
    rollRate: 2.2,
    yawRate: 0.6,
    pitchAccel: 3.0,
    rollAccel: 5.0,
    yawAccel: 1.5,
    stabilizationStrength: 0.0,
    inputSmoothing: 0.4,
    maxTurnRateMultiplier: 1.2,
    flatTurnMode: false,
  },
  [ControlStyle.ADVANCED]: {
    pitchRate: 1.5,
    rollRate: 2.8,
    yawRate: 0.8,
    pitchAccel: 1.5, 
    rollAccel: 3.0,
    yawAccel: 1.5,
    stabilizationStrength: 0.0,
    inputSmoothing: 0.0,
    maxTurnRateMultiplier: 1.5,
    flatTurnMode: false,
  }
};

// Barrel Roll Evasive Maneuver State
enum EvasiveState {
  NONE = 'NONE',
  BARREL_ROLL = 'BARREL_ROLL'
}

/**
 * FlightController - Handles flight physics, input, and movement
 * HERO mode: A/D controls yaw (flat turns), Q/E triggers barrel roll evasive maneuver
 * Now supports aircraft config for customized stats
 */
export class FlightController {
  public position: THREE.Vector3;
  public quaternion: THREE.Quaternion;
  public velocity: THREE.Vector3;
  public speed: number;
  public currentStyle: ControlStyle = ControlStyle.BEGINNER; // Default to HERO
  
  // Aircraft Config
  private aircraftConfig: PlayerAircraftConfig;
  
  // Physics State
  private currentPitchRate: number = 0;
  private currentRollRate: number = 0;
  private currentYawRate: number = 0;
  
  // Input Processing
  private smoothedInput = { pitch: 0, roll: 0, yaw: 0 };

  // Engine State
  public throttle: number = 0.5;

  // Energy System
  public energy: number = 100;
  public readonly MAX_ENERGY = 100;
  private readonly ENERGY_REGEN = 20;
  private readonly BOOST_DRAIN = 25;

  // Base Settings (modified by aircraft config)
  private MIN_SPEED = 15.0;
  private MAX_SPEED = 80.0;
  private BOOST_SPEED = 120.0;
  private readonly THROTTLE_LERP = 0.8;
  
  // Turn rate multiplier from aircraft config
  private turnRateMultiplier = 1.0;

  // Analog input
  private analog = { roll: 0, pitch: 0, yaw: 0 };

  // Barrel Roll Evasive Maneuver
  private evasiveState: EvasiveState = EvasiveState.NONE;
  private evasiveDirection: 1 | -1 = 1; // 1 = right, -1 = left
  private evasiveTimer: number = 0;
  private evasiveStartQuat: THREE.Quaternion = new THREE.Quaternion();
  private evasiveCooldown: number = 0;
  
  // Barrel roll timing
  private readonly BARREL_ROLL_DURATION = 0.5;  // Time for full 360° roll
  private readonly BARREL_ROLL_COOLDOWN = 0.8;  // Cooldown before next roll
  private readonly BARREL_ROLL_LATERAL = 8.0;   // Lateral movement during roll

  // Double-tap detection for barrel roll
  private lastKeyATap: number = 0;
  private lastKeyDTap: number = 0;
  private readonly DOUBLE_TAP_THRESHOLD = 300; // ms between taps

  // Inputs
  private input: InputState = {
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    yawLeft: false,
    yawRight: false,
    boost: false,
    brake: false,
  };

  private _keyDownHandler: (e: KeyboardEvent) => void;
  private _keyUpHandler: (e: KeyboardEvent) => void;
  private _blurHandler: () => void;

  constructor(autoBind: boolean = true, config?: PlayerAircraftConfig) {
    this.position = new THREE.Vector3(0, 100, 0);
    this.quaternion = new THREE.Quaternion();
    this.velocity = new THREE.Vector3(0, 0, -1);
    this.speed = 30;
    this.energy = 100;
    
    // Apply aircraft config
    this.aircraftConfig = config || getDefaultPlayerAircraft();
    this.applyAircraftConfig(this.aircraftConfig);

    this._keyDownHandler = (e) => this.handleKeyDown(e);
    this._keyUpHandler = (e) => this.handleKeyUp(e);
    this._blurHandler = () => this.resetInput();

    if (autoBind) {
      this.setupInput();
    }
  }
  
  /**
   * Apply aircraft configuration to flight parameters
   */
  public applyAircraftConfig(config: PlayerAircraftConfig): void {
    this.aircraftConfig = config;
    
    // Calculate effective stats from config
    const effectiveSpeed = getPlayerEffectiveSpeed(config);
    const effectiveTurnRate = getPlayerEffectiveTurnRate(config);
    
    // Apply speed modifiers
    this.MIN_SPEED = 15.0 * (0.7 + config.speed * 0.1);
    this.MAX_SPEED = effectiveSpeed;
    this.BOOST_SPEED = effectiveSpeed * 1.5;
    
    // Apply turn rate modifier
    this.turnRateMultiplier = effectiveTurnRate / PLAYER_BASE_STATS.TURN_RATE;
    
    console.log(`Aircraft config applied: ${config.name}`);
    console.log(`  Speed: ${this.MIN_SPEED.toFixed(1)} - ${this.MAX_SPEED.toFixed(1)} (boost: ${this.BOOST_SPEED.toFixed(1)})`);
    console.log(`  Turn rate multiplier: ${this.turnRateMultiplier.toFixed(2)}x`);
  }
  
  /**
   * Get current aircraft config
   */
  public getAircraftConfig(): PlayerAircraftConfig {
    return this.aircraftConfig;
  }
  
  /**
   * Update aircraft configuration (for changing aircraft mid-session)
   */
  public updateAircraftConfig(config: PlayerAircraftConfig): void {
    this.applyAircraftConfig(config);
  }

  public setControlStyle(style: ControlStyle) {
    this.currentStyle = style;
    console.log(`Control style set to: ${style}`);
  }

  public setAnalogInput(roll: number, pitch: number, yaw: number = 0) {
    this.analog.roll = roll;
    this.analog.pitch = pitch;
    this.analog.yaw = yaw;
  }

  /**
   * Set afterburner state (for touch controls)
   */
  public setAfterburner(active: boolean) {
    this.input.boost = active;
  }

  /**
   * Set air brake state (for touch controls)
   */
  public setAirBrake(active: boolean) {
    this.input.brake = active;
  }

  private setupInput() {
    window.addEventListener('keydown', this._keyDownHandler);
    window.addEventListener('keyup', this._keyUpHandler);
    window.addEventListener('contextmenu', (e) => e.preventDefault()); 
    window.addEventListener('blur', this._blurHandler);
  }

  public dispose() {
    window.removeEventListener('keydown', this._keyDownHandler);
    window.removeEventListener('keyup', this._keyUpHandler);
    window.removeEventListener('blur', this._blurHandler);
  }

  private handleKeyDown(e: KeyboardEvent) {
    const now = performance.now();
    
    switch(e.code) {
      case 'KeyW': this.input.pitchDown = true; break;
      case 'KeyS': this.input.pitchUp = true; break;
      case 'KeyA': 
        this.input.rollLeft = true;
        // Double-tap detection for barrel roll left (ignore key repeat)
        if (!e.repeat) {
          if (now - this.lastKeyATap < this.DOUBLE_TAP_THRESHOLD) {
            this.triggerBarrelRoll(1); // Barrel roll left
            this.lastKeyATap = 0; // Reset to prevent triple-tap
          } else {
            this.lastKeyATap = now;
          }
        }
        break;
      case 'KeyD': 
        this.input.rollRight = true;
        // Double-tap detection for barrel roll right (ignore key repeat)
        if (!e.repeat) {
          if (now - this.lastKeyDTap < this.DOUBLE_TAP_THRESHOLD) {
            this.triggerBarrelRoll(-1); // Barrel roll right
            this.lastKeyDTap = 0; // Reset to prevent triple-tap
          } else {
            this.lastKeyDTap = now;
          }
        }
        break;
      case 'ShiftLeft': 
      case 'ShiftRight': this.input.boost = true; break;
      case 'KeyB': this.input.brake = true; break;
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    switch(e.code) {
      case 'KeyW': this.input.pitchDown = false; break;
      case 'KeyS': this.input.pitchUp = false; break;
      case 'KeyA': this.input.rollLeft = false; break;
      case 'KeyD': this.input.rollRight = false; break;
      case 'ShiftLeft': 
      case 'ShiftRight': this.input.boost = false; break;
      case 'KeyB': this.input.brake = false; break;
    }
  }

  /**
   * Trigger the Barrel Roll evasive maneuver
   * @param direction -1 for left, 1 for right
   */
  private triggerBarrelRoll(direction: -1 | 1) {
    // Check cooldown
    if (this.evasiveCooldown > 0) return;
    if (this.evasiveState !== EvasiveState.NONE) return;
    
    console.log(`Barrel Roll triggered: ${direction === -1 ? 'LEFT' : 'RIGHT'}`);
    
    this.evasiveState = EvasiveState.BARREL_ROLL;
    this.evasiveDirection = direction;
    this.evasiveTimer = 0;
    this.evasiveStartQuat.copy(this.quaternion);
    
    // Dispatch event for UI feedback
    window.dispatchEvent(new CustomEvent('evasive-maneuver', { 
      detail: { type: 'barrel-roll', direction: direction === -1 ? 'left' : 'right' } 
    }));
  }

  public resetInput() {
    this.input = {
      pitchUp: false, pitchDown: false,
      rollLeft: false, rollRight: false,
      yawLeft: false, yawRight: false,
      boost: false, brake: false,
    };
    this.analog = { roll: 0, pitch: 0, yaw: 0 };
  }

  public reset(position: THREE.Vector3) {
    this.position.copy(position);
    this.quaternion.set(0, 0, 0, 1);
    this.speed = 30;
    this.throttle = 0.5;
    this.energy = 100;
    this.currentPitchRate = 0;
    this.currentRollRate = 0;
    this.currentYawRate = 0;
    this.smoothedInput = { pitch: 0, roll: 0, yaw: 0 };
    this.velocity.set(0, 0, -1).applyQuaternion(this.quaternion).multiplyScalar(this.speed);
    this.evasiveState = EvasiveState.NONE;
    this.evasiveCooldown = 0;
    this.resetInput();
  }

  /**
   * Update Barrel Roll evasive maneuver
   */
  private updateBarrelRoll(dt: number): boolean {
    // Update cooldown
    if (this.evasiveCooldown > 0) {
      this.evasiveCooldown = Math.max(0, this.evasiveCooldown - dt);
    }
    
    if (this.evasiveState === EvasiveState.NONE) return false;
    
    this.evasiveTimer += dt;
    const progress = Math.min(this.evasiveTimer / this.BARREL_ROLL_DURATION, 1.0);
    
    // Smooth roll animation (full 360°)
    const rollAngle = this.evasiveDirection * Math.PI * 2 * this.easeInOut(progress);
    
    // Apply roll on top of starting orientation
    const rollQuat = new THREE.Quaternion();
    rollQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollAngle);
    this.quaternion.copy(this.evasiveStartQuat).multiply(rollQuat);
    
    // Lateral movement during roll (peaks at middle of roll)
    const lateralIntensity = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.evasiveStartQuat);
    forward.y = 0;
    forward.normalize();
    const worldRight = new THREE.Vector3(-forward.z, 0, forward.x);
    
    const lateralMove = worldRight.multiplyScalar(
      this.evasiveDirection * this.BARREL_ROLL_LATERAL * lateralIntensity * dt
    );
    this.position.add(lateralMove);
    
    // Complete
    if (progress >= 1.0) {
      this.evasiveState = EvasiveState.NONE;
      this.evasiveCooldown = this.BARREL_ROLL_COOLDOWN;
      // Restore to clean orientation (remove any floating point drift)
      this.quaternion.copy(this.evasiveStartQuat);
    }
    
    return true; // Maneuver is active
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  public update(dt: number) {
    const profile = PROFILES[this.currentStyle];
    
    // Check if evasive maneuver is active
    const isEvading = this.updateBarrelRoll(dt);

    // --- Energy & Throttle ---
    let targetThrottle = 0.5;
    
    if (this.input.boost) {
      if (this.energy > 0) {
        this.energy = Math.max(0, this.energy - this.BOOST_DRAIN * dt);
        targetThrottle = 1.0;
      } else {
        targetThrottle = 0.8;
      }
    } else {
      this.energy = Math.min(this.MAX_ENERGY, this.energy + this.ENERGY_REGEN * dt);
      if (this.input.brake) targetThrottle = 0.0;
    }

    this.throttle = THREE.MathUtils.lerp(this.throttle, targetThrottle, dt * this.THROTTLE_LERP);

    // --- Speed Physics ---
    let targetSpeed = 0;
    if (this.throttle <= 0.5) {
      targetSpeed = THREE.MathUtils.lerp(this.MIN_SPEED, this.MAX_SPEED, this.throttle * 2);
    } else {
      targetSpeed = THREE.MathUtils.lerp(this.MAX_SPEED, this.BOOST_SPEED, (this.throttle - 0.5) * 2);
    }
    
    // Gravity influence (reduced in HERO mode to keep things simple)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    const climbFactor = forward.y;
    const gravityMult = profile.flatTurnMode ? 0.3 : 1.0; // Less gravity effect in HERO
    const gravityEffect = climbFactor * -20.0 * gravityMult * dt;

    const speedDiff = targetSpeed - this.speed;
    const accelRate = speedDiff > 0 ? 15.0 : 25.0;
    
    this.speed += speedDiff * dt * (accelRate / 20.0); 
    this.speed += gravityEffect;
    this.speed = Math.max(5.0, this.speed);

    // Skip normal controls if evading
    if (isEvading) {
      // Still update position with forward velocity
      const newForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
      this.velocity.copy(newForward).multiplyScalar(this.speed);
      this.position.add(this.velocity.clone().multiplyScalar(dt));
      return;
    }

    // --- Input Processing ---
    let rawPitch = THREE.MathUtils.clamp(
      (Number(this.input.pitchUp) - Number(this.input.pitchDown)) + this.analog.pitch, 
      -1, 1
    );
    
    let rawRoll = 0;
    let rawYaw = 0;
    
    // HERO mode: A/D and joystick left/right control YAW (flat turns), not roll
    if (profile.flatTurnMode) {
      // Convert roll input to yaw input for flat turns
      const horizontalInput = THREE.MathUtils.clamp(
        (Number(this.input.rollLeft) - Number(this.input.rollRight)) + this.analog.roll, 
        -1, 1
      );
      rawYaw = horizontalInput; // Use roll input as yaw
      rawRoll = 0; // No roll from A/D in HERO mode
      
      // Q/E still available for manual yaw if needed (additive)
      rawYaw += THREE.MathUtils.clamp(
        (Number(this.input.yawLeft) - Number(this.input.yawRight)), 
        -1, 1
      ) * 0.5;
      rawYaw = THREE.MathUtils.clamp(rawYaw, -1, 1);
    } else {
      // Standard controls: A/D = roll, Q/E = yaw
      rawRoll = THREE.MathUtils.clamp(
        (Number(this.input.rollLeft) - Number(this.input.rollRight)) + this.analog.roll, 
        -1, 1
      );
      rawYaw = THREE.MathUtils.clamp(
        (Number(this.input.yawLeft) - Number(this.input.yawRight)) + this.analog.yaw, 
        -1, 1
      );
    }

    const smoothSpeed = 20.0 * (1.0 - profile.inputSmoothing) + 0.1;
    const smoothFactor = THREE.MathUtils.clamp(dt * smoothSpeed, 0, 1);

    this.smoothedInput.pitch = THREE.MathUtils.lerp(this.smoothedInput.pitch, rawPitch, smoothFactor);
    this.smoothedInput.roll = THREE.MathUtils.lerp(this.smoothedInput.roll, rawRoll, smoothFactor);
    this.smoothedInput.yaw = THREE.MathUtils.lerp(this.smoothedInput.yaw, rawYaw, smoothFactor);

    // --- Rotational Physics ---
    // Apply both profile multiplier and aircraft config multiplier
    const multiplier = profile.maxTurnRateMultiplier * this.turnRateMultiplier;

    const pRate = profile.pitchRate * multiplier;
    const rRate = profile.rollRate * multiplier;
    const yRate = profile.yawRate * multiplier;

    let targetPitchRate = this.smoothedInput.pitch * pRate;
    let targetRollRate = this.smoothedInput.roll * rRate;
    let targetYawRate = this.smoothedInput.yaw * yRate;

    // --- Stabilization Assist (Always active in HERO mode) ---
    if (profile.stabilizationStrength > 0) {
      const isIdle = Math.abs(rawPitch) < 0.05 && Math.abs(rawRoll) < 0.05 && Math.abs(rawYaw) < 0.05;
      
      if (isIdle || profile.flatTurnMode) {
        // Always stabilize roll in HERO mode
        const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion.clone().invert());
        const rollError = localUp.x;
        targetRollRate -= rollError * profile.stabilizationStrength;
        
        // Also stabilize pitch to keep nose level in HERO mode
        if (profile.flatTurnMode || profile.stabilizationStrength > 1.0) {
          const pitchError = localUp.z;
          targetPitchRate += pitchError * profile.stabilizationStrength * 0.5;
        }
      }
    }

    // --- Apply Physics ---
    this.currentPitchRate = THREE.MathUtils.lerp(this.currentPitchRate, targetPitchRate, dt * profile.pitchAccel);
    this.currentRollRate = THREE.MathUtils.lerp(this.currentRollRate, targetRollRate, dt * profile.rollAccel);
    this.currentYawRate = THREE.MathUtils.lerp(this.currentYawRate, targetYawRate, dt * profile.yawAccel);

    const rotQuat = new THREE.Quaternion();
    
    rotQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.currentPitchRate * dt);
    this.quaternion.multiply(rotQuat);

    rotQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.currentYawRate * dt);
    this.quaternion.multiply(rotQuat);

    rotQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.currentRollRate * dt);
    this.quaternion.multiply(rotQuat);

    this.quaternion.normalize();

    // --- Update Position ---
    const newForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    this.velocity.copy(newForward).multiplyScalar(this.speed);
    this.position.add(this.velocity.clone().multiplyScalar(dt));
  }

  public isBoosting(): boolean {
    return this.throttle > 0.8;
  }

  public isEvading(): boolean {
    return this.evasiveState !== EvasiveState.NONE;
  }

  public getEvasiveState(): string {
    return this.evasiveState;
  }

  public getEvasiveCooldown(): number {
    return this.evasiveCooldown;
  }

  public getInputState(): InputState {
    return this.input;
  }
}
