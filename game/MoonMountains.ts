/**
 * MoonMountains - Procedural mountain and crater geometry that loads progressively
 * 
 * Creates 3D geometry for distant mountains and large craters that adds
 * visual interest to the moon surface. Uses LOD and chunking for performance.
 */

import * as THREE from 'three';

interface MountainChunk {
  mesh: THREE.Mesh;
  position: THREE.Vector2;
  loaded: boolean;
}

interface MoonMountainsConfig {
  chunkSize: number;          // Size of each chunk
  viewDistance: number;       // How far to render chunks
  mountainDensity: number;    // Mountains per chunk
  craterDensity: number;      // Large craters per chunk
  maxMountainHeight: number;  // Maximum mountain height
  baseY: number;              // Ground level Y position
}

const DEFAULT_CONFIG: MoonMountainsConfig = {
  chunkSize: 2000,
  viewDistance: 6000,
  mountainDensity: 3,
  craterDensity: 2,
  maxMountainHeight: 150,
  baseY: -50,
};

// Simple hash function for deterministic randomness
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// Seeded random for a chunk
function seededRandom(chunkX: number, chunkZ: number, seed: number): number {
  return hash(chunkX * 1000 + seed, chunkZ * 1000 + seed * 2);
}

export class MoonMountains {
  public group: THREE.Group;
  
  private chunks: Map<string, MountainChunk> = new Map();
  private config: MoonMountainsConfig;
  private material: THREE.MeshBasicMaterial;
  private lastPlayerChunk: THREE.Vector2 = new THREE.Vector2(Infinity, Infinity);
  
  constructor(config: Partial<MoonMountainsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.group = new THREE.Group();
    
    // Create shared material for all mountains
    this.material = new THREE.MeshBasicMaterial({
      color: 0x3a4a55,  // Blue-gray mountains for daytime
      fog: true,
      transparent: true,
      opacity: 0.95,
    });
  }

