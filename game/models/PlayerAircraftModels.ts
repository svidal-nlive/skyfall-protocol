/**
 * PlayerAircraftModels - Hangar preview models for each player aircraft
 * 
 * All aircraft currently use the same Su-27 Flanker voxel design (matching the gameplay model).
 * Each function is an independent copy ready for customization.
 */

import * as THREE from 'three';
import { PlayerAircraftConfig } from '../data/playerAircraftConfigs';

/**
 * Create a mesh for a player aircraft based on its configuration
 */
export function createPlayerAircraftMesh(config: PlayerAircraftConfig): THREE.Group {
  switch (config.id) {
    case 'falcon':
      return createFalconMesh(config);
    case 'switchblade':
      return createSwitchbladeMesh(config);
    case 'ironclad':
      return createIroncladMesh(config);
    case 'wraith':
      return createWraithMesh(config);
    case 'archon':
      return createArchonMesh(config);
    default:
      return createFalconMesh(config);
  }
}

/**
 * Build a Su-27 Flanker style voxel jet mesh
 * This is a static version of the gameplay PlayerJet model for hangar display
 */
function buildFlankerVoxelMesh(config: PlayerAircraftConfig): THREE.Group {
  const mesh = new THREE.Group();

  // --- MATERIALS (Use config colors) ---
  const materials: Record<string, THREE.Material> = {
    // Main fuselage
    body: new THREE.MeshStandardMaterial({ 
      color: config.color, 
      roughness: 0.4, 
      metalness: 0.3,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.1
    }),
    // Underside
    belly: new THREE.MeshStandardMaterial({ 
      color: config.accentColor, 
      roughness: 0.5, 
      metalness: 0.2 
    }),
    // Dark accents
    dark: new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.7 }),
    // Control surfaces
    control: new THREE.MeshStandardMaterial({ color: 0x5a6570, roughness: 0.5, metalness: 0.2 }),
    // Radome
    radome: new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.6 }),
    // Cockpit
    cockpit: new THREE.MeshStandardMaterial({ 
      color: 0x2266aa, 
      roughness: 0.0, 
      metalness: 0.95,
      emissive: 0x001133,
      emissiveIntensity: 0.6
    }),
    // Afterburner glow
    glow: new THREE.MeshBasicMaterial({ color: config.emissiveColor }),
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
    instances[matName].push(matrix);
  };

  // ============================================
  // SU-27 FLANKER GEOMETRY
  // ============================================

  // --- RADOME (Long pointed nose) ---
  addVoxel(0, 0, -9, 'radome', 0.5, 0.5, 1);
  addVoxel(0, 0, -8, 'radome', 0.7, 0.6, 1);
  addVoxel(0, 0, -7, 'radome', 0.9, 0.7, 1);
  addVoxel(0, 0, -6, 'radome');
  
  // --- NOSE SECTION ---
  addVoxel(0, 0, -5, 'body');
  addVoxel(0, -0.5, -5, 'belly', 1, 0.5, 1);
  addVoxel(0, 0, -4, 'body');
  addVoxel(0, -1, -4, 'belly');
  
  // --- COCKPIT (Bubble canopy) ---
  addVoxel(0, 0.8, -3, 'cockpit', 1.2, 0.8, 1);
  addVoxel(0, 1, -2, 'cockpit', 1.3, 1, 1);
  addVoxel(0, 0.9, -1, 'cockpit', 1.2, 0.9, 1);
  addVoxel(0, 0.7, 0, 'cockpit', 1, 0.7, 0.8);
  
  // Cockpit frame/spine
  addVoxel(0, 0, -3, 'body');
  addVoxel(0, 0, -2, 'body');
  addVoxel(0, -1, -3, 'belly');
  addVoxel(0, -1, -2, 'belly');
  
  // --- FORWARD FUSELAGE with LERX ---
  for (let z = -1; z <= 2; z++) {
    addVoxel(0, 0.5, z, 'body');
    addVoxel(0, 0, z, 'body');
    addVoxel(0, -0.5, z, 'belly');
  }
  
  // LERX - Left
  addVoxel(-1, -0.3, -2, 'body', 1, 0.6, 1);
  addVoxel(-1.5, -0.2, -1, 'body', 1, 0.5, 1);
  addVoxel(-2, -0.1, 0, 'body', 1, 0.4, 1);
  addVoxel(-2, 0, 1, 'body', 1, 0.4, 1);
  // LERX - Right
  addVoxel(1, -0.3, -2, 'body', 1, 0.6, 1);
  addVoxel(1.5, -0.2, -1, 'body', 1, 0.5, 1);
  addVoxel(2, -0.1, 0, 'body', 1, 0.4, 1);
  addVoxel(2, 0, 1, 'body', 1, 0.4, 1);
  
  // --- AIR INTAKES ---
  addVoxel(-1.2, -1, -1, 'dark', 0.8, 1, 1.5);
  addVoxel(1.2, -1, -1, 'dark', 0.8, 1, 1.5);
  addVoxel(-1.2, -1, 0, 'dark', 0.8, 1, 1);
  addVoxel(1.2, -1, 0, 'dark', 0.8, 1, 1);
  
  // --- MAIN FUSELAGE ---
  for (let z = 2; z <= 5; z++) {
    addVoxel(0, 0.5, z, 'body');
    addVoxel(0, 0, z, 'body');
    addVoxel(-1, 0, z, 'body');
    addVoxel(1, 0, z, 'body');
    addVoxel(-1.5, -0.5, z, 'body');
    addVoxel(1.5, -0.5, z, 'body');
  }
  
  // --- ENGINE SECTION ---
  for (let z = 5; z <= 7; z++) {
    addVoxel(-1.5, -0.3, z, 'dark', 1.2, 1, 1);
    addVoxel(1.5, -0.3, z, 'dark', 1.2, 1, 1);
  }
  
  // Engine nozzles
  addVoxel(-1.5, -0.3, 8, 'dark', 1.4, 1.2, 0.8);
  addVoxel(1.5, -0.3, 8, 'dark', 1.4, 1.2, 0.8);
  
  // Central tail boom
  addVoxel(0, 0, 6, 'body');
  addVoxel(0, 0, 7, 'body', 0.8, 0.6, 1);
  
  // --- MAIN WINGS ---
  for (let z = 1; z <= 4; z++) {
    addVoxel(-3, 0, z, 'body');
    addVoxel(3, 0, z, 'body');
  }
  
  // Mid wing
  addVoxel(-4, 0, 2, 'body');
  addVoxel(-4, 0, 3, 'body');
  addVoxel(-4, 0, 4, 'body');
  addVoxel(-4, 0, 5, 'body');
  addVoxel(4, 0, 2, 'body');
  addVoxel(4, 0, 3, 'body');
  addVoxel(4, 0, 4, 'body');
  addVoxel(4, 0, 5, 'body');
  
  // Outer wing
  addVoxel(-5, 0, 3, 'body');
  addVoxel(-5, 0, 4, 'body');
  addVoxel(-5, 0, 5, 'body');
  addVoxel(5, 0, 3, 'body');
  addVoxel(5, 0, 4, 'body');
  addVoxel(5, 0, 5, 'body');
  
  // Wing tips with nav lights
  addVoxel(-6, 0, 4, 'body');
  addVoxel(-6, 0, 5, 'body');
  addVoxel(-6.5, 0, 5, 'navRed', 0.5, 0.3, 0.5);
  addVoxel(6, 0, 4, 'body');
  addVoxel(6, 0, 5, 'body');
  addVoxel(6.5, 0, 5, 'navGreen', 0.5, 0.3, 0.5);

  // --- AILERONS ---
  addVoxel(-5, 0, 5.5, 'control');
  addVoxel(-4, 0, 5.5, 'control');
  addVoxel(-5.5, 0, 5.8, 'control', 0.8, 1, 0.8);
  addVoxel(5, 0, 5.5, 'control');
  addVoxel(4, 0, 5.5, 'control');
  addVoxel(5.5, 0, 5.8, 'control', 0.8, 1, 0.8);

  // --- HORIZONTAL STABILIZERS ---
  addVoxel(-2.5, 0, 7.5, 'control');
  addVoxel(-3.5, 0, 7.8, 'control');
  addVoxel(-4, 0, 8, 'control', 0.8, 1, 0.8);
  addVoxel(-2, 0, 7.2, 'control', 0.8, 1, 0.8);
  addVoxel(2.5, 0, 7.5, 'control');
  addVoxel(3.5, 0, 7.8, 'control');
  addVoxel(4, 0, 8, 'control', 0.8, 1, 0.8);
  addVoxel(2, 0, 7.2, 'control', 0.8, 1, 0.8);

  // --- TWIN VERTICAL TAILS ---
  // Left tail
  addVoxel(-1.5, 0.8, 6, 'body');
  addVoxel(-1.5, 1.8, 6, 'body');
  addVoxel(-1.5, 1.8, 6.5, 'control');
  addVoxel(-1.5, 2.8, 6.2, 'body');
  addVoxel(-1.5, 2.8, 6.7, 'control');
  addVoxel(-1.5, 3.3, 6.4, 'body', 0.8, 0.6, 0.8);
  addVoxel(-1.5, 3.3, 6.9, 'dark', 0.6, 0.5, 0.5);
  // Right tail
  addVoxel(1.5, 0.8, 6, 'body');
  addVoxel(1.5, 1.8, 6, 'body');
  addVoxel(1.5, 1.8, 6.5, 'control');
  addVoxel(1.5, 2.8, 6.2, 'body');
  addVoxel(1.5, 2.8, 6.7, 'control');
  addVoxel(1.5, 3.3, 6.4, 'body', 0.8, 0.6, 0.8);
  addVoxel(1.5, 3.3, 6.9, 'dark', 0.6, 0.5, 0.5);

  // --- TAIL STINGERS ---
  addVoxel(-1.5, -1, 7, 'control', 0.3, 0.8, 1);
  addVoxel(1.5, -1, 7, 'control', 0.3, 0.8, 1);

  // --- AFTERBURNER GLOW ---
  addVoxel(-1.5, -0.3, 8.5, 'glow', 0.9, 0.9, 1.5);
  addVoxel(1.5, -0.3, 8.5, 'glow', 0.9, 0.9, 1.5);

  // --- GUN PORT ---
  addVoxel(0.8, -0.8, -4, 'dark', 0.3, 0.3, 1.5);

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
    mesh.add(instMesh);
  }

  return mesh;
}

