/**
 * WaypointBeacon - 3D beacon for wave navigation
 * 
 * Phase 8B: Waypoint Beacon System
 * - Spawns relative to player position/heading after wave complete
 * - Distance scales with wave number
 * - Soft time limit with increasing urgency
 * - Activation radius triggers next wave
 */

import * as THREE from 'three';

// ============ Constants ============

const BEACON_BASE_DISTANCE = 2000;      // meters (Wave 1) - meaningful travel distance
const BEACON_DISTANCE_SCALE = 300;      // +300m per wave for escalating journeys
const BEACON_ACTIVATION_RADIUS = 80;    // meters to trigger activation (slightly tighter)

const BEACON_BASE_TIME = 90;            // seconds (Wave 1) - more time for longer distance
const BEACON_TIME_PER_WAVE = 15;        // +15s per wave

// Visual constants - targeting bracket style
const BEACON_SIZE = 40;                 // Size of the targeting bracket
const PULSE_SPEED = 2.0;
const ROTATION_SPEED = 0.8;

// ============ Types ============

export interface BeaconState {
  active: boolean;
  position: THREE.Vector3;
  distance: number;        // Current distance from player
  timeLimit: number;       // Total time allowed
  timeRemaining: number;   // Time left
  urgencyLevel: number;    // 0-1, increases as time runs out
}

// ============ WaypointBeacon Class ============

export class WaypointBeacon {
  private mesh: THREE.Group;
  private outerBrackets: THREE.Group;
  private innerDiamond: THREE.Mesh;
  private pulseRing: THREE.Mesh;
  private pointLight: THREE.PointLight;
  
  private active: boolean = false;
  private position: THREE.Vector3 = new THREE.Vector3();
  private targetDistance: number = 0;
  private timeLimit: number = 0;
  private timeRemaining: number = 0;
  private elapsedTime: number = 0;
  private timerEnabled: boolean = true;  // When false, no timeout (free flight)
  
  // Callbacks
  private onActivated?: () => void;
  private onTimeout?: () => void;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.visible = false;

    // Create beacon visuals - targeting bracket style (green/yellow color)
    this.outerBrackets = this.createOuterBrackets();
    this.innerDiamond = this.createInnerDiamond();
    this.pulseRing = this.createPulseRing();
    this.pointLight = this.createLight();

    this.mesh.add(this.outerBrackets);
    this.mesh.add(this.innerDiamond);
    this.mesh.add(this.pulseRing);
    this.mesh.add(this.pointLight);

