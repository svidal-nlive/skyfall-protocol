import * as THREE from 'three';

/**
 * Boss Models - Large voxel-style models for boss encounters
 * Each boss has distinct visual design matching their combat role
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

function createVoxelBox(
  width: number,
  height: number,
  depth: number,
  color: number,
  emissive: number = 0x000000,
  emissiveIntensity: number = 0
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    metalness: 0.6,
    roughness: 0.4,
  });
  return new THREE.Mesh(geometry, material);
}

function createGlowingSphere(
  radius: number,
  color: number,
  emissiveIntensity: number = 2
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity,
    metalness: 0.2,
    roughness: 0.8,
  });
  return new THREE.Mesh(geometry, material);
}

// ============================================
// CARRIER DRONE - Act 1 Boss
// Massive aircraft carrier-style drone
// ============================================

export function createCarrierDroneModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'carrier-drone';
  
  const mainColor = 0x2a3a4a;
  const accentColor = 0x4a5a6a;
  const engineColor = 0xff4400;
  const lightColor = 0x00ffff;
  
  // Main hull - long flat carrier shape
  const hull = createVoxelBox(30, 4, 50, mainColor);
  group.add(hull);
  
  // Flight deck (top)
  const flightDeck = createVoxelBox(28, 1, 45, accentColor);
  flightDeck.position.set(0, 3, 0);
  group.add(flightDeck);
  
  // Control tower (island)
  const tower = createVoxelBox(6, 8, 8, mainColor);
  tower.position.set(12, 6, -10);
  group.add(tower);
  
  // Tower antenna
  const antenna = createVoxelBox(0.5, 4, 0.5, accentColor);
  antenna.position.set(12, 12, -10);
  group.add(antenna);
  
  // Hangar bay (front opening)
  const hangarFrame = createVoxelBox(20, 3, 2, accentColor);
  hangarFrame.position.set(0, 0, 26);
  group.add(hangarFrame);
  
  // Engine nacelles (4 corners - weak points)
  const enginePositions = [
    { x: -12, z: -20 },
    { x: 12, z: -20 },
    { x: -12, z: 15 },
    { x: 12, z: 15 },
  ];
  
  enginePositions.forEach((pos, i) => {
    // Engine housing
    const nacelle = createVoxelBox(5, 4, 8, accentColor);
    nacelle.position.set(pos.x, -2, pos.z);
    group.add(nacelle);
    
    // Engine glow (weak point indicator)
    const engineGlow = createGlowingSphere(1.5, engineColor, 3);
    engineGlow.position.set(pos.x, -2, pos.z - 4);
    engineGlow.name = `engine-${i + 1}`;
    group.add(engineGlow);
    
    // Engine exhaust
    const exhaust = createVoxelBox(3, 2, 1, 0x111111);
    exhaust.position.set(pos.x, -2, pos.z - 5);
    group.add(exhaust);
  });
  
  // Side armor plates
  const leftArmor = createVoxelBox(2, 3, 40, accentColor);
  leftArmor.position.set(-16, 0, 0);
  group.add(leftArmor);
  
  const rightArmor = createVoxelBox(2, 3, 40, accentColor);
  rightArmor.position.set(16, 0, 0);
  group.add(rightArmor);
  
  // Runway lights
  for (let i = 0; i < 8; i++) {
    const light = createGlowingSphere(0.3, lightColor, 2);
    light.position.set(-10 + i * 3, 3.5, 0);
    group.add(light);
  }
  
  // Missile launchers (sides)
  for (let i = 0; i < 4; i++) {
    const launcherL = createVoxelBox(3, 2, 4, 0x333333);
    launcherL.position.set(-14, 1, -15 + i * 10);
    group.add(launcherL);
    
    const launcherR = createVoxelBox(3, 2, 4, 0x333333);
    launcherR.position.set(14, 1, -15 + i * 10);
    group.add(launcherR);
  }
  
  // Underside detail
  const underPanel = createVoxelBox(20, 1, 30, 0x1a2a3a);
  underPanel.position.set(0, -3, 0);
  group.add(underPanel);
  
  return group;
}

// ============================================
// COMMAND SHIP - Act 2 Boss
// Heavily armored command vessel
// ============================================

export function createCommandShipModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'command-ship';
  
  const mainColor = 0x4a2a5a;
  const accentColor = 0x6a4a7a;
  const shieldColor = 0x00aaff;
  const bridgeColor = 0xff0066;
  
  // Main hull - wedge shaped like a star destroyer
  const hullMain = createVoxelBox(25, 8, 40, mainColor);
  group.add(hullMain);
  
  // Tapered front
  const hullFront = createVoxelBox(15, 6, 20, mainColor);
  hullFront.position.set(0, 0, 30);
  group.add(hullFront);
  
  const hullTip = createVoxelBox(8, 4, 10, accentColor);
  hullTip.position.set(0, 0, 45);
  group.add(hullTip);
  
  // Bridge tower (weak point in phase 3)
  const bridgeBase = createVoxelBox(10, 4, 12, accentColor);
  bridgeBase.position.set(0, 6, -5);
  group.add(bridgeBase);
  
  const bridgeTop = createVoxelBox(6, 3, 8, mainColor);
  bridgeTop.position.set(0, 9.5, -5);
  group.add(bridgeTop);
  
  // Bridge window (glowing weak point)
  const bridgeWindow = createGlowingSphere(1.5, bridgeColor, 0.5);
  bridgeWindow.position.set(0, 9.5, 0);
  bridgeWindow.name = 'bridge';
  group.add(bridgeWindow);
  
  // Shield generator domes
  const shieldGen1 = createGlowingSphere(3, shieldColor, 1.5);
  shieldGen1.position.set(-10, 6, -15);
  group.add(shieldGen1);
  
  const shieldGen2 = createGlowingSphere(3, shieldColor, 1.5);
  shieldGen2.position.set(10, 6, -15);
  group.add(shieldGen2);
  
  // Engine block (rear)
  const engineBlock = createVoxelBox(20, 10, 8, 0x2a1a3a);
  engineBlock.position.set(0, 0, -25);
  group.add(engineBlock);
  
  // Main engines (3)
  for (let i = -1; i <= 1; i++) {
    const engineGlow = createGlowingSphere(2.5, 0xff6600, 3);
    engineGlow.position.set(i * 6, 0, -30);
    group.add(engineGlow);
    
    const engineHousing = createVoxelBox(5, 5, 3, accentColor);
    engineHousing.position.set(i * 6, 0, -27);
    group.add(engineHousing);
  }
  
  // Side weapon batteries
  for (let side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const turret = createVoxelBox(4, 3, 4, accentColor);
      turret.position.set(side * 13, 5, 10 - i * 15);
      group.add(turret);
      
      const turretBarrel = createVoxelBox(1, 1, 6, 0x333333);
      turretBarrel.position.set(side * 13, 5, 15 - i * 15);
      group.add(turretBarrel);
    }
  }
  
  // Energy beam emitter (front)
  const beamEmitter = createGlowingSphere(2, 0xff00ff, 2);
  beamEmitter.position.set(0, 0, 50);
  group.add(beamEmitter);
  
  // Underside armor
  const underArmor = createVoxelBox(22, 2, 35, 0x3a2a4a);
  underArmor.position.set(0, -5, 0);
  group.add(underArmor);
  
  // Detail panels
  for (let i = 0; i < 5; i++) {
    const panel = createVoxelBox(8, 0.5, 6, accentColor);
    panel.position.set(0, 4.5, 20 - i * 10);
    group.add(panel);
  }
  
  return group;
}

// ============================================
// SWARM QUEEN - Act 3 Boss
// Organic-looking mechanical hive
// ============================================

export function createSwarmQueenModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'swarm-queen';
  
  const organicColor = 0x2a4a3a;
  const chitinColor = 0x1a3a2a;
  const coreColor = 0xff00aa;
  const eyeColor = 0x00ff88;
  
  // Central body - organic sphere cluster
  const mainBody = createGlowingSphere(12, organicColor, 0.3);
  group.add(mainBody);
  
  // Outer shell segments
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const segment = createVoxelBox(8, 15, 8, chitinColor);
    segment.position.set(
      Math.cos(angle) * 10,
      0,
      Math.sin(angle) * 10
    );
    segment.rotation.y = angle;
    segment.rotation.z = 0.3;
    group.add(segment);
  }
  
  // Core (weak point in phase 3)
  const core = createGlowingSphere(4, coreColor, 0.5);
  core.position.set(0, 0, 0);
  core.name = 'core';
  group.add(core);
  
  // Protective core shell (opens in phase 3)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const shell = createVoxelBox(6, 6, 2, chitinColor);
    shell.position.set(
      Math.cos(angle) * 5,
      0,
      Math.sin(angle) * 5
    );
    shell.rotation.y = angle;
    group.add(shell);
  }
  
  // Crown/head structure
  const crown = createVoxelBox(10, 8, 10, organicColor);
  crown.position.set(0, 12, 0);
  group.add(crown);
  
  // Eyes
  const eye1 = createGlowingSphere(2, eyeColor, 2);
  eye1.position.set(-3, 14, 5);
  group.add(eye1);
  
  const eye2 = createGlowingSphere(2, eyeColor, 2);
  eye2.position.set(3, 14, 5);
  group.add(eye2);
  
  // Mandibles
  const mandible1 = createVoxelBox(3, 2, 8, chitinColor);
  mandible1.position.set(-5, 10, 8);
  mandible1.rotation.z = -0.3;
  mandible1.rotation.y = 0.2;
  group.add(mandible1);
  
  const mandible2 = createVoxelBox(3, 2, 8, chitinColor);
  mandible2.position.set(5, 10, 8);
  mandible2.rotation.z = 0.3;
  mandible2.rotation.y = -0.2;
  group.add(mandible2);
  
  // Tentacles/appendages
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    
    // Base segment
    const tentacle1 = createVoxelBox(2, 2, 12, organicColor);
    tentacle1.position.set(
      Math.cos(angle) * 15,
      -5,
      Math.sin(angle) * 15
    );
    tentacle1.rotation.y = angle;
    tentacle1.rotation.x = 0.5;
    group.add(tentacle1);
    
    // Tip segment
    const tentacle2 = createVoxelBox(1.5, 1.5, 8, chitinColor);
    tentacle2.position.set(
      Math.cos(angle) * 22,
      -10,
      Math.sin(angle) * 22
    );
    tentacle2.rotation.y = angle;
    tentacle2.rotation.x = 0.8;
    group.add(tentacle2);
    
    // Claw
    const claw = createVoxelBox(1, 1, 3, 0x4a2a3a);
    claw.position.set(
      Math.cos(angle) * 27,
      -14,
      Math.sin(angle) * 27
    );
    claw.rotation.y = angle;
    claw.rotation.x = 1.2;
    group.add(claw);
  }
  
  // Egg sacs / spawn points
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const sac = createGlowingSphere(3, 0x4a6a5a, 0.5);
    sac.position.set(
      Math.cos(angle) * 12,
      -8,
      Math.sin(angle) * 12
    );
    group.add(sac);
  }
  
  // Hive entrance (front)
  const hiveEntrance = createVoxelBox(6, 4, 3, 0x1a2a1a);
  hiveEntrance.position.set(0, -5, 15);
  group.add(hiveEntrance);
  
  // Pulsing veins
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 8 + Math.random() * 4;
    const vein = createVoxelBox(0.5, 0.5, 10, 0x5a3a4a);
    vein.position.set(
      Math.cos(angle) * radius,
      Math.random() * 10 - 5,
      Math.sin(angle) * radius
    );
    vein.rotation.y = angle;
    vein.rotation.z = Math.random() * 0.5;
    group.add(vein);
  }
  
  // Tail/stinger
  const tailBase = createVoxelBox(6, 6, 10, organicColor);
  tailBase.position.set(0, -2, -15);
  group.add(tailBase);
  
  const tailMid = createVoxelBox(4, 4, 12, chitinColor);
  tailMid.position.set(0, -4, -28);
  tailMid.rotation.x = -0.2;
  group.add(tailMid);
  
  const stinger = createVoxelBox(2, 2, 8, 0x6a2a4a);
  stinger.position.set(0, -6, -40);
  stinger.rotation.x = -0.3;
  group.add(stinger);
  
  const stingerTip = createGlowingSphere(1.5, coreColor, 2);
  stingerTip.position.set(0, -7, -46);
  group.add(stingerTip);
  
  return group;
}

export default {
  createCarrierDroneModel,
  createCommandShipModel,
  createSwarmQueenModel,
};
