# Skyfall Protocol - Implementation Roadmap

## 🎮 Game Vision

**Title:** Skyfall Protocol (Voxel Ace: Defender)  
**Genre:** Arcade Flight Combat with Roguelite Progression  
**Theme:** Skyfall Protocol  

### The Story
> *Year 2157. The clouds have swallowed the Earth.*  
> *Humanity's last hope floats above the storm - the flying fortress BASTION.*  
> *You are a Voxel Ace - one of the few pilots who can navigate the deadly skies.*  
> *The swarm is coming. Defend what remains.*

### Core Loop
1. **Launch** from Bastion into combat wave
2. **Defend** territories (POIs) from drone swarms
3. **Survive** increasingly difficult enemy compositions
4. **Return** to Bastion between waves for upgrades
5. **Progress** through 3 Acts, each ending with a Boss
6. **Unlock** new aircraft and permanent upgrades

---

## 📊 Implementation Progress

| Phase | Name | Status | Priority |
|-------|------|--------|----------|
| 1 | Multi-Target Locking | ✅ Complete | 🔴 Critical |
| 2 | Regenerative Missiles + Cannon | ✅ Complete | 🔴 Critical |
| 3 | State-Based Enemy AI + POI | ✅ Complete | 🔴 Critical |
| 4 | Damage, Destruction & Scoring | ✅ Complete | 🔴 Critical |
| 5 | Tactical Radar System | ✅ Complete | 🔴 Critical |
| 6 | Aircraft Framework & Enemy Variety | ✅ Complete | 🔴 Critical |
| 7 | Player Aircraft Garage | ✅ Complete | 🟡 High |
| 8 | Wave System & Progression | ✅ Complete | 🔴 Critical |
| 9 | Player Health & Game Over | ✅ Complete | 🔴 Critical |
| 10 | Upgrade Shop & Currency | ✅ Complete | 🟡 High |
| 11 | Story Integration & Briefings | ✅ Complete | 🟡 High |
| 12 | Boss Encounters | ✅ Complete | 🟡 High |
| 13 | Audio & Music | ✅ Complete | 🟢 Medium |
| 14 | Responsive HUD Refactor | ✅ Complete | 🟡 High |
| 15 | Polish & Effects | ✅ Complete | 🟢 Medium |
| 16 | Endless Mode | ⬜ Not Started | 🟢 Medium |

---

## ✅ Phase 1: Multi-Target Locking System [COMPLETE]

**Goal:** Implement multi-target lock-on system with up to 5 simultaneous locks  
**Files Created:** `game/TargetingController.ts`, `components/Crosshair.tsx`, `components/TargetingHUD.tsx`

### Checklist
- [x] Create `TargetingController.ts` with LockState enum
- [x] Implement lock array system (5 max locks)
- [x] Lock acquisition timer (1.0 second - reduced from 2.0s)
- [x] FOV-based target detection
- [x] Line-of-sight and range validation
- [x] Primary target selection (closest locked)
- [x] Lead point calculation for cannons
- [x] Crosshair component with lock indicators
- [x] TargetingHUD with lock slot display
- [x] Integration with GameEngine
- [x] Color coding: cyan → yellow → red

### Key Parameters
```typescript
LOCK_ACQUISITION_TIME = 1.0  // seconds
MAX_LOCKS = 5
LOCK_RANGE = 500
FOV_DEGREES = 30
```

---

## ✅ Phase 2: Regenerative Missiles + Cannon [COMPLETE]

**Goal:** Dual weapon system with regenerating missiles and infinite cannon  
**Files Created:** `game/MissileController.ts`, `game/CannonController.ts`, `components/WeaponsHUD.tsx`

### Checklist
- [x] Create `MissileController.ts` with homing logic
- [x] Missile pool system (6 missiles max)
- [x] Regeneration timer (4 seconds per missile)
- [x] Proportional navigation guidance
- [x] Create `CannonController.ts` with projectile pool
- [x] Cannon fire rate (10 rounds/second)
- [x] Weak homing for cannon rounds
- [x] WeaponsHUD component showing ammo/reload
- [x] Integration with TargetingController
- [x] Fire controls (Left Click = Cannon, Right Click = Missile)

### Key Parameters
```typescript
// Missiles
MAX_MISSILES = 6
RELOAD_TIME = 4.0  // seconds
MISSILE_SPEED = 150
TURN_RATE = 3.0

// Cannon
FIRE_RATE = 10  // rounds/second
CANNON_SPEED = 300
POOL_SIZE = 50
```

---

## ✅ Phase 3: State-Based Enemy AI + POI System [COMPLETE]

**Goal:** Enemies with patrol, engagement, and retreat behaviors tied to territories  
**Files Created:** `game/EnemyAI.ts`, `game/EnemyManager.ts`

### Checklist
- [x] Create `EnemyAI.ts` with state machine
- [x] PATROL state: orbit around POI
- [x] ENGAGEMENT state: aggressive pursuit
- [x] RETREAT state: return to POI when damaged
- [x] DESTROYED state: cleanup
- [x] State transition logic
- [x] Create `EnemyManager.ts` with POI system
- [x] 6 POI territories with threat levels
- [x] Enemy spawning at POIs
- [x] MAX_ENEMIES = 20 cap
- [x] Integration with GameEngine
- [x] `getStateName()` method for radar display
- [x] `getEnemyState()` and `getEncounterByPOI()` accessors

### POI Territories
```typescript
const POIS = [
  { name: "Alpha Station", position: (200, 50, 200), threatLevel: 1 },
  { name: "Bravo Outpost", position: (-300, 80, 100), threatLevel: 2 },
  { name: "Charlie Depot", position: (100, 30, -250), threatLevel: 2 },
  { name: "Delta Fortress", position: (-200, 100, -300), threatLevel: 3 },
  { name: "Echo Relay", position: (350, 60, -100), threatLevel: 3 },
  { name: "Foxtrot Command", position: (0, 120, 400), threatLevel: 4 }
]
```

---

## ✅ Phase 4: Damage, Destruction & Scoring [COMPLETE]

**Goal:** Visual feedback for hits, explosions, and score tracking  
**Files Created:** `game/ExplosionManager.ts`, `game/ScoreManager.ts`, `components/ScoreHUD.tsx`