/**
 * FALCON - F-22 Raptor Inspired Stealth Fighter
 * 
 * Design characteristics:
 * - Sleek, diamond-shaped fuselage (aerodynamic, pointed)
 * - Single vertical tail fin (not twin)
 * - Angular edges, stealthy design
 * - Compact, proportional wings with squared edges
 * - Narrow, elongated cockpit
 * - Low-observable profile with sharp angles
 */
function createFalconMesh(config: PlayerAircraftConfig): THREE.Group {
  const mesh = new THREE.Group();

  // --- F-22 MATERIALS (Stealth fighter colors) ---
  const materials: Record<string, THREE.Material> = {
    // Main fuselage - blue-gray stealth coating
    body: new THREE.MeshStandardMaterial({ 
      color: config.color, 
      roughness: 0.3, 
      metalness: 0.4,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.05
    }),
    // Underside - darker gray
    belly: new THREE.MeshStandardMaterial({ 
      color: config.accentColor, 
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
    glow: new THREE.MeshBasicMaterial({ color: 0x66ccff }),
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
    instances[matName].push(matrix);
  };

  // ============================================
  // F-22 RAPTOR GEOMETRY
  // ============================================

  // --- RADOME (Sharp pointed nose - needle-like) ---
  addVoxel(0, 0, -10, 'radome', 0.3, 0.3, 1);   // Very sharp tip
  addVoxel(0, 0, -9, 'radome', 0.5, 0.4, 1);
  addVoxel(0, 0, -8, 'radome', 0.6, 0.5, 1);
  addVoxel(0, 0, -7, 'radome', 0.8, 0.6, 1);
  addVoxel(0, 0, -6, 'radome', 0.9, 0.7, 1);
  
  // --- NOSE SECTION (Angular, diamond-shaped profile) ---
  addVoxel(0, 0, -5, 'body');
  addVoxel(0, -0.4, -5, 'belly', 0.9, 0.4, 1);
  addVoxel(0, 0, -4, 'body', 1.1, 0.8, 1);
  addVoxel(0, -0.5, -4, 'belly', 0.9, 0.5, 1);
  
  // Angular edges on nose sides
  addVoxel(-0.6, -0.2, -5, 'body', 0.5, 0.6, 1);
  addVoxel(0.6, -0.2, -5, 'body', 0.5, 0.6, 1);
  
  // --- COCKPIT (Narrow, integrated canopy - F-22 style) ---
  addVoxel(0, 0.5, -3, 'cockpit', 0.9, 0.6, 1);  // Narrower than base
  addVoxel(0, 0.7, -2, 'cockpit', 1.0, 0.7, 1);
  addVoxel(0, 0.6, -1, 'cockpit', 0.9, 0.6, 1);
  addVoxel(0, 0.4, 0, 'cockpit', 0.7, 0.5, 0.8);  // Rear canopy
  
  // Cockpit frame/spine (angular)
  addVoxel(0, 0, -3, 'body', 1.1, 0.7, 1);
  addVoxel(0, 0, -2, 'body', 1.2, 0.8, 1);
  addVoxel(0, -0.7, -3, 'belly');
  addVoxel(0, -0.7, -2, 'belly');
  
  // --- FORWARD FUSELAGE (Diamond cross-section, angular) ---
  for (let z = -1; z <= 2; z++) {
    addVoxel(0, 0.3, z, 'body', 1.1, 0.6, 1);
    addVoxel(0, 0, z, 'body', 1.3, 0.7, 1);
    addVoxel(0, -0.4, z, 'belly', 1.1, 0.5, 1);
    
    // Angular side panels (stealth facets)
    addVoxel(-0.9, -0.1, z, 'body', 0.4, 0.6, 1);
    addVoxel(0.9, -0.1, z, 'body', 0.4, 0.6, 1);
  }
  
  // --- REDUCED LERX (F-22 has minimal leading edge extensions) ---
  // Much smaller than Su-27 style
  addVoxel(-1.2, -0.2, 0, 'body', 0.6, 0.3, 1);
  addVoxel(-1.5, -0.1, 1, 'body', 0.5, 0.3, 1);
  addVoxel(1.2, -0.2, 0, 'body', 0.6, 0.3, 1);
  addVoxel(1.5, -0.1, 1, 'body', 0.5, 0.3, 1);
  
  // --- AIR INTAKES (Integrated, stealthy - side-mounted) ---
  addVoxel(-1.3, -0.6, -1, 'dark', 0.6, 0.7, 1.2);
  addVoxel(1.3, -0.6, -1, 'dark', 0.6, 0.7, 1.2);
  addVoxel(-1.3, -0.6, 0, 'dark', 0.6, 0.6, 1);
  addVoxel(1.3, -0.6, 0, 'dark', 0.6, 0.6, 1);
  
  // --- MAIN FUSELAGE (Wide, flat, diamond-shaped) ---
  for (let z = 2; z <= 5; z++) {
    // Central diamond body
    addVoxel(0, 0.3, z, 'body', 1.3, 0.5, 1);
    addVoxel(0, 0, z, 'body', 1.5, 0.7, 1);
    addVoxel(0, -0.4, z, 'belly', 1.3, 0.5, 1);
    
    // Side body panels (angular facets)
    addVoxel(-1.2, 0, z, 'body', 0.5, 0.6, 1);
    addVoxel(1.2, 0, z, 'body', 0.5, 0.6, 1);
  }
  
  // --- ENGINE SECTION (Single integrated engine bay appearance) ---
  for (let z = 5; z <= 7; z++) {
    // Twin engines but closer together (F-22 style)
    addVoxel(-0.9, -0.2, z, 'dark', 1.0, 0.9, 1);
    addVoxel(0.9, -0.2, z, 'dark', 1.0, 0.9, 1);
    addVoxel(0, 0, z, 'body', 0.6, 0.5, 1);  // Central spine
  }
  
  // Engine nozzles (rectangular, stealthy shape)
  addVoxel(-0.9, -0.2, 8, 'dark', 1.1, 1.0, 0.8);
  addVoxel(0.9, -0.2, 8, 'dark', 1.1, 1.0, 0.8);
  
  // --- MAIN WINGS (Trapezoidal, angular edges - F-22 style) ---
  // Inner wing sections
  for (let z = 1; z <= 4; z++) {
    addVoxel(-2.5, 0, z, 'body', 1, 0.3, 1);
    addVoxel(2.5, 0, z, 'body', 1, 0.3, 1);
  }
  
  // Mid wing sections (less sweep than Su-27)
  addVoxel(-3.5, 0, 2, 'body', 1, 0.3, 1);
  addVoxel(-3.5, 0, 3, 'body', 1, 0.3, 1);
  addVoxel(-3.5, 0, 4, 'body', 1, 0.3, 1);
  addVoxel(3.5, 0, 2, 'body', 1, 0.3, 1);
  addVoxel(3.5, 0, 3, 'body', 1, 0.3, 1);
  addVoxel(3.5, 0, 4, 'body', 1, 0.3, 1);
  
  // Outer wing sections (squared tips)
  addVoxel(-4.5, 0, 3, 'body', 1, 0.3, 1);
  addVoxel(-4.5, 0, 4, 'body', 1, 0.3, 1);
  addVoxel(4.5, 0, 3, 'body', 1, 0.3, 1);
  addVoxel(4.5, 0, 4, 'body', 1, 0.3, 1);
  
  // Wing tips with nav lights (squared, not swept)
  addVoxel(-5.2, 0, 3.5, 'body', 0.8, 0.25, 1);
  addVoxel(-5.5, 0, 3.5, 'navRed', 0.4, 0.2, 0.4);
  addVoxel(5.2, 0, 3.5, 'body', 0.8, 0.25, 1);
  addVoxel(5.5, 0, 3.5, 'navGreen', 0.4, 0.2, 0.4);

  // --- AILERONS (Trailing edge - angular) ---
  addVoxel(-4.5, 0, 4.8, 'control', 1, 0.25, 0.8);
  addVoxel(-3.5, 0, 4.8, 'control', 1, 0.25, 0.8);
  addVoxel(4.5, 0, 4.8, 'control', 1, 0.25, 0.8);
  addVoxel(3.5, 0, 4.8, 'control', 1, 0.25, 0.8);

  // --- HORIZONTAL STABILIZERS (All-moving, angular) ---
  addVoxel(-2.2, 0, 7, 'control', 1, 0.25, 1);
  addVoxel(-3, 0, 7.3, 'control', 1, 0.25, 0.8);
  addVoxel(-3.5, 0, 7.5, 'control', 0.8, 0.2, 0.7);
  addVoxel(2.2, 0, 7, 'control', 1, 0.25, 1);
  addVoxel(3, 0, 7.3, 'control', 1, 0.25, 0.8);
  addVoxel(3.5, 0, 7.5, 'control', 0.8, 0.2, 0.7);

  // --- SINGLE VERTICAL TAIL (F-22 distinctive feature - twin canted tails look like one from distance) ---
  // F-22 actually has twin canted tails but they're much closer and angular
  // For gameplay distinction, we use a single central-ish design
  addVoxel(0, 0.6, 6, 'body', 0.4, 0.8, 1);
  addVoxel(0, 1.4, 6.2, 'body', 0.35, 1, 1);
  addVoxel(0, 2.2, 6.4, 'body', 0.3, 0.9, 0.9);
  addVoxel(0, 2.8, 6.5, 'body', 0.25, 0.7, 0.8);
  addVoxel(0, 3.2, 6.6, 'dark', 0.2, 0.5, 0.6);  // Tip
  
  // Rudder section
  addVoxel(0, 1.4, 6.8, 'control', 0.25, 0.8, 0.6);
  addVoxel(0, 2.2, 7.0, 'control', 0.2, 0.7, 0.5);

  // --- AFTERBURNER GLOW (Blue-white for F-22) ---
  addVoxel(-0.9, -0.2, 8.5, 'glow', 0.8, 0.8, 1.5);
  addVoxel(0.9, -0.2, 8.5, 'glow', 0.8, 0.8, 1.5);

  // --- INTERNAL WEAPONS BAY DOORS (F-22 feature - stealth) ---
  addVoxel(0, -0.7, 1, 'dark', 1.5, 0.15, 2);  // Main bay
  addVoxel(-1.8, -0.5, 2, 'dark', 0.4, 0.15, 1.5);  // Side bay left
  addVoxel(1.8, -0.5, 2, 'dark', 0.4, 0.15, 1.5);   // Side bay right

  // --- GUN PORT (Internal M61 cannon) ---
  addVoxel(0.8, -0.5, -4, 'dark', 0.25, 0.25, 1.2);

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
    mesh.add(instMesh);
  }

  return mesh;
}

/**
 * SWITCHBLADE - X-47 Agile Strike Fighter (F-16/FA-50 Inspired)
 * 
 * Design characteristics:
 * - Small, compact fuselage (70% of base size)
 * - Single vertical tail fin (upright, proportional)
 * - Short, stubby wings (40% shorter, thicker)
 * - Prominent angular air intakes on sides
 * - Sleek, dart-like profile with pointed nose
 * - Aggressive, twitchy appearance
 * - Single engine look (narrow profile)
 * - Crimson red accents
 */
function createSwitchbladeMesh(config: PlayerAircraftConfig): THREE.Group {
  const mesh = new THREE.Group();

  // --- SWITCHBLADE MATERIALS (Aggressive black/red colors) ---
  const materials: Record<string, THREE.Material> = {
    // Main fuselage - matte black
    body: new THREE.MeshStandardMaterial({ 
      color: config.color, 
      roughness: 0.7, 
      metalness: 0.2,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.03
    }),
    // Underside - dark gray
    belly: new THREE.MeshStandardMaterial({ 
      color: config.accentColor, 
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
      emissiveIntensity: 0.2
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

  const voxelSize = 0.30;
  const geoBox = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

  // Buffers for InstancedMesh
  const instances: Record<string, THREE.Matrix4[]> = {};
  for (const k in materials) instances[k] = [];

  const addVoxel = (
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
    instances[matName].push(matrix);
  };

  // ============================================
  // X-47 SWITCHBLADE GEOMETRY (Compact, Dart-like)
  // Scale: 70% of base model - compact and aggressive
  // ============================================

  // --- NOSE (Sharp, pointed, dart-like) ---
  addVoxel(0, 0, -7, 'body', 0.35, 0.35, 1);   // Sharp tip
  addVoxel(0, 0, -6, 'body', 0.5, 0.45, 1);
  addVoxel(0, 0, -5, 'body', 0.7, 0.55, 1);
  addVoxel(0, -0.2, -5, 'belly', 0.6, 0.35, 1);
  addVoxel(0, 0, -4, 'body', 0.85, 0.65, 1);
  addVoxel(0, -0.3, -4, 'belly', 0.7, 0.4, 1);
  
  // Red accent stripe on nose
  addVoxel(0, 0.3, -5, 'accent', 0.3, 0.15, 0.8);
  
  // --- COCKPIT (Compact, aggressive, red-tinted) ---
  addVoxel(0, 0.5, -3, 'cockpit', 0.8, 0.55, 1);
  addVoxel(0, 0.65, -2, 'cockpit', 0.9, 0.6, 1);
  addVoxel(0, 0.55, -1, 'cockpit', 0.8, 0.5, 1);
  addVoxel(0, 0.4, 0, 'cockpit', 0.6, 0.4, 0.7);
  
  // Cockpit frame
  addVoxel(0, 0, -3, 'body', 0.95, 0.6, 1);
  addVoxel(0, 0, -2, 'body', 1.0, 0.65, 1);
  addVoxel(0, -0.4, -3, 'belly', 0.85, 0.4, 1);
  addVoxel(0, -0.4, -2, 'belly', 0.9, 0.4, 1);
  
  // --- PROMINENT AIR INTAKES (F-16 style, angular) ---
  addVoxel(-0.7, -0.3, -2, 'dark', 0.5, 0.6, 1.3);
  addVoxel(0.7, -0.3, -2, 'dark', 0.5, 0.6, 1.3);
  addVoxel(-0.7, -0.3, -1, 'dark', 0.55, 0.65, 1);
  addVoxel(0.7, -0.3, -1, 'dark', 0.55, 0.65, 1);
  // Red intake highlights
  addVoxel(-0.9, -0.3, -1.5, 'accent', 0.15, 0.5, 1);
  addVoxel(0.9, -0.3, -1.5, 'accent', 0.15, 0.5, 1);
  
  // --- FORWARD FUSELAGE (Narrow, single-engine profile) ---
  for (let z = -1; z <= 2; z++) {
    addVoxel(0, 0.2, z, 'body', 0.9, 0.5, 1);
    addVoxel(0, 0, z, 'body', 1.0, 0.6, 1);
    addVoxel(0, -0.35, z, 'belly', 0.85, 0.45, 1);
  }
  
  // --- MAIN FUSELAGE (Compact, narrow) ---
  for (let z = 2; z <= 5; z++) {
    addVoxel(0, 0.2, z, 'body', 0.85, 0.45, 1);
    addVoxel(0, 0, z, 'body', 0.95, 0.55, 1);
    addVoxel(0, -0.3, z, 'belly', 0.8, 0.4, 1);
  }
  
  // --- ENGINE SECTION (Single engine, narrow, prominent nozzle) ---
  addVoxel(0, 0, 5, 'dark', 0.85, 0.7, 1);
  addVoxel(0, 0, 6, 'dark', 0.9, 0.75, 1);
  addVoxel(0, 0, 7, 'dark', 1.0, 0.85, 0.8);  // Nozzle
  
  // --- SHORT STUBBY WINGS (40% shorter, thicker, blunt tips) ---
  // Inner wing
  for (let z = 1; z <= 3; z++) {
    addVoxel(-1.5, 0, z, 'body', 0.9, 0.35, 1);
    addVoxel(1.5, 0, z, 'body', 0.9, 0.35, 1);
  }
  
  // Mid wing (stubby)
  addVoxel(-2.3, 0, 1.5, 'body', 0.85, 0.4, 1);
  addVoxel(-2.3, 0, 2.5, 'body', 0.85, 0.4, 1);
  addVoxel(2.3, 0, 1.5, 'body', 0.85, 0.4, 1);
  addVoxel(2.3, 0, 2.5, 'body', 0.85, 0.4, 1);
  
  // Outer wing (blunt, squared tips)
  addVoxel(-3, 0, 2, 'body', 0.8, 0.35, 1);
  addVoxel(3, 0, 2, 'body', 0.8, 0.35, 1);
  
  // Wing tips with nav lights
  addVoxel(-3.5, 0, 2, 'body', 0.6, 0.3, 0.8);
  addVoxel(-3.8, 0, 2, 'navRed', 0.35, 0.2, 0.4);
  addVoxel(3.5, 0, 2, 'body', 0.6, 0.3, 0.8);
  addVoxel(3.8, 0, 2, 'navGreen', 0.35, 0.2, 0.4);
  
  // Red accent on wing leading edge
  addVoxel(-2, 0.1, 1, 'accent', 0.3, 0.15, 0.6);
  addVoxel(2, 0.1, 1, 'accent', 0.3, 0.15, 0.6);

  // --- AILERONS (Short, aggressive) ---
  addVoxel(-2.5, 0, 3.2, 'control', 1, 0.25, 0.7);
  addVoxel(-1.8, 0, 3.2, 'control', 0.8, 0.25, 0.7);
  addVoxel(2.5, 0, 3.2, 'control', 1, 0.25, 0.7);
  addVoxel(1.8, 0, 3.2, 'control', 0.8, 0.25, 0.7);

  // --- SINGLE VERTICAL TAIL (Upright, proportional) ---
  addVoxel(0, 0.5, 5, 'body', 0.35, 0.7, 1);
  addVoxel(0, 1.1, 5.2, 'body', 0.3, 0.8, 0.9);
  addVoxel(0, 1.7, 5.4, 'body', 0.25, 0.7, 0.8);
  addVoxel(0, 2.1, 5.5, 'body', 0.2, 0.5, 0.7);
  addVoxel(0, 2.4, 5.6, 'dark', 0.15, 0.3, 0.5);
  
  // Rudder
  addVoxel(0, 1.1, 5.8, 'control', 0.2, 0.65, 0.45);
  addVoxel(0, 1.7, 6.0, 'control', 0.15, 0.55, 0.35);
  
  // Red accent on tail
  addVoxel(0, 2.0, 5.3, 'accent', 0.18, 0.35, 0.4);

  // --- HORIZONTAL STABILIZERS (Small, simple) ---
  addVoxel(-1.2, 0, 6.2, 'control', 0.9, 0.2, 0.7);
  addVoxel(-1.8, 0, 6.4, 'control', 0.7, 0.18, 0.6);
  addVoxel(1.2, 0, 6.2, 'control', 0.9, 0.2, 0.7);
  addVoxel(1.8, 0, 6.4, 'control', 0.7, 0.18, 0.6);

  // --- AFTERBURNER GLOW (Crimson red, prominent) ---
  addVoxel(0, 0, 7.5, 'glow', 0.7, 0.7, 1.8);

  // --- GUN PORT ---
  addVoxel(0.5, -0.3, -4, 'dark', 0.2, 0.2, 1);

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
    mesh.add(instMesh);
  }

  return mesh;
}

/**
 * IRONCLAD - A-10 Thunderbolt II (Warthog) Inspired Heavy Assault Gunship
 * 
 * Design characteristics:
 * - Bulky, broad fuselage (40% wider, stocky, tank-like)
 * - Twin vertical tail fins (widely spaced for stability)
 * - Short, stubby, HIGH-MOUNTED wings
 * - Pronounced twin engines mounted high on rear fuselage
 * - Flat, boxy profile (functional, not aerodynamic)
 * - Massive GAU-8 cannon visible under nose
 * - Heavy, armored appearance with panel details
 * - Straight leading edges on wings
 */
function createIroncladMesh(config: PlayerAircraftConfig): THREE.Group {
  const mesh = new THREE.Group();

  // --- A-10 MATERIALS (Military olive/tan colors) ---
  const materials: Record<string, THREE.Material> = {
    // Main fuselage - olive drab
    body: new THREE.MeshStandardMaterial({ 
      color: config.color, 
      roughness: 0.6, 
      metalness: 0.2,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.02
    }),
    // Underside - tan/beige
    belly: new THREE.MeshStandardMaterial({ 
      color: config.accentColor, 
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
    glow: new THREE.MeshBasicMaterial({ color: 0xffaa44 }),
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
    instances[matName].push(matrix);
  };

  // ============================================
  // A-10 WARTHOG GEOMETRY (Bulky, Tank-like)
  // ============================================

  // --- NOSE SECTION (Blunt, houses GAU-8 cannon) ---
  addVoxel(0, 0, -7, 'body', 1.2, 0.9, 1);
  addVoxel(0, 0, -6, 'body', 1.4, 1.0, 1);
  addVoxel(0, -0.3, -6, 'belly', 1.3, 0.6, 1);
  addVoxel(0, 0, -5, 'body', 1.5, 1.1, 1);
  addVoxel(0, -0.4, -5, 'belly', 1.4, 0.6, 1);
  
  // GAU-8 Avenger cannon (massive rotary cannon under nose)
  addVoxel(0, -0.9, -8, 'dark', 0.6, 0.6, 1.5);  // Cannon barrel cluster
  addVoxel(0, -0.9, -6.5, 'dark', 0.8, 0.8, 1.5);  // Cannon housing
  addVoxel(0, -0.9, -5, 'dark', 0.9, 0.9, 1);    // Cannon mount
  
  // --- COCKPIT (Armored bubble, positioned forward and high) ---
  addVoxel(0, 0.8, -4, 'cockpit', 1.3, 0.8, 1);
  addVoxel(0, 1.0, -3, 'cockpit', 1.4, 0.9, 1);
  addVoxel(0, 0.9, -2, 'cockpit', 1.3, 0.8, 1);
  addVoxel(0, 0.6, -1, 'cockpit', 1.1, 0.6, 0.8);
  
  // Cockpit armor frame (titanium bathtub)
  addVoxel(0, 0, -4, 'armor', 1.6, 0.8, 1);
  addVoxel(0, 0, -3, 'armor', 1.7, 0.9, 1);
  addVoxel(0, -0.6, -4, 'belly', 1.5, 0.5, 1);
  addVoxel(0, -0.6, -3, 'belly', 1.6, 0.5, 1);
  
  // --- FORWARD FUSELAGE (Wide, boxy) ---
  for (let z = -2; z <= 1; z++) {
    addVoxel(0, 0.3, z, 'body', 1.8, 0.7, 1);
    addVoxel(0, 0, z, 'body', 2.0, 0.8, 1);
    addVoxel(0, -0.5, z, 'belly', 1.8, 0.6, 1);
    
    // Side armor panels
    addVoxel(-1.3, 0, z, 'armor', 0.4, 0.7, 1);
    addVoxel(1.3, 0, z, 'armor', 0.4, 0.7, 1);
  }
  
  // --- MAIN FUSELAGE (Wide, straight, boxy) ---
  for (let z = 1; z <= 5; z++) {
    addVoxel(0, 0.4, z, 'body', 1.6, 0.6, 1);
    addVoxel(0, 0, z, 'body', 1.8, 0.8, 1);
    addVoxel(0, -0.5, z, 'belly', 1.6, 0.6, 1);
    
    // Visible panel lines (armor plating effect)
    if (z % 2 === 0) {
      addVoxel(-1.1, 0, z, 'armor', 0.3, 0.6, 0.8);
      addVoxel(1.1, 0, z, 'armor', 0.3, 0.6, 0.8);
    }
  }
  
  // --- HIGH-MOUNTED WINGS (Short, stubby, straight leading edge) ---
  // Wing root (high position - A-10 signature)
  for (let z = 1; z <= 4; z++) {
    addVoxel(-2.2, 0.4, z, 'body', 1, 0.4, 1);
    addVoxel(2.2, 0.4, z, 'body', 1, 0.4, 1);
  }
  
  // Mid wing (thick, sturdy)
  addVoxel(-3.2, 0.4, 1.5, 'body', 1, 0.5, 1.2);
  addVoxel(-3.2, 0.4, 2.5, 'body', 1, 0.5, 1.2);
  addVoxel(-3.2, 0.4, 3.5, 'body', 1, 0.5, 1.2);
  addVoxel(3.2, 0.4, 1.5, 'body', 1, 0.5, 1.2);
  addVoxel(3.2, 0.4, 2.5, 'body', 1, 0.5, 1.2);
  addVoxel(3.2, 0.4, 3.5, 'body', 1, 0.5, 1.2);
  
  // Outer wing (blunt tips)
  addVoxel(-4.2, 0.4, 2, 'body', 1, 0.45, 1);
  addVoxel(-4.2, 0.4, 3, 'body', 1, 0.45, 1);
  addVoxel(4.2, 0.4, 2, 'body', 1, 0.45, 1);
  addVoxel(4.2, 0.4, 3, 'body', 1, 0.45, 1);
  
  // Wing tips with nav lights (blunt, squared)
  addVoxel(-5, 0.4, 2.5, 'body', 0.8, 0.4, 1);
  addVoxel(-5.3, 0.4, 2.5, 'navRed', 0.4, 0.25, 0.5);
  addVoxel(5, 0.4, 2.5, 'body', 0.8, 0.4, 1);
  addVoxel(5.3, 0.4, 2.5, 'navGreen', 0.4, 0.25, 0.5);
  
  // Hardpoints under wings (weapons pylons)
  addVoxel(-3.5, 0, 2, 'dark', 0.3, 0.5, 0.8);
  addVoxel(-3.5, 0, 3, 'dark', 0.3, 0.5, 0.8);
  addVoxel(3.5, 0, 2, 'dark', 0.3, 0.5, 0.8);
  addVoxel(3.5, 0, 3, 'dark', 0.3, 0.5, 0.8);

  // --- AILERONS (Trailing edge - thick, heavy) ---
  addVoxel(-4, 0.4, 4, 'control', 1.2, 0.35, 0.8);
  addVoxel(-3, 0.4, 4, 'control', 1, 0.35, 0.8);
  addVoxel(4, 0.4, 4, 'control', 1.2, 0.35, 0.8);
  addVoxel(3, 0.4, 4, 'control', 1, 0.35, 0.8);

  // --- TWIN ENGINES (Mounted high, behind wings - A-10 signature) ---
  // Left engine nacelle
  addVoxel(-1.8, 1.2, 4, 'engine', 1.2, 1.2, 1);
  addVoxel(-1.8, 1.2, 5, 'engine', 1.3, 1.3, 1);
  addVoxel(-1.8, 1.2, 6, 'engine', 1.4, 1.4, 1);
  addVoxel(-1.8, 1.2, 7, 'dark', 1.5, 1.5, 0.8);  // Exhaust
  
  // Right engine nacelle
  addVoxel(1.8, 1.2, 4, 'engine', 1.2, 1.2, 1);
  addVoxel(1.8, 1.2, 5, 'engine', 1.3, 1.3, 1);
  addVoxel(1.8, 1.2, 6, 'engine', 1.4, 1.4, 1);
  addVoxel(1.8, 1.2, 7, 'dark', 1.5, 1.5, 0.8);  // Exhaust
  
  // Engine intake fairings
  addVoxel(-1.8, 1.5, 3.5, 'dark', 0.9, 0.6, 1);
  addVoxel(1.8, 1.5, 3.5, 'dark', 0.9, 0.6, 1);

  // --- TAIL SECTION (Narrow boom between twin fins) ---
  addVoxel(0, 0.2, 5, 'body', 1.0, 0.5, 1);
  addVoxel(0, 0.2, 6, 'body', 0.8, 0.4, 1);
  addVoxel(0, 0.2, 7, 'body', 0.6, 0.35, 1);

  // --- TWIN VERTICAL TAILS (Widely spaced - A-10 signature) ---
  // Left vertical tail (wide spacing)
  addVoxel(-2.5, 0.8, 6, 'body', 0.4, 0.9, 1);
  addVoxel(-2.5, 1.6, 6.2, 'body', 0.35, 1, 1);
  addVoxel(-2.5, 2.4, 6.4, 'body', 0.3, 0.9, 0.9);
  addVoxel(-2.5, 3.0, 6.5, 'body', 0.25, 0.6, 0.7);
  addVoxel(-2.5, 1.6, 6.8, 'control', 0.25, 0.8, 0.5);  // Rudder
  addVoxel(-2.5, 2.4, 7.0, 'control', 0.2, 0.7, 0.4);
  
  // Right vertical tail (wide spacing)
  addVoxel(2.5, 0.8, 6, 'body', 0.4, 0.9, 1);
  addVoxel(2.5, 1.6, 6.2, 'body', 0.35, 1, 1);
  addVoxel(2.5, 2.4, 6.4, 'body', 0.3, 0.9, 0.9);
  addVoxel(2.5, 3.0, 6.5, 'body', 0.25, 0.6, 0.7);
  addVoxel(2.5, 1.6, 6.8, 'control', 0.25, 0.8, 0.5);  // Rudder
  addVoxel(2.5, 2.4, 7.0, 'control', 0.2, 0.7, 0.4);

  // --- HORIZONTAL STABILIZERS (Large, between tail fins) ---
  addVoxel(-1.5, 0.3, 7, 'control', 1.2, 0.25, 1);
  addVoxel(-2.2, 0.3, 7.3, 'control', 1, 0.22, 0.8);
  addVoxel(1.5, 0.3, 7, 'control', 1.2, 0.25, 1);
  addVoxel(2.2, 0.3, 7.3, 'control', 1, 0.22, 0.8);

  // --- LANDING GEAR PODS (Visible on A-10) ---
  addVoxel(-1.5, -0.9, 0, 'dark', 0.7, 0.5, 1.5);
  addVoxel(1.5, -0.9, 0, 'dark', 0.7, 0.5, 1.5);
  addVoxel(0, -0.9, -3, 'dark', 0.6, 0.4, 1.2);  // Nose gear

  // --- AFTERBURNER GLOW (Deep orange) ---
  addVoxel(-1.8, 1.2, 7.5, 'glow', 1.0, 1.0, 1.5);
  addVoxel(1.8, 1.2, 7.5, 'glow', 1.0, 1.0, 1.5);

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
    mesh.add(instMesh);
  }

  return mesh;
}

/**
 * WRAITH - SR-71 Stealth Reconnaissance Aircraft (Blackbird Inspired)
 * 
 * Design characteristics:
 * - Extremely long, slender fuselage (150% length)
 * - Very narrow profile (30% reduced width)
 * - Needle-sharp pointed nose (8+ voxels)
 * - Twin tall vertical tail fins (blade-like)
 * - Tiny, minimal wings (60% length, blade-thin)
 * - Smooth, streamlined body (no protrusions)
 * - Matte black/deep purple stealth colors
 * - Integrated air intakes (smooth)
 * - Elegant, speed-optimized silhouette
 */
function createWraithMesh(config: PlayerAircraftConfig): THREE.Group {
  const mesh = new THREE.Group();

  // --- WRAITH MATERIALS (Stealth black/purple colors) ---
  const materials: Record<string, THREE.Material> = {
    // Main body - near-black with purple tint
    body: new THREE.MeshStandardMaterial({ 
      color: config.color, 
      roughness: 0.85, 
      metalness: 0.15,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.02
    }),
    // Underside - dark purple-gray
    belly: new THREE.MeshStandardMaterial({ 
      color: config.accentColor, 
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
      emissiveIntensity: 0.25
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

  // Buffers for InstancedMesh
  const instances: Record<string, THREE.Matrix4[]> = {};
  for (const k in materials) instances[k] = [];

  const addVoxel = (
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
    instances[matName].push(matrix);
  };

  // ============================================
  // SR-71 WRAITH GEOMETRY (Long, Slender, Needle-like)
  // Scale: 150% length, 70% width - elegant and fast
  // ============================================

  // --- NEEDLE NOSE (Sharp, 8+ voxels, hypersonic design) ---
  addVoxel(0, 0, -11, 'body', 0.2, 0.2, 1);   // Needle tip
  addVoxel(0, 0, -10, 'body', 0.25, 0.25, 1);
  addVoxel(0, 0, -9, 'body', 0.35, 0.3, 1);
  addVoxel(0, 0, -8, 'body', 0.45, 0.35, 1);
  addVoxel(0, 0, -7, 'body', 0.55, 0.4, 1);
  addVoxel(0, -0.15, -7, 'belly', 0.45, 0.25, 1);
  addVoxel(0, 0, -6, 'body', 0.65, 0.45, 1);
  addVoxel(0, -0.2, -6, 'belly', 0.55, 0.3, 1);
  addVoxel(0, 0, -5, 'body', 0.75, 0.5, 1);
  addVoxel(0, -0.25, -5, 'belly', 0.6, 0.3, 1);
  
  // --- COCKPIT (Smooth fairing, integrated into fuselage) ---
  addVoxel(0, 0.3, -4, 'cockpit', 0.75, 0.45, 1);
  addVoxel(0, 0.35, -3, 'cockpit', 0.8, 0.5, 1);
  addVoxel(0, 0.3, -2, 'cockpit', 0.75, 0.45, 1);
  addVoxel(0, 0.2, -1, 'cockpit', 0.65, 0.35, 0.8);
  
  // Cockpit frame (smooth fairing)
  addVoxel(0, 0, -4, 'body', 0.8, 0.55, 1);
  addVoxel(0, 0, -3, 'body', 0.85, 0.6, 1);
  addVoxel(0, 0, -2, 'body', 0.8, 0.55, 1);
  addVoxel(0, -0.3, -4, 'belly', 0.7, 0.35, 1);
  addVoxel(0, -0.3, -3, 'belly', 0.75, 0.35, 1);
  addVoxel(0, -0.3, -2, 'belly', 0.7, 0.35, 1);
  
  // --- FORWARD FUSELAGE (Narrow, streamlined) ---
  for (let z = -1; z <= 2; z++) {
    addVoxel(0, 0.1, z, 'body', 0.75, 0.45, 1);
    addVoxel(0, 0, z, 'body', 0.8, 0.5, 1);
    addVoxel(0, -0.25, z, 'belly', 0.65, 0.35, 1);
  }
  
  // --- INTEGRATED AIR INTAKES (Smooth, flush with fuselage) ---
  addVoxel(-0.5, -0.1, 0, 'dark', 0.35, 0.45, 1.5);
  addVoxel(0.5, -0.1, 0, 'dark', 0.35, 0.45, 1.5);
  addVoxel(-0.5, -0.1, 1.2, 'dark', 0.4, 0.5, 1);
  addVoxel(0.5, -0.1, 1.2, 'dark', 0.4, 0.5, 1);
  
  // --- MAIN FUSELAGE (Long, slender, tapered) ---
  for (let z = 2; z <= 6; z++) {
    const taper = 1 - (z - 2) * 0.03;  // Gradual taper
    addVoxel(0, 0.1, z, 'body', 0.7 * taper, 0.4, 1);
    addVoxel(0, 0, z, 'body', 0.75 * taper, 0.45, 1);
    addVoxel(0, -0.2, z, 'belly', 0.6 * taper, 0.3, 1);
  }
  
  // --- REAR FUSELAGE (Narrow tail boom) ---
  for (let z = 7; z <= 9; z++) {
    const taper = 1 - (z - 7) * 0.08;
    addVoxel(0, 0.05, z, 'body', 0.6 * taper, 0.35, 1);
    addVoxel(0, -0.15, z, 'belly', 0.5 * taper, 0.25, 1);
  }
  
  // --- ENGINE SECTION (Slim, integrated) ---
  addVoxel(0, 0, 9, 'dark', 0.55, 0.5, 1);
  addVoxel(0, 0, 10, 'dark', 0.6, 0.55, 0.8);
  
  // --- TINY BLADE WINGS (60% length, thin, positioned toward tail) ---
  // Inner wing root
  addVoxel(-0.9, 0, 4, 'body', 0.6, 0.2, 1);
  addVoxel(-0.9, 0, 5, 'body', 0.6, 0.2, 1);
  addVoxel(0.9, 0, 4, 'body', 0.6, 0.2, 1);
  addVoxel(0.9, 0, 5, 'body', 0.6, 0.2, 1);
  
  // Mid wing (blade-thin)
  addVoxel(-1.5, 0, 4.5, 'body', 0.7, 0.18, 1);
  addVoxel(1.5, 0, 4.5, 'body', 0.7, 0.18, 1);
  
  // Outer wing (minimal, diamond profile)
  addVoxel(-2.0, 0, 5, 'body', 0.6, 0.15, 0.9);
  addVoxel(2.0, 0, 5, 'body', 0.6, 0.15, 0.9);
  
  // Wing tips with nav lights
  addVoxel(-2.4, 0, 5, 'body', 0.4, 0.12, 0.7);
  addVoxel(-2.7, 0, 5, 'navPurple', 0.25, 0.12, 0.35);
  addVoxel(2.4, 0, 5, 'body', 0.4, 0.12, 0.7);
  addVoxel(2.7, 0, 5, 'navGreen', 0.25, 0.12, 0.35);
  
  // --- AILERONS (Minimal, blade-thin) ---
  addVoxel(-1.8, 0, 5.8, 'control', 0.7, 0.12, 0.5);
  addVoxel(1.8, 0, 5.8, 'control', 0.7, 0.12, 0.5);

  // --- TWIN VERTICAL TAILS (Tall, blade-like, widely spaced) ---
  // Left tail (tall, blade-thin)
  addVoxel(-0.6, 0.4, 8, 'body', 0.25, 0.65, 1);
  addVoxel(-0.6, 1.0, 8.2, 'body', 0.22, 0.8, 0.9);
  addVoxel(-0.6, 1.7, 8.4, 'body', 0.18, 0.9, 0.8);
  addVoxel(-0.6, 2.4, 8.5, 'body', 0.15, 0.8, 0.7);
  addVoxel(-0.6, 2.9, 8.6, 'dark', 0.12, 0.5, 0.5);
  // Rudder
  addVoxel(-0.6, 1.2, 8.8, 'control', 0.12, 0.7, 0.4);
  addVoxel(-0.6, 1.9, 9.0, 'control', 0.1, 0.6, 0.35);
  // Purple accent stripe
  addVoxel(-0.6, 2.2, 8.3, 'accent', 0.14, 0.35, 0.4);
  
  // Right tail (mirrored)
  addVoxel(0.6, 0.4, 8, 'body', 0.25, 0.65, 1);
  addVoxel(0.6, 1.0, 8.2, 'body', 0.22, 0.8, 0.9);
  addVoxel(0.6, 1.7, 8.4, 'body', 0.18, 0.9, 0.8);
  addVoxel(0.6, 2.4, 8.5, 'body', 0.15, 0.8, 0.7);
  addVoxel(0.6, 2.9, 8.6, 'dark', 0.12, 0.5, 0.5);
  // Rudder
  addVoxel(0.6, 1.2, 8.8, 'control', 0.12, 0.7, 0.4);
  addVoxel(0.6, 1.9, 9.0, 'control', 0.1, 0.6, 0.35);
  // Purple accent stripe
  addVoxel(0.6, 2.2, 8.3, 'accent', 0.14, 0.35, 0.4);

  // --- HORIZONTAL STABILIZERS (Small, between tails) ---
  addVoxel(-0.9, 0.2, 9, 'control', 0.7, 0.12, 0.6);
  addVoxel(-1.4, 0.2, 9.2, 'control', 0.5, 0.1, 0.5);
  addVoxel(0.9, 0.2, 9, 'control', 0.7, 0.12, 0.6);
  addVoxel(1.4, 0.2, 9.2, 'control', 0.5, 0.1, 0.5);

  // --- AFTERBURNER GLOW (Deep purple) ---
  addVoxel(0, 0, 10.5, 'glow', 0.5, 0.5, 1.5);

  // --- SUBTLE BODY ACCENTS (Purple glow lines) ---
  addVoxel(0, 0.35, 2, 'accent', 0.2, 0.1, 2);
  addVoxel(-0.55, 0.15, 3, 'accent', 0.1, 0.08, 1.5);
  addVoxel(0.55, 0.15, 3, 'accent', 0.1, 0.08, 1.5);

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
    mesh.add(instMesh);
  }

  // Cloak shimmer effect (Wraith special ability)
  const shimmerGeo = new THREE.SphereGeometry(6, 16, 16);
  const shimmerMat = new THREE.MeshBasicMaterial({
    color: 0x8844ff,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
  });
  const shimmer = new THREE.Mesh(shimmerGeo, shimmerMat);
  shimmer.name = 'cloakShimmer';
  mesh.add(shimmer);

  return mesh;
}

/**
 * ARCHON - XF-108 Elite Advanced Experimental Fighter
 * 
 * Design characteristics:
 * - Sleek, modern fuselage with advanced angular shaping
 * - Prominent canards (50% larger, angular, active-looking)
 * - Twin swept-back vertical tail fins (tall, aggressive)
 * - Medium-length advanced wings with LEX (leading-edge extensions)
 * - Integrated stealthy air inlets
 * - Faceted, high-tech angular design
 * - Dark blue-gray body with metallic gold accents
 * - Glowing cockpit and nav lights
 * - Sensor bumps and advanced system indicators
 */
function createArchonMesh(config: PlayerAircraftConfig): THREE.Group {
  const mesh = new THREE.Group();

  // --- ARCHON MATERIALS (Elite dark blue-gray/gold scheme) ---
  const materials: Record<string, THREE.Material> = {
    // Main body - dark blue-gray
    body: new THREE.MeshStandardMaterial({ 
      color: config.color, 
      roughness: 0.35, 
      metalness: 0.4,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.02
    }),
    // Underside - slightly lighter
    belly: new THREE.MeshStandardMaterial({ 
      color: config.accentColor, 
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
      emissiveIntensity: 0.35
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

  // Buffers for InstancedMesh
  const instances: Record<string, THREE.Matrix4[]> = {};
  for (const k in materials) instances[k] = [];

  const addVoxel = (
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
    instances[matName].push(matrix);
  };

  // ============================================
  // XF-108 ARCHON GEOMETRY (Advanced, Angular, Elite)
  // Faceted futuristic design with gold accents
  // ============================================

  // --- NOSE (Angular, faceted, advanced) ---
  addVoxel(0, 0, -7, 'body', 0.4, 0.35, 1);
  addVoxel(0, 0, -6, 'body', 0.55, 0.45, 1);
  addVoxel(0, -0.15, -6, 'belly', 0.45, 0.3, 1);
  addVoxel(0, 0, -5, 'body', 0.7, 0.55, 1);
  addVoxel(0, -0.2, -5, 'belly', 0.6, 0.35, 1);
  addVoxel(0, 0, -4, 'body', 0.85, 0.65, 1);
  addVoxel(0, -0.25, -4, 'belly', 0.7, 0.4, 1);
  
  // Gold accent stripe on nose
  addVoxel(0, 0.3, -5.5, 'gold', 0.25, 0.12, 1.5);
  
  // Sensor bump on nose
  addVoxel(0, 0.15, -6.5, 'sensor', 0.3, 0.2, 0.6);
  
  // --- COCKPIT (Raised, prominent, glowing) ---
  addVoxel(0, 0.6, -3, 'cockpit', 0.85, 0.55, 1);
  addVoxel(0, 0.7, -2, 'cockpit', 0.95, 0.6, 1.1);
  addVoxel(0, 0.6, -1, 'cockpit', 0.85, 0.55, 1);
  addVoxel(0, 0.5, 0, 'cockpit', 0.7, 0.45, 0.8);
  
  // Cockpit frame (angular)
  addVoxel(0, 0.1, -3, 'body', 1.0, 0.6, 1);
  addVoxel(0, 0.1, -2, 'body', 1.05, 0.65, 1);
  addVoxel(0, 0.1, -1, 'body', 1.0, 0.6, 1);
  addVoxel(0, -0.35, -3, 'belly', 0.85, 0.45, 1);
  addVoxel(0, -0.35, -2, 'belly', 0.9, 0.45, 1);
  addVoxel(0, -0.35, -1, 'belly', 0.85, 0.45, 1);
  
  // --- PROMINENT CANARDS (50% larger, angular, raised) ---
  // Left canard
  addVoxel(-0.9, 0.3, -2.5, 'body', 0.6, 0.22, 1);
  addVoxel(-1.5, 0.35, -2.3, 'body', 0.7, 0.2, 0.9);
  addVoxel(-2.0, 0.4, -2.1, 'body', 0.6, 0.18, 0.8);
  addVoxel(-2.4, 0.42, -2, 'control', 0.5, 0.15, 0.7);
  // Gold leading edge
  addVoxel(-1.3, 0.38, -2.8, 'gold', 0.15, 0.1, 0.8);
  
  // Right canard
  addVoxel(0.9, 0.3, -2.5, 'body', 0.6, 0.22, 1);
  addVoxel(1.5, 0.35, -2.3, 'body', 0.7, 0.2, 0.9);
  addVoxel(2.0, 0.4, -2.1, 'body', 0.6, 0.18, 0.8);
  addVoxel(2.4, 0.42, -2, 'control', 0.5, 0.15, 0.7);
  // Gold leading edge
  addVoxel(1.3, 0.38, -2.8, 'gold', 0.15, 0.1, 0.8);
  
  // --- FORWARD FUSELAGE (Angular, faceted) ---
  for (let z = 0; z <= 2; z++) {
    addVoxel(0, 0.2, z, 'body', 0.95, 0.5, 1);
    addVoxel(0, 0, z, 'body', 1.05, 0.6, 1);
    addVoxel(0, -0.3, z, 'belly', 0.9, 0.45, 1);
  }
  
  // Side facets/sensor panels
  addVoxel(-0.65, 0.1, 1, 'sensor', 0.25, 0.35, 1.5);
  addVoxel(0.65, 0.1, 1, 'sensor', 0.25, 0.35, 1.5);
  
  // --- INTEGRATED AIR INLETS (Stealthy, angular) ---
  addVoxel(-0.7, -0.2, -0.5, 'dark', 0.45, 0.5, 1.5);
  addVoxel(0.7, -0.2, -0.5, 'dark', 0.45, 0.5, 1.5);
  addVoxel(-0.7, -0.2, 0.5, 'dark', 0.5, 0.55, 1);
  addVoxel(0.7, -0.2, 0.5, 'dark', 0.5, 0.55, 1);
  
  // --- MAIN FUSELAGE (Sleek, purposeful) ---
  for (let z = 2; z <= 5; z++) {
    addVoxel(0, 0.15, z, 'body', 0.9, 0.45, 1);
    addVoxel(0, 0, z, 'body', 1.0, 0.55, 1);
    addVoxel(0, -0.25, z, 'belly', 0.85, 0.4, 1);
  }
  
  // Engine nacelle bulges (advanced systems)
  addVoxel(-0.55, 0, 4, 'body', 0.5, 0.55, 1.5);
  addVoxel(0.55, 0, 4, 'body', 0.5, 0.55, 1.5);
  
  // --- ENGINE SECTION (Twin engines, angular) ---
  addVoxel(-0.5, 0, 5.5, 'dark', 0.6, 0.6, 1);
  addVoxel(0.5, 0, 5.5, 'dark', 0.6, 0.6, 1);
  addVoxel(-0.5, 0, 6.5, 'dark', 0.65, 0.65, 0.8);
  addVoxel(0.5, 0, 6.5, 'dark', 0.65, 0.65, 0.8);
  
  // --- ADVANCED WINGS with LEX (Medium-length, refined) ---
  // LEX (Leading Edge Extensions)
  addVoxel(-1.0, 0.1, 0, 'body', 0.5, 0.25, 1.2);
  addVoxel(-1.0, 0.1, 1, 'body', 0.6, 0.25, 1);
  addVoxel(1.0, 0.1, 0, 'body', 0.5, 0.25, 1.2);
  addVoxel(1.0, 0.1, 1, 'body', 0.6, 0.25, 1);
  
  // Inner wing root
  for (let z = 1; z <= 3; z++) {
    addVoxel(-1.5, 0, z, 'body', 0.85, 0.3, 1);
    addVoxel(1.5, 0, z, 'body', 0.85, 0.3, 1);
  }
  
  // Mid wing
  addVoxel(-2.3, 0, 1.5, 'body', 0.9, 0.28, 1);
  addVoxel(-2.3, 0, 2.5, 'body', 0.9, 0.28, 1);
  addVoxel(2.3, 0, 1.5, 'body', 0.9, 0.28, 1);
  addVoxel(2.3, 0, 2.5, 'body', 0.9, 0.28, 1);
  
  // Outer wing
  addVoxel(-3.0, 0, 2, 'body', 0.85, 0.25, 1);
  addVoxel(-3.0, 0, 2.8, 'body', 0.75, 0.22, 0.8);
  addVoxel(3.0, 0, 2, 'body', 0.85, 0.25, 1);
  addVoxel(3.0, 0, 2.8, 'body', 0.75, 0.22, 0.8);
  
  // Wing tips with nav lights
  addVoxel(-3.6, 0, 2.5, 'body', 0.55, 0.2, 0.7);
  addVoxel(-4.0, 0, 2.5, 'navRed', 0.3, 0.15, 0.35);
  addVoxel(3.6, 0, 2.5, 'body', 0.55, 0.2, 0.7);
  addVoxel(4.0, 0, 2.5, 'navGreen', 0.3, 0.15, 0.35);
  
  // Gold accent on wing leading edge
  addVoxel(-2.0, 0.08, 1, 'gold', 0.15, 0.1, 0.8);
  addVoxel(-2.8, 0.08, 1.5, 'gold', 0.12, 0.08, 0.7);
  addVoxel(2.0, 0.08, 1, 'gold', 0.15, 0.1, 0.8);
  addVoxel(2.8, 0.08, 1.5, 'gold', 0.12, 0.08, 0.7);

  // --- AILERONS (Angular, active-looking) ---
  addVoxel(-2.8, 0, 3.5, 'control', 1, 0.2, 0.7);
  addVoxel(-2.0, 0, 3.5, 'control', 0.85, 0.2, 0.65);
  addVoxel(2.8, 0, 3.5, 'control', 1, 0.2, 0.7);
  addVoxel(2.0, 0, 3.5, 'control', 0.85, 0.2, 0.65);

  // --- TWIN VERTICAL TAILS (Tall, swept-back, angular) ---
  // Left tail (tall, swept, aggressive)
  addVoxel(-0.7, 0.5, 5, 'body', 0.3, 0.7, 1);
  addVoxel(-0.75, 1.1, 5.2, 'body', 0.28, 0.85, 0.95);
  addVoxel(-0.8, 1.8, 5.4, 'body', 0.25, 0.95, 0.9);
  addVoxel(-0.85, 2.4, 5.5, 'body', 0.22, 0.8, 0.8);
  addVoxel(-0.88, 2.9, 5.6, 'dark', 0.18, 0.5, 0.6);
  // Rudder
  addVoxel(-0.8, 1.2, 5.9, 'control', 0.18, 0.7, 0.45);
  addVoxel(-0.85, 1.9, 6.1, 'control', 0.15, 0.65, 0.4);
  // Gold accent stripe
  addVoxel(-0.78, 2.2, 5.3, 'gold', 0.15, 0.4, 0.5);
  // Tail nav light
  addVoxel(-0.88, 2.8, 5.4, 'navGold', 0.12, 0.2, 0.25);
  
  // Right tail (mirrored)
  addVoxel(0.7, 0.5, 5, 'body', 0.3, 0.7, 1);
  addVoxel(0.75, 1.1, 5.2, 'body', 0.28, 0.85, 0.95);
  addVoxel(0.8, 1.8, 5.4, 'body', 0.25, 0.95, 0.9);
  addVoxel(0.85, 2.4, 5.5, 'body', 0.22, 0.8, 0.8);
  addVoxel(0.88, 2.9, 5.6, 'dark', 0.18, 0.5, 0.6);
  // Rudder
  addVoxel(0.8, 1.2, 5.9, 'control', 0.18, 0.7, 0.45);
  addVoxel(0.85, 1.9, 6.1, 'control', 0.15, 0.65, 0.4);
  // Gold accent stripe
  addVoxel(0.78, 2.2, 5.3, 'gold', 0.15, 0.4, 0.5);
  // Tail nav light
  addVoxel(0.88, 2.8, 5.4, 'navGold', 0.12, 0.2, 0.25);

  // --- HORIZONTAL STABILIZERS (Angular, between tails) ---
  addVoxel(-1.2, 0.3, 6, 'control', 0.9, 0.18, 0.7);
  addVoxel(-1.8, 0.3, 6.2, 'control', 0.7, 0.15, 0.6);
  addVoxel(1.2, 0.3, 6, 'control', 0.9, 0.18, 0.7);
  addVoxel(1.8, 0.3, 6.2, 'control', 0.7, 0.15, 0.6);

  // --- AFTERBURNER GLOW (Twin engines, golden-amber) ---
  addVoxel(-0.5, 0, 7, 'glow', 0.55, 0.55, 1.5);
  addVoxel(0.5, 0, 7, 'glow', 0.55, 0.55, 1.5);

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
    mesh.add(instMesh);
  }

  return mesh;
}

/**
 * Apply cloak effect to player aircraft mesh
 */
export function applyPlayerCloakEffect(mesh: THREE.Group): void {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      if (child.name === 'cloakShimmer') {
        (child.material as THREE.MeshBasicMaterial).opacity = 0.15;
      } else if (child.material instanceof THREE.MeshPhongMaterial || child.material instanceof THREE.MeshStandardMaterial) {
        child.material.transparent = true;
        child.material.opacity = 0.15;
      } else if (child.material instanceof THREE.MeshBasicMaterial) {
        child.material.opacity *= 0.3;
      }
    }
  });
}

/**
 * Remove cloak effect from player aircraft mesh
 */
export function removePlayerCloakEffect(mesh: THREE.Group): void {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      if (child.name === 'cloakShimmer') {
        (child.material as THREE.MeshBasicMaterial).opacity = 0;
      } else if (child.material instanceof THREE.MeshPhongMaterial || child.material instanceof THREE.MeshStandardMaterial) {
        child.material.opacity = 1;
        child.material.transparent = false;
      } else if (child.material instanceof THREE.MeshBasicMaterial) {
        if (child.name.includes('Glow') || child.name.includes('sensor') || child.name.includes('Sensor')) {
          child.material.opacity = 0.9;
        }
      }
    }
  });
}

/**
 * Update engine glow based on speed
 */
export function updatePlayerEngineGlow(mesh: THREE.Group, speedFactor: number): void {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name.includes('engineGlow')) {
      const scale = 0.8 + speedFactor * 0.4;
      child.scale.set(scale, scale, scale);
    }
    if (child.name === 'afterburnerTrail') {
      (child as THREE.Mesh).scale.z = 0.5 + speedFactor * 1.5;
    }
  });
}

/**
 * Pulse sensors for dual-lock visual feedback
 */
export function pulseTargetingSensors(mesh: THREE.Group, active: boolean): void {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh && (child.name.includes('Sensor') || child.name === 'targetingArray')) {
      const mat = child.material;
      if (mat instanceof THREE.MeshPhongMaterial) {
        if (active) {
          mat.emissiveIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        } else {
          mat.emissiveIntensity = 0.3;
        }
      }
    }
  });
}
