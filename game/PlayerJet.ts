import * as THREE from 'three';
import { PlayerAircraftConfig, getPlayerAircraftById, getDefaultPlayerAircraft } from './data/playerAircraftConfigs';

/**
 * PlayerJet - Voxel jet with animated control surfaces and afterburner
 * Supports multiple aircraft types: F-22 Falcon, Su-27 Flanker (base), and more
 */
export class PlayerJet {
  public mesh: THREE.Group;
  private aircraftConfig: PlayerAircraftConfig;

  // Control Surfaces
  private leftElevator: THREE.Group;   // Taileron (horizontal stabilizer)
  private rightElevator: THREE.Group;
  private leftAileron: THREE.Group;
  private rightAileron: THREE.Group;
  private leftRudder: THREE.Group;     // Twin vertical tails (or single)
  private rightRudder: THREE.Group;
  private rudder: THREE.Group;         // Keep for compatibility (linked to left rudder)
  private leftCanard: THREE.Group;     // Canard wings (Archon)
  private rightCanard: THREE.Group;

  // Effects
  private exhaustLeft: THREE.Mesh;
  private exhaustRight: THREE.Mesh;
  
  // Muzzle flash lights
  private muzzleFlashLeft: THREE.PointLight;
  private muzzleFlashRight: THREE.PointLight;
  
  // Afterburner colors per aircraft
  private afterburnerColor: number;

  constructor(aircraftId?: string) {
    this.mesh = new THREE.Group();
    this.leftElevator = new THREE.Group();
    this.rightElevator = new THREE.Group();
    this.leftAileron = new THREE.Group();
    this.rightAileron = new THREE.Group();
    this.leftRudder = new THREE.Group();
    this.rightRudder = new THREE.Group();
    this.rudder = this.leftRudder; // Alias for compatibility
    this.leftCanard = new THREE.Group();
    this.rightCanard = new THREE.Group();

    this.exhaustLeft = new THREE.Mesh();
    this.exhaustRight = new THREE.Mesh();
    
    this.muzzleFlashLeft = new THREE.PointLight(0xffffaa, 0, 10);
    this.muzzleFlashRight = new THREE.PointLight(0xffffaa, 0, 10);
    
    // Get aircraft config
    this.aircraftConfig = aircraftId 
      ? (getPlayerAircraftById(aircraftId) || getDefaultPlayerAircraft())
      : getDefaultPlayerAircraft();
    
    // Set afterburner color based on aircraft
    this.afterburnerColor = this.getAfterburnerColor();

    // Build the appropriate aircraft model
    this.buildAircraftModel();
  }
  
  private getAfterburnerColor(): number {
    switch (this.aircraftConfig.id) {
      case 'falcon':
        return 0x66ccff; // Blue-white (F-22 style)
      case 'switchblade':
        return 0xff5555; // Crimson red
      case 'ironclad':
        return 0xffaa44; // Deep orange
      case 'wraith':
        return 0x7744ff; // Purple-blue
      case 'archon':
        return 0xffdd66; // Gold-white
      default:
        return 0xffaa00; // Default orange
    }
  }
  
  private buildAircraftModel(): void {
    switch (this.aircraftConfig.id) {
      case 'falcon':
        this.buildF22Falcon();
        break;
      case 'switchblade':
        this.buildX47Switchblade();
        break;
      case 'ironclad':
        this.buildA10Ironclad();
        break;
      case 'wraith':
        this.buildSR71Wraith();
        break;
      case 'archon':
        this.buildXF108Archon();
        break;
      default:
        this.buildFlankerJet();
        break;
    }
  }