### Checklist
- [x] Create `ExplosionManager.ts` with particle effects
- [x] Voxel debris system (12 pieces per explosion)
- [x] Shockwave sphere effect
- [x] Screen shake events
- [x] Create `ScoreManager.ts` with combo system
- [x] Base kill points: 100
- [x] Combo multiplier (3 second window)
- [x] Max combo: 10x
- [x] High score persistence (localStorage)
- [x] ScoreHUD component
- [x] Kill confirmation popups
- [x] Integration with GameEngine

### Scoring Formula
```typescript
points = BASE_KILL_POINTS * comboMultiplier * threatLevelBonus
// threatLevelBonus = 1.0 + (threatLevel * 0.25)
```

---

## ✅ Phase 5: Tactical Radar System [COMPLETE]

**Goal:** Mini-map radar showing enemies, POIs, and tactical information  
**Files Created:** `components/RadarHUD.tsx`

### Checklist
- [x] Create `RadarHUD.tsx` with canvas rendering
- [x] 140x140 pixel radar display
- [x] Player-centered view with heading rotation
- [x] Enemy blips with color-coded states
- [x] POI markers on radar
- [x] Range rings for distance reference
- [x] Cardinal direction indicators
- [x] GameEngine dispatchRadarState() integration
- [x] Real-time updates from EnemyManager

### Radar Colors
```typescript
PATROL → Green (#00ff88)
ENGAGEMENT → Red (#ff4444)
RETREAT → Yellow (#ffff00)
POI → Cyan (#00ffff)
```

---

## ✅ Phase 6: Aircraft Framework & Enemy Variety [COMPLETE]

**Goal:** Create config-driven aircraft system with 4 distinct enemy types  
**Priority:** 🔴 Critical  
**Completed:** January 18, 2026

### 6.1 Aircraft Configuration System
- [x] Create `game/types/AircraftConfig.ts`
  - AircraftConfig interface with stats, visuals, behavior
  - Star rating system (1-5 stars = 20-100 stat points)
  - Helper functions for effective stat calculation
  - Support for special abilities

- [x] Create `game/data/enemyAircraftConfigs.ts`
  - 4 enemy configurations defined
  - Threat level spawn weights
  - Type selection function

### 6.2 Enemy Aircraft Types

#### Phantom (Scout) - Threat Level 1 ✅
- [x] PhantomConfig defined
  ```typescript
  {
    speed: 5 ★★★★★, agility: 4 ★★★★, armor: 1 ★, firepower: 1 ★
    color: cyan, scale: 0.6, retreatHealth: 0.5, points: 75
  }
  ```
- [x] Slim, arrow-like voxel model
- [x] Behavior: Quick passes, frequent retreats, hard to hit

#### Viper (Fighter) - Threat Level 2 ✅
- [x] ViperConfig defined
  ```typescript
  {
    speed: 3 ★★★, agility: 3 ★★★, armor: 3 ★★★, firepower: 3 ★★★
    color: red, scale: 0.8, retreatHealth: 0.3, points: 100
  }
  ```
- [x] Balanced fighter voxel model
- [x] Behavior: Standard dogfighting, aggressive

#### Warden (Heavy) - Threat Level 3 ✅
- [x] WardenConfig defined
  ```typescript
  {
    speed: 1 ★, agility: 1 ★, armor: 5 ★★★★★, firepower: 4 ★★★★
    color: purple, scale: 1.2, retreatHealth: 0.2, points: 200
  }
  ```
- [x] Bulky, armored voxel model with twin engines
- [x] Behavior: Slow but tanky, punishing hits

#### Specter (Elite) - Threat Level 4 ✅
- [x] SpecterConfig defined
  ```typescript
  {
    speed: 4 ★★★★, agility: 4 ★★★★, armor: 4 ★★★★, firepower: 4 ★★★★
    color: magenta, scale: 1.0, retreatHealth: 0.15, points: 300
    specialAbility: 'cloak'
  }
  ```
- [x] Sleek, menacing voxel model
- [x] Behavior: Unpredictable, uses cloak ability
- [x] Special: Brief cloak (2s) when taking damage

### 6.3 Config-Driven EnemyAI
- [x] Modified `EnemyAI.ts` constructor to accept `AircraftConfig`
- [x] Stats calculated from config via helper functions
- [x] Speed/turn rates scale with config values
- [x] Health set from armor rating
- [x] Retreat threshold from config
- [x] Cloak ability implementation for Specter

### 6.4 EnemyManager Variety Spawning
- [x] Modified spawn logic to select aircraft type by threat level
- [x] Threat 1 POIs: 80% Phantom, 20% Viper
- [x] Threat 2 POIs: 40% Phantom, 50% Viper, 10% Warden
- [x] Threat 3 POIs: 10% Phantom, 30% Viper, 40% Warden, 20% Specter
- [x] Threat 4 POIs: 10% Viper, 30% Warden, 60% Specter
- [x] Config passed to EnemyAI on creation

### 6.5 Visual Distinction
- [x] Created `game/models/EnemyModels.ts`
- [x] Phantom: Small, dart-shaped, cyan tint, swept wings
- [x] Viper: Medium, aggressive angles, red tint
- [x] Warden: Large, blocky, purple tint, twin engines
- [x] Specter: Medium-large, sleek stealth design, magenta tint
- [x] Each model immediately recognizable by silhouette

### 6.6 Scoring by Enemy Type
- [x] ScoreManager accepts enemy type info from events
- [x] Base points from AircraftConfig
- [x] 25% bonus multiplier for elite class kills
- [x] Kill statistics tracked by type (phantom, viper, warden, specter)
- [x] Enemy name shown in kill confirmation popup

### 6.7 Files Created/Modified
```
game/
├── types/
│   └── AircraftConfig.ts     [NEW]
├── data/
│   └── enemyAircraftConfigs.ts [NEW]
├── models/
│   └── EnemyModels.ts        [NEW]
├── EnemyAI.ts                [MODIFIED]
├── EnemyManager.ts           [MODIFIED]
└── ScoreManager.ts           [MODIFIED]

components/
└── ScoreHUD.tsx              [MODIFIED]
```

---

## ✅ Phase 7: Player Aircraft Garage [COMPLETE]