    // Disable frustum culling so beacon remains visible even when outside camera frustum
    this.mesh.frustumCulled = false;
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        child.frustumCulled = false;
      }
    });

    console.log('[BEACON] Waypoint beacon initialized (targeting bracket style)');
  }

  // ============ Visual Creation - Targeting Bracket Style ============

  /**
   * Create outer corner brackets - similar to targeting reticle but green/yellow
   */
  private createOuterBrackets(): THREE.Group {
    const group = new THREE.Group();
    const bracketColor = 0x44ff44; // Green color for waypoint (different from cyan targeting)
    const bracketSize = BEACON_SIZE;
    const bracketThickness = 2;
    const bracketLength = bracketSize * 0.35;

    // Create corner brackets using thin box geometries
    const cornerPositions = [
      { x: -bracketSize/2, y: bracketSize/2, rotZ: 0 },      // Top-left
      { x: bracketSize/2, y: bracketSize/2, rotZ: Math.PI/2 },   // Top-right
      { x: bracketSize/2, y: -bracketSize/2, rotZ: Math.PI },    // Bottom-right
      { x: -bracketSize/2, y: -bracketSize/2, rotZ: -Math.PI/2 }, // Bottom-left
    ];

    cornerPositions.forEach(pos => {
      // Horizontal part of L-bracket
      const horizGeo = new THREE.BoxGeometry(bracketLength, bracketThickness, bracketThickness);
      const horizMat = new THREE.MeshBasicMaterial({
        color: bracketColor,
        transparent: true,
        opacity: 0.9,
      });
      const horiz = new THREE.Mesh(horizGeo, horizMat);
      horiz.position.set(pos.x + (pos.x > 0 ? -bracketLength/2 : bracketLength/2), pos.y, 0);
      group.add(horiz);

      // Vertical part of L-bracket
      const vertGeo = new THREE.BoxGeometry(bracketThickness, bracketLength, bracketThickness);
      const vertMat = new THREE.MeshBasicMaterial({
        color: bracketColor,
        transparent: true,
        opacity: 0.9,
      });
      const vert = new THREE.Mesh(vertGeo, vertMat);
      vert.position.set(pos.x, pos.y + (pos.y > 0 ? -bracketLength/2 : bracketLength/2), 0);
      group.add(vert);
    });

    return group;
  }

  /**
   * Create inner diamond marker - waypoint indicator
   */
  private createInnerDiamond(): THREE.Mesh {
    const diamondSize = BEACON_SIZE * 0.2;
    
    // Create a diamond shape using a rotated square
    const geometry = new THREE.PlaneGeometry(diamondSize, diamondSize);
    const material = new THREE.MeshBasicMaterial({
      color: 0x88ff88, // Lighter green
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = Math.PI / 4; // Rotate 45 degrees to make diamond
    return mesh;
  }

  /**
   * Create pulsing ring around the beacon
   */
  private createPulseRing(): THREE.Mesh {
    const geometry = new THREE.RingGeometry(
      BEACON_SIZE * 0.55,
      BEACON_SIZE * 0.6,
      32
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    return new THREE.Mesh(geometry, material);
  }

  private createLight(): THREE.PointLight {
    const light = new THREE.PointLight(0x44ff44, 1.5, 200);
    return light;
  }

  // ============ Spawn Logic ============

  /**
   * Spawn beacon relative to player position and heading
   * @param timerEnabled - If false, no time limit (free flight mode)
   */
  public spawn(
    playerPosition: THREE.Vector3,
    playerDirection: THREE.Vector3,
    waveNumber: number,
    timerEnabled: boolean = true
  ): void {
    // Clear any previous beacon state
    this.elapsedTime = 0;
    this.timeRemaining = 0;
    
    // Store timer state
    this.timerEnabled = timerEnabled;
    
    // Calculate distance for this wave
    this.targetDistance = BEACON_BASE_DISTANCE + (waveNumber - 1) * BEACON_DISTANCE_SCALE;
    
    // Calculate time limit for this wave (only matters if timerEnabled)
    this.timeLimit = BEACON_BASE_TIME + (waveNumber - 1) * BEACON_TIME_PER_WAVE;
    this.timeRemaining = timerEnabled ? this.timeLimit : Infinity;
    
    // Position beacon ahead of player in their current direction
    const direction = playerDirection.clone().normalize();
    
    // Keep beacon at reasonable altitude (player's altitude or 50m, whichever is higher)
    const beaconAltitude = Math.max(playerPosition.y, 50);
    
    this.position.copy(playerPosition)
      .add(direction.multiplyScalar(this.targetDistance));
    this.position.y = beaconAltitude;
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;
    this.active = true;
    this.elapsedTime = 0;

    if (timerEnabled) {
      console.log(`[BEACON] Spawned at distance ${this.targetDistance.toFixed(0)}m, time limit ${this.timeLimit}s`);
    } else {
      console.log(`[BEACON] Spawned at distance ${this.targetDistance.toFixed(0)}m, FREE FLIGHT (no time limit)`);
    }

    // Dispatch beacon spawn event
    window.dispatchEvent(new CustomEvent('beacon-spawn', {
      detail: {
        position: this.position.clone(),
        distance: this.targetDistance,
        timeLimit: timerEnabled ? this.timeLimit : null,  // null = no limit
        timerEnabled,
      }
    }));
  }

  /**
   * Despawn the beacon
   */
  public despawn(): void {
    this.mesh.visible = false;
    this.active = false;
    this.elapsedTime = 0;
    this.timeRemaining = 0;

    window.dispatchEvent(new CustomEvent('beacon-despawn', {}));
    console.log('[BEACON] Despawned');
  }

  // ============ Update ============

  /**
   * Update beacon state
   */
  public update(dt: number, playerPosition: THREE.Vector3): void {
    if (!this.active) return;

    // Update timer (only if timer is enabled)
    this.elapsedTime += dt;
    if (this.timerEnabled) {
      this.timeRemaining = Math.max(0, this.timeLimit - this.elapsedTime);
    }

    // Calculate distance from player
    const distance = playerPosition.distanceTo(this.position);

    // Check for activation (player reached beacon)
    if (distance <= BEACON_ACTIVATION_RADIUS) {
      this.onReached();
      return;
    }

    // Check for timeout (only if timer is enabled)
    if (this.timerEnabled && this.timeRemaining <= 0) {
      this.onTimerExpired();
      return;
    }

    // Update visuals
    this.updateVisuals(dt);

    // Dispatch beacon update for HUD
    const urgencyLevel = this.timerEnabled ? (1 - (this.timeRemaining / this.timeLimit)) : 0;
    window.dispatchEvent(new CustomEvent('beacon-update', {
      detail: {
        distance,
        timeRemaining: this.timerEnabled ? this.timeRemaining : null,  // null = free flight
        timeLimit: this.timerEnabled ? this.timeLimit : null,
        timerEnabled: this.timerEnabled,
        urgencyLevel,
        position: this.position.clone(),
      }
    }));
  }

  private updateVisuals(dt: number): void {
    // Pulse the inner diamond opacity
    const pulse = 0.5 + Math.sin(this.elapsedTime * PULSE_SPEED) * 0.3;
    (this.innerDiamond.material as THREE.MeshBasicMaterial).opacity = pulse;

    // Pulse the ring
    const ringPulse = 0.3 + Math.sin(this.elapsedTime * PULSE_SPEED * 1.5) * 0.2;
    (this.pulseRing.material as THREE.MeshBasicMaterial).opacity = ringPulse;

    // Rotate the outer brackets slowly
    this.outerBrackets.rotation.z += dt * ROTATION_SPEED * 0.3;
    
    // Rotate the inner diamond
    this.innerDiamond.rotation.z += dt * ROTATION_SPEED;

    // Scale pulse ring for breathing effect
    const ringScale = 1 + Math.sin(this.elapsedTime * PULSE_SPEED * 0.8) * 0.15;
    this.pulseRing.scale.set(ringScale, ringScale, 1);

    // Make beacon face the camera (billboarding) - rotate to face player
    // The mesh will naturally face the player due to how it's positioned

    // Urgency: Change color from green to orange/red as time runs out (only if timer enabled)
    if (this.timerEnabled) {
      const urgency = 1 - (this.timeRemaining / this.timeLimit);
      if (urgency > 0.5) {
        const urgencyFactor = (urgency - 0.5) * 2; // 0 to 1 in the last 50%
        // Transition from green (0x44ff44) to orange/red
        const r = Math.floor(68 + urgencyFactor * 187);  // 68 -> 255
        const g = Math.floor(255 - urgencyFactor * 155); // 255 -> 100
        const b = Math.floor(68 - urgencyFactor * 68);   // 68 -> 0
        const color = new THREE.Color(`rgb(${r}, ${g}, ${b})`);
        
        // Update all materials
        (this.innerDiamond.material as THREE.MeshBasicMaterial).color = color;
        (this.pulseRing.material as THREE.MeshBasicMaterial).color = color;
        this.outerBrackets.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshBasicMaterial).color = color;
          }
        });
        this.pointLight.color = color;
      }
    }
  }

  // ============ Callbacks ============

  private onReached(): void {
    console.log('[BEACON] Player reached beacon!');
    this.despawn();
    this.onActivated?.();

    window.dispatchEvent(new CustomEvent('beacon-reached', {
      detail: { timeRemaining: this.timeRemaining }
    }));
  }

  private onTimerExpired(): void {
    console.log('[BEACON] Timer expired!');
    this.despawn();
    this.onTimeout?.();

    window.dispatchEvent(new CustomEvent('beacon-timeout', {}));
  }

  public setOnActivated(callback: () => void): void {
    this.onActivated = callback;
  }

  public setOnTimeout(callback: () => void): void {
    this.onTimeout = callback;
  }

  // ============ Getters ============

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public isActive(): boolean {
    return this.active;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getDistance(playerPosition: THREE.Vector3): number {
    return playerPosition.distanceTo(this.position);
  }

  public getTimeRemaining(): number {
    return this.timeRemaining;
  }

  public getTimeLimit(): number {
    return this.timeLimit;
  }

  public getState(playerPosition: THREE.Vector3): BeaconState {
    return {
      active: this.active,
      position: this.position.clone(),
      distance: this.active ? playerPosition.distanceTo(this.position) : 0,
      timeLimit: this.timeLimit,
      timeRemaining: this.timeRemaining,
      urgencyLevel: this.active ? 1 - (this.timeRemaining / this.timeLimit) : 0,
    };
  }

  // ============ Disposal ============

  public dispose(): void {
    // Dispose outer brackets
    this.outerBrackets.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    
    // Dispose inner diamond
    this.innerDiamond.geometry.dispose();
    (this.innerDiamond.material as THREE.Material).dispose();
    
    // Dispose pulse ring
    this.pulseRing.geometry.dispose();
    (this.pulseRing.material as THREE.Material).dispose();
    
    this.mesh.clear();
    console.log('[BEACON] Disposed');
  }
}

// ============ Singleton Export ============

export const waypointBeacon = new WaypointBeacon();
