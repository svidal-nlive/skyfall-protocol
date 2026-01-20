/**
 * WaveCinematicController - Manages cinematic enemy entry sequences
 * 
 * Phase 8C: Cinematic Entry System
 * - Camera detaches from player for dramatic enemy reveals
 * - Per-enemy-type camera angles and entry patterns
 * - Letterbox bars and title cards
 * - Staggered enemy entry by type
 * - Skip functionality
 */

import * as THREE from 'three';
import { EnemyType, Wave, WaveComposition } from './WaveManager';

// ============ Types ============

export type CameraAngle = 'side_tracking' | 'head_on' | 'low_angle' | 'static' | 'orbit';
export type EntryDirection = 'FRONT' | 'FRONT_LEFT' | 'FRONT_RIGHT' | 'LEFT' | 'RIGHT' | 'ABOVE' | 'ABOVE_BEHIND';

export interface CinematicSegment {
  enemyType: EnemyType;
  duration: number;           // seconds
  cameraAngle: CameraAngle;
  entryDirection: EntryDirection;
  displayCount: number;       // representative count shown (max 4)
  actualCount: number;        // real spawn count
}

export interface CinematicState {
  isActive: boolean;
  currentSegmentIndex: number;
  segmentProgress: number;    // 0-1 within current segment
  totalProgress: number;      // 0-1 of entire cinematic
  currentSegment: CinematicSegment | null;
  waveName: string;
  waveNumber: number;
  isBoss: boolean;
}

// ============ Constants ============

// Camera angles per enemy type
const ENEMY_CAMERA_ANGLES: Record<EnemyType, CameraAngle> = {
  phantom: 'side_tracking',
  viper: 'head_on',
  warden: 'low_angle',
  specter: 'static',
};

// Duration per enemy type segment (seconds to showcase each type)
const ENEMY_SEGMENT_DURATION: Record<EnemyType, number> = {
  phantom: 2.5,   // Fast scouts - slightly shorter showcase
  viper: 3.0,     // Fighters - medium showcase  
  warden: 3.5,    // Heavy tanks - longer dramatic entrance
  specter: 4.0,   // Elite stealth - longest for dramatic effect
};

// Max enemies to show in cinematic per type
const MAX_CINEMATIC_ENEMIES: Record<EnemyType, number> = {
  phantom: 4,
  viper: 4,
  warden: 2,
  specter: 2,
};

// Entry directions cycle
const ENTRY_DIRECTIONS: EntryDirection[] = [
  'FRONT',
  'FRONT_LEFT', 
  'FRONT_RIGHT',
  'ABOVE',
  'LEFT',
  'RIGHT',
  'ABOVE_BEHIND',
];

// Timing constants
const INTRO_DURATION = 1.5;      // Letterbox slide in + wave title (extended)
const OUTRO_DURATION = 1.0;      // Camera return + letterbox out (extended)
const TRANSITION_DURATION = 0.5; // Between segments (smoother)
const BOSS_EXTRA_DURATION = 5.0; // Extra time for boss waves (total 12-15s)
const BOSS_INTRO_DURATION = 2.5; // Extended intro for bosses
const BOSS_TITLE_DURATION = 3.0; // Boss name display time

// ============ WaveCinematicController Class ============

export class WaveCinematicController {
  private isActive: boolean = false;
  private segments: CinematicSegment[] = [];
  private currentSegmentIndex: number = -1;
  private segmentStartTime: number = 0;
  private cinematicStartTime: number = 0;
  private totalDuration: number = 0;
  
  private currentWave: Wave | null = null;
  private playerPosition: THREE.Vector3 = new THREE.Vector3();
  private playerQuaternion: THREE.Quaternion = new THREE.Quaternion();
  
  // Camera state
  private cinematicCamera: THREE.PerspectiveCamera | null = null;
  private originalCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private originalCameraQuaternion: THREE.Quaternion = new THREE.Quaternion();
  private targetCameraPosition: THREE.Vector3 = new THREE.Vector3();
  private targetCameraLookAt: THREE.Vector3 = new THREE.Vector3();
  
  // Callbacks
  private onComplete?: () => void;
  private onSegmentChange?: (segment: CinematicSegment) => void;

  constructor() {
    console.log('[CINEMATIC] Controller initialized');
  }

  // ============ Segment Generation ============

