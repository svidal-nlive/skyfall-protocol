/**
 * EnemyModels - Distinct voxel-style models for each enemy aircraft type
 * 
 * Each enemy type is modeled after a real-world fighter jet:
 * - Phantom (Scout): JAS 39 Gripen - Small, agile Swedish fighter
 * - Viper (Fighter): Dassault Rafale - French multirole with canards
 * - Warden (Heavy): Chengdu J-20 Mighty Dragon - Large Chinese stealth
 * - Specter (Elite): F-22 Raptor - US stealth air superiority
 */

import * as THREE from 'three';
import { AircraftConfig, AircraftClass } from '../types/AircraftConfig';

/**
 * Create a mesh for an enemy based on its configuration
 */
export function createEnemyMesh(config: AircraftConfig): THREE.Group {
  let group: THREE.Group;
  switch (config.class) {
    case 'scout':
      group = createGripenMesh(config);
      break;
    case 'fighter':
      group = createRafaleMesh(config);
      break;
    case 'heavy':
      group = createJ20Mesh(config);
      break;
    case 'elite':
      group = createF22Mesh(config);
      break;
    default:
      group = createRafaleMesh(config);
  }
  
  // Disable frustum culling so enemies remain visible/updated even when outside camera frustum
  group.frustumCulled = false;
  group.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
      child.frustumCulled = false;
    }
  });
  
  return group;
}

/**
 * PHANTOM - JAS 39 Gripen Model
 * Swedish lightweight single-engine multirole fighter.
 * Distinctive features: Delta wing, canards, compact size, single engine
 */