  private getChunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }

  private createMountainGeometry(
    baseX: number,
    baseZ: number,
    radius: number,
    height: number,
    segments: number = 8
  ): THREE.BufferGeometry {
    // Create a cone-like mountain with irregular shape
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Center peak vertex
    vertices.push(0, height, 0);
    
    // Base ring with variation
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const variation = 0.7 + hash(baseX + i, baseZ + i * 2) * 0.6;
      const r = radius * variation;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      vertices.push(x, 0, z);
    }
    
    // Create triangular faces from peak to base
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      indices.push(0, i + 1, next + 1);
    }
    
    // Close the base
    for (let i = 1; i < segments - 1; i++) {
      indices.push(1, i + 2, i + 1);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }

  private createCraterGeometry(
    baseX: number,
    baseZ: number,
    outerRadius: number,
    innerRadius: number,
    rimHeight: number,
    depth: number,
    segments: number = 16
  ): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Create rings: outer edge, rim top, inner edge, crater floor
    const rings = 4;
    const radii = [outerRadius, outerRadius * 0.85, innerRadius, innerRadius * 0.3];
    const heights = [0, rimHeight, rimHeight * 0.3, -depth];
    
    for (let ring = 0; ring < rings; ring++) {
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const variation = ring < 2 ? (0.9 + hash(baseX + i + ring, baseZ + i * 2 + ring) * 0.2) : 1.0;
        const r = radii[ring] * variation;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y = heights[ring];
        vertices.push(x, y, z);
      }
    }
    
    // Create faces between rings
    for (let ring = 0; ring < rings - 1; ring++) {
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        const current = ring * segments + i;
        const nextRing = (ring + 1) * segments + i;
        
        indices.push(current, nextRing, current + (next - i));
        indices.push(current + (next - i), nextRing, nextRing + (next - i));
      }
    }
    
    // Close crater floor
    const floorStart = (rings - 1) * segments;
    for (let i = 1; i < segments - 1; i++) {
      indices.push(floorStart, floorStart + i, floorStart + i + 1);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }

  private createChunk(chunkX: number, chunkZ: number): MountainChunk {
    const chunkGroup = new THREE.Group();
    const chunkWorldX = chunkX * this.config.chunkSize;
    const chunkWorldZ = chunkZ * this.config.chunkSize;
    
    // Create mountains for this chunk
    for (let i = 0; i < this.config.mountainDensity; i++) {
      const seed = i * 17;
      const rand1 = seededRandom(chunkX, chunkZ, seed);
      const rand2 = seededRandom(chunkX, chunkZ, seed + 1);
      const rand3 = seededRandom(chunkX, chunkZ, seed + 2);
      const rand4 = seededRandom(chunkX, chunkZ, seed + 3);
      
      // Skip some randomly
      if (rand1 < 0.3) continue;
      
      const x = chunkWorldX + rand2 * this.config.chunkSize;
      const z = chunkWorldZ + rand3 * this.config.chunkSize;
      const height = 30 + rand4 * this.config.maxMountainHeight;
      const radius = height * (0.8 + rand1 * 0.8);
      
      const geometry = this.createMountainGeometry(x, z, radius, height);
      const material = this.material.clone();
      // Vary darkness slightly
      const darkness = 0.08 + rand1 * 0.06;
      material.color.setRGB(darkness, darkness, darkness + 0.02);
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, this.config.baseY, z);
      chunkGroup.add(mesh);
    }
    
    // Create craters for this chunk
    for (let i = 0; i < this.config.craterDensity; i++) {
      const seed = i * 31 + 1000;
      const rand1 = seededRandom(chunkX, chunkZ, seed);
      const rand2 = seededRandom(chunkX, chunkZ, seed + 1);
      const rand3 = seededRandom(chunkX, chunkZ, seed + 2);
      const rand4 = seededRandom(chunkX, chunkZ, seed + 3);
      
      // Skip some randomly
      if (rand1 < 0.4) continue;
      
      const x = chunkWorldX + rand2 * this.config.chunkSize;
      const z = chunkWorldZ + rand3 * this.config.chunkSize;
      const outerRadius = 80 + rand4 * 200;
      const innerRadius = outerRadius * (0.5 + rand1 * 0.3);
      const rimHeight = 10 + rand4 * 30;
      const depth = 5 + rand3 * 15;
      
      const geometry = this.createCraterGeometry(x, z, outerRadius, innerRadius, rimHeight, depth);
      const material = this.material.clone();
      const darkness = 0.06 + rand1 * 0.04;
      material.color.setRGB(darkness, darkness, darkness + 0.01);
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, this.config.baseY, z);
      chunkGroup.add(mesh);
    }
    
    // Create merged mesh from group for performance
    const mergedMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    
    // If we have children, just use the group
    if (chunkGroup.children.length > 0) {
      this.group.add(chunkGroup);
      return {
        mesh: chunkGroup as unknown as THREE.Mesh,
        position: new THREE.Vector2(chunkX, chunkZ),
        loaded: true,
      };
    }
    
    return {
      mesh: mergedMesh,
      position: new THREE.Vector2(chunkX, chunkZ),
      loaded: true,
    };
  }

  private unloadChunk(key: string) {
    const chunk = this.chunks.get(key);
    if (chunk) {
      this.group.remove(chunk.mesh);
      if (chunk.mesh instanceof THREE.Group) {
        chunk.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
      } else {
        chunk.mesh.geometry.dispose();
      }
      this.chunks.delete(key);
    }
  }

  public update(playerPosition: THREE.Vector3) {
    const chunkSize = this.config.chunkSize;
    const viewDistance = this.config.viewDistance;
    
    // Calculate current chunk
    const playerChunkX = Math.floor(playerPosition.x / chunkSize);
    const playerChunkZ = Math.floor(playerPosition.z / chunkSize);
    
    // Only update if player moved to new chunk
    if (
      playerChunkX === this.lastPlayerChunk.x &&
      playerChunkZ === this.lastPlayerChunk.y
    ) {
      return;
    }
    
    this.lastPlayerChunk.set(playerChunkX, playerChunkZ);
    
    // Calculate chunk range to load
    const chunksToLoad = Math.ceil(viewDistance / chunkSize);
    const activeChunks = new Set<string>();
    
    // Load/keep chunks in view distance
    for (let dz = -chunksToLoad; dz <= chunksToLoad; dz++) {
      for (let dx = -chunksToLoad; dx <= chunksToLoad; dx++) {
        const chunkX = playerChunkX + dx;
        const chunkZ = playerChunkZ + dz;
        const key = this.getChunkKey(chunkX, chunkZ);
        
        // Check if within circular view distance
        const dist = Math.sqrt(dx * dx + dz * dz) * chunkSize;
        if (dist > viewDistance) continue;
        
        activeChunks.add(key);
        
        // Load chunk if not already loaded
        if (!this.chunks.has(key)) {
          const chunk = this.createChunk(chunkX, chunkZ);
          this.chunks.set(key, chunk);
        }
      }
    }
    
    // Unload chunks outside view distance
    for (const [key] of this.chunks) {
      if (!activeChunks.has(key)) {
        this.unloadChunk(key);
      }
    }
  }

  public dispose() {
    for (const [key] of this.chunks) {
      this.unloadChunk(key);
    }
    this.material.dispose();
  }
}

export function initMoonMountains(scene: THREE.Scene): MoonMountains {
  const mountains = new MoonMountains();
  scene.add(mountains.group);
  return mountains;
}