  /**
   * Generate cinematic segments from wave composition
   */
  private generateSegments(wave: Wave): CinematicSegment[] {
    const segments: CinematicSegment[] = [];
    let directionIndex = Math.floor(Math.random() * ENTRY_DIRECTIONS.length);

    for (const comp of wave.composition) {
      const displayCount = Math.min(comp.count, MAX_CINEMATIC_ENEMIES[comp.type]);
      
      // For boss waves, use longer durations
      const baseDuration = ENEMY_SEGMENT_DURATION[comp.type];
      const duration = wave.isBoss ? baseDuration * 1.3 : baseDuration;
      
      segments.push({
        enemyType: comp.type,
        duration,
        cameraAngle: ENEMY_CAMERA_ANGLES[comp.type],
        entryDirection: ENTRY_DIRECTIONS[directionIndex % ENTRY_DIRECTIONS.length],
        displayCount,
        actualCount: comp.count,
      });

      directionIndex++;
    }

    // For boss waves, add a final dramatic orbit segment
    if (wave.isBoss) {
      segments.push({
        enemyType: 'specter', // Use specter as placeholder for boss
        duration: BOSS_TITLE_DURATION,
        cameraAngle: 'orbit',
        entryDirection: 'FRONT',
        displayCount: 1,
        actualCount: 1,
      });
    }

    return segments;
  }

  /**
   * Calculate total duration of cinematic
   */
  private calculateTotalDuration(wave: Wave): number {
    // Boss waves get extended intro
    const introDuration = wave.isBoss ? BOSS_INTRO_DURATION : INTRO_DURATION;
    let duration = introDuration + OUTRO_DURATION;
    
    // Add segment durations with transitions
    for (let i = 0; i < this.segments.length; i++) {
      duration += this.segments[i].duration;
      if (i < this.segments.length - 1) {
        duration += TRANSITION_DURATION;
      }
    }

    // Boss waves get extra time for dramatic effect
    if (wave.isBoss) {
      duration += BOSS_EXTRA_DURATION;
    }

    return duration;
  }

  // ============ Start/Stop ============

  /**
   * Start cinematic for a wave
   */
  public start(
    wave: Wave,
    playerPosition: THREE.Vector3,
    playerQuaternion: THREE.Quaternion,
    camera: THREE.PerspectiveCamera
  ): void {
    if (this.isActive) {
      console.warn('[CINEMATIC] Already active, skipping');
      return;
    }

    this.currentWave = wave;
    this.playerPosition.copy(playerPosition);
    this.playerQuaternion.copy(playerQuaternion);
    this.cinematicCamera = camera;
    
    // Store original camera state
    this.originalCameraPosition.copy(camera.position);
    this.originalCameraQuaternion.copy(camera.quaternion);

    // Generate segments
    this.segments = this.generateSegments(wave);
    this.totalDuration = this.calculateTotalDuration(wave);
    
    // Initialize state
    this.isActive = true;
    this.currentSegmentIndex = -1; // Start with intro
    this.cinematicStartTime = performance.now() / 1000;
    this.segmentStartTime = this.cinematicStartTime;

    console.log(`[CINEMATIC] Starting for Wave ${wave.id}: ${wave.name}`);
    console.log(`[CINEMATIC] ${this.segments.length} segments, ${this.totalDuration.toFixed(1)}s total`);

    // Dispatch start event
    window.dispatchEvent(new CustomEvent('cinematic-start', {
      detail: {
        waveNumber: wave.id,
        waveName: wave.name,
        isBoss: wave.isBoss,
        bossType: wave.bossType,
        totalDuration: this.totalDuration,
        segments: this.segments,
      }
    }));
  }

  /**
   * Skip the cinematic (user pressed skip)
   */
  public skip(): void {
    if (!this.isActive) return;
    
    console.log('[CINEMATIC] Skipped by user');
    this.complete();
  }

  /**
   * Complete the cinematic
   */
  private complete(): void {
    if (!this.isActive) return;

    // Restore camera
    if (this.cinematicCamera) {
      this.cinematicCamera.position.copy(this.originalCameraPosition);
      this.cinematicCamera.quaternion.copy(this.originalCameraQuaternion);
    }

    this.isActive = false;
    this.currentSegmentIndex = -1;
    this.segments = [];
    this.currentWave = null;

    console.log('[CINEMATIC] Complete');

    // Dispatch complete event
    window.dispatchEvent(new CustomEvent('cinematic-complete', {}));

    this.onComplete?.();
  }

  // ============ Update ============