function createGripenMesh(config: AircraftConfig): THREE.Group {
  const group = new THREE.Group();
  const scale = config.scale;

  const bodyMat = new THREE.MeshPhongMaterial({
    color: config.color,
    emissive: config.emissiveColor,
    emissiveIntensity: 0.3,
  });
  const accentMat = new THREE.MeshPhongMaterial({
    color: config.accentColor,
    emissive: config.emissiveColor,
    emissiveIntensity: 0.2,
  });
  const darkMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
  const cockpitMat = new THREE.MeshPhongMaterial({ 
    color: 0x334455, 
    emissive: 0x112233,
    transparent: true,
    opacity: 0.8,
  });

  // Slim fuselage - Gripen is compact
  const bodyGeo = new THREE.BoxGeometry(1.4 * scale, 0.7 * scale, 5.5 * scale);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Pointed nose cone
  const noseGeo = new THREE.ConeGeometry(0.5 * scale, 2 * scale, 6);
  const nose = new THREE.Mesh(noseGeo, darkMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -3.5 * scale;
  group.add(nose);

  // Cockpit canopy
  const canopyGeo = new THREE.BoxGeometry(0.8 * scale, 0.5 * scale, 1.5 * scale);
  const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
  canopy.position.set(0, 0.5 * scale, -1.5 * scale);
  group.add(canopy);

  // Delta wings - swept back
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(3.5 * scale, 1.5 * scale);
  wingShape.lineTo(3.2 * scale, 2 * scale);
  wingShape.lineTo(0, 0.8 * scale);
  wingShape.lineTo(0, 0);

  const wingExtrudeSettings = { depth: 0.12 * scale, bevelEnabled: false };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);

  const leftWing = new THREE.Mesh(wingGeo, accentMat);
  leftWing.rotation.x = Math.PI / 2;
  leftWing.position.set(0.6 * scale, 0, 0.5 * scale);
  group.add(leftWing);

  const rightWingShape = new THREE.Shape();
  rightWingShape.moveTo(0, 0);
  rightWingShape.lineTo(-3.5 * scale, 1.5 * scale);
  rightWingShape.lineTo(-3.2 * scale, 2 * scale);
  rightWingShape.lineTo(0, 0.8 * scale);
  rightWingShape.lineTo(0, 0);

  const rightWingGeo = new THREE.ExtrudeGeometry(rightWingShape, wingExtrudeSettings);
  const rightWing = new THREE.Mesh(rightWingGeo, accentMat);
  rightWing.rotation.x = Math.PI / 2;
  rightWing.position.set(-0.6 * scale, 0, 0.5 * scale);
  group.add(rightWing);

  // Canards - distinctive Gripen feature
  const canardGeo = new THREE.BoxGeometry(1.8 * scale, 0.08 * scale, 0.6 * scale);
  const leftCanard = new THREE.Mesh(canardGeo, bodyMat);
  leftCanard.position.set(1.2 * scale, 0.1 * scale, -2 * scale);
  leftCanard.rotation.z = -0.1;
  group.add(leftCanard);

  const rightCanard = new THREE.Mesh(canardGeo, bodyMat);
  rightCanard.position.set(-1.2 * scale, 0.1 * scale, -2 * scale);
  rightCanard.rotation.z = 0.1;
  group.add(rightCanard);

  // Single vertical stabilizer
  const tailGeo = new THREE.BoxGeometry(0.15 * scale, 1.4 * scale, 1.2 * scale);
  const tail = new THREE.Mesh(tailGeo, accentMat);
  tail.position.set(0, 0.8 * scale, 2 * scale);
  group.add(tail);

  // Single engine nozzle
  const engineGeo = new THREE.CylinderGeometry(0.4 * scale, 0.5 * scale, 1 * scale, 8);
  const engine = new THREE.Mesh(engineGeo, darkMat);
  engine.rotation.x = Math.PI / 2;
  engine.position.set(0, 0, 3 * scale);
  group.add(engine);

  // Engine glow
  const glowGeo = new THREE.SphereGeometry(0.35 * scale, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.9,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.z = 3.5 * scale;
  glow.name = 'engineGlow';
  group.add(glow);

  return group;
}

/**
 * VIPER - Dassault Rafale Model
 * French twin-engine multirole fighter.
 * Distinctive features: Delta wing, close-coupled canards, twin engines, curved fuselage
 */
function createRafaleMesh(config: AircraftConfig): THREE.Group {
  const group = new THREE.Group();
  const scale = config.scale;

  const bodyMat = new THREE.MeshPhongMaterial({
    color: config.color,
    emissive: config.emissiveColor,
    emissiveIntensity: 0.3,
  });
  const accentMat = new THREE.MeshPhongMaterial({
    color: config.accentColor,
    emissive: config.emissiveColor,
    emissiveIntensity: 0.2,
  });
  const darkMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
  const cockpitMat = new THREE.MeshPhongMaterial({ 
    color: 0x445566, 
    emissive: 0x223344,
    transparent: true,
    opacity: 0.8,
  });

  // Main fuselage - wider for twin engines
  const bodyGeo = new THREE.BoxGeometry(2.2 * scale, 1.2 * scale, 6 * scale);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Nose - more rounded than Gripen
  const noseGeo = new THREE.ConeGeometry(0.7 * scale, 2.5 * scale, 8);
  const nose = new THREE.Mesh(noseGeo, darkMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -4 * scale;
  group.add(nose);

  // Cockpit
  const canopyGeo = new THREE.BoxGeometry(0.9 * scale, 0.6 * scale, 1.8 * scale);
  const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
  canopy.position.set(0, 0.7 * scale, -1.5 * scale);
  group.add(canopy);

  // Delta wings - Rafale has a distinctive shape
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(4 * scale, 1 * scale);
  wingShape.lineTo(4.2 * scale, 2.5 * scale);
  wingShape.lineTo(2 * scale, 2 * scale);
  wingShape.lineTo(0, 0.5 * scale);
  wingShape.lineTo(0, 0);

  const wingExtrudeSettings = { depth: 0.15 * scale, bevelEnabled: false };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);

  const leftWing = new THREE.Mesh(wingGeo, accentMat);
  leftWing.rotation.x = Math.PI / 2;
  leftWing.position.set(1 * scale, -0.1 * scale, 0);
  group.add(leftWing);

  const rightWingShape = new THREE.Shape();
  rightWingShape.moveTo(0, 0);
  rightWingShape.lineTo(-4 * scale, 1 * scale);
  rightWingShape.lineTo(-4.2 * scale, 2.5 * scale);
  rightWingShape.lineTo(-2 * scale, 2 * scale);
  rightWingShape.lineTo(0, 0.5 * scale);
  rightWingShape.lineTo(0, 0);

  const rightWingGeo = new THREE.ExtrudeGeometry(rightWingShape, wingExtrudeSettings);
  const rightWing = new THREE.Mesh(rightWingGeo, accentMat);
  rightWing.rotation.x = Math.PI / 2;
  rightWing.position.set(-1 * scale, -0.1 * scale, 0);
  group.add(rightWing);

  // Close-coupled canards - signature Rafale feature
  const canardShape = new THREE.Shape();
  canardShape.moveTo(0, 0);
  canardShape.lineTo(1.5 * scale, 0.3 * scale);
  canardShape.lineTo(1.2 * scale, 0.8 * scale);
  canardShape.lineTo(0, 0.3 * scale);
  canardShape.lineTo(0, 0);

  const canardExtrudeSettings = { depth: 0.08 * scale, bevelEnabled: false };
  const canardGeo = new THREE.ExtrudeGeometry(canardShape, canardExtrudeSettings);

  const leftCanard = new THREE.Mesh(canardGeo, bodyMat);
  leftCanard.rotation.x = Math.PI / 2;
  leftCanard.position.set(0.8 * scale, 0.2 * scale, -2.5 * scale);
  group.add(leftCanard);

  const rightCanardShape = new THREE.Shape();
  rightCanardShape.moveTo(0, 0);
  rightCanardShape.lineTo(-1.5 * scale, 0.3 * scale);
  rightCanardShape.lineTo(-1.2 * scale, 0.8 * scale);
  rightCanardShape.lineTo(0, 0.3 * scale);
  rightCanardShape.lineTo(0, 0);

  const rightCanardGeo = new THREE.ExtrudeGeometry(rightCanardShape, canardExtrudeSettings);
  const rightCanard = new THREE.Mesh(rightCanardGeo, bodyMat);
  rightCanard.rotation.x = Math.PI / 2;
  rightCanard.position.set(-0.8 * scale, 0.2 * scale, -2.5 * scale);
  group.add(rightCanard);

  // Single vertical stabilizer
  const tailGeo = new THREE.BoxGeometry(0.15 * scale, 1.8 * scale, 1.5 * scale);
  const tail = new THREE.Mesh(tailGeo, accentMat);
  tail.position.set(0, 1 * scale, 2.2 * scale);
  group.add(tail);

  // Twin engine housings
  const engineHousingGeo = new THREE.BoxGeometry(0.8 * scale, 0.7 * scale, 2 * scale);
  const leftEngineHousing = new THREE.Mesh(engineHousingGeo, darkMat);
  leftEngineHousing.position.set(0.6 * scale, -0.3 * scale, 2.5 * scale);
  group.add(leftEngineHousing);

  const rightEngineHousing = new THREE.Mesh(engineHousingGeo, darkMat);
  rightEngineHousing.position.set(-0.6 * scale, -0.3 * scale, 2.5 * scale);
  group.add(rightEngineHousing);

  // Twin engine glows
  const glowGeo = new THREE.SphereGeometry(0.35 * scale, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.85,
  });

  const glow1 = new THREE.Mesh(glowGeo, glowMat);
  glow1.position.set(0.6 * scale, -0.3 * scale, 3.5 * scale);
  glow1.name = 'engineGlow';
  group.add(glow1);

  const glow2 = new THREE.Mesh(glowGeo, glowMat);
  glow2.position.set(-0.6 * scale, -0.3 * scale, 3.5 * scale);
  glow2.name = 'engineGlow2';
  group.add(glow2);

  return group;
}

