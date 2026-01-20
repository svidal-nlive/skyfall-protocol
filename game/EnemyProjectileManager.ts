import * as THREE from 'three';

/**
 * Enemy projectile types
 */
export type EnemyProjectileType = 'bullet' | 'plasma' | 'missile';

/**
 * Active enemy projectile
 */
interface EnemyProjectile {
  id: string;
  type: EnemyProjectileType;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  isActive: boolean;
  sourceId: string;  // Which enemy fired this
}

/**
 * Projectile configuration by enemy type
 */
const PROJECTILE_CONFIG: Record<string, {
  color: number;
  glowColor: number;
  size: number;
  speed: number;
  type: EnemyProjectileType;
}> = {
  phantom: {
    color: 0xff4444,
    glowColor: 0xff0000,
    size: 0.3,
    speed: 300,
    type: 'bullet',
  },
  viper: {
    color: 0xff6600,
    glowColor: 0xff4400,
    size: 0.4,
    speed: 280,
    type: 'bullet',
  },
  warden: {
    color: 0x00ffff,
    glowColor: 0x00aaff,
    size: 0.6,
    speed: 220,
    type: 'plasma',
  },
  specter: {
    color: 0xff00ff,
    glowColor: 0xaa00ff,
    size: 0.5,
    speed: 260,
    type: 'plasma',
  },
  default: {
    color: 0xff4444,
    glowColor: 0xff0000,
    size: 0.4,
    speed: 250,
    type: 'bullet',
  },
};

/**
 * EnemyProjectileManager - Manages all enemy projectiles
 * 
 * Features:
 * - Different visual styles per enemy type
 * - Collision detection with player
 * - Efficient pooling and cleanup
 * - Trail effects
 */
export class EnemyProjectileManager {
  private scene: THREE.Scene | null = null;
  private projectiles: EnemyProjectile[] = [];
  private projectileIdCounter = 0;
  
  // Collision settings
  private readonly PLAYER_HIT_RADIUS = 2.5;  // Player hitbox radius
  private readonly MAX_PROJECTILES = 100;    // Performance limit
  private readonly DEFAULT_LIFETIME = 4.0;   // Seconds
  
  // Trail geometry pool
  private trailPool: THREE.Mesh[] = [];

  constructor() {
    // Listen for enemy fire events
    window.addEventListener('enemy-fire', this.handleEnemyFire as EventListener);
  }

  /**
   * Set scene reference
   */
  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  /**
   * Handle enemy fire event
   */
  private handleEnemyFire = (e: CustomEvent): void => {
    const { enemyId, enemyType, position, direction, damage, projectileSpeed } = e.detail;
    this.spawnProjectile(enemyId, enemyType, position, direction, damage, projectileSpeed);
  };

  /**
   * Spawn a new projectile
   */
  public spawnProjectile(
    sourceId: string,
    enemyType: string,
    position: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    speed?: number
  ): void {
    if (!this.scene) return;
    
    // Limit projectile count for performance
    if (this.projectiles.length >= this.MAX_PROJECTILES) {
      // Remove oldest inactive projectile
      const oldestInactive = this.projectiles.find(p => !p.isActive);
      if (oldestInactive) {
        this.removeProjectile(oldestInactive);
      } else {
        console.warn('[PROJECTILES] Max projectile limit reached');
        return;
      }
    }

    const config = PROJECTILE_CONFIG[enemyType] || PROJECTILE_CONFIG.default;
    const projectileSpeed = speed || config.speed;

    // Create projectile mesh
    const mesh = this.createProjectileMesh(config);
    mesh.position.copy(position);
    this.scene.add(mesh);

    // Create projectile data
    const projectile: EnemyProjectile = {
      id: `proj_${this.projectileIdCounter++}`,
      type: config.type,
      mesh,
      position: position.clone(),
      velocity: direction.clone().normalize().multiplyScalar(projectileSpeed),
      damage,
      lifetime: 0,
      maxLifetime: this.DEFAULT_LIFETIME,
      isActive: true,
      sourceId,
    };

    this.projectiles.push(projectile);
  }