**Goal:** Multiple playable aircraft with distinct characteristics  
**Priority:** 🟡 High  
**Est. Duration:** 2 days

### 7.1 Player Aircraft Configurations
- [x] Create `game/data/playerAircraftConfigs.ts`

#### Falcon (Starter)
- [x] Default unlocked aircraft
  ```typescript
  {
    id: 'falcon',
    name: 'F-22 Falcon',
    speed: 3,      // ★★★
    armor: 2,      // ★★
    missiles: 6,
    cannonDamage: 1.0,
    special: null,
    unlockCondition: 'default'
  }
  ```

#### Switchblade (Speed)
- [x] Unlock: 1,000 career points
  ```typescript
  {
    id: 'switchblade',
    name: 'X-47 Switchblade',
    speed: 5,      // ★★★★★
    armor: 1,      // ★
    missiles: 4,
    cannonDamage: 0.8,
    special: 'afterburner',
    unlockCondition: { type: 'points', value: 1000 }
  }
  ```

#### Ironclad (Tank)
- [x] Unlock: Complete Act 1
  ```typescript
  {
    id: 'ironclad',
    name: 'A-10 Ironclad',
    speed: 2,      // ★★
    armor: 4,      // ★★★★
    missiles: 8,
    cannonDamage: 1.5,
    special: 'armorPlating',
    unlockCondition: { type: 'act', value: 1 }
  }
  ```

#### Wraith (Stealth)
- [x] Unlock: Complete Act 2
  ```typescript
  {
    id: 'wraith',
    name: 'SR-71 Wraith',
    speed: 4,      // ★★★★
    armor: 2,      // ★★
    missiles: 5,
    cannonDamage: 1.0,
    special: 'cloak',
    unlockCondition: { type: 'act', value: 2 }
  }
  ```

#### Archon (Elite)
- [x] Unlock: Complete Campaign
  ```typescript
  {
    id: 'archon',
    name: 'XF-108 Archon',
    speed: 4,      // ★★★★
    armor: 4,      // ★★★★
    missiles: 8,
    cannonDamage: 1.2,
    special: 'dualLock',
    unlockCondition: { type: 'campaign', value: true }
  }
  ```

### 7.2 Aircraft Selection UI
- [x] Create `components/AircraftSelect.tsx`
- [x] Grid display of all aircraft
- [x] Locked aircraft shown with unlock requirements
- [x] Stats comparison view
- [x] 3D preview of selected aircraft
- [x] Confirm selection button

### 7.3 Unlock System
- [x] Create `game/ProgressManager.ts`
- [x] Track career points (persistent)
- [x] Track completed acts
- [x] Track campaign completion
- [x] Save/load from localStorage

### 7.4 Player Aircraft Swap
- [x] Modify FlightController to accept config
- [x] Modify MissileController for configurable missile count
- [x] Modify CannonController for configurable damage/fire rate
- [x] Apply speed/armor multipliers
- [x] Create distinct voxel models in `game/models/PlayerAircraftModels.ts`

### 7.5 Testing
- [x] All aircraft configs compile correctly
- [x] Stats correctly applied in GameEngine
- [x] Unlock conditions defined properly
- [x] Selection persists via ProgressManager

---

## ⬜ Phase 8: Wave System & Progression

**Goal:** Structured wave-based gameplay with beacon navigation, cinematic enemy entries, and escalating difficulty  
**Priority:** 🔴 Critical  
**Est. Duration:** 3-4 days

### Subphase Breakdown

```
┌────────────────────────────────────────────────────────────────┐
│                    PHASE 8 SUBPHASES                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  8A: Wave Manager & Basic Flow (1 day)                         │
│      └─ State machine, wave definitions, basic HUD            │
│      └─ Enemies spawn immediately, complete when all dead     │
│      └─ ✓ Testable: Waves progress, enemies spawn correctly   │
│                              ↓                                 │
│  8B: Waypoint Beacon System (1 day)                            │
│      └─ 3D beacon, HUD indicator, timer                       │
│      └─ Timeout → hangar flow                                 │
│      └─ ✓ Testable: Fly to beacon, timer works                │
│                              ↓                                 │
│  8C: Cinematic Entry System (1-2 days)                         │
│      └─ Camera controller, letterboxing                       │
│      └─ Enemy entry animations, staggered spawning            │
│      └─ Skip functionality                                    │
│      └─ ✓ Testable: Cinematics play, can skip                 │
│                              ↓                                 │
│  8D: Boss Waves & Polish (1 day)                               │
│      └─ Extended boss cinematics                              │
│      └─ Difficulty scaling                                    │
│      └─ Full integration testing                              │
│      └─ ✓ Testable: All 15 waves playable                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.0 Wave Flow Overview (Complete System)

```
┌─────────────────────────────────────────────────────────────────┐
│                        WAVE FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [WAVE COMPLETE] → [BEACON SPAWNS] → [PLAYER FLIES TO BEACON]  │
│                           ↓                                     │
│              (soft timer counting down)                         │
│                           ↓                                     │
│         ┌─────────────────┴─────────────────┐                   │
│         ↓                                   ↓                   │
│   [TIMER EXPIRES]                   [BEACON REACHED]            │
│         ↓                                   ↓                   │
│  "Intel unreliable..."              [CINEMATIC STARTS]          │
│         ↓                                   ↓                   │
│  [RETURN TO HANGAR]                 [Enemies enter by type]     │
│         ↓                                   ↓                   │
│  [Upgrade/Change Plane]             [Camera returns to player]  │
│         ↓                                   ↓                   │
│  [RESUME → Beacon Phase]            [COMBAT BEGINS]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.1 Wave Manager

- [ ] Create `game/WaveManager.ts`

```typescript
interface Wave {
  id: number;
  act: number;              // 1, 2, or 3
  composition: { type: EnemyType; count: number }[];
  beaconDistance: number;   // meters from player
  timeLimit: number;        // seconds to reach beacon
  isBoss: boolean;
  bossType?: string;
}

type WaveState = 
  | 'PRE_GAME'           // Before Wave 1
  | 'BEACON_ACTIVE'      // Player flying to beacon
  | 'CINEMATIC'          // Enemy entry cinematic playing
  | 'COMBAT'             // Active combat
  | 'WAVE_COMPLETE'      // All enemies destroyed
  | 'TIMEOUT'            // Timer expired, return to hangar
  | 'GAME_OVER';         // Player destroyed
```