/**
 * WARDEN - Chengdu J-20 Mighty Dragon Model
 * Chinese twin-engine stealth fighter.
 * Distinctive features: Very long fuselage, canards, canted vertical stabilizers, 
 * all-moving horizontal tails, DSI intakes
 */
function createJ20Mesh(config: AircraftConfig): THREE.Group {
  const group = new THREE.Group();
  const scale = config.scale;

  const bodyMat = new THREE.MeshPhongMaterial({
    color: config.color,
    emissive: config.emissiveColor,
    emissiveIntensity: 0.3,
  });
  const accentMat = new THREE.MeshPhongMaterial({
    color: config.accentColor,
    emissive: config.emissiveColor,
    emissiveIntensity: 0.2,
  });
  const stealthMat = new THREE.MeshPhongMaterial({
    color: 0x2a2a3a,
    emissive: 0x111122,
    emissiveIntensity: 0.1,
  });
  const cockpitMat = new THREE.MeshPhongMaterial({ 
    color: 0x334455, 
    emissive: 0x112233,
    transparent: true,
    opacity: 0.7,
  });

  // Long main fuselage - J-20 is notably long
  const bodyGeo = new THREE.BoxGeometry(2.8 * scale, 1.5 * scale, 8 * scale);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Chiseled stealth nose
  const noseGeo = new THREE.BoxGeometry(2 * scale, 1 * scale, 3 * scale);
  const nose = new THREE.Mesh(noseGeo, stealthMat);
  nose.position.z = -5 * scale;
  group.add(nose);

  // Nose tip
  const noseTipGeo = new THREE.ConeGeometry(0.6 * scale, 1.5 * scale, 4);
  const noseTip = new THREE.Mesh(noseTipGeo, stealthMat);
  noseTip.rotation.x = -Math.PI / 2;
  noseTip.rotation.y = Math.PI / 4; // Diamond shape
  noseTip.position.z = -6.5 * scale;
  group.add(noseTip);

  // Bubble canopy
  const canopyGeo = new THREE.SphereGeometry(0.7 * scale, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
  canopy.position.set(0, 0.7 * scale, -3 * scale);
  canopy.scale.set(1, 0.8, 2);
  group.add(canopy);

  // DSI (Diverterless Supersonic Inlet) bumps
  const dsiGeo = new THREE.SphereGeometry(0.5 * scale, 8, 8, 0, Math.PI);
  const leftDsi = new THREE.Mesh(dsiGeo, bodyMat);
  leftDsi.position.set(1.2 * scale, -0.2 * scale, -2 * scale);
  leftDsi.rotation.z = Math.PI / 2;
  group.add(leftDsi);

  const rightDsi = new THREE.Mesh(dsiGeo, bodyMat);
  rightDsi.position.set(-1.2 * scale, -0.2 * scale, -2 * scale);
  rightDsi.rotation.z = -Math.PI / 2;
  group.add(rightDsi);

  // Delta wings - large span
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(5 * scale, 2 * scale);
  wingShape.lineTo(4.5 * scale, 3.5 * scale);
  wingShape.lineTo(0, 1.5 * scale);
  wingShape.lineTo(0, 0);

  const wingExtrudeSettings = { depth: 0.2 * scale, bevelEnabled: false };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);

  const leftWing = new THREE.Mesh(wingGeo, accentMat);
  leftWing.rotation.x = Math.PI / 2;
  leftWing.position.set(1.2 * scale, -0.2 * scale, 1 * scale);
  group.add(leftWing);

  const rightWingShape = new THREE.Shape();
  rightWingShape.moveTo(0, 0);
  rightWingShape.lineTo(-5 * scale, 2 * scale);
  rightWingShape.lineTo(-4.5 * scale, 3.5 * scale);
  rightWingShape.lineTo(0, 1.5 * scale);
  rightWingShape.lineTo(0, 0);

  const rightWingGeo = new THREE.ExtrudeGeometry(rightWingShape, wingExtrudeSettings);
  const rightWing = new THREE.Mesh(rightWingGeo, accentMat);
  rightWing.rotation.x = Math.PI / 2;
  rightWing.position.set(-1.2 * scale, -0.2 * scale, 1 * scale);
  group.add(rightWing);

  // All-moving canards - large and forward
  const canardGeo = new THREE.BoxGeometry(2.5 * scale, 0.1 * scale, 1 * scale);
  const leftCanard = new THREE.Mesh(canardGeo, bodyMat);
  leftCanard.position.set(2 * scale, 0.3 * scale, -3.5 * scale);
  leftCanard.rotation.z = -0.15;
  group.add(leftCanard);

  const rightCanard = new THREE.Mesh(canardGeo, bodyMat);
  rightCanard.position.set(-2 * scale, 0.3 * scale, -3.5 * scale);
  rightCanard.rotation.z = 0.15;
  group.add(rightCanard);

  // Canted vertical stabilizers - distinctive J-20 feature
  const tailGeo = new THREE.BoxGeometry(0.15 * scale, 1.8 * scale, 1.8 * scale);
  
  const leftTail = new THREE.Mesh(tailGeo, accentMat);
  leftTail.position.set(1.2 * scale, 0.8 * scale, 3.5 * scale);
  leftTail.rotation.z = -0.25; // Canted outward
  group.add(leftTail);

  const rightTail = new THREE.Mesh(tailGeo, accentMat);
  rightTail.position.set(-1.2 * scale, 0.8 * scale, 3.5 * scale);
  rightTail.rotation.z = 0.25; // Canted outward
  group.add(rightTail);

  // All-moving horizontal stabilizers
  const hStabGeo = new THREE.BoxGeometry(2 * scale, 0.1 * scale, 1.2 * scale);
  const leftHStab = new THREE.Mesh(hStabGeo, bodyMat);
  leftHStab.position.set(2 * scale, -0.2 * scale, 3.5 * scale);
  group.add(leftHStab);

  const rightHStab = new THREE.Mesh(hStabGeo, bodyMat);
  rightHStab.position.set(-2 * scale, -0.2 * scale, 3.5 * scale);
  group.add(rightHStab);

  // Twin engine bays
  const engineBayGeo = new THREE.BoxGeometry(1 * scale, 1 * scale, 2.5 * scale);
  const leftEngineBay = new THREE.Mesh(engineBayGeo, stealthMat);
  leftEngineBay.position.set(0.9 * scale, -0.2 * scale, 4 * scale);
  group.add(leftEngineBay);

  const rightEngineBay = new THREE.Mesh(engineBayGeo, stealthMat);
  rightEngineBay.position.set(-0.9 * scale, -0.2 * scale, 4 * scale);
  group.add(rightEngineBay);

  // Twin engine glows - purple for the Dragon
  const glowGeo = new THREE.SphereGeometry(0.45 * scale, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x9944ff,
    transparent: true,
    opacity: 0.85,
  });

  const glow1 = new THREE.Mesh(glowGeo, glowMat);
  glow1.position.set(0.9 * scale, -0.2 * scale, 5.2 * scale);
  glow1.name = 'engineGlow';
  group.add(glow1);

  const glow2 = new THREE.Mesh(glowGeo, glowMat);
  glow2.position.set(-0.9 * scale, -0.2 * scale, 5.2 * scale);
  glow2.name = 'engineGlow2';
  group.add(glow2);

  return group;
}

