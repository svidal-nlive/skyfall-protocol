# Voxel Ace Defender - Directional Controls Guide

This document explains the coordinate system and how to adjust directional controls for flight, camera, and maneuvers.

## Coordinate System

Three.js uses a **right-handed coordinate system**:

```
        +Y (Up)
         |
         |
         |_______ +X (Right)
        /
       /
      +Z (Toward Camera / Backward)
```

- **+X** = Right
- **-X** = Left
- **+Y** = Up
- **-Y** = Down
- **+Z** = Toward camera (backward from jet's perspective)
- **-Z** = Away from camera (forward from jet's perspective)

### Jet Orientation
The jet faces **-Z** (forward). When the jet's quaternion is identity (no rotation):
- Forward = `(0, 0, -1)`
- Right = `(1, 0, 0)`
- Up = `(0, 1, 0)`

---

## Roll, Pitch, Yaw Conventions

Using Euler angles with `'YXZ'` order:

| Axis | Rotation | Positive Direction |
|------|----------|-------------------|
| **X (Pitch)** | Nose up/down | Positive = nose down |
| **Y (Yaw)** | Turn left/right | Positive = turn left (counter-clockwise from above) |
| **Z (Roll)** | Bank left/right | Positive = roll left (left wing down) |

---

## FlightController Key Mappings

Located in `game/FlightController.ts`:

### Keyboard Input → Actions
```typescript
case 'KeyW': pitch down (dive)
case 'KeyS': pitch up (climb)
case 'KeyA': turn left (HERO mode) / roll left (ACE/SIM)
case 'KeyD': turn right (HERO mode) / roll right (ACE/SIM)
case 'KeyQ': Barrel Roll LEFT (evasive maneuver)
case 'KeyE': Barrel Roll RIGHT (evasive maneuver)
case 'Shift': Boost
case 'KeyB': Brake
```

### HERO Mode (Default)
- A/D controls **yaw** (flat turns) - plane stays level
- Q/E triggers **Barrel Roll** evasive maneuver
- Strong auto-stabilization keeps wings level

### ACE/SIM Mode
- A/D controls **roll** 
- Q/E triggers **Barrel Roll** evasive maneuver
- Less or no stabilization

---

## Barrel Roll Evasive Maneuver

Located in `game/FlightController.ts`:

### Trigger
```typescript
// Q key = barrel roll left
triggerBarrelRoll(-1)

// E key = barrel roll right  
triggerBarrelRoll(1)
```

### Mechanics
1. **Duration**: 0.5 seconds for full 360° roll
2. **Cooldown**: 0.8 seconds before next roll
3. **Lateral movement**: Slight sideways slide during roll (8 units)
4. **Camera**: Stays level, doesn't follow the roll

### Implementation
```typescript
// Roll angle increases from 0 to 360°
const rollAngle = direction * Math.PI * 2 * easeInOut(progress);

// Applied as rotation around Z-axis
rollQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollAngle);
this.quaternion.copy(startQuat).multiply(rollQuat);
```

---

## Camera System

Located in `game/GameEngine.ts`, method `updateCamera()`:

### Camera Position (Chase Cam)
```typescript
const offsetVector = new THREE.Vector3(0, 4.5, 6.0).applyQuaternion(jetQuat);
// 0 = centered horizontally
// 4.5 = above the jet
// 6.0 = behind the jet
```

### During Evasive Maneuver
```typescript
if (isEvading) {
  // Camera ignores jet roll, stays level
  euler.z = 0;
  cameraFollowQuat.setFromEuler(euler);
}
```

---

## Common Fixes

### "Movement/Rotation is Inverted"
1. Check the sign in the input mapping
2. For roll: positive = left wing down, negative = right wing down
3. For yaw: positive = turn left, negative = turn right

### "Barrel Roll Goes Wrong Direction"
- `direction = -1` → roll left (positive Z rotation)
- `direction = 1` → roll right (negative Z rotation)
- Invert the direction parameter if needed

---

## Quick Reference

| Action | Code Location | Key Variable |
|--------|---------------|--------------|
| Keyboard mapping | `FlightController.handleKeyDown()` | `this.input.*` |
| HERO flat turns | `FlightController.update()` | `profile.flatTurnMode` |
| Barrel Roll | `FlightController.triggerBarrelRoll()` | `evasiveDirection` |
| Camera position | `GameEngine.updateCamera()` | `offsetVector` |
| Camera during evasive | `GameEngine.updateCamera()` | `isEvading`, `cameraFollowQuat` |