### 8.2 Waypoint Beacon System

- [ ] Create `game/WaypointBeacon.ts`

#### Beacon Spawning

- Beacon spawns **relative to player's position** when wave ends
- Direction: Player's current heading (fly forward to reach)
- Distance: Scales with wave number

```typescript
const BEACON_BASE_DISTANCE = 800;   // meters (Wave 1)
const BEACON_DISTANCE_SCALE = 150;  // +150m per wave

// Wave 1:  800m    | Wave 5:  1,400m
// Wave 10: 2,150m  | Wave 15: 2,900m
```

#### Beacon Visuals

- [ ] 3D marker: Glowing vertical beam of light (cyan/blue)
- [ ] HUD indicator: Diamond icon with distance readout
- [ ] Radar: Pulsing blip in beacon direction
- [ ] Audio: Ping sound that increases tempo as player approaches
- [ ] Activation radius: ~100m

#### Soft Time Limit

```typescript
const BEACON_BASE_TIME = 60;       // seconds (Wave 1)
const BEACON_TIME_PER_WAVE = 10;   // +10s per wave

// Wave 1:  60s   | Wave 5:  100s
// Wave 10: 150s  | Wave 15: 200s
```

#### Timer Expiry Flow

- [ ] Display: "⚠ INTEL UNRELIABLE - MISSION ABORTED"
- [ ] Fade transition (1s) to Hangar screen
- [ ] Player can change aircraft, upgrade, repair
- [ ] "CONTINUE MISSION" resumes at beacon phase for same wave

### 8.3 Cinematic Entry System

- [ ] Create `game/WaveCinematicController.ts`

#### Timing

- **Standard waves**: 5-6 seconds total
- **Boss waves**: 8-10 seconds total

```typescript
interface CinematicSegment {
  enemyType: EnemyType;
  duration: number;         // seconds
  cameraAngle: CameraAngle;
  entryDirection: Vector3;
  enemyCount: number;       // representative count shown
}
```

#### Camera Angles per Enemy Type

| Enemy Type | Camera Style | Duration | Entry Pattern |
|------------|--------------|----------|---------------|
| **Phantom** | Fast tracking shot from side | 1.0s | Dive from above, scattered |
| **Viper** | Head-on dramatic approach | 1.2s | V-formation, level flight |
| **Warden** | Low angle looking up (menacing) | 1.5s | Slow approach from front |
| **Specter** | Static shot, shimmer/decloak FX | 1.8s | Materialize from cloak |
| **Boss** | Multiple cuts, sweeping orbit | 3-4s | Unique per boss |

#### Entry Directions (Varied)

```typescript
const ENTRY_DIRECTIONS = [
  'FRONT',        // 12 o'clock
  'FRONT_LEFT',   // 10 o'clock
  'FRONT_RIGHT',  // 2 o'clock
  'LEFT',         // 9 o'clock
  'RIGHT',        // 3 o'clock
  'ABOVE',        // diving down
  'ABOVE_BEHIND'  // 6 o'clock high
];
// Each enemy group gets different direction, no repeats
```

#### Representative Groups (Large Waves)

```typescript
const MAX_CINEMATIC_ENEMIES = {
  phantom: 4,   // Show max 4 even if 8 spawning
  viper: 4,
  warden: 2,
  specter: 2,
  boss: 1
};
```

#### Player State During Cinematic

- [ ] Player jet frozen in place
- [ ] No input accepted (except skip)
- [ ] Enemies spawned but frozen (no movement/shooting)
- [ ] HUD hidden during cinematic
- [ ] Letterbox bars (black bars top/bottom)
- [ ] Skip with SPACE or ENTER (single press)

### 8.4 Staggered Enemy Entry

Example: Wave 8 (2 Wardens, 4 Vipers, 1 Specter)

```
0.0s  ─ CINEMATIC START
        Letterbox bars slide in
        "WAVE 8" text fades in

0.5s  ─ SEGMENT 1: VIPERS
        Camera: Side tracking shot
        4 Vipers streak in from 2 o'clock
        Formation: Arrow

1.7s  ─ TRANSITION (quick camera cut)

2.0s  ─ SEGMENT 2: WARDENS  
        Camera: Low angle, looking up
        2 Wardens rumble in from 10 o'clock high
        Formation: Line abreast

3.5s  ─ TRANSITION (camera shake, audio sting)

3.8s  ─ SEGMENT 3: SPECTER
        Camera: Static, centered
        1 Specter decloaks with shimmer effect
        Dramatic pause

5.5s  ─ CINEMATIC END
        Letterbox bars slide out
        Camera snaps to player cockpit
        HUD fades back in

5.8s  ─ COMBAT BEGINS
        All enemies now active
        Player controls restored
```

### 8.5 Boss Wave Cinematics

- [ ] Extended duration: 8-10 seconds
- [ ] Unique camera work: Orbiting shots, dramatic zoom
- [ ] Boss-specific audio sting
- [ ] Title card: Boss name displayed

Example: Wave 15 - Final Boss

```
0.0s  - Screen dims, ominous rumble
1.0s  - "WARNING: HOSTILE FLAGSHIP DETECTED"
2.0s  - Camera pulls way back
2.5s  - Massive ship warps/flies in
4.0s  - Camera orbits around boss
6.0s  - Close-up on threatening feature
7.5s  - "THE SWARM QUEEN" title card
9.0s  - Camera returns to player
9.5s  - Combat begins
```

### 8.6 Act Structure & Wave Composition