/**
 * SPECTER - F-22 Raptor Model
 * American twin-engine stealth air superiority fighter.
 * Distinctive features: Canted twin tails, trapezoidal wings, 
 * angular stealth faceting, wide flat fuselage
 */
function createF22Mesh(config: AircraftConfig): THREE.Group {
  const group = new THREE.Group();
  const scale = config.scale;

  const bodyMat = new THREE.MeshPhongMaterial({
    color: config.color,
    emissive: config.emissiveColor,
    emissiveIntensity: 0.4,
  });
  const accentMat = new THREE.MeshPhongMaterial({
    color: config.accentColor,
    emissive: config.emissiveColor,
    emissiveIntensity: 0.3,
  });
  const stealthMat = new THREE.MeshPhongMaterial({
    color: 0x1a1a2a,
    emissive: 0x110011,
    emissiveIntensity: 0.15,
  });
  const cockpitMat = new THREE.MeshPhongMaterial({ 
    color: 0x443355, 
    emissive: 0x221133,
    transparent: true,
    opacity: 0.75,
  });

  // Wide, flat fuselage - F-22 blends into wings
  const bodyGeo = new THREE.BoxGeometry(3 * scale, 1.1 * scale, 6.5 * scale);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Angular stealth nose
  const noseShape = new THREE.Shape();
  noseShape.moveTo(0, 0);
  noseShape.lineTo(1.2 * scale, 0);
  noseShape.lineTo(0, -3 * scale);
  noseShape.lineTo(-1.2 * scale, 0);
  noseShape.lineTo(0, 0);

  const noseExtrudeSettings = { depth: 0.7 * scale, bevelEnabled: false };
  const noseGeo = new THREE.ExtrudeGeometry(noseShape, noseExtrudeSettings);
  const nose = new THREE.Mesh(noseGeo, stealthMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.35 * scale, -3.25 * scale);
  group.add(nose);

  // Cockpit - golden tint like real F-22
  const canopyGeo = new THREE.BoxGeometry(1 * scale, 0.5 * scale, 2 * scale);
  const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
  canopy.position.set(0, 0.7 * scale, -1.5 * scale);
  group.add(canopy);

  // Trapezoidal wings - blended with fuselage
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(4.5 * scale, 0.5 * scale);
  wingShape.lineTo(4 * scale, 2 * scale);
  wingShape.lineTo(1.5 * scale, 2.5 * scale);
  wingShape.lineTo(0, 0.8 * scale);
  wingShape.lineTo(0, 0);

  const wingExtrudeSettings = { depth: 0.12 * scale, bevelEnabled: false };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);

  const leftWing = new THREE.Mesh(wingGeo, accentMat);
  leftWing.rotation.x = Math.PI / 2;
  leftWing.position.set(1.3 * scale, -0.1 * scale, 0.5 * scale);
  group.add(leftWing);

  const rightWingShape = new THREE.Shape();
  rightWingShape.moveTo(0, 0);
  rightWingShape.lineTo(-4.5 * scale, 0.5 * scale);
  rightWingShape.lineTo(-4 * scale, 2 * scale);
  rightWingShape.lineTo(-1.5 * scale, 2.5 * scale);
  rightWingShape.lineTo(0, 0.8 * scale);
  rightWingShape.lineTo(0, 0);

  const rightWingGeo = new THREE.ExtrudeGeometry(rightWingShape, wingExtrudeSettings);
  const rightWing = new THREE.Mesh(rightWingGeo, accentMat);
  rightWing.rotation.x = Math.PI / 2;
  rightWing.position.set(-1.3 * scale, -0.1 * scale, 0.5 * scale);
  group.add(rightWing);

  // Distinctive canted twin tails - F-22's most recognizable feature
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0.15 * scale, 0);
  tailShape.lineTo(0.15 * scale, 1.8 * scale);
  tailShape.lineTo(-0.3 * scale, 1.5 * scale);
  tailShape.lineTo(0, 0);

  const tailExtrudeSettings = { depth: 1.5 * scale, bevelEnabled: false };
  const tailGeo = new THREE.ExtrudeGeometry(tailShape, tailExtrudeSettings);

  const leftTail = new THREE.Mesh(tailGeo, accentMat);
  leftTail.position.set(1 * scale, 0.4 * scale, 2 * scale);
  leftTail.rotation.y = 0.1;
  leftTail.rotation.z = -0.4; // Canted outward ~22 degrees
  group.add(leftTail);

  const rightTail = new THREE.Mesh(tailGeo, accentMat);
  rightTail.position.set(-1 * scale, 0.4 * scale, 2 * scale);
  rightTail.rotation.y = -0.1;
  rightTail.rotation.z = 0.4; // Canted outward
  group.add(rightTail);

  // Horizontal stabilizers
  const hStabGeo = new THREE.BoxGeometry(2.5 * scale, 0.1 * scale, 1.2 * scale);
  const leftHStab = new THREE.Mesh(hStabGeo, bodyMat);
  leftHStab.position.set(2.2 * scale, 0, 2.8 * scale);
  group.add(leftHStab);

  const rightHStab = new THREE.Mesh(hStabGeo, bodyMat);
  rightHStab.position.set(-2.2 * scale, 0, 2.8 * scale);
  group.add(rightHStab);

  // Twin engine rectangular nozzles - 2D thrust vectoring look
  const nozzleGeo = new THREE.BoxGeometry(0.9 * scale, 0.5 * scale, 1.2 * scale);
  const leftNozzle = new THREE.Mesh(nozzleGeo, stealthMat);
  leftNozzle.position.set(0.8 * scale, -0.2 * scale, 3.5 * scale);
  group.add(leftNozzle);

  const rightNozzle = new THREE.Mesh(nozzleGeo, stealthMat);
  rightNozzle.position.set(-0.8 * scale, -0.2 * scale, 3.5 * scale);
  group.add(rightNozzle);

  // Engine glow - magenta for elite Specter
  const glowGeo = new THREE.SphereGeometry(0.4 * scale, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.9,
  });

  const glow1 = new THREE.Mesh(glowGeo, glowMat);
  glow1.position.set(0.8 * scale, -0.2 * scale, 4.2 * scale);
  glow1.name = 'engineGlow';
  group.add(glow1);

  const glow2 = new THREE.Mesh(glowGeo, glowMat);
  glow2.position.set(-0.8 * scale, -0.2 * scale, 4.2 * scale);
  glow2.name = 'engineGlow2';
  group.add(glow2);

  // Sensor pod under nose - targeting system
  const sensorGeo = new THREE.SphereGeometry(0.25 * scale, 8, 8);
  const sensorMat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.7,
  });
  const sensor = new THREE.Mesh(sensorGeo, sensorMat);
  sensor.position.set(0, -0.5 * scale, -2.5 * scale);
  sensor.name = 'sensor';
  group.add(sensor);

  return group;
}

/**
 * Update enemy mesh for cloak effect (Specter)
 */
export function applyCloakEffect(mesh: THREE.Group, intensity: number) {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
      const mat = child.material as THREE.MeshPhongMaterial;
      if (mat.transparent !== undefined) {
        mat.transparent = true;
        mat.opacity = 1 - intensity * 0.8; // Max 80% invisible
      }
    }
  });
}

/**
 * Remove cloak effect
 */
export function removeCloakEffect(mesh: THREE.Group) {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
      const mat = child.material as THREE.MeshPhongMaterial;
      if (mat.transparent !== undefined) {
        mat.opacity = 1;
      }
    }
  });
}

/**
 * Update engine glow based on speed
 */
export function updateEngineGlow(mesh: THREE.Group, speedRatio: number) {
  mesh.traverse((child) => {
    if (child.name === 'engineGlow' || child.name === 'engineGlow2') {
      const glow = child as THREE.Mesh;
      glow.scale.setScalar(0.8 + speedRatio * 0.4);
      const mat = glow.material as THREE.MeshBasicMaterial;
      if (mat.opacity !== undefined) {
        mat.opacity = 0.5 + speedRatio * 0.4;
      }
    }
  });
}