  /**
   * Create visual mesh for projectile
   */
  private createProjectileMesh(config: typeof PROJECTILE_CONFIG.default): THREE.Mesh {
    // Elongated shape for motion blur effect
    const geometry = new THREE.CylinderGeometry(
      config.size * 0.3,  // Top radius
      config.size * 0.5,  // Bottom radius
      config.size * 2,    // Height
      8                   // Segments
    );
    geometry.rotateX(Math.PI / 2); // Point forward

    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(config.size * 0.8, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: config.glowColor,
      transparent: true,
      opacity: 0.5,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    // Add point light for dynamic lighting
    const light = new THREE.PointLight(config.color, 0.5, 10);
    mesh.add(light);

    return mesh;
  }

  /**
   * Update all projectiles
   */
  public update(dt: number, playerPosition: THREE.Vector3): void {
    for (const projectile of this.projectiles) {
      if (!projectile.isActive) continue;

      // Update lifetime
      projectile.lifetime += dt;
      if (projectile.lifetime >= projectile.maxLifetime) {
        this.deactivateProjectile(projectile);
        continue;
      }

      // Move projectile
      const movement = projectile.velocity.clone().multiplyScalar(dt);
      projectile.position.add(movement);
      projectile.mesh.position.copy(projectile.position);

      // Orient to velocity
      if (projectile.velocity.lengthSq() > 0.001) {
        const lookTarget = projectile.position.clone().add(projectile.velocity);
        projectile.mesh.lookAt(lookTarget);
      }

      // Check collision with player
      const distToPlayer = projectile.position.distanceTo(playerPosition);
      if (distToPlayer < this.PLAYER_HIT_RADIUS) {
        this.onPlayerHit(projectile);
      }

      // Check if too far from origin (cleanup)
      if (projectile.position.length() > 5000) {
        this.deactivateProjectile(projectile);
      }
    }

    // Cleanup inactive projectiles periodically
    this.cleanupInactiveProjectiles();
  }

  /**
   * Handle player being hit by projectile
   */
  private onPlayerHit(projectile: EnemyProjectile): void {
    // Dispatch hit event
    window.dispatchEvent(new CustomEvent('player-hit', {
      detail: {
        damage: projectile.damage,
        source: 'projectile',
        projectileType: projectile.type,
        position: projectile.position.clone(),
        sourceId: projectile.sourceId,
      }
    }));

    // Small screen shake
    window.dispatchEvent(new CustomEvent('screen-shake', {
      detail: { intensity: 0.3 }
    }));

    // Create small impact effect
    this.createImpactEffect(projectile.position);

    // Deactivate projectile
    this.deactivateProjectile(projectile);
  }

  /**
   * Create impact effect when projectile hits
   */
  private createImpactEffect(position: THREE.Vector3): void {
    if (!this.scene) return;

    // Small flash
    const flashGeometry = new THREE.SphereGeometry(1, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 1.0,
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.add(flash);

    // Animate and remove
    let elapsed = 0;
    const animate = () => {
      elapsed += 0.016;
      if (elapsed >= 0.2) {
        this.scene?.remove(flash);
        flashGeometry.dispose();
        flashMaterial.dispose();
        return;
      }
      flash.scale.setScalar(1 + elapsed * 5);
      flashMaterial.opacity = 1 - elapsed * 5;
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Deactivate a projectile
   */
  private deactivateProjectile(projectile: EnemyProjectile): void {
    projectile.isActive = false;
    projectile.mesh.visible = false;
  }

  /**
   * Remove a projectile completely
   */
  private removeProjectile(projectile: EnemyProjectile): void {
    if (this.scene) {
      this.scene.remove(projectile.mesh);
    }

    // Dispose geometry and material
    if (projectile.mesh.geometry) {
      projectile.mesh.geometry.dispose();
    }
    if (projectile.mesh.material) {
      if (Array.isArray(projectile.mesh.material)) {
        projectile.mesh.material.forEach(m => m.dispose());
      } else {
        projectile.mesh.material.dispose();
      }
    }

    // Remove from array
    const index = this.projectiles.indexOf(projectile);
    if (index > -1) {
      this.projectiles.splice(index, 1);
    }
  }

  /**
   * Cleanup inactive projectiles
   */
  private cleanupInactiveProjectiles(): void {
    // Only cleanup occasionally
    if (Math.random() > 0.1) return;

    const inactive = this.projectiles.filter(p => !p.isActive);
    for (const projectile of inactive) {
      this.removeProjectile(projectile);
    }
  }

  /**
   * Clear all projectiles (e.g., on wave end or game reset)
   */
  public clearAll(): void {
    for (const projectile of [...this.projectiles]) {
      this.removeProjectile(projectile);
    }
    this.projectiles = [];
  }

  /**
   * Get active projectile count (for debugging)
   */
  public getActiveCount(): number {
    return this.projectiles.filter(p => p.isActive).length;
  }

  /**
   * Dispose manager
   */
  public dispose(): void {
    window.removeEventListener('enemy-fire', this.handleEnemyFire as EventListener);
    this.clearAll();
  }
}