| Wave | Act | Composition | Beacon Dist | Time Limit |
|------|-----|-------------|-------------|------------|
| 1 | 1 | 3 Phantom | 800m | 60s |
| 2 | 1 | 5 Phantom, 2 Viper | 950m | 70s |
| 3 | 1 | 4 Viper, 2 Phantom | 1,100m | 80s |
| 4 | 1 | 6 Viper, 1 Warden | 1,250m | 90s |
| 5 | 1 | **BOSS: Carrier Drone** + Phantoms | 1,400m | 100s |
| 6 | 2 | 4 Viper, 3 Warden | 1,550m | 110s |
| 7 | 2 | 8 Phantom (swarm) | 1,700m | 120s |
| 8 | 2 | 2 Warden, 4 Viper, 1 Specter | 1,850m | 130s |
| 9 | 2 | 3 Specter, 2 Warden | 2,000m | 140s |
| 10 | 2 | **BOSS: Command Ship** | 2,150m | 150s |
| 11 | 3 | 4 Specter, 4 Warden | 2,300m | 160s |
| 12 | 3 | 10 Viper, 2 Specter | 2,450m | 170s |
| 13 | 3 | 4 Specter, 4 Viper, 2 Warden | 2,600m | 180s |
| 14 | 3 | 6 Specter | 2,750m | 190s |
| 15 | 3 | **FINAL BOSS: The Swarm Queen** | 2,900m | 200s |

### 8.7 Wave HUD

- [ ] Create `components/WaveHUD.tsx`

Display elements:

- [ ] Current wave number and act
- [ ] Enemies remaining counter
- [ ] Beacon distance (during BEACON_ACTIVE state)
- [ ] Time remaining to reach beacon
- [ ] "WAVE COMPLETE" announcement
- [ ] Wave transition effects

### 8.8 Between-Wave State

- [ ] Pause menu accessible during beacon flight
- [ ] Menu options:
  - **RESUME** - Continue to beacon
  - **HANGAR** - Return to aircraft selection (keeps wave progress)
  - **UPGRADES** - (if Phase 10 implemented)
  - **QUIT** - Exit to main menu
- [ ] No auto-repair/reload during flight (must use HANGAR)

### 8.9 Difficulty Scaling

- [ ] Enemy health: +10% per wave
- [ ] Enemy damage: +5% per wave
- [ ] AI aggression increases in later acts
- [ ] More complex attack patterns in Act 3

### 8.10 Integration

- [ ] Modify `GameEngine.ts` for wave state machine
- [ ] Add enemy entry animations to `EnemyManager.ts`
- [ ] Create intel timeout → hangar flow
- [ ] Connect to ProgressManager for act completion tracking

### 8.11 Testing

- [ ] Beacon spawns correctly relative to player
- [ ] Timer counts down and timeout triggers hangar
- [ ] Cinematics play with correct camera angles
- [ ] Skip functionality works
- [ ] All 15 waves progress correctly
- [ ] Enemy compositions match design
- [ ] Boss cinematics are extended
- [ ] Pause menu works during beacon phase

---

## ⬜ Phase 9: Player Health & Game Over

**Goal:** Player can take damage and be destroyed  
**Priority:** 🔴 Critical  
**Est. Duration:** 1-2 days

### 9.1 Player Health System
- [ ] Add health to PlayerJet
  ```typescript
  maxHealth: number      // from aircraft config
  currentHealth: number
  isInvulnerable: boolean
  invulnerabilityTimer: number
  ```
- [ ] `takeDamage(amount)` method
- [ ] Invulnerability frames (0.5s after hit)
- [ ] Damage scaling by enemy firepower

### 9.2 Health UI
- [ ] Create `components/HealthHUD.tsx`
- [ ] Health bar (top-left or bottom)
- [ ] Shield indicator (if upgrade)
- [ ] Damage flash effect
- [ ] Low health warning (pulsing red)
- [ ] Critical health alarm

### 9.3 Death & Game Over
- [ ] Create `components/GameOverScreen.tsx`
- [ ] Player explosion on death
- [ ] Slow-motion death sequence
- [ ] Final score display
- [ ] Stats summary:
  - Waves survived
  - Enemies destroyed
  - Highest combo
  - Time survived
- [ ] "Try Again" button (restart wave 1)
- [ ] "Return to Hangar" button

### 9.4 Lives System (Optional)
- [ ] 3 lives per run
- [ ] Life icon display
- [ ] Respawn with brief invulnerability
- [ ] Game over when all lives lost

### 9.5 Enemy Attacks
- [ ] Add projectile system for enemies
- [ ] Enemies fire at player during ENGAGEMENT
- [ ] Projectile collision detection
- [ ] Visual/audio feedback for incoming fire

### 9.6 Testing
- [ ] Player takes damage correctly
- [ ] Health UI updates in real-time
- [ ] Invulnerability works
- [ ] Death triggers game over
- [ ] Restart works correctly

---

## ⬜ Phase 10: Upgrade Shop & Currency

**Goal:** Between-wave upgrade system for roguelite progression  
**Priority:** 🟡 High  
**Est. Duration:** 2-3 days

### 10.1 Currency System
- [ ] Create `game/CurrencyManager.ts`
- [ ] Scrap: earned from kills (1 scrap = 10 points)
- [ ] Display scrap count in HUD
- [ ] Persist between waves (reset on death)

### 10.2 Upgrade Categories

#### Weapons
- [ ] Missile Capacity (+2 missiles) - 50 scrap
- [ ] Reload Speed (-20% reload time) - 75 scrap
- [ ] Cannon Damage (+25% damage) - 60 scrap
- [ ] Homing Strength (+15% turn rate) - 80 scrap

#### Defense
- [ ] Armor Plating (+25% max health) - 70 scrap
- [ ] Shield Generator (absorb 1 hit) - 100 scrap
- [ ] Emergency Repair (heal 50%) - 40 scrap

#### Systems
- [ ] Radar Range (+30% range) - 50 scrap
- [ ] Lock Speed (-20% lock time) - 65 scrap
- [ ] Combo Extender (+1s combo window) - 55 scrap

#### Special
- [ ] EMP Burst (stun nearby enemies) - 120 scrap
- [ ] Decoy Flare (distract missiles) - 80 scrap
- [ ] Overcharge (2x damage for 5s) - 100 scrap

### 10.3 Shop UI
- [ ] Create `components/UpgradeShop.tsx`
- [ ] Grid of upgrade cards
- [ ] Card shows: name, description, cost, current level
- [ ] Purchase button (disabled if insufficient scrap)
- [ ] Category tabs (Weapons, Defense, Systems, Special)
- [ ] "Ready for Combat" button to proceed

### 10.4 Upgrade Application
- [ ] Create `game/UpgradeManager.ts`
- [ ] Track purchased upgrades
- [ ] Apply stat modifiers to systems
- [ ] Stack multiple purchases (diminishing returns)
- [ ] Reset upgrades on new run