  /**
   * Update cinematic state
   */
  public update(dt: number): void {
    if (!this.isActive || !this.cinematicCamera) return;

    const now = performance.now() / 1000;
    const elapsed = now - this.cinematicStartTime;

    // Check if cinematic is complete
    if (elapsed >= this.totalDuration) {
      this.complete();
      return;
    }

    // Determine current phase
    let timeAccumulator = 0;
    let newSegmentIndex = -1;
    let segmentLocalTime = 0;

    // Intro phase
    if (elapsed < INTRO_DURATION) {
      newSegmentIndex = -1;
      segmentLocalTime = elapsed;
    } else {
      timeAccumulator = INTRO_DURATION;

      // Find current segment
      for (let i = 0; i < this.segments.length; i++) {
        const segmentEnd = timeAccumulator + this.segments[i].duration;
        
        if (elapsed < segmentEnd) {
          newSegmentIndex = i;
          segmentLocalTime = elapsed - timeAccumulator;
          break;
        }
        
        timeAccumulator = segmentEnd + TRANSITION_DURATION;
      }

      // Check if in outro
      if (newSegmentIndex === -1 && elapsed >= this.totalDuration - OUTRO_DURATION) {
        newSegmentIndex = this.segments.length; // Outro marker
        segmentLocalTime = elapsed - (this.totalDuration - OUTRO_DURATION);
      }
    }

    // Handle segment change
    if (newSegmentIndex !== this.currentSegmentIndex) {
      this.currentSegmentIndex = newSegmentIndex;
      this.segmentStartTime = now;
      
      if (newSegmentIndex >= 0 && newSegmentIndex < this.segments.length) {
        const segment = this.segments[newSegmentIndex];
        console.log(`[CINEMATIC] Segment ${newSegmentIndex + 1}: ${segment.enemyType} (${segment.displayCount})`);
        
        this.onSegmentChange?.(segment);
        
        // Dispatch segment event
        window.dispatchEvent(new CustomEvent('cinematic-segment', {
          detail: {
            segmentIndex: newSegmentIndex,
            segment,
            isLast: newSegmentIndex === this.segments.length - 1,
          }
        }));
      }
    }

    // Update camera based on current phase
    this.updateCamera(elapsed, segmentLocalTime);

    // Dispatch progress event
    const progress = elapsed / this.totalDuration;
    const currentSegment = this.currentSegmentIndex >= 0 && this.currentSegmentIndex < this.segments.length
      ? this.segments[this.currentSegmentIndex]
      : null;

    window.dispatchEvent(new CustomEvent('cinematic-progress', {
      detail: {
        progress,
        elapsed,
        totalDuration: this.totalDuration,
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegment,
        isIntro: this.currentSegmentIndex === -1,
        isOutro: this.currentSegmentIndex === this.segments.length,
      }
    }));
  }

  /**
   * Update camera position based on current phase
   */
  private updateCamera(elapsed: number, segmentLocalTime: number): void {
    if (!this.cinematicCamera) return;

    const introProgress = Math.min(elapsed / INTRO_DURATION, 1);
    const outroProgress = elapsed >= this.totalDuration - OUTRO_DURATION
      ? (elapsed - (this.totalDuration - OUTRO_DURATION)) / OUTRO_DURATION
      : 0;

    // During intro: dramatic pull out and pan
    if (this.currentSegmentIndex === -1) {
      // Ease function for smooth acceleration
      const easeOut = 1 - Math.pow(1 - introProgress, 3);
      
      // Pull back, rise up, and slight orbit for drama
      const pullBack = 80 * easeOut;
      const rise = 40 * easeOut;
      const orbitAngle = easeOut * Math.PI * 0.15; // Slight orbit
      
      // Calculate offset with orbit
      const orbitX = Math.sin(orbitAngle) * pullBack * 0.3;
      const orbitZ = pullBack;
      
      this.cinematicCamera.position.copy(this.originalCameraPosition);
      this.cinematicCamera.position.x += orbitX;
      this.cinematicCamera.position.z += orbitZ;
      this.cinematicCamera.position.y += rise;
      
      // Look at a point ahead of player for anticipation
      const lookAhead = this.playerPosition.clone();
      lookAhead.z -= 50 * easeOut;
      this.cinematicCamera.lookAt(lookAhead);
      return;
    }

    // During outro: smooth return to player with cinematic ease
    if (this.currentSegmentIndex === this.segments.length) {
      // Ease in for smooth deceleration
      const easeIn = outroProgress * outroProgress;
      
      this.cinematicCamera.position.lerpVectors(
        this.targetCameraPosition,
        this.originalCameraPosition,
        easeIn
      );
      this.cinematicCamera.quaternion.slerpQuaternions(
        this.cinematicCamera.quaternion,
        this.originalCameraQuaternion,
        easeIn * 0.15
      );
      return;
    }

    // During segment: position camera for dramatic enemy flyby
    if (this.currentSegmentIndex >= 0 && this.currentSegmentIndex < this.segments.length) {
      const segment = this.segments[this.currentSegmentIndex];
      const segmentProgress = segmentLocalTime / segment.duration;
      
      this.positionCameraForSegment(segment, segmentProgress);
    }
  }