  /**
   * F-22 Falcon - Modern Stealth Fighter
   * Features: Single vertical tail, angular stealth design, diamond fuselage, blue-white afterburner
   */
  private buildF22Falcon() {
    // --- F-22 MATERIALS (Stealth fighter colors) ---
    const materials: Record<string, THREE.Material> = {
      // Main fuselage - blue-gray stealth coating
      body: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.color, 
        roughness: 0.3, 
        metalness: 0.4,
        emissive: this.aircraftConfig.emissiveColor,
        emissiveIntensity: 0.05
      }),
      // Underside - darker gray
      belly: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.accentColor, 
        roughness: 0.4, 
        metalness: 0.3 
      }),
      // Dark accents - intakes, panels
      dark: new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.6 }),
      // Control surfaces
      control: new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: 0.5, metalness: 0.2 }),
      // Radome (nose cone) - darker, radar-absorbing
      radome: new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.5 }),
      // Cockpit - blue tinted glass
      cockpit: new THREE.MeshStandardMaterial({ 
        color: 0x4488cc, 
        roughness: 0.0, 
        metalness: 0.95,
        emissive: 0x0044aa,
        emissiveIntensity: 0.4
      }),
      // Afterburner glow - blue-white (F-22 characteristic)
      glow: new THREE.MeshBasicMaterial({ color: this.afterburnerColor }),
      // Nav lights
      navRed: new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.5 }),
      navGreen: new THREE.MeshStandardMaterial({ color: 0x22ff22, emissive: 0x00ff00, emissiveIntensity: 0.5 })
    };

    const voxelSize = 0.30;
    const geoBox = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    // Buffers for InstancedMesh
    const instances: Record<string, THREE.Matrix4[]> = {};
    for (const k in materials) instances[k] = [];

    const addVoxel = (
      parent: THREE.Object3D, 
      x: number, y: number, z: number, 
      matName: string,
      scaleX = 1, scaleY = 1, scaleZ = 1
    ) => {
      if (parent !== this.mesh) {
        const mat = materials[matName];
        const mesh = new THREE.Mesh(geoBox, mat);
        mesh.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
        mesh.scale.set(scaleX, scaleY, scaleZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      }

      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x * voxelSize, y * voxelSize, z * voxelSize),
        new THREE.Quaternion(),
        new THREE.Vector3(scaleX, scaleY, scaleZ)
      );
      
      if (!instances[matName]) instances[matName] = [];
      instances[matName].push(matrix);
      return null;
    };

    // ============================================
    // F-22 RAPTOR GEOMETRY
    // ============================================

    // --- RADOME (Sharp pointed nose - needle-like) ---
    addVoxel(this.mesh, 0, 0, -10, 'radome', 0.3, 0.3, 1);   // Very sharp tip
    addVoxel(this.mesh, 0, 0, -9, 'radome', 0.5, 0.4, 1);
    addVoxel(this.mesh, 0, 0, -8, 'radome', 0.6, 0.5, 1);
    addVoxel(this.mesh, 0, 0, -7, 'radome', 0.8, 0.6, 1);
    addVoxel(this.mesh, 0, 0, -6, 'radome', 0.9, 0.7, 1);
    
    // --- NOSE SECTION (Angular, diamond-shaped profile) ---
    addVoxel(this.mesh, 0, 0, -5, 'body');
    addVoxel(this.mesh, 0, -0.4, -5, 'belly', 0.9, 0.4, 1);
    addVoxel(this.mesh, 0, 0, -4, 'body', 1.1, 0.8, 1);
    addVoxel(this.mesh, 0, -0.5, -4, 'belly', 0.9, 0.5, 1);
    
    // Angular edges on nose sides
    addVoxel(this.mesh, -0.6, -0.2, -5, 'body', 0.5, 0.6, 1);
    addVoxel(this.mesh, 0.6, -0.2, -5, 'body', 0.5, 0.6, 1);
    
    // --- COCKPIT (Narrow, integrated canopy - F-22 style) ---
    addVoxel(this.mesh, 0, 0.5, -3, 'cockpit', 0.9, 0.6, 1);
    addVoxel(this.mesh, 0, 0.7, -2, 'cockpit', 1.0, 0.7, 1);
    addVoxel(this.mesh, 0, 0.6, -1, 'cockpit', 0.9, 0.6, 1);
    addVoxel(this.mesh, 0, 0.4, 0, 'cockpit', 0.7, 0.5, 0.8);
    
    // Cockpit frame/spine (angular)
    addVoxel(this.mesh, 0, 0, -3, 'body', 1.1, 0.7, 1);
    addVoxel(this.mesh, 0, 0, -2, 'body', 1.2, 0.8, 1);
    addVoxel(this.mesh, 0, -0.7, -3, 'belly');
    addVoxel(this.mesh, 0, -0.7, -2, 'belly');
    
    // --- FORWARD FUSELAGE (Diamond cross-section, angular) ---
    for (let z = -1; z <= 2; z++) {
      addVoxel(this.mesh, 0, 0.3, z, 'body', 1.1, 0.6, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 1.3, 0.7, 1);
      addVoxel(this.mesh, 0, -0.4, z, 'belly', 1.1, 0.5, 1);
      
      // Angular side panels (stealth facets)
      addVoxel(this.mesh, -0.9, -0.1, z, 'body', 0.4, 0.6, 1);
      addVoxel(this.mesh, 0.9, -0.1, z, 'body', 0.4, 0.6, 1);
    }
    
    // --- REDUCED LERX (F-22 has minimal leading edge extensions) ---
    addVoxel(this.mesh, -1.2, -0.2, 0, 'body', 0.6, 0.3, 1);
    addVoxel(this.mesh, -1.5, -0.1, 1, 'body', 0.5, 0.3, 1);
    addVoxel(this.mesh, 1.2, -0.2, 0, 'body', 0.6, 0.3, 1);
    addVoxel(this.mesh, 1.5, -0.1, 1, 'body', 0.5, 0.3, 1);
    
    // --- AIR INTAKES (Integrated, stealthy - side-mounted) ---
    addVoxel(this.mesh, -1.3, -0.6, -1, 'dark', 0.6, 0.7, 1.2);
    addVoxel(this.mesh, 1.3, -0.6, -1, 'dark', 0.6, 0.7, 1.2);
    addVoxel(this.mesh, -1.3, -0.6, 0, 'dark', 0.6, 0.6, 1);
    addVoxel(this.mesh, 1.3, -0.6, 0, 'dark', 0.6, 0.6, 1);
    
    // --- MAIN FUSELAGE (Wide, flat, diamond-shaped) ---
    for (let z = 2; z <= 5; z++) {
      addVoxel(this.mesh, 0, 0.3, z, 'body', 1.3, 0.5, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 1.5, 0.7, 1);
      addVoxel(this.mesh, 0, -0.4, z, 'belly', 1.3, 0.5, 1);
      
      // Side body panels (angular facets)
      addVoxel(this.mesh, -1.2, 0, z, 'body', 0.5, 0.6, 1);
      addVoxel(this.mesh, 1.2, 0, z, 'body', 0.5, 0.6, 1);
    }
    
    // --- ENGINE SECTION (Twin engines closer together) ---
    for (let z = 5; z <= 7; z++) {
      addVoxel(this.mesh, -0.9, -0.2, z, 'dark', 1.0, 0.9, 1);
      addVoxel(this.mesh, 0.9, -0.2, z, 'dark', 1.0, 0.9, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 0.6, 0.5, 1);
    }
    
    // Engine nozzles (rectangular, stealthy shape)
    addVoxel(this.mesh, -0.9, -0.2, 8, 'dark', 1.1, 1.0, 0.8);
    addVoxel(this.mesh, 0.9, -0.2, 8, 'dark', 1.1, 1.0, 0.8);
    
    // --- MAIN WINGS (Trapezoidal, angular edges) ---
    for (let z = 1; z <= 4; z++) {
      addVoxel(this.mesh, -2.5, 0, z, 'body', 1, 0.3, 1);
      addVoxel(this.mesh, 2.5, 0, z, 'body', 1, 0.3, 1);
    }
    
    // Mid wing sections
    addVoxel(this.mesh, -3.5, 0, 2, 'body', 1, 0.3, 1);
    addVoxel(this.mesh, -3.5, 0, 3, 'body', 1, 0.3, 1);
    addVoxel(this.mesh, -3.5, 0, 4, 'body', 1, 0.3, 1);
    addVoxel(this.mesh, 3.5, 0, 2, 'body', 1, 0.3, 1);
    addVoxel(this.mesh, 3.5, 0, 3, 'body', 1, 0.3, 1);
    addVoxel(this.mesh, 3.5, 0, 4, 'body', 1, 0.3, 1);
    
    // Outer wing sections (squared tips)
    addVoxel(this.mesh, -4.5, 0, 3, 'body', 1, 0.3, 1);
    addVoxel(this.mesh, -4.5, 0, 4, 'body', 1, 0.3, 1);
    addVoxel(this.mesh, 4.5, 0, 3, 'body', 1, 0.3, 1);
    addVoxel(this.mesh, 4.5, 0, 4, 'body', 1, 0.3, 1);
    
    // Wing tips with nav lights (squared)
    addVoxel(this.mesh, -5.2, 0, 3.5, 'body', 0.8, 0.25, 1);
    addVoxel(this.mesh, -5.5, 0, 3.5, 'navRed', 0.4, 0.2, 0.4);
    addVoxel(this.mesh, 5.2, 0, 3.5, 'body', 0.8, 0.25, 1);
    addVoxel(this.mesh, 5.5, 0, 3.5, 'navGreen', 0.4, 0.2, 0.4);

    // --- AILERONS ---
    this.leftAileron.position.set(-4 * voxelSize, 0, 4.5 * voxelSize);
    this.mesh.add(this.leftAileron);
    addVoxel(this.leftAileron, 0, 0, 0, 'control', 1.2, 0.25, 0.8);
    addVoxel(this.leftAileron, -0.8, 0, 0, 'control', 0.8, 0.25, 0.8);

    this.rightAileron.position.set(4 * voxelSize, 0, 4.5 * voxelSize);
    this.mesh.add(this.rightAileron);
    addVoxel(this.rightAileron, 0, 0, 0, 'control', 1.2, 0.25, 0.8);
    addVoxel(this.rightAileron, 0.8, 0, 0, 'control', 0.8, 0.25, 0.8);

    // --- HORIZONTAL STABILIZERS (All-moving) ---
    this.leftElevator.position.set(-2.5 * voxelSize, 0, 7 * voxelSize);
    this.mesh.add(this.leftElevator);
    addVoxel(this.leftElevator, 0, 0, 0, 'control', 1, 0.25, 1);
    addVoxel(this.leftElevator, -0.8, 0, 0.3, 'control', 0.9, 0.2, 0.8);
    addVoxel(this.leftElevator, -1.3, 0, 0.5, 'control', 0.7, 0.18, 0.6);
    
    this.rightElevator.position.set(2.5 * voxelSize, 0, 7 * voxelSize);
    this.mesh.add(this.rightElevator);
    addVoxel(this.rightElevator, 0, 0, 0, 'control', 1, 0.25, 1);
    addVoxel(this.rightElevator, 0.8, 0, 0.3, 'control', 0.9, 0.2, 0.8);
    addVoxel(this.rightElevator, 1.3, 0, 0.5, 'control', 0.7, 0.18, 0.6);

    // --- SINGLE VERTICAL TAIL (F-22 distinctive feature) ---
    // Central vertical stabilizer
    this.leftRudder.position.set(0, 0.6 * voxelSize, 6 * voxelSize);
    this.leftRudder.rotation.z = 0; // No angle - straight up
    this.mesh.add(this.leftRudder);
    addVoxel(this.leftRudder, 0, 0, 0, 'body', 0.4, 0.8, 1);
    addVoxel(this.leftRudder, 0, 0.8, 0.2, 'body', 0.35, 1, 1);
    addVoxel(this.leftRudder, 0, 1.6, 0.4, 'body', 0.3, 0.9, 0.9);
    addVoxel(this.leftRudder, 0, 2.2, 0.5, 'body', 0.25, 0.7, 0.8);
    addVoxel(this.leftRudder, 0, 2.6, 0.6, 'dark', 0.2, 0.5, 0.6);
    // Rudder control surface
    addVoxel(this.leftRudder, 0, 0.8, 0.8, 'control', 0.25, 0.8, 0.5);
    addVoxel(this.leftRudder, 0, 1.6, 1.0, 'control', 0.2, 0.7, 0.4);
    
    // Dummy right rudder (not visible for single tail, but needed for animation system)
    this.rightRudder.position.set(0, 0.6 * voxelSize, 6 * voxelSize);
    this.mesh.add(this.rightRudder);

    // --- AFTERBURNER EXHAUST ---
    const exhaustGeo = new THREE.BoxGeometry(voxelSize * 0.8, voxelSize * 0.8, voxelSize);
    exhaustGeo.translate(0, 0, voxelSize * 0.5);
    this.exhaustLeft = new THREE.Mesh(exhaustGeo, materials.glow);
    this.exhaustRight = new THREE.Mesh(exhaustGeo, materials.glow);

    this.exhaustLeft.position.set(-0.9 * voxelSize, -0.2 * voxelSize, 8.2 * voxelSize);
    this.exhaustRight.position.set(0.9 * voxelSize, -0.2 * voxelSize, 8.2 * voxelSize);

    this.mesh.add(this.exhaustLeft);
    this.mesh.add(this.exhaustRight);

    // --- INTERNAL WEAPONS BAY DOORS (F-22 feature) ---
    addVoxel(this.mesh, 0, -0.7, 1, 'dark', 1.5, 0.15, 2);
    addVoxel(this.mesh, -1.8, -0.5, 2, 'dark', 0.4, 0.15, 1.5);
    addVoxel(this.mesh, 1.8, -0.5, 2, 'dark', 0.4, 0.15, 1.5);

    // --- GUN PORT ---
    addVoxel(this.mesh, 0.8, -0.5, -4, 'dark', 0.25, 0.25, 1.2);

    // Muzzle flash positions
    this.muzzleFlashLeft.position.set(-0.9 * voxelSize, 0, -3 * voxelSize);
    this.muzzleFlashRight.position.set(0.8 * voxelSize, -0.5 * voxelSize, -4.5 * voxelSize);
    this.mesh.add(this.muzzleFlashLeft);
    this.mesh.add(this.muzzleFlashRight);

    // --- INSTANCING ---
    for (const key in instances) {
      const matrices = instances[key];
      if (matrices.length === 0) continue;

      const instMesh = new THREE.InstancedMesh(geoBox, materials[key], matrices.length);
      
      for (let i = 0; i < matrices.length; i++) {
        instMesh.setMatrixAt(i, matrices[i]);
      }
      
      instMesh.instanceMatrix.needsUpdate = true;
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;
      this.mesh.add(instMesh);
    }
  }

  /**
   * A-10 Ironclad - Heavy Assault Gunship (A-10 Thunderbolt II / Warthog)
   * Features: Bulky fuselage, twin widely-spaced vertical tails, high-mounted engines,
   * short stubby wings, massive GAU-8 cannon, heavy armor appearance
   */
  private buildA10Ironclad() {
    // --- A-10 MATERIALS (Military olive/tan colors) ---
    const materials: Record<string, THREE.Material> = {
      // Main fuselage - olive drab
      body: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.color, 
        roughness: 0.6, 
        metalness: 0.2,
        emissive: this.aircraftConfig.emissiveColor,
        emissiveIntensity: 0.02
      }),
      // Underside - tan/beige
      belly: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.accentColor, 
        roughness: 0.5, 
        metalness: 0.1 
      }),
      // Dark accents - intakes, cannon, panels
      dark: new THREE.MeshStandardMaterial({ color: 0x2a2f25, roughness: 0.7 }),
      // Control surfaces - slightly darker olive
      control: new THREE.MeshStandardMaterial({ color: 0x4a5540, roughness: 0.6, metalness: 0.15 }),
      // Armor panels - weathered gray
      armor: new THREE.MeshStandardMaterial({ color: 0x5a5a55, roughness: 0.7, metalness: 0.3 }),
      // Cockpit - simple bubble canopy
      cockpit: new THREE.MeshStandardMaterial({ 
        color: 0x446644, 
        roughness: 0.1, 
        metalness: 0.8,
        emissive: 0x113311,
        emissiveIntensity: 0.3
      }),
      // Engine nacelles
      engine: new THREE.MeshStandardMaterial({ color: 0x3a3a35, roughness: 0.5, metalness: 0.4 }),
      // Afterburner glow - deep orange-yellow (powerful)
      glow: new THREE.MeshBasicMaterial({ color: this.afterburnerColor }),
      // Nav lights
      navRed: new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.5 }),
      navGreen: new THREE.MeshStandardMaterial({ color: 0x22ff22, emissive: 0x00ff00, emissiveIntensity: 0.5 })
    };

    const voxelSize = 0.30;
    const geoBox = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    // Buffers for InstancedMesh
    const instances: Record<string, THREE.Matrix4[]> = {};
    for (const k in materials) instances[k] = [];

    const addVoxel = (
      parent: THREE.Object3D, 
      x: number, y: number, z: number, 
      matName: string,
      scaleX = 1, scaleY = 1, scaleZ = 1
    ) => {
      if (parent !== this.mesh) {
        const mat = materials[matName];
        const mesh = new THREE.Mesh(geoBox, mat);
        mesh.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
        mesh.scale.set(scaleX, scaleY, scaleZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      }

      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x * voxelSize, y * voxelSize, z * voxelSize),
        new THREE.Quaternion(),
        new THREE.Vector3(scaleX, scaleY, scaleZ)
      );
      
      if (!instances[matName]) instances[matName] = [];
      instances[matName].push(matrix);
      return null;
    };

    // ============================================
    // A-10 WARTHOG GEOMETRY (Bulky, Tank-like)
    // ============================================

    // --- NOSE SECTION (Blunt, houses GAU-8 cannon) ---
    addVoxel(this.mesh, 0, 0, -7, 'body', 1.2, 0.9, 1);
    addVoxel(this.mesh, 0, 0, -6, 'body', 1.4, 1.0, 1);
    addVoxel(this.mesh, 0, -0.3, -6, 'belly', 1.3, 0.6, 1);
    addVoxel(this.mesh, 0, 0, -5, 'body', 1.5, 1.1, 1);
    addVoxel(this.mesh, 0, -0.4, -5, 'belly', 1.4, 0.6, 1);
    
    // GAU-8 Avenger cannon (massive rotary cannon under nose)
    addVoxel(this.mesh, 0, -0.9, -8, 'dark', 0.6, 0.6, 1.5);
    addVoxel(this.mesh, 0, -0.9, -6.5, 'dark', 0.8, 0.8, 1.5);
    addVoxel(this.mesh, 0, -0.9, -5, 'dark', 0.9, 0.9, 1);
    
    // --- COCKPIT (Armored bubble, positioned forward and high) ---
    addVoxel(this.mesh, 0, 0.8, -4, 'cockpit', 1.3, 0.8, 1);
    addVoxel(this.mesh, 0, 1.0, -3, 'cockpit', 1.4, 0.9, 1);
    addVoxel(this.mesh, 0, 0.9, -2, 'cockpit', 1.3, 0.8, 1);
    addVoxel(this.mesh, 0, 0.6, -1, 'cockpit', 1.1, 0.6, 0.8);
    
    // Cockpit armor frame (titanium bathtub)
    addVoxel(this.mesh, 0, 0, -4, 'armor', 1.6, 0.8, 1);
    addVoxel(this.mesh, 0, 0, -3, 'armor', 1.7, 0.9, 1);
    addVoxel(this.mesh, 0, -0.6, -4, 'belly', 1.5, 0.5, 1);
    addVoxel(this.mesh, 0, -0.6, -3, 'belly', 1.6, 0.5, 1);
    
    // --- FORWARD FUSELAGE (Wide, boxy) ---
    for (let z = -2; z <= 1; z++) {
      addVoxel(this.mesh, 0, 0.3, z, 'body', 1.8, 0.7, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 2.0, 0.8, 1);
      addVoxel(this.mesh, 0, -0.5, z, 'belly', 1.8, 0.6, 1);
      
      // Side armor panels
      addVoxel(this.mesh, -1.3, 0, z, 'armor', 0.4, 0.7, 1);
      addVoxel(this.mesh, 1.3, 0, z, 'armor', 0.4, 0.7, 1);
    }
    
    // --- MAIN FUSELAGE (Wide, straight, boxy) ---
    for (let z = 1; z <= 5; z++) {
      addVoxel(this.mesh, 0, 0.4, z, 'body', 1.6, 0.6, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 1.8, 0.8, 1);
      addVoxel(this.mesh, 0, -0.5, z, 'belly', 1.6, 0.6, 1);
      
      // Visible panel lines (armor plating effect)
      if (z % 2 === 0) {
        addVoxel(this.mesh, -1.1, 0, z, 'armor', 0.3, 0.6, 0.8);
        addVoxel(this.mesh, 1.1, 0, z, 'armor', 0.3, 0.6, 0.8);
      }
    }
    
    // --- HIGH-MOUNTED WINGS (Short, stubby, straight leading edge) ---
    for (let z = 1; z <= 4; z++) {
      addVoxel(this.mesh, -2.2, 0.4, z, 'body', 1, 0.4, 1);
      addVoxel(this.mesh, 2.2, 0.4, z, 'body', 1, 0.4, 1);
    }
    
    // Mid wing (thick, sturdy)
    addVoxel(this.mesh, -3.2, 0.4, 1.5, 'body', 1, 0.5, 1.2);
    addVoxel(this.mesh, -3.2, 0.4, 2.5, 'body', 1, 0.5, 1.2);
    addVoxel(this.mesh, -3.2, 0.4, 3.5, 'body', 1, 0.5, 1.2);
    addVoxel(this.mesh, 3.2, 0.4, 1.5, 'body', 1, 0.5, 1.2);
    addVoxel(this.mesh, 3.2, 0.4, 2.5, 'body', 1, 0.5, 1.2);
    addVoxel(this.mesh, 3.2, 0.4, 3.5, 'body', 1, 0.5, 1.2);
    
    // Outer wing (blunt tips)
    addVoxel(this.mesh, -4.2, 0.4, 2, 'body', 1, 0.45, 1);
    addVoxel(this.mesh, -4.2, 0.4, 3, 'body', 1, 0.45, 1);
    addVoxel(this.mesh, 4.2, 0.4, 2, 'body', 1, 0.45, 1);
    addVoxel(this.mesh, 4.2, 0.4, 3, 'body', 1, 0.45, 1);
    
    // Wing tips with nav lights (blunt, squared)
    addVoxel(this.mesh, -5, 0.4, 2.5, 'body', 0.8, 0.4, 1);
    addVoxel(this.mesh, -5.3, 0.4, 2.5, 'navRed', 0.4, 0.25, 0.5);
    addVoxel(this.mesh, 5, 0.4, 2.5, 'body', 0.8, 0.4, 1);
    addVoxel(this.mesh, 5.3, 0.4, 2.5, 'navGreen', 0.4, 0.25, 0.5);
    
    // Hardpoints under wings (weapons pylons)
    addVoxel(this.mesh, -3.5, 0, 2, 'dark', 0.3, 0.5, 0.8);
    addVoxel(this.mesh, -3.5, 0, 3, 'dark', 0.3, 0.5, 0.8);
    addVoxel(this.mesh, 3.5, 0, 2, 'dark', 0.3, 0.5, 0.8);
    addVoxel(this.mesh, 3.5, 0, 3, 'dark', 0.3, 0.5, 0.8);

    // --- AILERONS ---
    this.leftAileron.position.set(-3.5 * voxelSize, 0.4 * voxelSize, 4 * voxelSize);
    this.mesh.add(this.leftAileron);
    addVoxel(this.leftAileron, 0, 0, 0, 'control', 1.2, 0.35, 0.8);
    addVoxel(this.leftAileron, -0.8, 0, 0, 'control', 1, 0.35, 0.8);

    this.rightAileron.position.set(3.5 * voxelSize, 0.4 * voxelSize, 4 * voxelSize);
    this.mesh.add(this.rightAileron);
    addVoxel(this.rightAileron, 0, 0, 0, 'control', 1.2, 0.35, 0.8);
    addVoxel(this.rightAileron, 0.8, 0, 0, 'control', 1, 0.35, 0.8);

    // --- TWIN ENGINES (Mounted high, behind wings - A-10 signature) ---
    // Left engine nacelle
    addVoxel(this.mesh, -1.8, 1.2, 4, 'engine', 1.2, 1.2, 1);
    addVoxel(this.mesh, -1.8, 1.2, 5, 'engine', 1.3, 1.3, 1);
    addVoxel(this.mesh, -1.8, 1.2, 6, 'engine', 1.4, 1.4, 1);
    addVoxel(this.mesh, -1.8, 1.2, 7, 'dark', 1.5, 1.5, 0.8);
    
    // Right engine nacelle
    addVoxel(this.mesh, 1.8, 1.2, 4, 'engine', 1.2, 1.2, 1);
    addVoxel(this.mesh, 1.8, 1.2, 5, 'engine', 1.3, 1.3, 1);
    addVoxel(this.mesh, 1.8, 1.2, 6, 'engine', 1.4, 1.4, 1);
    addVoxel(this.mesh, 1.8, 1.2, 7, 'dark', 1.5, 1.5, 0.8);
    
    // Engine intake fairings
    addVoxel(this.mesh, -1.8, 1.5, 3.5, 'dark', 0.9, 0.6, 1);
    addVoxel(this.mesh, 1.8, 1.5, 3.5, 'dark', 0.9, 0.6, 1);

    // --- TAIL SECTION (Narrow boom between twin fins) ---
    addVoxel(this.mesh, 0, 0.2, 5, 'body', 1.0, 0.5, 1);
    addVoxel(this.mesh, 0, 0.2, 6, 'body', 0.8, 0.4, 1);
    addVoxel(this.mesh, 0, 0.2, 7, 'body', 0.6, 0.35, 1);

    // --- HORIZONTAL STABILIZERS (Large, between tail fins) ---
    this.leftElevator.position.set(-1.8 * voxelSize, 0.3 * voxelSize, 7 * voxelSize);
    this.mesh.add(this.leftElevator);
    addVoxel(this.leftElevator, 0, 0, 0, 'control', 1.2, 0.25, 1);
    addVoxel(this.leftElevator, -0.6, 0, 0.3, 'control', 1, 0.22, 0.8);
    
    this.rightElevator.position.set(1.8 * voxelSize, 0.3 * voxelSize, 7 * voxelSize);
    this.mesh.add(this.rightElevator);
    addVoxel(this.rightElevator, 0, 0, 0, 'control', 1.2, 0.25, 1);
    addVoxel(this.rightElevator, 0.6, 0, 0.3, 'control', 1, 0.22, 0.8);

    // --- TWIN VERTICAL TAILS (Widely spaced - A-10 signature) ---
    // Left vertical tail (wide spacing, no angle)
    this.leftRudder.position.set(-2.5 * voxelSize, 0.8 * voxelSize, 6 * voxelSize);
    this.leftRudder.rotation.z = 0;  // Upright, not canted
    this.mesh.add(this.leftRudder);
    addVoxel(this.leftRudder, 0, 0, 0, 'body', 0.4, 0.9, 1);
    addVoxel(this.leftRudder, 0, 0.8, 0.2, 'body', 0.35, 1, 1);
    addVoxel(this.leftRudder, 0, 1.6, 0.4, 'body', 0.3, 0.9, 0.9);
    addVoxel(this.leftRudder, 0, 2.2, 0.5, 'body', 0.25, 0.6, 0.7);
    addVoxel(this.leftRudder, 0, 0.8, 0.8, 'control', 0.25, 0.8, 0.5);
    addVoxel(this.leftRudder, 0, 1.6, 1.0, 'control', 0.2, 0.7, 0.4);
    
    // Right vertical tail (wide spacing)
    this.rightRudder.position.set(2.5 * voxelSize, 0.8 * voxelSize, 6 * voxelSize);
    this.rightRudder.rotation.z = 0;
    this.mesh.add(this.rightRudder);
    addVoxel(this.rightRudder, 0, 0, 0, 'body', 0.4, 0.9, 1);
    addVoxel(this.rightRudder, 0, 0.8, 0.2, 'body', 0.35, 1, 1);
    addVoxel(this.rightRudder, 0, 1.6, 0.4, 'body', 0.3, 0.9, 0.9);
    addVoxel(this.rightRudder, 0, 2.2, 0.5, 'body', 0.25, 0.6, 0.7);
    addVoxel(this.rightRudder, 0, 0.8, 0.8, 'control', 0.25, 0.8, 0.5);
    addVoxel(this.rightRudder, 0, 1.6, 1.0, 'control', 0.2, 0.7, 0.4);

    // --- LANDING GEAR PODS (Visible on A-10) ---
    addVoxel(this.mesh, -1.5, -0.9, 0, 'dark', 0.7, 0.5, 1.5);
    addVoxel(this.mesh, 1.5, -0.9, 0, 'dark', 0.7, 0.5, 1.5);
    addVoxel(this.mesh, 0, -0.9, -3, 'dark', 0.6, 0.4, 1.2);

    // --- AFTERBURNER EXHAUST (Positioned at high-mounted engines) ---
    const exhaustGeo = new THREE.BoxGeometry(voxelSize * 1.0, voxelSize * 1.0, voxelSize);
    exhaustGeo.translate(0, 0, voxelSize * 0.5);
    this.exhaustLeft = new THREE.Mesh(exhaustGeo, materials.glow);
    this.exhaustRight = new THREE.Mesh(exhaustGeo, materials.glow);

    this.exhaustLeft.position.set(-1.8 * voxelSize, 1.2 * voxelSize, 7.5 * voxelSize);
    this.exhaustRight.position.set(1.8 * voxelSize, 1.2 * voxelSize, 7.5 * voxelSize);

    this.mesh.add(this.exhaustLeft);
    this.mesh.add(this.exhaustRight);

    // Muzzle flash positions (GAU-8 cannon)
    this.muzzleFlashLeft.position.set(0, -0.9 * voxelSize, -8 * voxelSize);
    this.muzzleFlashRight.position.set(0, -0.9 * voxelSize, -8.5 * voxelSize);
    this.mesh.add(this.muzzleFlashLeft);
    this.mesh.add(this.muzzleFlashRight);

    // --- INSTANCING ---
    for (const key in instances) {
      const matrices = instances[key];
      if (matrices.length === 0) continue;

      const instMesh = new THREE.InstancedMesh(geoBox, materials[key], matrices.length);
      
      for (let i = 0; i < matrices.length; i++) {
        instMesh.setMatrixAt(i, matrices[i]);
      }
      
      instMesh.instanceMatrix.needsUpdate = true;
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;
      this.mesh.add(instMesh);
    }
  }

  /**
   * X-47 SWITCHBLADE - Agile Strike Fighter (F-16/FA-50 Inspired)
   * 
   * Compact, dart-like profile with aggressive styling. Features:
   * - 70% overall scale (compact, nimble)
   * - Single vertical tail fin
   * - Short, stubby wings (40% reduced)
   * - Prominent angular air intakes
   * - Narrow single-engine profile
   * - Crimson red afterburner
   */
  private buildX47Switchblade() {
    // --- MATERIALS (Aggressive matte black/crimson scheme) ---
    const materials: Record<string, THREE.Material> = {
      // Main body - matte black
      body: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.color, 
        roughness: 0.7, 
        metalness: 0.2,
        emissive: this.aircraftConfig.emissiveColor,
        emissiveIntensity: 0.03
      }),
      // Underside - dark gray
      belly: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.accentColor, 
        roughness: 0.6, 
        metalness: 0.2 
      }),
      // Dark accents - intakes, panels
      dark: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 }),
      // Control surfaces
      control: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.2 }),
      // Red accents
      accent: new THREE.MeshStandardMaterial({ 
        color: 0xff3333, 
        roughness: 0.4, 
        metalness: 0.3,
        emissive: 0xff0000,
        emissiveIntensity: 0.15
      }),
      // Cockpit - red tinted glass
      cockpit: new THREE.MeshStandardMaterial({ 
        color: 0x661111, 
        roughness: 0.0, 
        metalness: 0.95,
        emissive: 0x330000,
        emissiveIntensity: 0.5
      }),
      // Afterburner glow - crimson red
      glow: new THREE.MeshBasicMaterial({ color: 0xff5555 }),
      // Nav lights
      navRed: new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.6 }),
      navGreen: new THREE.MeshStandardMaterial({ color: 0x22ff22, emissive: 0x00ff00, emissiveIntensity: 0.5 })
    };

    const voxelSize = 0.30;  // Standard voxel size
    const geoBox = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    // Instance buffer
    const instances: Record<string, THREE.Matrix4[]> = {};
    for (const k in materials) instances[k] = [];

    const addVoxel = (
      parent: THREE.Object3D,
      x: number, y: number, z: number,
      matName: string,
      scaleX = 1, scaleY = 1, scaleZ = 1
    ) => {
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x * voxelSize, y * voxelSize, z * voxelSize),
        new THREE.Quaternion(),
        new THREE.Vector3(scaleX, scaleY, scaleZ)
      );

      if (!instances[matName]) instances[matName] = [];

      if (parent === this.mesh) {
        instances[matName].push(matrix);
      } else {
        const m = new THREE.Mesh(geoBox, materials[matName]);
        m.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
        m.scale.set(scaleX, scaleY, scaleZ);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
      }
    };

    // ============================================
    // X-47 SWITCHBLADE GEOMETRY (Compact, Dart-like)
    // 70% scale - aggressive, twitchy fighter
    // ============================================

    // --- NOSE (Sharp, pointed, dart-like) ---
    addVoxel(this.mesh, 0, 0, -7, 'body', 0.35, 0.35, 1);   // Sharp tip
    addVoxel(this.mesh, 0, 0, -6, 'body', 0.5, 0.45, 1);
    addVoxel(this.mesh, 0, 0, -5, 'body', 0.7, 0.55, 1);
    addVoxel(this.mesh, 0, -0.2, -5, 'belly', 0.6, 0.35, 1);
    addVoxel(this.mesh, 0, 0, -4, 'body', 0.85, 0.65, 1);
    addVoxel(this.mesh, 0, -0.3, -4, 'belly', 0.7, 0.4, 1);
    
    // Red accent stripe on nose
    addVoxel(this.mesh, 0, 0.3, -5, 'accent', 0.3, 0.15, 0.8);
    
    // --- COCKPIT (Compact, aggressive, red-tinted) ---
    addVoxel(this.mesh, 0, 0.5, -3, 'cockpit', 0.8, 0.55, 1);
    addVoxel(this.mesh, 0, 0.65, -2, 'cockpit', 0.9, 0.6, 1);
    addVoxel(this.mesh, 0, 0.55, -1, 'cockpit', 0.8, 0.5, 1);
    addVoxel(this.mesh, 0, 0.4, 0, 'cockpit', 0.6, 0.4, 0.7);
    
    // Cockpit frame
    addVoxel(this.mesh, 0, 0, -3, 'body', 0.95, 0.6, 1);
    addVoxel(this.mesh, 0, 0, -2, 'body', 1.0, 0.65, 1);
    addVoxel(this.mesh, 0, -0.4, -3, 'belly', 0.85, 0.4, 1);
    addVoxel(this.mesh, 0, -0.4, -2, 'belly', 0.9, 0.4, 1);
    
    // --- PROMINENT AIR INTAKES (F-16 style, angular) ---
    addVoxel(this.mesh, -0.7, -0.3, -2, 'dark', 0.5, 0.6, 1.3);
    addVoxel(this.mesh, 0.7, -0.3, -2, 'dark', 0.5, 0.6, 1.3);
    addVoxel(this.mesh, -0.7, -0.3, -1, 'dark', 0.55, 0.65, 1);
    addVoxel(this.mesh, 0.7, -0.3, -1, 'dark', 0.55, 0.65, 1);
    // Red intake highlights
    addVoxel(this.mesh, -0.9, -0.3, -1.5, 'accent', 0.15, 0.5, 1);
    addVoxel(this.mesh, 0.9, -0.3, -1.5, 'accent', 0.15, 0.5, 1);
    
    // --- FORWARD FUSELAGE (Narrow, single-engine profile) ---
    for (let z = -1; z <= 2; z++) {
      addVoxel(this.mesh, 0, 0.2, z, 'body', 0.9, 0.5, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 1.0, 0.6, 1);
      addVoxel(this.mesh, 0, -0.35, z, 'belly', 0.85, 0.45, 1);
    }
    
    // --- MAIN FUSELAGE (Compact, narrow) ---
    for (let z = 2; z <= 5; z++) {
      addVoxel(this.mesh, 0, 0.2, z, 'body', 0.85, 0.45, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 0.95, 0.55, 1);
      addVoxel(this.mesh, 0, -0.3, z, 'belly', 0.8, 0.4, 1);
    }
    
    // --- ENGINE SECTION (Single engine, narrow, prominent nozzle) ---
    addVoxel(this.mesh, 0, 0, 5, 'dark', 0.85, 0.7, 1);
    addVoxel(this.mesh, 0, 0, 6, 'dark', 0.9, 0.75, 1);
    addVoxel(this.mesh, 0, 0, 7, 'dark', 1.0, 0.85, 0.8);
    
    // --- SHORT STUBBY WINGS (40% shorter, thicker, blunt tips) ---
    // Inner wing root
    for (let z = 1; z <= 3; z++) {
      addVoxel(this.mesh, -1.3, 0, z, 'body', 0.85, 0.35, 1);
      addVoxel(this.mesh, 1.3, 0, z, 'body', 0.85, 0.35, 1);
    }
    
    // Mid wing (stubby)
    addVoxel(this.mesh, -2, 0, 1.5, 'body', 0.9, 0.4, 1);
    addVoxel(this.mesh, -2, 0, 2.5, 'body', 0.9, 0.4, 1);
    addVoxel(this.mesh, 2, 0, 1.5, 'body', 0.9, 0.4, 1);
    addVoxel(this.mesh, 2, 0, 2.5, 'body', 0.9, 0.4, 1);
    
    // Outer wing (blunt, squared tips)
    addVoxel(this.mesh, -2.7, 0, 2, 'body', 0.8, 0.35, 1);
    addVoxel(this.mesh, 2.7, 0, 2, 'body', 0.8, 0.35, 1);
    
    // Wing tips with nav lights
    addVoxel(this.mesh, -3.2, 0, 2, 'body', 0.6, 0.3, 0.8);
    addVoxel(this.mesh, -3.5, 0, 2, 'navRed', 0.35, 0.2, 0.4);
    addVoxel(this.mesh, 3.2, 0, 2, 'body', 0.6, 0.3, 0.8);
    addVoxel(this.mesh, 3.5, 0, 2, 'navGreen', 0.35, 0.2, 0.4);
    
    // Red accent on wing leading edge
    addVoxel(this.mesh, -1.8, 0.1, 1, 'accent', 0.35, 0.15, 0.6);
    addVoxel(this.mesh, 1.8, 0.1, 1, 'accent', 0.35, 0.15, 0.6);

    // --- AILERONS (Animated control surfaces - shorter) ---
    this.leftAileron.position.set(-2.3 * voxelSize, 0, 3 * voxelSize);
    this.mesh.add(this.leftAileron);
    addVoxel(this.leftAileron, 0, 0, 0, 'control', 0.95, 0.25, 0.7);
    addVoxel(this.leftAileron, -0.5, 0, 0, 'control', 0.7, 0.25, 0.6);

    this.rightAileron.position.set(2.3 * voxelSize, 0, 3 * voxelSize);
    this.mesh.add(this.rightAileron);
    addVoxel(this.rightAileron, 0, 0, 0, 'control', 0.95, 0.25, 0.7);
    addVoxel(this.rightAileron, 0.5, 0, 0, 'control', 0.7, 0.25, 0.6);

    // --- SINGLE VERTICAL TAIL (Upright, proportional) ---
    // Using leftRudder as the single tail for Switchblade
    this.leftRudder.position.set(0, 0.5 * voxelSize, 5.5 * voxelSize);
    this.leftRudder.rotation.z = 0;
    this.mesh.add(this.leftRudder);
    addVoxel(this.leftRudder, 0, 0, 0, 'body', 0.35, 0.8, 1);
    addVoxel(this.leftRudder, 0, 0.7, 0.2, 'body', 0.3, 0.9, 0.9);
    addVoxel(this.leftRudder, 0, 1.4, 0.4, 'body', 0.25, 0.8, 0.8);
    addVoxel(this.leftRudder, 0, 2.0, 0.5, 'body', 0.2, 0.6, 0.7);
    addVoxel(this.leftRudder, 0, 2.4, 0.6, 'dark', 0.15, 0.35, 0.5);
    // Rudder control surface
    addVoxel(this.leftRudder, 0, 0.7, 0.8, 'control', 0.2, 0.7, 0.5);
    addVoxel(this.leftRudder, 0, 1.4, 1.0, 'control', 0.15, 0.6, 0.4);
    // Red accent on tail
    addVoxel(this.leftRudder, 0, 1.7, 0.3, 'accent', 0.18, 0.4, 0.45);
    
    // Hide the right rudder (single tail design)
    this.rightRudder.visible = false;

    // --- HORIZONTAL STABILIZERS (Small elevators) ---
    this.leftElevator.position.set(-1.0 * voxelSize, 0.2 * voxelSize, 6.5 * voxelSize);
    this.mesh.add(this.leftElevator);
    addVoxel(this.leftElevator, 0, 0, 0, 'control', 0.9, 0.2, 0.7);
    addVoxel(this.leftElevator, -0.5, 0, 0.2, 'control', 0.7, 0.18, 0.6);
    
    this.rightElevator.position.set(1.0 * voxelSize, 0.2 * voxelSize, 6.5 * voxelSize);
    this.mesh.add(this.rightElevator);
    addVoxel(this.rightElevator, 0, 0, 0, 'control', 0.9, 0.2, 0.7);
    addVoxel(this.rightElevator, 0.5, 0, 0.2, 'control', 0.7, 0.18, 0.6);

    // --- AFTERBURNER EXHAUST (Single center engine - crimson glow) ---
    const exhaustGeo = new THREE.BoxGeometry(voxelSize * 1.0, voxelSize * 1.0, voxelSize);
    exhaustGeo.translate(0, 0, voxelSize * 0.5);
    this.exhaustLeft = new THREE.Mesh(exhaustGeo, materials.glow);
    this.exhaustRight = new THREE.Mesh(exhaustGeo.clone(), materials.glow);

    // Single center exhaust (use exhaustLeft as main, hide right or position together)
    this.exhaustLeft.position.set(0, 0, 7.5 * voxelSize);
    this.exhaustRight.position.set(0, 0, 7.8 * voxelSize);  // Slightly behind for depth
    this.exhaustRight.scale.set(0.7, 0.7, 0.6);  // Smaller inner glow

    this.mesh.add(this.exhaustLeft);
    this.mesh.add(this.exhaustRight);

    // Muzzle flash positions
    this.muzzleFlashLeft.position.set(0.5 * voxelSize, -0.3 * voxelSize, -7 * voxelSize);
    this.muzzleFlashRight.position.set(-0.5 * voxelSize, -0.3 * voxelSize, -7.2 * voxelSize);
    this.mesh.add(this.muzzleFlashLeft);
    this.mesh.add(this.muzzleFlashRight);

    // --- GUN PORT ---
    addVoxel(this.mesh, 0.4, -0.3, -5, 'dark', 0.2, 0.2, 1.5);

    // --- INSTANCING ---
    for (const key in instances) {
      const matrices = instances[key];
      if (matrices.length === 0) continue;

      const instMesh = new THREE.InstancedMesh(geoBox, materials[key], matrices.length);
      
      for (let i = 0; i < matrices.length; i++) {
        instMesh.setMatrixAt(i, matrices[i]);
      }
      
      instMesh.instanceMatrix.needsUpdate = true;
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;
      this.mesh.add(instMesh);
    }
  }

  /**
   * SR-71 WRAITH - Stealth Reconnaissance Aircraft (Blackbird Inspired)
   * 
   * Extremely long, slender fuselage with needle-sharp nose. Features:
   * - 150% length (very long, elegant)
   * - 70% width (narrow, slip through air)
   * - Needle-sharp pointed nose (8+ voxels)
   * - Twin tall blade-like vertical tails
   * - Tiny minimal wings (positioned toward tail)
   * - Smooth, streamlined body
   * - Deep purple afterburner
   */
  private buildSR71Wraith() {
    // --- MATERIALS (Stealth matte black/purple scheme) ---
    const materials: Record<string, THREE.Material> = {
      // Main body - near-black with purple tint
      body: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.color, 
        roughness: 0.85, 
        metalness: 0.15,
        emissive: this.aircraftConfig.emissiveColor,
        emissiveIntensity: 0.02
      }),
      // Underside - dark purple-gray
      belly: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.accentColor, 
        roughness: 0.8, 
        metalness: 0.1 
      }),
      // Dark accents - edges, panels
      dark: new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.9 }),
      // Control surfaces
      control: new THREE.MeshStandardMaterial({ color: 0x0c0c14, roughness: 0.7, metalness: 0.15 }),
      // Purple accents - subtle glow
      accent: new THREE.MeshStandardMaterial({ 
        color: 0x6633cc, 
        roughness: 0.5, 
        metalness: 0.4,
        emissive: 0x4422aa,
        emissiveIntensity: 0.2
      }),
      // Cockpit - purple tinted, smooth fairing
      cockpit: new THREE.MeshStandardMaterial({ 
        color: 0x221133, 
        roughness: 0.1, 
        metalness: 0.9,
        emissive: 0x331155,
        emissiveIntensity: 0.4
      }),
      // Afterburner glow - deep purple
      glow: new THREE.MeshBasicMaterial({ color: 0x7744ff }),
      // Nav lights - purple themed
      navPurple: new THREE.MeshStandardMaterial({ color: 0xaa66ff, emissive: 0x7744ff, emissiveIntensity: 0.7 }),
      navGreen: new THREE.MeshStandardMaterial({ color: 0x44ff88, emissive: 0x22cc66, emissiveIntensity: 0.5 })
    };

    const voxelSize = 0.30;
    const geoBox = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    // Instance buffer
    const instances: Record<string, THREE.Matrix4[]> = {};
    for (const k in materials) instances[k] = [];

    const addVoxel = (
      parent: THREE.Object3D,
      x: number, y: number, z: number,
      matName: string,
      scaleX = 1, scaleY = 1, scaleZ = 1
    ) => {
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x * voxelSize, y * voxelSize, z * voxelSize),
        new THREE.Quaternion(),
        new THREE.Vector3(scaleX, scaleY, scaleZ)
      );

      if (!instances[matName]) instances[matName] = [];

      if (parent === this.mesh) {
        instances[matName].push(matrix);
      } else {
        const m = new THREE.Mesh(geoBox, materials[matName]);
        m.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
        m.scale.set(scaleX, scaleY, scaleZ);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
      }
    };

    // ============================================
    // SR-71 WRAITH GEOMETRY (Long, Slender, Needle-like)
    // 150% length, 70% width - elegant and fast
    // ============================================

    // --- NEEDLE NOSE (Sharp, 8+ voxels, hypersonic design) ---
    addVoxel(this.mesh, 0, 0, -11, 'body', 0.2, 0.2, 1);   // Needle tip
    addVoxel(this.mesh, 0, 0, -10, 'body', 0.25, 0.25, 1);
    addVoxel(this.mesh, 0, 0, -9, 'body', 0.35, 0.3, 1);
    addVoxel(this.mesh, 0, 0, -8, 'body', 0.45, 0.35, 1);
    addVoxel(this.mesh, 0, 0, -7, 'body', 0.55, 0.4, 1);
    addVoxel(this.mesh, 0, -0.15, -7, 'belly', 0.45, 0.25, 1);
    addVoxel(this.mesh, 0, 0, -6, 'body', 0.65, 0.45, 1);
    addVoxel(this.mesh, 0, -0.2, -6, 'belly', 0.55, 0.3, 1);
    addVoxel(this.mesh, 0, 0, -5, 'body', 0.75, 0.5, 1);
    addVoxel(this.mesh, 0, -0.25, -5, 'belly', 0.6, 0.3, 1);
    
    // --- COCKPIT (Smooth fairing, integrated into fuselage) ---
    addVoxel(this.mesh, 0, 0.3, -4, 'cockpit', 0.75, 0.45, 1);
    addVoxel(this.mesh, 0, 0.35, -3, 'cockpit', 0.8, 0.5, 1);
    addVoxel(this.mesh, 0, 0.3, -2, 'cockpit', 0.75, 0.45, 1);
    addVoxel(this.mesh, 0, 0.2, -1, 'cockpit', 0.65, 0.35, 0.8);
    
    // Cockpit frame (smooth fairing)
    addVoxel(this.mesh, 0, 0, -4, 'body', 0.8, 0.55, 1);
    addVoxel(this.mesh, 0, 0, -3, 'body', 0.85, 0.6, 1);
    addVoxel(this.mesh, 0, 0, -2, 'body', 0.8, 0.55, 1);
    addVoxel(this.mesh, 0, -0.3, -4, 'belly', 0.7, 0.35, 1);
    addVoxel(this.mesh, 0, -0.3, -3, 'belly', 0.75, 0.35, 1);
    addVoxel(this.mesh, 0, -0.3, -2, 'belly', 0.7, 0.35, 1);
    
    // --- FORWARD FUSELAGE (Narrow, streamlined) ---
    for (let z = -1; z <= 2; z++) {
      addVoxel(this.mesh, 0, 0.1, z, 'body', 0.75, 0.45, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 0.8, 0.5, 1);
      addVoxel(this.mesh, 0, -0.25, z, 'belly', 0.65, 0.35, 1);
    }
    
    // --- INTEGRATED AIR INTAKES (Smooth, flush with fuselage) ---
    addVoxel(this.mesh, -0.5, -0.1, 0, 'dark', 0.35, 0.45, 1.5);
    addVoxel(this.mesh, 0.5, -0.1, 0, 'dark', 0.35, 0.45, 1.5);
    addVoxel(this.mesh, -0.5, -0.1, 1.2, 'dark', 0.4, 0.5, 1);
    addVoxel(this.mesh, 0.5, -0.1, 1.2, 'dark', 0.4, 0.5, 1);
    
    // --- MAIN FUSELAGE (Long, slender, tapered) ---
    for (let z = 2; z <= 6; z++) {
      const taper = 1 - (z - 2) * 0.03;
      addVoxel(this.mesh, 0, 0.1, z, 'body', 0.7 * taper, 0.4, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 0.75 * taper, 0.45, 1);
      addVoxel(this.mesh, 0, -0.2, z, 'belly', 0.6 * taper, 0.3, 1);
    }
    
    // --- REAR FUSELAGE (Narrow tail boom) ---
    for (let z = 7; z <= 9; z++) {
      const taper = 1 - (z - 7) * 0.08;
      addVoxel(this.mesh, 0, 0.05, z, 'body', 0.6 * taper, 0.35, 1);
      addVoxel(this.mesh, 0, -0.15, z, 'belly', 0.5 * taper, 0.25, 1);
    }
    
    // --- ENGINE SECTION (Slim, integrated) ---
    addVoxel(this.mesh, 0, 0, 9, 'dark', 0.55, 0.5, 1);
    addVoxel(this.mesh, 0, 0, 10, 'dark', 0.6, 0.55, 0.8);
    
    // --- TINY BLADE WINGS (60% length, thin, positioned toward tail) ---
    // Inner wing root
    addVoxel(this.mesh, -0.9, 0, 4, 'body', 0.6, 0.2, 1);
    addVoxel(this.mesh, -0.9, 0, 5, 'body', 0.6, 0.2, 1);
    addVoxel(this.mesh, 0.9, 0, 4, 'body', 0.6, 0.2, 1);
    addVoxel(this.mesh, 0.9, 0, 5, 'body', 0.6, 0.2, 1);
    
    // Mid wing (blade-thin)
    addVoxel(this.mesh, -1.5, 0, 4.5, 'body', 0.7, 0.18, 1);
    addVoxel(this.mesh, 1.5, 0, 4.5, 'body', 0.7, 0.18, 1);
    
    // Outer wing (minimal, diamond profile)
    addVoxel(this.mesh, -2.0, 0, 5, 'body', 0.6, 0.15, 0.9);
    addVoxel(this.mesh, 2.0, 0, 5, 'body', 0.6, 0.15, 0.9);
    
    // Wing tips with nav lights
    addVoxel(this.mesh, -2.4, 0, 5, 'body', 0.4, 0.12, 0.7);
    addVoxel(this.mesh, -2.7, 0, 5, 'navPurple', 0.25, 0.12, 0.35);
    addVoxel(this.mesh, 2.4, 0, 5, 'body', 0.4, 0.12, 0.7);
    addVoxel(this.mesh, 2.7, 0, 5, 'navGreen', 0.25, 0.12, 0.35);

    // --- AILERONS (Animated control surfaces - minimal) ---
    this.leftAileron.position.set(-1.8 * voxelSize, 0, 5.5 * voxelSize);
    this.mesh.add(this.leftAileron);
    addVoxel(this.leftAileron, 0, 0, 0, 'control', 0.7, 0.12, 0.5);
    addVoxel(this.leftAileron, -0.3, 0, 0, 'control', 0.5, 0.1, 0.45);

    this.rightAileron.position.set(1.8 * voxelSize, 0, 5.5 * voxelSize);
    this.mesh.add(this.rightAileron);
    addVoxel(this.rightAileron, 0, 0, 0, 'control', 0.7, 0.12, 0.5);
    addVoxel(this.rightAileron, 0.3, 0, 0, 'control', 0.5, 0.1, 0.45);

    // --- TWIN VERTICAL TAILS (Tall, blade-like, widely spaced) ---
    // Left tail
    this.leftRudder.position.set(-0.6 * voxelSize, 0.5 * voxelSize, 8 * voxelSize);
    this.leftRudder.rotation.z = 0;
    this.mesh.add(this.leftRudder);
    addVoxel(this.leftRudder, 0, 0, 0, 'body', 0.25, 0.7, 1);
    addVoxel(this.leftRudder, 0, 0.6, 0.2, 'body', 0.22, 0.85, 0.9);
    addVoxel(this.leftRudder, 0, 1.3, 0.4, 'body', 0.18, 0.95, 0.8);
    addVoxel(this.leftRudder, 0, 2.0, 0.5, 'body', 0.15, 0.85, 0.7);
    addVoxel(this.leftRudder, 0, 2.5, 0.6, 'dark', 0.12, 0.55, 0.5);
    // Rudder control surface
    addVoxel(this.leftRudder, 0, 0.8, 0.8, 'control', 0.12, 0.7, 0.4);
    addVoxel(this.leftRudder, 0, 1.5, 1.0, 'control', 0.1, 0.65, 0.35);
    // Purple accent stripe
    addVoxel(this.leftRudder, 0, 1.8, 0.3, 'accent', 0.14, 0.4, 0.45);
    
    // Right tail (mirrored)
    this.rightRudder.position.set(0.6 * voxelSize, 0.5 * voxelSize, 8 * voxelSize);
    this.rightRudder.rotation.z = 0;
    this.mesh.add(this.rightRudder);
    addVoxel(this.rightRudder, 0, 0, 0, 'body', 0.25, 0.7, 1);
    addVoxel(this.rightRudder, 0, 0.6, 0.2, 'body', 0.22, 0.85, 0.9);
    addVoxel(this.rightRudder, 0, 1.3, 0.4, 'body', 0.18, 0.95, 0.8);
    addVoxel(this.rightRudder, 0, 2.0, 0.5, 'body', 0.15, 0.85, 0.7);
    addVoxel(this.rightRudder, 0, 2.5, 0.6, 'dark', 0.12, 0.55, 0.5);
    // Rudder control surface
    addVoxel(this.rightRudder, 0, 0.8, 0.8, 'control', 0.12, 0.7, 0.4);
    addVoxel(this.rightRudder, 0, 1.5, 1.0, 'control', 0.1, 0.65, 0.35);
    // Purple accent stripe
    addVoxel(this.rightRudder, 0, 1.8, 0.3, 'accent', 0.14, 0.4, 0.45);

    // --- HORIZONTAL STABILIZERS (Small elevators between tails) ---
    this.leftElevator.position.set(-0.9 * voxelSize, 0.2 * voxelSize, 9 * voxelSize);
    this.mesh.add(this.leftElevator);
    addVoxel(this.leftElevator, 0, 0, 0, 'control', 0.7, 0.12, 0.6);
    addVoxel(this.leftElevator, -0.4, 0, 0.15, 'control', 0.5, 0.1, 0.5);
    
    this.rightElevator.position.set(0.9 * voxelSize, 0.2 * voxelSize, 9 * voxelSize);
    this.mesh.add(this.rightElevator);
    addVoxel(this.rightElevator, 0, 0, 0, 'control', 0.7, 0.12, 0.6);
    addVoxel(this.rightElevator, 0.4, 0, 0.15, 'control', 0.5, 0.1, 0.5);

    // --- AFTERBURNER EXHAUST (Single center engine - deep purple) ---
    const exhaustGeo = new THREE.BoxGeometry(voxelSize * 0.8, voxelSize * 0.8, voxelSize);
    exhaustGeo.translate(0, 0, voxelSize * 0.5);
    this.exhaustLeft = new THREE.Mesh(exhaustGeo, materials.glow);
    this.exhaustRight = new THREE.Mesh(exhaustGeo.clone(), materials.glow);

    // Single center exhaust
    this.exhaustLeft.position.set(0, 0, 10.5 * voxelSize);
    this.exhaustRight.position.set(0, 0, 10.8 * voxelSize);
    this.exhaustRight.scale.set(0.6, 0.6, 0.5);

    this.mesh.add(this.exhaustLeft);
    this.mesh.add(this.exhaustRight);

    // Muzzle flash positions
    this.muzzleFlashLeft.position.set(0.3 * voxelSize, -0.2 * voxelSize, -11 * voxelSize);
    this.muzzleFlashRight.position.set(-0.3 * voxelSize, -0.2 * voxelSize, -11.2 * voxelSize);
    this.mesh.add(this.muzzleFlashLeft);
    this.mesh.add(this.muzzleFlashRight);

    // --- SUBTLE BODY ACCENTS (Purple glow lines) ---
    addVoxel(this.mesh, 0, 0.35, 2, 'accent', 0.2, 0.1, 2);
    addVoxel(this.mesh, -0.55, 0.15, 3, 'accent', 0.1, 0.08, 1.5);
    addVoxel(this.mesh, 0.55, 0.15, 3, 'accent', 0.1, 0.08, 1.5);

    // --- INSTANCING ---
    for (const key in instances) {
      const matrices = instances[key];
      if (matrices.length === 0) continue;

      const instMesh = new THREE.InstancedMesh(geoBox, materials[key], matrices.length);
      
      for (let i = 0; i < matrices.length; i++) {
        instMesh.setMatrixAt(i, matrices[i]);
      }
      
      instMesh.instanceMatrix.needsUpdate = true;
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;
      this.mesh.add(instMesh);
    }
  }

  /**
   * XF-108 ARCHON - Elite Advanced Experimental Fighter
   * 
   * Sleek, modern fuselage with advanced angular shaping. Features:
   * - Faceted, high-tech angular design
   * - Prominent canards (50% larger, raised)
   * - Twin swept-back vertical tail fins (tall, aggressive)
   * - Medium-length wings with LEX (leading-edge extensions)
   * - Dark blue-gray body with metallic gold accents
   * - Glowing cockpit and sensor panels
   * - Golden-amber afterburner
   */
  private buildXF108Archon() {
    // --- MATERIALS (Elite dark blue-gray/gold scheme) ---
    const materials: Record<string, THREE.Material> = {
      // Main body - dark blue-gray
      body: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.color, 
        roughness: 0.35, 
        metalness: 0.4,
        emissive: this.aircraftConfig.emissiveColor,
        emissiveIntensity: 0.02
      }),
      // Underside - slightly lighter
      belly: new THREE.MeshStandardMaterial({ 
        color: this.aircraftConfig.accentColor, 
        roughness: 0.4, 
        metalness: 0.35 
      }),
      // Dark accents - panels, edges
      dark: new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.6, metalness: 0.3 }),
      // Control surfaces
      control: new THREE.MeshStandardMaterial({ color: 0x252f3a, roughness: 0.45, metalness: 0.35 }),
      // Gold accents - premium, advanced
      gold: new THREE.MeshStandardMaterial({ 
        color: 0xffaa00, 
        roughness: 0.25, 
        metalness: 0.7,
        emissive: 0xcc8800,
        emissiveIntensity: 0.3
      }),
      // Cockpit - glowing blue-white (advanced avionics)
      cockpit: new THREE.MeshStandardMaterial({ 
        color: 0x4488cc, 
        roughness: 0.0, 
        metalness: 0.95,
        emissive: 0x2266aa,
        emissiveIntensity: 0.7
      }),
      // Sensor panels - subtle tech glow
      sensor: new THREE.MeshStandardMaterial({ 
        color: 0x334455, 
        roughness: 0.3, 
        metalness: 0.5,
        emissive: 0x224466,
        emissiveIntensity: 0.15
      }),
      // Afterburner glow - golden-amber
      glow: new THREE.MeshBasicMaterial({ color: 0xffdd66 }),
      // Nav lights
      navRed: new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 0.7 }),
      navGreen: new THREE.MeshStandardMaterial({ color: 0x44ff44, emissive: 0x22ff22, emissiveIntensity: 0.6 }),
      navGold: new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa00, emissiveIntensity: 0.8 })
    };

    const voxelSize = 0.30;
    const geoBox = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    // Instance buffer
    const instances: Record<string, THREE.Matrix4[]> = {};
    for (const k in materials) instances[k] = [];

    const addVoxel = (
      parent: THREE.Object3D,
      x: number, y: number, z: number,
      matName: string,
      scaleX = 1, scaleY = 1, scaleZ = 1
    ) => {
      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x * voxelSize, y * voxelSize, z * voxelSize),
        new THREE.Quaternion(),
        new THREE.Vector3(scaleX, scaleY, scaleZ)
      );

      if (!instances[matName]) instances[matName] = [];

      if (parent === this.mesh) {
        instances[matName].push(matrix);
      } else {
        const m = new THREE.Mesh(geoBox, materials[matName]);
        m.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
        m.scale.set(scaleX, scaleY, scaleZ);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
      }
    };

    // ============================================
    // XF-108 ARCHON GEOMETRY (Advanced, Angular, Elite)
    // Faceted futuristic design with gold accents
    // ============================================

    // --- NOSE (Angular, faceted, advanced) ---
    addVoxel(this.mesh, 0, 0, -7, 'body', 0.4, 0.35, 1);
    addVoxel(this.mesh, 0, 0, -6, 'body', 0.55, 0.45, 1);
    addVoxel(this.mesh, 0, -0.15, -6, 'belly', 0.45, 0.3, 1);
    addVoxel(this.mesh, 0, 0, -5, 'body', 0.7, 0.55, 1);
    addVoxel(this.mesh, 0, -0.2, -5, 'belly', 0.6, 0.35, 1);
    addVoxel(this.mesh, 0, 0, -4, 'body', 0.85, 0.65, 1);
    addVoxel(this.mesh, 0, -0.25, -4, 'belly', 0.7, 0.4, 1);
    
    // Gold accent stripe on nose
    addVoxel(this.mesh, 0, 0.3, -5.5, 'gold', 0.25, 0.12, 1.5);
    
    // Sensor bump on nose
    addVoxel(this.mesh, 0, 0.15, -6.5, 'sensor', 0.3, 0.2, 0.6);
    
    // --- COCKPIT (Raised, prominent, glowing) ---
    addVoxel(this.mesh, 0, 0.6, -3, 'cockpit', 0.85, 0.55, 1);
    addVoxel(this.mesh, 0, 0.7, -2, 'cockpit', 0.95, 0.6, 1.1);
    addVoxel(this.mesh, 0, 0.6, -1, 'cockpit', 0.85, 0.55, 1);
    addVoxel(this.mesh, 0, 0.5, 0, 'cockpit', 0.7, 0.45, 0.8);
    
    // Cockpit frame (angular)
    addVoxel(this.mesh, 0, 0.1, -3, 'body', 1.0, 0.6, 1);
    addVoxel(this.mesh, 0, 0.1, -2, 'body', 1.05, 0.65, 1);
    addVoxel(this.mesh, 0, 0.1, -1, 'body', 1.0, 0.6, 1);
    addVoxel(this.mesh, 0, -0.35, -3, 'belly', 0.85, 0.45, 1);
    addVoxel(this.mesh, 0, -0.35, -2, 'belly', 0.9, 0.45, 1);
    addVoxel(this.mesh, 0, -0.35, -1, 'belly', 0.85, 0.45, 1);
    
    // --- PROMINENT CANARDS (50% larger, angular, raised) ---
    // Left canard (animated)
    this.leftCanard = new THREE.Group();
    this.leftCanard.position.set(-1.5 * voxelSize, 0.35 * voxelSize, -2.3 * voxelSize);
    this.mesh.add(this.leftCanard);
    addVoxel(this.leftCanard, 0, 0, 0, 'body', 0.7, 0.2, 0.9);
    addVoxel(this.leftCanard, -0.5, 0.05, 0.2, 'body', 0.6, 0.18, 0.8);
    addVoxel(this.leftCanard, -0.9, 0.08, 0.3, 'control', 0.5, 0.15, 0.7);
    // Gold leading edge
    addVoxel(this.leftCanard, 0.2, 0.03, -0.5, 'gold', 0.15, 0.1, 0.8);
    
    // Right canard (animated)
    this.rightCanard = new THREE.Group();
    this.rightCanard.position.set(1.5 * voxelSize, 0.35 * voxelSize, -2.3 * voxelSize);
    this.mesh.add(this.rightCanard);
    addVoxel(this.rightCanard, 0, 0, 0, 'body', 0.7, 0.2, 0.9);
    addVoxel(this.rightCanard, 0.5, 0.05, 0.2, 'body', 0.6, 0.18, 0.8);
    addVoxel(this.rightCanard, 0.9, 0.08, 0.3, 'control', 0.5, 0.15, 0.7);
    // Gold leading edge
    addVoxel(this.rightCanard, -0.2, 0.03, -0.5, 'gold', 0.15, 0.1, 0.8);
    
    // Canard inner roots
    addVoxel(this.mesh, -0.9, 0.3, -2.5, 'body', 0.6, 0.22, 1);
    addVoxel(this.mesh, 0.9, 0.3, -2.5, 'body', 0.6, 0.22, 1);
    
    // --- FORWARD FUSELAGE (Angular, faceted) ---
    for (let z = 0; z <= 2; z++) {
      addVoxel(this.mesh, 0, 0.2, z, 'body', 0.95, 0.5, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 1.05, 0.6, 1);
      addVoxel(this.mesh, 0, -0.3, z, 'belly', 0.9, 0.45, 1);
    }
    
    // Side facets/sensor panels
    addVoxel(this.mesh, -0.65, 0.1, 1, 'sensor', 0.25, 0.35, 1.5);
    addVoxel(this.mesh, 0.65, 0.1, 1, 'sensor', 0.25, 0.35, 1.5);
    
    // --- INTEGRATED AIR INLETS (Stealthy, angular) ---
    addVoxel(this.mesh, -0.7, -0.2, -0.5, 'dark', 0.45, 0.5, 1.5);
    addVoxel(this.mesh, 0.7, -0.2, -0.5, 'dark', 0.45, 0.5, 1.5);
    addVoxel(this.mesh, -0.7, -0.2, 0.5, 'dark', 0.5, 0.55, 1);
    addVoxel(this.mesh, 0.7, -0.2, 0.5, 'dark', 0.5, 0.55, 1);
    
    // --- MAIN FUSELAGE (Sleek, purposeful) ---
    for (let z = 2; z <= 5; z++) {
      addVoxel(this.mesh, 0, 0.15, z, 'body', 0.9, 0.45, 1);
      addVoxel(this.mesh, 0, 0, z, 'body', 1.0, 0.55, 1);
      addVoxel(this.mesh, 0, -0.25, z, 'belly', 0.85, 0.4, 1);
    }
    
    // Engine nacelle bulges (advanced systems)
    addVoxel(this.mesh, -0.55, 0, 4, 'body', 0.5, 0.55, 1.5);
    addVoxel(this.mesh, 0.55, 0, 4, 'body', 0.5, 0.55, 1.5);
    
    // --- ENGINE SECTION (Twin engines, angular) ---
    addVoxel(this.mesh, -0.5, 0, 5.5, 'dark', 0.6, 0.6, 1);
    addVoxel(this.mesh, 0.5, 0, 5.5, 'dark', 0.6, 0.6, 1);
    addVoxel(this.mesh, -0.5, 0, 6.5, 'dark', 0.65, 0.65, 0.8);
    addVoxel(this.mesh, 0.5, 0, 6.5, 'dark', 0.65, 0.65, 0.8);
    
    // --- ADVANCED WINGS with LEX (Medium-length, refined) ---
    // LEX (Leading Edge Extensions)
    addVoxel(this.mesh, -1.0, 0.1, 0, 'body', 0.5, 0.25, 1.2);
    addVoxel(this.mesh, -1.0, 0.1, 1, 'body', 0.6, 0.25, 1);
    addVoxel(this.mesh, 1.0, 0.1, 0, 'body', 0.5, 0.25, 1.2);
    addVoxel(this.mesh, 1.0, 0.1, 1, 'body', 0.6, 0.25, 1);
    
    // Inner wing root
    for (let z = 1; z <= 3; z++) {
      addVoxel(this.mesh, -1.5, 0, z, 'body', 0.85, 0.3, 1);
      addVoxel(this.mesh, 1.5, 0, z, 'body', 0.85, 0.3, 1);
    }
    
    // Mid wing
    addVoxel(this.mesh, -2.3, 0, 1.5, 'body', 0.9, 0.28, 1);
    addVoxel(this.mesh, -2.3, 0, 2.5, 'body', 0.9, 0.28, 1);
    addVoxel(this.mesh, 2.3, 0, 1.5, 'body', 0.9, 0.28, 1);
    addVoxel(this.mesh, 2.3, 0, 2.5, 'body', 0.9, 0.28, 1);
    
    // Outer wing
    addVoxel(this.mesh, -3.0, 0, 2, 'body', 0.85, 0.25, 1);
    addVoxel(this.mesh, -3.0, 0, 2.8, 'body', 0.75, 0.22, 0.8);
    addVoxel(this.mesh, 3.0, 0, 2, 'body', 0.85, 0.25, 1);
    addVoxel(this.mesh, 3.0, 0, 2.8, 'body', 0.75, 0.22, 0.8);
    
    // Wing tips with nav lights
    addVoxel(this.mesh, -3.6, 0, 2.5, 'body', 0.55, 0.2, 0.7);
    addVoxel(this.mesh, -4.0, 0, 2.5, 'navRed', 0.3, 0.15, 0.35);
    addVoxel(this.mesh, 3.6, 0, 2.5, 'body', 0.55, 0.2, 0.7);
    addVoxel(this.mesh, 4.0, 0, 2.5, 'navGreen', 0.3, 0.15, 0.35);
    
    // Gold accent on wing leading edge
    addVoxel(this.mesh, -2.0, 0.08, 1, 'gold', 0.15, 0.1, 0.8);
    addVoxel(this.mesh, -2.8, 0.08, 1.5, 'gold', 0.12, 0.08, 0.7);
    addVoxel(this.mesh, 2.0, 0.08, 1, 'gold', 0.15, 0.1, 0.8);
    addVoxel(this.mesh, 2.8, 0.08, 1.5, 'gold', 0.12, 0.08, 0.7);

    // --- AILERONS (Animated control surfaces) ---
    this.leftAileron.position.set(-2.5 * voxelSize, 0, 3.5 * voxelSize);
    this.mesh.add(this.leftAileron);
    addVoxel(this.leftAileron, 0, 0, 0, 'control', 1, 0.2, 0.7);
    addVoxel(this.leftAileron, -0.5, 0, 0, 'control', 0.85, 0.2, 0.65);

    this.rightAileron.position.set(2.5 * voxelSize, 0, 3.5 * voxelSize);
    this.mesh.add(this.rightAileron);
    addVoxel(this.rightAileron, 0, 0, 0, 'control', 1, 0.2, 0.7);
    addVoxel(this.rightAileron, 0.5, 0, 0, 'control', 0.85, 0.2, 0.65);

    // --- TWIN VERTICAL TAILS (Tall, swept-back, angular) ---
    // Left tail
    this.leftRudder.position.set(-0.7 * voxelSize, 0.6 * voxelSize, 5 * voxelSize);
    this.leftRudder.rotation.z = -0.1;  // Slight outward cant
    this.mesh.add(this.leftRudder);
    addVoxel(this.leftRudder, 0, 0, 0, 'body', 0.3, 0.75, 1);
    addVoxel(this.leftRudder, -0.05, 0.6, 0.2, 'body', 0.28, 0.9, 0.95);
    addVoxel(this.leftRudder, -0.1, 1.3, 0.4, 'body', 0.25, 1.0, 0.9);
    addVoxel(this.leftRudder, -0.15, 1.9, 0.5, 'body', 0.22, 0.85, 0.8);
    addVoxel(this.leftRudder, -0.18, 2.4, 0.6, 'dark', 0.18, 0.55, 0.6);
    // Rudder control surface
    addVoxel(this.leftRudder, -0.08, 0.8, 0.9, 'control', 0.18, 0.75, 0.45);
    addVoxel(this.leftRudder, -0.12, 1.5, 1.1, 'control', 0.15, 0.7, 0.4);
    // Gold accent stripe
    addVoxel(this.leftRudder, -0.1, 1.7, 0.3, 'gold', 0.15, 0.45, 0.5);
    // Tail nav light
    addVoxel(this.leftRudder, -0.18, 2.3, 0.4, 'navGold', 0.12, 0.2, 0.25);
    
    // Right tail (mirrored)
    this.rightRudder.position.set(0.7 * voxelSize, 0.6 * voxelSize, 5 * voxelSize);
    this.rightRudder.rotation.z = 0.1;  // Slight outward cant
    this.mesh.add(this.rightRudder);
    addVoxel(this.rightRudder, 0, 0, 0, 'body', 0.3, 0.75, 1);
    addVoxel(this.rightRudder, 0.05, 0.6, 0.2, 'body', 0.28, 0.9, 0.95);
    addVoxel(this.rightRudder, 0.1, 1.3, 0.4, 'body', 0.25, 1.0, 0.9);
    addVoxel(this.rightRudder, 0.15, 1.9, 0.5, 'body', 0.22, 0.85, 0.8);
    addVoxel(this.rightRudder, 0.18, 2.4, 0.6, 'dark', 0.18, 0.55, 0.6);
    // Rudder control surface
    addVoxel(this.rightRudder, 0.08, 0.8, 0.9, 'control', 0.18, 0.75, 0.45);
    addVoxel(this.rightRudder, 0.12, 1.5, 1.1, 'control', 0.15, 0.7, 0.4);
    // Gold accent stripe
    addVoxel(this.rightRudder, 0.1, 1.7, 0.3, 'gold', 0.15, 0.45, 0.5);
    // Tail nav light
    addVoxel(this.rightRudder, 0.18, 2.3, 0.4, 'navGold', 0.12, 0.2, 0.25);

    // --- HORIZONTAL STABILIZERS (Angular elevators between tails) ---
    this.leftElevator.position.set(-1.2 * voxelSize, 0.3 * voxelSize, 6 * voxelSize);
    this.mesh.add(this.leftElevator);
    addVoxel(this.leftElevator, 0, 0, 0, 'control', 0.9, 0.18, 0.7);
    addVoxel(this.leftElevator, -0.5, 0, 0.15, 'control', 0.7, 0.15, 0.6);
    
    this.rightElevator.position.set(1.2 * voxelSize, 0.3 * voxelSize, 6 * voxelSize);
    this.mesh.add(this.rightElevator);
    addVoxel(this.rightElevator, 0, 0, 0, 'control', 0.9, 0.18, 0.7);
    addVoxel(this.rightElevator, 0.5, 0, 0.15, 'control', 0.7, 0.15, 0.6);

    // --- AFTERBURNER EXHAUST (Twin engines - golden-amber glow) ---
    const exhaustGeo = new THREE.BoxGeometry(voxelSize * 0.9, voxelSize * 0.9, voxelSize);
    exhaustGeo.translate(0, 0, voxelSize * 0.5);
    this.exhaustLeft = new THREE.Mesh(exhaustGeo, materials.glow);
    this.exhaustRight = new THREE.Mesh(exhaustGeo.clone(), materials.glow);

    this.exhaustLeft.position.set(-0.5 * voxelSize, 0, 7 * voxelSize);
    this.exhaustRight.position.set(0.5 * voxelSize, 0, 7 * voxelSize);

    this.mesh.add(this.exhaustLeft);
    this.mesh.add(this.exhaustRight);

    // Muzzle flash positions
    this.muzzleFlashLeft.position.set(0.35 * voxelSize, -0.25 * voxelSize, -7 * voxelSize);
    this.muzzleFlashRight.position.set(-0.35 * voxelSize, -0.25 * voxelSize, -7.2 * voxelSize);
    this.mesh.add(this.muzzleFlashLeft);
    this.mesh.add(this.muzzleFlashRight);

    // --- INSTANCING ---
    for (const key in instances) {
      const matrices = instances[key];
      if (matrices.length === 0) continue;

      const instMesh = new THREE.InstancedMesh(geoBox, materials[key], matrices.length);
      
      for (let i = 0; i < matrices.length; i++) {
        instMesh.setMatrixAt(i, matrices[i]);
      }
      
      instMesh.instanceMatrix.needsUpdate = true;
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;
      this.mesh.add(instMesh);
    }
  }

  private buildFlankerJet() {
    // --- MATERIALS (Russian Air Force inspired colors) ---
    const materials: Record<string, THREE.Material> = {
      // Main fuselage - light blue-grey (Russian camo)
      body: new THREE.MeshStandardMaterial({ color: 0x7a8b99, roughness: 0.4, metalness: 0.3 }),
      // Underside - lighter grey
      belly: new THREE.MeshStandardMaterial({ color: 0x9caebf, roughness: 0.5, metalness: 0.2 }),
      // Dark accents - intakes, engine nozzles
      dark: new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.7 }),
      // Medium grey for control surfaces
      control: new THREE.MeshStandardMaterial({ color: 0x5a6570, roughness: 0.5, metalness: 0.2 }),
      // Radome (nose cone)
      radome: new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.6 }),
      // Cockpit glass
      cockpit: new THREE.MeshStandardMaterial({ 
        color: 0x2266aa, 
        roughness: 0.0, 
        metalness: 0.95,
        emissive: 0x001133,
        emissiveIntensity: 0.6
      }),
      // Afterburner glow
      glow: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
      // Wing tips / navigation lights
      navRed: new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.5 }),
      navGreen: new THREE.MeshStandardMaterial({ color: 0x22ff22, emissive: 0x00ff00, emissiveIntensity: 0.5 })
    };

    const voxelSize = 0.30; // Slightly smaller voxels for more detail
    const geoBox = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

    // Buffers for InstancedMesh
    const instances: Record<string, THREE.Matrix4[]> = {};
    for (const k in materials) instances[k] = [];

    const addVoxel = (
      parent: THREE.Object3D, 
      x: number, y: number, z: number, 
      matName: string,
      scaleX = 1, scaleY = 1, scaleZ = 1
    ) => {
      if (parent !== this.mesh) {
        const mat = materials[matName];
        const mesh = new THREE.Mesh(geoBox, mat);
        mesh.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
        mesh.scale.set(scaleX, scaleY, scaleZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      }

      const matrix = new THREE.Matrix4();
      matrix.compose(
        new THREE.Vector3(x * voxelSize, y * voxelSize, z * voxelSize),
        new THREE.Quaternion(),
        new THREE.Vector3(scaleX, scaleY, scaleZ)
      );
      
      if (!instances[matName]) instances[matName] = [];
      instances[matName].push(matrix);
      return null;
    };

    // ============================================
    // SU-27 FLANKER GEOMETRY
    // ============================================

    // --- RADOME (Long pointed nose) ---
    addVoxel(this.mesh, 0, 0, -9, 'radome', 0.5, 0.5, 1);  // Tip
    addVoxel(this.mesh, 0, 0, -8, 'radome', 0.7, 0.6, 1);
    addVoxel(this.mesh, 0, 0, -7, 'radome', 0.9, 0.7, 1);
    addVoxel(this.mesh, 0, 0, -6, 'radome');
    
    // --- NOSE SECTION ---
    addVoxel(this.mesh, 0, 0, -5, 'body');
    addVoxel(this.mesh, 0, -0.5, -5, 'belly', 1, 0.5, 1);
    addVoxel(this.mesh, 0, 0, -4, 'body');
    addVoxel(this.mesh, 0, -1, -4, 'belly');
    
    // --- COCKPIT (Bubble canopy) ---
    addVoxel(this.mesh, 0, 0.8, -3, 'cockpit', 1.2, 0.8, 1);
    addVoxel(this.mesh, 0, 1, -2, 'cockpit', 1.3, 1, 1);
    addVoxel(this.mesh, 0, 0.9, -1, 'cockpit', 1.2, 0.9, 1);
    addVoxel(this.mesh, 0, 0.7, 0, 'cockpit', 1, 0.7, 0.8);  // Rear canopy frame
    
    // Cockpit frame/spine
    addVoxel(this.mesh, 0, 0, -3, 'body');
    addVoxel(this.mesh, 0, 0, -2, 'body');
    addVoxel(this.mesh, 0, -1, -3, 'belly');
    addVoxel(this.mesh, 0, -1, -2, 'belly');
    
    // --- FORWARD FUSELAGE with LERX (Leading Edge Root Extensions) ---
    // Central spine
    for (let z = -1; z <= 2; z++) {
      addVoxel(this.mesh, 0, 0.5, z, 'body');
      addVoxel(this.mesh, 0, 0, z, 'body');
      addVoxel(this.mesh, 0, -0.5, z, 'belly');
    }
    
    // LERX - the distinctive curved extensions that blend wing to fuselage
    // Left LERX
    addVoxel(this.mesh, -1, -0.3, -2, 'body', 1, 0.6, 1);
    addVoxel(this.mesh, -1.5, -0.2, -1, 'body', 1, 0.5, 1);
    addVoxel(this.mesh, -2, -0.1, 0, 'body', 1, 0.4, 1);
    addVoxel(this.mesh, -2, 0, 1, 'body', 1, 0.4, 1);
    // Right LERX
    addVoxel(this.mesh, 1, -0.3, -2, 'body', 1, 0.6, 1);
    addVoxel(this.mesh, 1.5, -0.2, -1, 'body', 1, 0.5, 1);
    addVoxel(this.mesh, 2, -0.1, 0, 'body', 1, 0.4, 1);
    addVoxel(this.mesh, 2, 0, 1, 'body', 1, 0.4, 1);
    
    // --- AIR INTAKES (Distinctive under-fuselage intakes) ---
    addVoxel(this.mesh, -1.2, -1, -1, 'dark', 0.8, 1, 1.5);
    addVoxel(this.mesh, 1.2, -1, -1, 'dark', 0.8, 1, 1.5);
    addVoxel(this.mesh, -1.2, -1, 0, 'dark', 0.8, 1, 1);
    addVoxel(this.mesh, 1.2, -1, 0, 'dark', 0.8, 1, 1);
    
    // --- MAIN FUSELAGE (Wide body between engines) ---
    for (let z = 2; z <= 5; z++) {
      // Central spine
      addVoxel(this.mesh, 0, 0.5, z, 'body');
      addVoxel(this.mesh, 0, 0, z, 'body');
      
      // Wide body
      addVoxel(this.mesh, -1, 0, z, 'body');
      addVoxel(this.mesh, 1, 0, z, 'body');
      
      // Engine nacelles (wide-spaced twin engines)
      addVoxel(this.mesh, -1.5, -0.5, z, 'body');
      addVoxel(this.mesh, 1.5, -0.5, z, 'body');
    }
    
    // --- ENGINE SECTION (Twin AL-31F turbofans) ---
    // Engine nacelles
    for (let z = 5; z <= 7; z++) {
      addVoxel(this.mesh, -1.5, -0.3, z, 'dark', 1.2, 1, 1);
      addVoxel(this.mesh, 1.5, -0.3, z, 'dark', 1.2, 1, 1);
    }
    
    // Engine nozzles (wider at exhaust)
    addVoxel(this.mesh, -1.5, -0.3, 8, 'dark', 1.4, 1.2, 0.8);
    addVoxel(this.mesh, 1.5, -0.3, 8, 'dark', 1.4, 1.2, 0.8);
    
    // Central tail boom between engines
    addVoxel(this.mesh, 0, 0, 6, 'body');
    addVoxel(this.mesh, 0, 0, 7, 'body', 0.8, 0.6, 1);
    
    // --- MAIN WINGS (Swept, high aspect ratio) ---
    // Inner wing sections
    for (let z = 1; z <= 4; z++) {
      addVoxel(this.mesh, -3, 0, z, 'body');
      addVoxel(this.mesh, 3, 0, z, 'body');
    }
    
    // Mid wing sections (swept back)
    addVoxel(this.mesh, -4, 0, 2, 'body');
    addVoxel(this.mesh, -4, 0, 3, 'body');
    addVoxel(this.mesh, -4, 0, 4, 'body');
    addVoxel(this.mesh, -4, 0, 5, 'body');
    addVoxel(this.mesh, 4, 0, 2, 'body');
    addVoxel(this.mesh, 4, 0, 3, 'body');
    addVoxel(this.mesh, 4, 0, 4, 'body');
    addVoxel(this.mesh, 4, 0, 5, 'body');
    
    // Outer wing sections
    addVoxel(this.mesh, -5, 0, 3, 'body');
    addVoxel(this.mesh, -5, 0, 4, 'body');
    addVoxel(this.mesh, -5, 0, 5, 'body');
    addVoxel(this.mesh, 5, 0, 3, 'body');
    addVoxel(this.mesh, 5, 0, 4, 'body');
    addVoxel(this.mesh, 5, 0, 5, 'body');
    
    // Wing tips with nav lights
    addVoxel(this.mesh, -6, 0, 4, 'body');
    addVoxel(this.mesh, -6, 0, 5, 'body');
    addVoxel(this.mesh, -6.5, 0, 5, 'navRed', 0.5, 0.3, 0.5);  // Left red nav light
    addVoxel(this.mesh, 6, 0, 4, 'body');
    addVoxel(this.mesh, 6, 0, 5, 'body');
    addVoxel(this.mesh, 6.5, 0, 5, 'navGreen', 0.5, 0.3, 0.5);  // Right green nav light

    // --- AILERONS (Trailing edge of wings) ---
    this.leftAileron.position.set(-5 * voxelSize, 0, 5.5 * voxelSize);
    this.mesh.add(this.leftAileron);
    addVoxel(this.leftAileron, 0, 0, 0, 'control');
    addVoxel(this.leftAileron, 1, 0, 0, 'control');
    addVoxel(this.leftAileron, -0.5, 0, 0.3, 'control', 0.8, 1, 0.8);

    this.rightAileron.position.set(5 * voxelSize, 0, 5.5 * voxelSize);
    this.mesh.add(this.rightAileron);
    addVoxel(this.rightAileron, 0, 0, 0, 'control');
    addVoxel(this.rightAileron, -1, 0, 0, 'control');
    addVoxel(this.rightAileron, 0.5, 0, 0.3, 'control', 0.8, 1, 0.8);

    // --- HORIZONTAL STABILIZERS / TAILERONS ---
    // These are all-moving on the real Su-27
    this.leftElevator.position.set(-2.5 * voxelSize, 0, 7.5 * voxelSize);
    this.mesh.add(this.leftElevator);
    addVoxel(this.leftElevator, 0, 0, 0, 'control');
    addVoxel(this.leftElevator, -1, 0, 0.3, 'control');
    addVoxel(this.leftElevator, -1.5, 0, 0.5, 'control', 0.8, 1, 0.8);
    addVoxel(this.leftElevator, 0.5, 0, -0.3, 'control', 0.8, 1, 0.8);
    
    this.rightElevator.position.set(2.5 * voxelSize, 0, 7.5 * voxelSize);
    this.mesh.add(this.rightElevator);
    addVoxel(this.rightElevator, 0, 0, 0, 'control');
    addVoxel(this.rightElevator, 1, 0, 0.3, 'control');
    addVoxel(this.rightElevator, 1.5, 0, 0.5, 'control', 0.8, 1, 0.8);
    addVoxel(this.rightElevator, -0.5, 0, -0.3, 'control', 0.8, 1, 0.8);

    // --- TWIN VERTICAL TAILS (Angled outward - signature Flanker look) ---
    // Left vertical tail (angled left)
    this.leftRudder.position.set(-1.5 * voxelSize, 0.8 * voxelSize, 6 * voxelSize);
    this.leftRudder.rotation.z = 0.25; // Angle outward ~15 degrees
    this.mesh.add(this.leftRudder);
    addVoxel(this.leftRudder, 0, 0, 0, 'body');
    addVoxel(this.leftRudder, 0, 1, 0, 'body');
    addVoxel(this.leftRudder, 0, 1, 0.5, 'control');
    addVoxel(this.leftRudder, 0, 2, 0.2, 'body');
    addVoxel(this.leftRudder, 0, 2, 0.7, 'control');
    addVoxel(this.leftRudder, 0, 2.5, 0.4, 'body', 0.8, 0.6, 0.8);
    addVoxel(this.leftRudder, 0, 2.5, 0.9, 'dark', 0.6, 0.5, 0.5);  // Top cap
    
    // Right vertical tail (angled right)
    this.rightRudder.position.set(1.5 * voxelSize, 0.8 * voxelSize, 6 * voxelSize);
    this.rightRudder.rotation.z = -0.25; // Angle outward ~15 degrees
    this.mesh.add(this.rightRudder);
    addVoxel(this.rightRudder, 0, 0, 0, 'body');
    addVoxel(this.rightRudder, 0, 1, 0, 'body');
    addVoxel(this.rightRudder, 0, 1, 0.5, 'control');
    addVoxel(this.rightRudder, 0, 2, 0.2, 'body');
    addVoxel(this.rightRudder, 0, 2, 0.7, 'control');
    addVoxel(this.rightRudder, 0, 2.5, 0.4, 'body', 0.8, 0.6, 0.8);
    addVoxel(this.rightRudder, 0, 2.5, 0.9, 'dark', 0.6, 0.5, 0.5);  // Top cap

    // --- TAIL STINGERS (Small ventral fins under engines) ---
    addVoxel(this.mesh, -1.5, -1, 7, 'control', 0.3, 0.8, 1);
    addVoxel(this.mesh, 1.5, -1, 7, 'control', 0.3, 0.8, 1);

    // --- AFTERBURNER EXHAUST (Dynamic glow) ---
    const exhaustGeo = new THREE.BoxGeometry(voxelSize * 0.9, voxelSize * 0.9, voxelSize);
    exhaustGeo.translate(0, 0, voxelSize * 0.5);
    this.exhaustLeft = new THREE.Mesh(exhaustGeo, materials.glow);
    this.exhaustRight = new THREE.Mesh(exhaustGeo, materials.glow);

    this.exhaustLeft.position.set(-1.5 * voxelSize, -0.3 * voxelSize, 8.2 * voxelSize);
    this.exhaustRight.position.set(1.5 * voxelSize, -0.3 * voxelSize, 8.2 * voxelSize);

    this.mesh.add(this.exhaustLeft);
    this.mesh.add(this.exhaustRight);

    // --- GUN PORT (GSh-30-1 cannon on starboard side) ---
    addVoxel(this.mesh, 0.8, -0.8, -4, 'dark', 0.3, 0.3, 1.5);
    
    // Muzzle flash positions
    this.muzzleFlashLeft.position.set(-1.5 * voxelSize, 0, -3 * voxelSize);
    this.muzzleFlashRight.position.set(0.8 * voxelSize, -0.8 * voxelSize, -4.5 * voxelSize);
    this.mesh.add(this.muzzleFlashLeft);
    this.mesh.add(this.muzzleFlashRight);

    // --- INSTANCING for main mesh voxels ---
    for (const key in instances) {
      const matrices = instances[key];
      if (matrices.length === 0) continue;

      const instMesh = new THREE.InstancedMesh(geoBox, materials[key], matrices.length);
      
      for (let i = 0; i < matrices.length; i++) {
        instMesh.setMatrixAt(i, matrices[i]);
      }
      
      instMesh.instanceMatrix.needsUpdate = true;
      instMesh.castShadow = true;
      instMesh.receiveShadow = true;
      this.mesh.add(instMesh);
    }
  }

  /**
   * Update control surfaces and afterburner effects
   */
  public update(dt: number, input: { pitchUp: boolean; pitchDown: boolean; rollLeft: boolean; rollRight: boolean; yawLeft: boolean; yawRight: boolean }, throttle: number) {
    // --- Afterburner Exhaust Animation ---
    const baseScale = 0.8;
    const boostScale = 4.5;
    
    let effectIntensity = 0;
    if (throttle > 0.5) {
      effectIntensity = (throttle - 0.5) * 2.0;
    }

    const targetScale = THREE.MathUtils.lerp(baseScale, boostScale, effectIntensity);
    const flicker = 0.85 + Math.random() * 0.3;
    const finalScale = targetScale * flicker;
    
    this.exhaustLeft.scale.z = finalScale;
    this.exhaustRight.scale.z = finalScale;
    
    // Color tinting - Aircraft-specific afterburner colors
    const mat = this.exhaustLeft.material as THREE.MeshBasicMaterial;
    const matRight = this.exhaustRight.material as THREE.MeshBasicMaterial;
    
    // Calculate intensity-based color variation using the aircraft's base afterburner color
    const baseColor = new THREE.Color(this.afterburnerColor);
    const hotColor = new THREE.Color(0xffffff); // White hot at max
    
    if (effectIntensity > 0.8) {
      // At max throttle, blend toward white-hot
      mat.color.copy(baseColor).lerp(hotColor, 0.5);
    } else if (effectIntensity > 0.3) {
      // At medium throttle, use base color
      mat.color.copy(baseColor);
    } else {
      // At low throttle, darken the base color slightly
      mat.color.copy(baseColor).multiplyScalar(0.7);
    }
    matRight.color.copy(mat.color);

    this.exhaustLeft.visible = true;
    this.exhaustRight.visible = true;

    // --- Control Surface Animation ---
    const maxRot = Math.PI / 5;  // Slightly more deflection for dramatic effect
    const lerpSpeed = 12 * dt;

    // Pitch -> Tailerons (Horizontal stabilizers)
    // Su-27 tailerons move together for pitch
    let targetElevator = 0;
    if (input.pitchUp) targetElevator = -maxRot;
    if (input.pitchDown) targetElevator = maxRot;
    
    this.leftElevator.rotation.x = THREE.MathUtils.lerp(this.leftElevator.rotation.x, targetElevator, lerpSpeed);
    this.rightElevator.rotation.x = THREE.MathUtils.lerp(this.rightElevator.rotation.x, targetElevator, lerpSpeed);

    // Roll -> Ailerons + Differential Tailerons
    // Su-27 uses differential taileron movement for roll assist
    let targetAileronL = 0;
    let targetAileronR = 0;
    let differentialTaileron = 0;
    
    if (input.rollLeft) {
      targetAileronL = -maxRot;
      targetAileronR = maxRot;
      differentialTaileron = maxRot * 0.4;  // Tailerons assist roll
    }
    if (input.rollRight) {
      targetAileronL = maxRot;
      targetAileronR = -maxRot;
      differentialTaileron = -maxRot * 0.4;
    }

    this.leftAileron.rotation.x = THREE.MathUtils.lerp(this.leftAileron.rotation.x, targetAileronL, lerpSpeed);
    this.rightAileron.rotation.x = THREE.MathUtils.lerp(this.rightAileron.rotation.x, targetAileronR, lerpSpeed);
    
    // Apply differential to tailerons
    this.leftElevator.rotation.x = THREE.MathUtils.lerp(
      this.leftElevator.rotation.x, 
      targetElevator - differentialTaileron, 
      lerpSpeed
    );
    this.rightElevator.rotation.x = THREE.MathUtils.lerp(
      this.rightElevator.rotation.x, 
      targetElevator + differentialTaileron, 
      lerpSpeed
    );

    // Yaw -> Twin Rudders (both move together)
    let targetRudder = 0;
    if (input.yawLeft) targetRudder = maxRot * 0.7;
    if (input.yawRight) targetRudder = -maxRot * 0.7;
    
    this.leftRudder.rotation.y = THREE.MathUtils.lerp(this.leftRudder.rotation.y, targetRudder, lerpSpeed);
    this.rightRudder.rotation.y = THREE.MathUtils.lerp(this.rightRudder.rotation.y, targetRudder, lerpSpeed);
  }

  public dispose() {
    this.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