### 10.5 Testing
- [ ] Shop appears between waves
- [ ] Purchases deduct scrap correctly
- [ ] Upgrades apply to gameplay
- [ ] Cannot overspend
- [ ] Visual feedback on purchase

---

## ⬜ Phase 11: Story Integration & Briefings

**Goal:** Narrative framing for combat encounters  
**Priority:** 🟡 High  
**Est. Duration:** 1-2 days

### 11.1 Mission Briefings
- [ ] Create `components/BriefingScreen.tsx`
- [ ] Commander portrait (pixel art style)
- [ ] Typewriter text effect
- [ ] Mission objective display
- [ ] "Launch" button

### 11.2 Briefing Content

#### Act 1 Briefings
- [ ] Wave 1: "Welcome to Bastion, pilot..."
- [ ] Wave 5: "Carrier approaching. Take it down!"

#### Act 2 Briefings  
- [ ] Wave 6: "They're adapting. Stay sharp."
- [ ] Wave 10: "Command ship detected. Priority target!"

#### Act 3 Briefings
- [ ] Wave 11: "This is Skyfall Protocol. Hold nothing back."
- [ ] Wave 15: "The Queen approaches. End this."

### 11.3 Victory/Defeat Dialogues
- [ ] Wave complete messages
- [ ] Boss defeated celebrations
- [ ] Act complete summaries
- [ ] Game over commander reaction

### 11.4 Lore Collectibles
- [ ] Data fragments dropped by elites
- [ ] Unlock lore entries in gallery
- [ ] Optional: backstory for aircraft

### 11.5 Testing
- [ ] Briefings play at correct times
- [ ] Text displays correctly
- [ ] Can skip briefings
- [ ] Dialogue fits tone

---

## ⬜ Phase 12: Boss Encounters

**Goal:** Epic boss fights at act endings  
**Priority:** 🟡 High  
**Est. Duration:** 2-3 days

### 12.1 Boss Framework
- [ ] Create `game/BossController.ts`
- [ ] Multi-phase health bars
- [ ] Attack pattern system
- [ ] Weak point mechanics
- [ ] Spawn minions ability

### 12.2 Boss Designs

#### Act 1 Boss: Carrier Drone
- [ ] Massive aircraft carrier-style drone
- [ ] Phase 1: Spawns Phantoms continuously
- [ ] Phase 2: Launches missile barrages
- [ ] Weak point: Engine cores (4 targets)
- [ ] Health: 2000

#### Act 2 Boss: Command Ship  
- [ ] Heavily armored command vessel
- [ ] Phase 1: Deploys Warden escorts
- [ ] Phase 2: Energy beam attack
- [ ] Phase 3: Shield rotation
- [ ] Weak point: Bridge (exposed in Phase 3)
- [ ] Health: 3500

#### Act 3 Boss: The Swarm Queen
- [ ] Organic-looking mechanical hive
- [ ] Phase 1: Specter swarm
- [ ] Phase 2: Tracking drone bombs
- [ ] Phase 3: Queen core exposed, desperate attacks
- [ ] Weak point: Core (Phase 3 only)
- [ ] Health: 5000

### 12.3 Boss UI
- [ ] Large health bar at top of screen
- [ ] Phase indicators
- [ ] Boss name display
- [ ] Weak point highlighting

### 12.4 Boss Rewards
- [ ] Massive score bonus
- [ ] Unlock next act
- [ ] Special upgrade reward
- [ ] Story progression

### 12.5 Testing
- [ ] Bosses spawn at correct waves
- [ ] Phases transition properly
- [ ] Weak points work
- [ ] Defeat triggers rewards

---

## ⬜ Phase 13: Audio & Music

**Goal:** Immersive sound design and dynamic music  
**Priority:** 🟢 Medium  
**Est. Duration:** 2 days

### 13.1 Sound Effects
- [ ] Create `game/AudioManager.ts`
- [ ] Cannon fire (pew pew)
- [ ] Missile launch (whoosh)
- [ ] Missile lock tone
- [ ] Lock acquired beep
- [ ] Explosion (enemy death)
- [ ] Player hit (damage)
- [ ] Low health alarm
- [ ] Wave complete fanfare
- [ ] Upgrade purchase

### 13.2 Engine Sounds
- [ ] Player jet engine loop
- [ ] Afterburner boost
- [ ] Enemy engine (distant)
- [ ] Boss engine (rumble)

### 13.3 Dynamic Music
- [ ] Calm: Patrol/exploration
- [ ] Combat: Engagement music
- [ ] Intense: Boss battle theme
- [ ] Victory: Wave complete sting
- [ ] Defeat: Game over dirge

### 13.4 Audio Settings
- [ ] Master volume
- [ ] SFX volume
- [ ] Music volume
- [ ] Mute toggle

### 13.5 Implementation
- [ ] Use Web Audio API or Howler.js
- [ ] Spatial audio for 3D positioning
- [ ] Volume ducking for priority sounds
- [ ] Smooth music transitions

### 13.6 Testing
- [ ] All sounds play correctly
- [ ] No audio clipping
- [ ] Performance acceptable
- [ ] Settings persist

---

## ✅ Phase 14: Responsive HUD Refactor [COMPLETE]

**Goal:** Minimalist, futuristic HUD that adapts to any screen size and orientation  
**Priority:** 🟡 High  
**Est. Duration:** 2-3 days

### Design Philosophy

The current HUD has multiple elements competing for screen space, causing overlap on mobile portrait and visual clutter. This phase consolidates all HUD elements into a unified, edge-anchored system with a consistent "helmet display" aesthetic.

**Key Principles:**
1. **Edge-Anchored**: All HUD hugs screen edges, center sacred for combat
2. **Icon-First**: Replace text with universally understood symbols
3. **Responsive**: Use viewport units (vw, vh) + clamp() for sizing
4. **Minimalist**: Less is more - show what matters, hide what doesn't
5. **Unified Style**: Consistent border/glow aesthetic across all elements

### Color Palette Exploration

Moving beyond cyan/red/yellow to a more sophisticated scheme:

