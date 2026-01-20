# Aircraft Design Implementation Checklist

**Last Updated:** January 20, 2026  
**Status:** Phase 1 Complete - All 5 Aircraft Models Implemented  
**Overall Progress:** 64/75 tasks

---

## Phase 1: Build Individual Models
*Create separate functions for each aircraft with custom voxel placements and base colors*

### F-22 Falcon - Modern Stealth Fighter ✅
- [x] Create `buildFalconModel()` function (implemented as `buildF22Falcon()` in PlayerJet.ts and `createFalconMesh()` in PlayerAircraftModels.ts)
- [x] Modify fuselage: taper nose (reduce width 30%), angular edges, narrow belly
- [x] Reduce canard wings by 50% (minimal LERX extensions)
- [x] Reduce vertical tail fins to single (central single tail design)
- [x] Make main wings edges angular/squared (trapezoidal wings with squared tips)
- [x] Implement blue accent color (#0099ff) with blue-gray body (#6688aa)
- [x] Test model renders correctly in hangar
- [x] Verify proportions match design guide

**Subtasks Completed:** 8/8

**Implementation Details:**
- Hangar preview model: `game/models/PlayerAircraftModels.ts` → `createFalconMesh()`
- Gameplay model: `game/PlayerJet.ts` → `buildF22Falcon()`
- Config colors updated in: `game/data/playerAircraftConfigs.ts`
- Afterburner color: Blue-white (#66ccff) - F-22 characteristic
- Features: Sharp pointed nose, diamond-shaped fuselage, single vertical tail, internal weapons bays, angular stealth facets

---

### X-47 Switchblade - Agile Strike Fighter ✅
- [x] Create `buildSwitchbladeModel()` function (implemented as `buildX47Switchblade()` in PlayerJet.ts and `createSwitchbladeMesh()` in PlayerAircraftModels.ts)
- [x] Scale entire model to 70% size (compact, dart-like profile)
- [x] Shorten fuselage by 25%, narrow profile (single-engine look)
- [x] Reduce wing length by 40%, increase thickness (stubby wings)
- [x] Create square/blunt wing tips
- [x] Add prominent angular side inlets (F-16 style)
- [x] Single, shorter vertical fin (30% smaller, upright)
- [x] Implement red accent color (#ff3333) with matte black body (#1a1a1a)
- [x] Test model renders correctly in hangar
- [x] Verify compact, aggressive appearance

**Subtasks Completed:** 10/10

**Implementation Details:**
- Hangar preview model: `game/models/PlayerAircraftModels.ts` → `createSwitchbladeMesh()`
- Gameplay model: `game/PlayerJet.ts` → `buildX47Switchblade()`
- Config colors updated in: `game/data/playerAircraftConfigs.ts`
- Afterburner color: Crimson red (#ff5555) - aggressive, pulsing
- Features: Sharp dart-like nose, prominent angular side intakes, red-tinted cockpit glass, single vertical tail, short stubby wings with blunt tips, crimson accent stripes

---

### A-10 Ironclad - Heavy Assault Gunship ✅
- [x] Create `buildIroncladModel()` function (implemented as `buildA10Ironclad()` in PlayerJet.ts and `createIroncladMesh()` in PlayerAircraftModels.ts)
- [x] Increase fuselage width by 40%, make taller (boxy, stocky design)
- [x] Create boxy, functional design (armor panels, titanium bathtub cockpit)
- [x] Reduce wing length by 20%, increase thickness dramatically (stubby, sturdy wings)
- [x] Raise wing position (high-mounted - A-10 signature)
- [x] Add straight leading edges on wings
- [x] Widen twin vertical fin spacing (widely-spaced twin tails)
- [x] Make fins larger/more prominent
- [x] Add small horizontal stabilizers (between twin fins)
- [x] Implement green accent color (#55aa55) with olive body (#5a6b4a)
- [x] Add subtle armor plating voxel details (armor panels, weathered gray)
- [x] Test model renders correctly in hangar
- [x] Verify heavy, tank-like appearance

**Subtasks Completed:** 13/13

**Implementation Details:**
- Hangar preview model: `game/models/PlayerAircraftModels.ts` → `createIroncladMesh()`
- Gameplay model: `game/PlayerJet.ts` → `buildA10Ironclad()`
- Config colors updated in: `game/data/playerAircraftConfigs.ts`
- Afterburner color: Deep orange-yellow (#ffaa44) - powerful, hot
- Features: GAU-8 Avenger cannon under nose, high-mounted twin engines, titanium bathtub cockpit armor, landing gear pods, weapons hardpoints, widely-spaced twin vertical tails

---

### SR-71 Wraith - Reconnaissance Jet ✅
- [x] Create `buildWraithModel()` function (implemented as `buildSR71Wraith()` in PlayerJet.ts and `createWraithMesh()` in PlayerAircraftModels.ts)
- [x] Increase fuselage length by 50% (extends from -11 to +10 Z axis)
- [x] Reduce fuselage width by 30% (needle profile, 70% width)
- [x] Create sharp pointed nose (8+ voxels, needle-like)
- [x] Taper fuselage to thin tail section (gradual taper from Z=2 to Z=9)
- [x] Reduce wings to minimal proportions (60% of base length)
- [x] Make wings thin, blade-like (0.15-0.2 height scale)
- [x] Position wings closer to tail (Z=4 to Z=5.5)
- [x] Keep twin fins but make taller/more prominent (height 2.5+)
- [x] Space twin fins wider apart (±0.6 X position)
- [x] Make fins more blade-like (thin, elegant)
- [x] Add small horizontal stabilizers (between twin tails)
- [x] Implement purple accent color (#7744ff) with matte black body (#0a0a12)
- [x] Ensure smooth, streamlined appearance (integrated intakes, smooth fairing cockpit)
- [x] Test model renders correctly in hangar
- [x] Verify elongated, needle-like profile

**Subtasks Completed:** 15/15

**Implementation Details:**
- Hangar preview model: `game/models/PlayerAircraftModels.ts` → `createWraithMesh()`
- Gameplay model: `game/PlayerJet.ts` → `buildSR71Wraith()`
- Config colors updated in: `game/data/playerAircraftConfigs.ts`
- Afterburner color: Deep purple (#7744ff) - mysterious/stealth
- Features: Needle-sharp nose (8+ voxels), smooth fairing cockpit, integrated flush air intakes, long slender fuselage, tiny blade-thin wings, tall blade-like twin vertical tails, purple accent stripes, purple nav lights, cloak shimmer effect (special ability)

---

### XF-108 Archon - Advanced Experimental Fighter ✅
- [x] Create `buildArchonModel()` function (implemented as `buildXF108Archon()` in PlayerJet.ts and `createArchonMesh()` in PlayerAircraftModels.ts)
- [x] Create faceted, angular fuselage design
- [x] Modernize fuselage shape, add subtle bulges (engine nacelle bulges)
- [x] Enlarge canards by 50% (prominent, animated canards)
- [x] Make canards angular, active-looking
- [x] Add articulated appearance to canards (gold leading edges)
- [x] Position canards slightly raised (0.35 Y position)
- [x] Refine main wing edges (angular, purposeful)
- [x] Add leading-edge extensions (LEX) to wings
- [x] Make tail fins more angular/swept (slight outward cant)
- [x] Increase tail fin height/prominence (tall, blade-like)
- [x] Add small horizontal stabilizers between tails
- [x] Add subtle voxel sensor bumps/facets on fuselage (side sensor panels)
- [x] Create articulated surface appearance (animated canards, control surfaces)
- [x] Implement gold accent color (#ffaa00) with dark blue-gray body (#2a3444)
- [x] Add glowing element voxels (cockpit, nav lights, gold tail lights)
- [x] Test model renders correctly in hangar
- [x] Verify advanced, experimental appearance

**Subtasks Completed:** 18/18

**Implementation Details:**
- Hangar preview model: `game/models/PlayerAircraftModels.ts` → `createArchonMesh()`
- Gameplay model: `game/PlayerJet.ts` → `buildXF108Archon()`
- Config colors updated in: `game/data/playerAircraftConfigs.ts`
- Afterburner color: Golden-amber (#ffdd66) - premium/elite
- Features: Angular faceted fuselage, prominent animated canards, twin swept-back tall tails with gold nav lights, LEX wings, sensor panels, targeting array (special ability), glowing blue cockpit, gold accent stripes on nose/wings/canards/tails

---

## Phase 2: Cockpit & Details
*Add prominent features and visual systems that enhance aircraft distinctiveness*

### F-22 Falcon - Cockpit & Details
- [ ] Narrow and point cockpit area
- [ ] Raise cockpit slightly
- [ ] Add blue glow voxels to cockpit area
- [ ] Create subtle shimmer effect voxels around edges
- [ ] Add air intake detail voxels
- [ ] Verify stealth aesthetic is maintained

**Subtasks Completed:** 0/6

---

### X-47 Switchblade - Cockpit & Details
- [ ] Design minimal, integrated cockpit
- [ ] Add red cockpit glow voxels
- [ ] Make cockpit area raised for aggressive look
- [ ] Add visible intake flashing spots
- [ ] Create pointed nose detail section
- [ ] Add afterburner nozzle prominence

**Subtasks Completed:** 0/6

---

### A-10 Ironclad - Cockpit & Details
- [ ] Design broad, functional cockpit
- [ ] Add green cockpit glow voxels
- [ ] Create prominent engine intake details
- [ ] Add visible turbine/rotor indicator voxels
- [ ] Create landing gear pod details on underside
- [ ] Add armor panel seam details via voxel arrangement
- [ ] Create visible exhaust nozzle section

**Subtasks Completed:** 0/7

---

### SR-71 Wraith - Cockpit & Details
- [ ] Create minimal, smooth cockpit fairing
- [ ] Integrate cockpit into fuselage smoothly
- [ ] Add subtle purple glow voxels
- [ ] Create integrated air inlet details
- [ ] Add engine section glow spots
- [ ] Ensure completely smooth profile (no bumps)

**Subtasks Completed:** 0/6

---

### XF-108 Archon - Cockpit & Details
- [ ] Create raised, prominent cockpit
- [ ] Add gold accent voxels to cockpit area
- [ ] Add subtle glow effect voxels throughout
- [ ] Create sensor bump/facet details
- [ ] Add nav light indicator voxels (red, green)
- [ ] Design articulated surface details
- [ ] Create advanced systems glow spots

**Subtasks Completed:** 0/7

---

## Phase 3: Polish & Testing
*Ensure visual distinctiveness, proper scaling, and 3D space visibility*

### F-22 Falcon - Polish & Testing
- [ ] Test in hangar with full lighting
- [ ] Verify visual distinctiveness vs. other aircraft
- [ ] Check proportions match design guide
- [ ] Test rotation/spin visibility
- [ ] Verify blue glow is visible in dark environment
- [ ] Test color accent stands out
- [ ] Perform final aesthetic review

**Subtasks Completed:** 0/7

---

### X-47 Switchblade - Polish & Testing
- [ ] Test in hangar with full lighting
- [ ] Verify compact size is clearly visible
- [ ] Check aggressive appearance is conveyed
- [ ] Test rotation shows short wings clearly
- [ ] Verify red accent glow works
- [ ] Confirm visual uniqueness vs. Falcon
- [ ] Perform final aesthetic review

**Subtasks Completed:** 0/7

---

### A-10 Ironclad - Polish & Testing
- [ ] Test in hangar with full lighting
- [ ] Verify bulky appearance is clear
- [ ] Check heavy, tank-like silhouette
- [ ] Test rotation shows wide stance
- [ ] Verify green accent and armor details visible
- [ ] Confirm visual distinctiveness vs. others
- [ ] Test scale (130%) is appropriate
- [ ] Perform final aesthetic review

**Subtasks Completed:** 0/8

---

### SR-71 Wraith - Polish & Testing
- [ ] Test in hangar with full lighting
- [ ] Verify needle-like profile is clear
- [ ] Check elongated appearance is obvious
- [ ] Test rotation shows long fuselage/thin wings
- [ ] Verify purple shimmer effect works
- [ ] Confirm elegant, swift aesthetic
- [ ] Check stealth appearance is conveyed
- [ ] Perform final aesthetic review

**Subtasks Completed:** 0/8

---

### XF-108 Archon - Polish & Testing
- [ ] Test in hangar with full lighting
- [ ] Verify advanced/experimental appearance
- [ ] Check faceted design is visible
- [ ] Test rotation shows articulated surfaces
- [ ] Verify gold accent and glow effects
- [ ] Confirm active control surface appearance
- [ ] Check cockpit glow is prominent
- [ ] Perform final aesthetic review

**Subtasks Completed:** 0/8

---

## Animation Implementation
*Post-models phase: Add control surface animations and effects*

### Animation Framework Setup
- [ ] Review animation speed tiers in design guide
- [ ] Set up control surface rotation system
- [ ] Implement glow intensity animation
- [ ] Create dynamic trail particle system
- [ ] Implement damage effect color changes

**Subtasks Completed:** 0/5

---

### Afterburner & Effects
- [ ] Implement F-22 steady blue-white glow (#66ccff)
- [ ] Implement Switchblade pulsing red glow (#ff5555)
- [ ] Implement Ironclad throbbing orange glow (#ffaa44)
- [ ] Implement Wraith smooth purple-blue glow (#7744ff)
- [ ] Implement Archon multi-layer gold-white glow (#ffdd66)
- [ ] Test all glow patterns in flight

**Subtasks Completed:** 0/6

---

### Control Surface Animations
- [ ] Implement F-22 fast ailerons (±15°, 0.1s lerp)
- [ ] Implement Switchblade ultra-fast ailerons (±20°, instant)
- [ ] Implement Ironclad slow ailerons (±10°, 0.2s lerp)
- [ ] Implement Wraith smooth ailerons (±12°, 0.1s lerp)
- [ ] Implement Archon dynamic ailerons (±18°, variable)
- [ ] Test all elevators with appropriate timing
- [ ] Test all rudders with appropriate timing
- [ ] Verify control surfaces respond naturally

**Subtasks Completed:** 0/8

---

### Flight Dynamics Animations
- [ ] Implement F-22 stealth shimmer effect
- [ ] Implement Switchblade turbulence wobble
- [ ] Implement Ironclad vibration/shake effect
- [ ] Implement Wraith high-speed shimmer
- [ ] Implement Archon g-force glow response
- [ ] Test all flight effects in gameplay
- [ ] Verify effects enhance visual feedback

**Subtasks Completed:** 0/7

---

## Summary Statistics

| Phase | Tasks | Completed | Remaining | Progress |
| --- | --- | --- | --- | --- |
| **Phase 1** | 56 | 0 | 56 | 0% |
| **Phase 2** | 32 | 0 | 32 | 0% |
| **Phase 3** | 40 | 0 | 40 | 0% |
| **Animations** | 26 | 0 | 26 | 0% |
| **TOTAL** | **154** | **0** | **154** | **0%** |

---

## Priority Implementation Order

### High Priority (Start Here)
1. **Phase 1 - F-22 Falcon** - Simplest model, good starting point
2. **Phase 1 - A-10 Ironclad** - Straightforward scaling/widening
3. **Phase 1 - X-47 Switchblade** - Requires scaling but clear specs

### Medium Priority
4. **Phase 1 - SR-71 Wraith** - Requires precision lengthening
5. **Phase 1 - XF-108 Archon** - Most complex model modifications

### Final Priority
6. **Phase 2** - All aircraft (parallel after models done)
7. **Phase 3** - All aircraft (parallel after details done)
8. **Animations** - Polish phase after all models verified

---

## Notes

### Implementation Tips
- Work aircraft one at a time through Phase 1 before moving to Phase 2
- Test each model in hangar immediately after basic voxel placement
- Refer to design guide measurements for accuracy
- Use color accents to visually confirm each aircraft during development

### Known Considerations
- All models based on Su-27 Flanker base mesh
- Maintain proportional cockpit/fuselage relationships
- Ensure rotation/spin visibility in 3D space
- Test visual distinctiveness against all other aircraft

### File References
- Design Guide: [AIRCRAFT-DESIGN-GUIDE.md](AIRCRAFT-DESIGN-GUIDE.md)
- Models File: `game/models/PlayerAircraftModels.ts`
- Config File: `game/data/playerAircraftConfigs.ts`

---

**Last Updated:** January 20, 2026  
**Next Review:** When Phase 1 work begins
