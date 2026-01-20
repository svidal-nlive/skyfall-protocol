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

const BEACON_BASE_DISTANCE = 800;      // meters (Wave 1)
const BEACON_DISTANCE_SCALE = 150;     // +150m per wave
const BEACON_ACTIVATION_RADIUS = 100;  // meters to trigger activation

const BEACON_BASE_TIME = 60;           // seconds (Wave 1)
const BEACON_TIME_PER_WAVE = 10;       // +10s per wave

// Visual constants
const BEAM_HEIGHT = 200;
const BEAM_RADIUS = 5;
const BASE_RADIUS = 15;
const PULSE_SPEED = 2.0;
const ROTATION_SPEED = 1.0;

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
  private beam: THREE.Mesh;
  private beamGlow: THREE.Mesh;
  private base: THREE.Mesh;
  private rings: THREE.Mesh[] = [];
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

    // Create beacon visuals
    this.beam = this.createBeam();
    this.beamGlow = this.createBeamGlow();
    this.base = this.createBase();
    this.createRings();
    this.pointLight = this.createLight();

    this.mesh.add(this.beam);
    this.mesh.add(this.beamGlow);
    this.mesh.add(this.base);
    this.rings.forEach(ring => this.mesh.add(ring));
    this.mesh.add(this.pointLight);

    console.log('[BEACON] Waypoint beacon initialized');
  }

  // ============ Visual Creation ============

  private createBeam(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(
      BEAM_RADIUS * 0.3,  // top radius (tapers)
      BEAM_RADIUS,        // bottom radius
      BEAM_HEIGHT,
      8
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = BEAM_HEIGHT / 2;
    return mesh;
  }

  private createBeamGlow(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(
      BEAM_RADIUS * 0.5,
      BEAM_RADIUS * 2,
      BEAM_HEIGHT * 0.8,
      8
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = BEAM_HEIGHT * 0.4;
    return mesh;
  }

  private createBase(): THREE.Mesh {
    // Flat disc at ground level
    const geometry = new THREE.CylinderGeometry(
      BASE_RADIUS,
      BASE_RADIUS,
      2,
      16
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1;
    return mesh;
  }

  private createRings(): void {
    // Create expanding ring indicators
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.RingGeometry(
        BASE_RADIUS + i * 20,
        BASE_RADIUS + i * 20 + 3,
        32
      );
      
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3 - i * 0.08,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2; // Lay flat
      mesh.position.y = 1;
      this.rings.push(mesh);
    }
  }

  private createLight(): THREE.PointLight {
    const light = new THREE.PointLight(0x00ffff, 2, 300);
    light.position.y = BEAM_HEIGHT / 2;
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
    // Pulse the beam opacity
    const pulse = 0.4 + Math.sin(this.elapsedTime * PULSE_SPEED) * 0.2;
    (this.beam.material as THREE.MeshBasicMaterial).opacity = pulse + 0.2;
    (this.beamGlow.material as THREE.MeshBasicMaterial).opacity = pulse * 0.4;

    // Rotate the rings
    this.rings.forEach((ring, i) => {
      ring.rotation.z += dt * ROTATION_SPEED * (1 + i * 0.2);
    });

    // Scale rings based on pulse
    const ringScale = 1 + Math.sin(this.elapsedTime * PULSE_SPEED * 0.5) * 0.1;
    this.rings.forEach(ring => {
      ring.scale.set(ringScale, ringScale, 1);
    });

    // Urgency: Change color from cyan to orange as time runs out
    const urgency = 1 - (this.timeRemaining / this.timeLimit);
    if (urgency > 0.5) {
      const urgencyFactor = (urgency - 0.5) * 2; // 0 to 1 in the last 50%
      const r = Math.floor(0 + urgencyFactor * 255);
      const g = Math.floor(255 - urgencyFactor * 100);
      const b = Math.floor(255 - urgencyFactor * 255);
      const color = new THREE.Color(`rgb(${r}, ${g}, ${b})`);
      
      (this.beam.material as THREE.MeshBasicMaterial).color = color;
      (this.beamGlow.material as THREE.MeshBasicMaterial).color = color;
      (this.base.material as THREE.MeshBasicMaterial).color = color;
      this.rings.forEach(ring => {
        (ring.material as THREE.MeshBasicMaterial).color = color;
      });
      this.pointLight.color = color;
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
    this.beam.geometry.dispose();
    (this.beam.material as THREE.Material).dispose();
    this.beamGlow.geometry.dispose();
    (this.beamGlow.material as THREE.Material).dispose();
    this.base.geometry.dispose();
    (this.base.material as THREE.Material).dispose();
    this.rings.forEach(ring => {
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    });
    this.mesh.clear();
    console.log('[BEACON] Disposed');
  }
}

// ============ Singleton Export ============

export const waypointBeacon = new WaypointBeacon();