| Element | Primary | Warning | Critical |
|---------|---------|---------|----------|
| **Hull/Health** | Emerald (#10b981) | Amber (#f59e0b) | Rose (#f43f5e) |
| **Weapons** | Sky (#0ea5e9) | - | Slate (#64748b) |
| **Score/Info** | Violet (#8b5cf6) | - | - |
| **Radar** | Teal (#14b8a6) | Orange (#f97316) | Red (#ef4444) |
| **Borders/Glow** | Slate (#475569) with subtle glow | - | - |

### Responsive Breakpoints

| Breakpoint | Width | Mode |
|------------|-------|------|
| **Portrait Mobile** | < 480px | Combat Mode (minimal) |
| **Landscape Mobile** | 480-768px | Compact Mode |
| **Tablet** | 768-1024px | Standard Mode |
| **Desktop** | > 1024px | Full Mode |

### 14.1 Core Layout System
- [x] Create `components/hud/HUDLayout.tsx` - master container
- [x] Define CSS custom properties for HUD sizing
- [x] Implement breakpoint detection hook
- [x] Z-index hierarchy: Game < HUD < Overlays < Modals
- [x] Safe area insets for notched devices

### 14.2 Unified HUD Panel Component
- [x] Create `components/hud/HUDPanel.tsx` - reusable frame
- [x] Variants: `compact`, `standard`, `expanded`
- [x] Consistent styling: thin border, subtle glow, translucent bg
- [x] Corner accent decorations for futuristic feel
- [x] Animation support: fade, slide, pulse

### 14.3 Adaptive Health Display
- [x] Redesign as edge-anchored horizontal bar (bottom-left)
- [x] Gradient fill: Emerald → Amber → Rose based on %
- [x] Icon-only low health warning (pulsing heart icon)
- [x] Damage flash animation (brief red overlay)
- [x] Sizing: 120px (mobile) → 200px (desktop)
- [x] No text in minimal mode, percentage in full mode

### 14.4 Compact Weapons Display
- [x] Icon-based missile count (filled/empty missile icons)
- [x] Circular reload progress around missile icon
- [x] Thin cannon heat bar (horizontal)
- [x] Overheat warning glow
- [x] Horizontal strip layout (bottom-right)
- [x] Lock glow animation when target acquired

### 14.5 Adaptive Radar System
- [x] Responsive sizing: 60px (portrait) → 80px (landscape) → 120px (desktop)
- [x] Minimize to dot indicator in combat on mobile portrait
- [x] Expand on touch/hover
- [x] Integrated lock count badge
- [x] Enemy blips with state-based colors (new palette)
- [x] Beacon direction indicator

### 14.6 Streamlined Score Display
- [x] Minimal: just number with subtle glow
- [x] Expand on score gain, shrink after 1s
- [x] Combo badge (×2, ×3, etc.) appears on multiplier
- [x] Position: top-right, always visible but unobtrusive
- [ ] Wave-end expansion shows full stats (deferred)

### 14.7 Edge-Based Lock Indicators
- [x] Remove center-screen lock boxes on targets
- [x] Add edge arrows pointing to off-screen locked targets
- [x] Distance-based sizing (closer = larger arrow)
- [x] Lock state colors: Acquiring (amber pulse) → Locked (emerald solid)
- [ ] Cluster nearby targets to reduce clutter (deferred)
- [x] Primary target indicator (diamond vs triangle for others)

### 14.8 Consolidated Top Bar
- [x] Single bar: Wave | Enemies | Beacon Timer
- [x] Wave: "W3" or icon-based
- [x] Enemies: skull icon + count
- [x] Beacon timer: only visible when < 30s remaining
- [x] Collapsible in portrait mode (tap to expand)

### 14.9 Mobile Touch Integration
- [x] Position HUD to avoid virtual control zones
- [x] Larger touch targets for interactive elements
- [ ] Haptic feedback support (if available) (deferred)
- [x] Gesture: tap to expand radar

### 14.10 HUD Animations
- [x] Damage pulse: red border flash (0.2s)
- [x] Lock glow: emerald pulse on acquisition
- [x] Score pop: scale up on gain, ease back
- [x] Health drain: smooth interpolation
- [x] Combo shake: subtle vibration on multiplier increase
- [x] Performance: use CSS transforms, GPU-accelerated

### 14.11 Settings & Accessibility
- [x] HUD opacity slider (50-100%) (implemented in Phase 15)
- [x] HUD scale slider (80-120%) (implemented in Phase 15)
- [x] Colorblind-friendly alternative palette (implemented in Phase 15)
- [x] Reduced motion option (disable animations via CSS)
- [x] High contrast mode (implemented in Phase 15)

### 14.12 Files Created

```
components/
├── hud/
│   ├── HUDLayout.tsx        [✅ DONE] Master container
│   ├── HUDPanel.tsx         [✅ DONE] Reusable frame
│   ├── HealthBar.tsx        [✅ DONE] Replaces HealthHUD
│   ├── WeaponsStrip.tsx     [✅ DONE] Replaces WeaponsHUD
│   ├── MiniRadar.tsx        [✅ DONE] Replaces RadarHUD
│   ├── ScoreDisplay.tsx     [✅ DONE] Replaces ScoreHUD
│   ├── TopBar.tsx           [✅ DONE] Wave/enemies/timer
│   ├── EdgeIndicators.tsx   [✅ DONE] Off-screen target arrows
│   └── index.tsx            [✅ DONE] Barrel export + CompleteHUD

hooks/
└── useDeviceDetection.ts    [✅ DONE] Touch/breakpoint detection

styles/
└── hud.css                  [✅ DONE] HUD CSS variables & animations
```

### 14.13 Testing
- [x] Test all 4 breakpoints (portrait mobile, landscape, tablet, desktop)
- [x] Verify no overlaps at any size
- [x] Check animation performance (maintain 60 FPS)
- [x] Test with virtual controls enabled
- [x] Verify touch interactions work
- [x] Colorblind mode validation (implemented in Phase 15)
- [x] Reduced motion mode validation

---

## ✅ Phase 15: Polish & Effects [COMPLETE]

**Goal:** Visual improvements and quality-of-life features  
**Priority:** 🟢 Medium  
**Est. Duration:** 2 days  
**Files Created:** `game/ParticleTrailSystem.ts`, `game/CameraEffects.ts`, `game/CloudSystem.ts`, `game/AccessibilityManager.ts`, `components/ScreenEffects.tsx`, `components/PerformanceOverlay.tsx`, `components/AccessibilitySettings.tsx`

### 15.1 Visual Effects
- [x] Engine trails for all aircraft (ParticleTrailSystem)
- [x] Missile smoke trails (TrailType.MISSILE)
- [x] Muzzle flash for cannon (existing in PlayerJet)
- [x] Impact sparks (ExplosionManager.createImpactSparks)
- [x] Improved explosions (more particles, secondary bursts)
- [x] Cloud layers for depth (CloudSystem - 3 layers)
- [ ] Sun/lighting effects (future enhancement)

### 15.2 UI Polish
- [x] Animated HUD elements (existing CSS animations)
- [x] Screen shake on damage (CameraEffects trauma system)
- [x] Slow-motion on kill (CameraEffects.triggerKillSlowmo)
- [x] Screen effects overlay (ScreenEffects.tsx)
- [ ] Kill counter animations (existing counter functional)
- [ ] Combo number pop effects (future enhancement)

### 15.3 Camera Effects
- [x] Dynamic FOV during speed boost
- [x] Camera shake gradients (trauma-based with 4 types)
- [x] Hit flash overlay (ScreenEffects component)
- [x] Damage vignette (ScreenEffects component)
- [ ] Smooth death camera (future enhancement)
- [ ] Boss intro camera (handled by WaveCinematicController)

### 15.4 Performance
- [x] Object pooling audit (particles, projectiles)
- [x] FPS counter (PerformanceOverlay - toggle with ~)
- [x] Particle count tracking
- [ ] LOD for distant enemies (future optimization)
- [ ] Reduce draw calls (future optimization)

### 15.5 Accessibility
- [x] Colorblind mode (3 filters: protanopia, deuteranopia, tritanopia)
- [x] UI scale options (HUD opacity 30-100%, scale 80-150%)
- [x] Screen shake toggle
- [x] Reduced motion option
- [x] Settings persistence (localStorage)
- [ ] Control remapping (future enhancement)
- [ ] Subtitles for dialogue (future enhancement)

### 15.6 Testing
- [x] 60 FPS maintained
- [x] Effects compile without errors
- [x] Build verified successful
- [x] Accessibility settings persist

---

## ✅ Phase 16: Endless Mode [COMPLETE]

**Goal:** Infinite replayability mode after campaign  
**Priority:** 🟢 Medium  
**Est. Duration:** 1-2 days

### 16.1 Endless Mode Rules
- [x] Unlock after completing campaign
- [x] Infinite waves with scaling difficulty
- [x] Random enemy compositions
- [x] Boss every 5 waves (rotates carrier-drone, command-ship, swarm-queen)
- [x] Leaderboard (local, top 10 runs)

### 16.2 Difficulty Scaling
- [x] Enemy stats scale exponentially (8% per wave)
- [x] Health, damage, and speed multipliers
- [x] Faster spawns (spawn delay multiplier)
- [x] Reduced shop healing (2% less per wave, min 50%)

### 16.3 Endless UI
- [x] ModeSelect screen for Campaign vs Endless
- [x] EndlessHUD with wave counter (no limit)
- [x] Difficulty indicator (NORMAL → NIGHTMARE)
- [x] Best wave trophy indicator
- [x] LeaderboardDisplay component

### 16.4 Procedural Waves
- [x] EndlessModeManager for wave generation
- [x] 8 wave modifiers with unique compositions
  - phantom_swarm, warden_wall, specter_ambush
  - viper_blitz, mixed_assault, elite_guard
  - speed_demons, iron_fortress
- [x] Modifier popup notifications
- [x] Weighted compositions by wave number

### 16.5 Testing
- [x] Mode unlocks correctly (requires campaignComplete)
- [x] Difficulty scales properly (exponential)
- [x] Vite build compiles successfully
- [x] Leaderboard saves to localStorage

---

## 🎯 Build Priority Order

### Critical Path (Must Have)
1. **Phase 6** - Enemy variety makes combat interesting
2. **Phase 8** - Wave system gives structure
3. **Phase 9** - Player health adds stakes

### High Priority (Should Have)
4. **Phase 7** - Player aircraft adds replayability
5. **Phase 10** - Upgrades add depth
6. **Phase 11** - Story gives context
7. **Phase 12** - Bosses create memorable moments
8. **Phase 14** - Responsive HUD for all devices

### Medium Priority (Nice to Have)
9. **Phase 13** - Audio elevates experience
10. **Phase 15** - Polish shows quality
11. **Phase 16** - Endless extends playtime

---

## 📁 File Structure Plan

```
game/
├── types/
│   └── AircraftConfig.ts
├── data/
│   ├── enemyAircraftConfigs.ts
│   └── playerAircraftConfigs.ts
├── models/
│   ├── EnemyModels.ts
│   └── PlayerModels.ts
├── managers/
│   ├── WaveManager.ts
│   ├── ProgressManager.ts
│   ├── CurrencyManager.ts
│   ├── UpgradeManager.ts
│   ├── AudioManager.ts
│   └── BossController.ts
└── [existing files]

components/
├── screens/
│   ├── MainMenu.tsx
│   ├── AircraftSelect.tsx
│   ├── BriefingScreen.tsx
│   ├── UpgradeShop.tsx
│   ├── GameOverScreen.tsx
│   └── VictoryScreen.tsx
├── hud/
│   ├── WaveHUD.tsx
│   ├── HealthHUD.tsx
│   ├── BossHealthBar.tsx
│   └── [existing HUDs]
└── [existing files]
```

---

## 📝 Notes

### Design Principles
1. **Arcade First** - Fast, responsive, satisfying
2. **Clear Feedback** - Player always knows what's happening
3. **Meaningful Choices** - Aircraft and upgrades matter
4. **Fair Challenge** - Difficult but learnable
5. **Rewarding Progression** - Unlocks feel earned

### Technical Constraints
- Target 60 FPS on mid-range hardware
- Keep bundle size reasonable
- Mobile-friendly controls (future consideration)

---

*Last Updated: January 20, 2026*
*Current Phase: 14 (Responsive HUD Refactor)*