  /**
   * Position camera for a specific segment - CINEMATIC CLOSE-UP FLYBYS
   */
  private positionCameraForSegment(segment: CinematicSegment, progress: number): void {
    if (!this.cinematicCamera) return;

    // Get entry direction vector
    const entryDir = this.getEntryDirectionVector(segment.entryDirection);
    
    // Calculate enemy flight path - enemies fly THROUGH the scene
    // They start far away and fly past the camera
    const flightPathLength = 400;
    const enemyStartDistance = 250;
    
    // Enemy position along their flight path (they fly toward and past the player)
    // Progress 0 = far away, Progress 0.5 = closest to camera, Progress 1 = passed by
    const enemyT = progress;
    const enemyDistance = enemyStartDistance - (flightPathLength * enemyT);
    
    // Current enemy position
    const enemyPosition = this.playerPosition.clone()
      .add(entryDir.clone().multiplyScalar(enemyDistance));
    
    // Add some vertical movement to enemy path for drama
    const verticalWave = Math.sin(progress * Math.PI) * 15;
    enemyPosition.y += verticalWave;

    // Calculate perpendicular vectors for camera positioning
    const forward = entryDir.clone();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    switch (segment.cameraAngle) {
      case 'side_tracking':
        // DRAMATIC SIDE FLYBY - Camera positioned to the side, enemies fly past
        // Camera starts ahead of enemies, they catch up and pass by
        {
          const cameraLead = 30 - (progress * 80); // Camera starts ahead, enemies catch up
          const sideDistance = 25 + Math.sin(progress * Math.PI) * 10; // Get closer at midpoint
          const heightVariation = 5 + Math.cos(progress * Math.PI * 2) * 8;
          
          this.targetCameraPosition.copy(enemyPosition)
            .add(right.clone().multiplyScalar(sideDistance))
            .add(forward.clone().multiplyScalar(cameraLead));
          this.targetCameraPosition.y += heightVariation;
          
          // Look slightly ahead of enemy for motion feel
          this.targetCameraLookAt.copy(enemyPosition)
            .add(forward.clone().multiplyScalar(-20));
        }
        break;

      case 'head_on':
        // HEAD-ON APPROACH - Enemies fly directly toward camera, dramatic close pass
        {
          // Camera positioned in path of enemies, they fly toward and past
          const closePassDistance = 20; // How close enemies get to camera
          const cameraOffset = Math.max(closePassDistance, enemyDistance * 0.15);
          
          // Camera backs up as enemies approach, then they pass overhead
          if (progress < 0.6) {
            // Enemies approaching - camera faces them
            this.targetCameraPosition.copy(enemyPosition)
              .add(forward.clone().multiplyScalar(-cameraOffset));
            this.targetCameraPosition.y -= 10; // Slightly below for imposing look
          } else {
            // Enemies passing - camera tracks them going by
            const passProgress = (progress - 0.6) / 0.4;
            this.targetCameraPosition.copy(enemyPosition)
              .add(forward.clone().multiplyScalar(30 * passProgress))
              .add(right.clone().multiplyScalar(20 * passProgress));
            this.targetCameraPosition.y += 15 * passProgress;
          }
          
          this.targetCameraLookAt.copy(enemyPosition);
        }
        break;

      case 'low_angle':
        // LOW ANGLE HERO SHOT - Camera low, enemies soar overhead
        {
          // Camera positioned below flight path looking up
          const belowDistance = 35 + Math.sin(progress * Math.PI) * 15;
          const behindDistance = -20 + progress * 60; // Camera moves as they pass
          
          this.targetCameraPosition.copy(enemyPosition)
            .add(forward.clone().multiplyScalar(behindDistance));
          this.targetCameraPosition.y -= belowDistance;
          
          // Add slight side offset for dynamic composition
          this.targetCameraPosition.add(right.clone().multiplyScalar(15));
          
          this.targetCameraLookAt.copy(enemyPosition);
          this.targetCameraLookAt.y += 10; // Look up at them
        }
        break;

      case 'static':
        // CLOSE STATIC WITH PAN - Camera nearly stationary, enemies fly past close
        {
          // Position camera close to flight path, enemies pass by dramatically
          const staticOffset = 30;
          const panOffset = (progress - 0.5) * 40; // Subtle camera drift
          
          // Camera positioned to side of flight path
          this.targetCameraPosition.copy(this.playerPosition)
            .add(entryDir.clone().multiplyScalar(100)) // Ahead on path
            .add(right.clone().multiplyScalar(staticOffset))
            .add(new THREE.Vector3(0, 20 + panOffset * 0.3, 0));
          
          // Track enemies as they fly past
          this.targetCameraLookAt.copy(enemyPosition);
        }
        break;

      case 'orbit':
        // DRAMATIC ORBIT - Camera circles around enemies at close range
        {
          const orbitAngle = progress * Math.PI * 1.5; // 270 degree orbit
          const orbitRadius = 40 + Math.sin(progress * Math.PI) * 15; // Vary distance
          const orbitHeight = 10 + Math.sin(progress * Math.PI * 2) * 20; // Vary height
          
          const orbitOffset = new THREE.Vector3(
            Math.sin(orbitAngle) * orbitRadius,
            orbitHeight,
            Math.cos(orbitAngle) * orbitRadius
          );
          
          this.targetCameraPosition.copy(enemyPosition).add(orbitOffset);
          this.targetCameraLookAt.copy(enemyPosition);
        }
        break;
    }

    // Smooth camera movement - faster response for more dynamic feel
    const lerpSpeed = segment.cameraAngle === 'orbit' ? 0.08 : 0.12;
    this.cinematicCamera.position.lerp(this.targetCameraPosition, lerpSpeed);
    
    // Look at target with smooth rotation
    const lookAtMatrix = new THREE.Matrix4();
    lookAtMatrix.lookAt(this.cinematicCamera.position, this.targetCameraLookAt, new THREE.Vector3(0, 1, 0));
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
    this.cinematicCamera.quaternion.slerp(targetQuat, 0.15);
  }

  /**
   * Get direction vector for entry direction
   */
  private getEntryDirectionVector(direction: EntryDirection): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerQuaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.playerQuaternion);
    const up = new THREE.Vector3(0, 1, 0);

    switch (direction) {
      case 'FRONT':
        return forward.clone();
      case 'FRONT_LEFT':
        return forward.clone().add(right.clone().multiplyScalar(-0.5)).normalize();
      case 'FRONT_RIGHT':
        return forward.clone().add(right.clone().multiplyScalar(0.5)).normalize();
      case 'LEFT':
        return right.clone().multiplyScalar(-1);
      case 'RIGHT':
        return right.clone();
      case 'ABOVE':
        return forward.clone().add(up.clone().multiplyScalar(0.5)).normalize();
      case 'ABOVE_BEHIND':
        return forward.clone().multiplyScalar(-0.5).add(up.clone().multiplyScalar(0.5)).normalize();
      default:
        return forward.clone();
    }
  }

  // ============ Getters ============

  public isPlaying(): boolean {
    return this.isActive;
  }

  public getProgress(): number {
    if (!this.isActive) return 0;
    const elapsed = performance.now() / 1000 - this.cinematicStartTime;
    return Math.min(elapsed / this.totalDuration, 1);
  }

  public getCurrentSegment(): CinematicSegment | null {
    if (this.currentSegmentIndex >= 0 && this.currentSegmentIndex < this.segments.length) {
      return this.segments[this.currentSegmentIndex];
    }
    return null;
  }

  public getState(): CinematicState {
    const currentSegment = this.getCurrentSegment();
    const elapsed = this.isActive ? performance.now() / 1000 - this.cinematicStartTime : 0;
    
    return {
      isActive: this.isActive,
      currentSegmentIndex: this.currentSegmentIndex,
      segmentProgress: currentSegment 
        ? Math.min((elapsed - this.segmentStartTime) / currentSegment.duration, 1)
        : 0,
      totalProgress: this.isActive ? elapsed / this.totalDuration : 0,
      currentSegment,
      waveName: this.currentWave?.name || '',
      waveNumber: this.currentWave?.id || 0,
      isBoss: this.currentWave?.isBoss || false,
    };
  }

  // ============ Callbacks ============

  public setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  public setOnSegmentChange(callback: (segment: CinematicSegment) => void): void {
    this.onSegmentChange = callback;
  }
}

// ============ Singleton Export ============

export const waveCinematicController = new WaveCinematicController();
