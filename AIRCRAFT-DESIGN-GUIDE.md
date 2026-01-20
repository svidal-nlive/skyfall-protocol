# Aircraft Design Guide - Visual & Model Modifications

## Overview
Each aircraft in the hangar represents a distinct military aircraft type. The current base model is a **Su-27 Flanker** (Russian fighter jet) with twin engines and canard wings. This guide describes the intended visual design for each ship and the voxel modifications needed to transform the base model.

---

## 1. F-22 Falcon - Modern Stealth Fighter

### Real Aircraft: F-22 Raptor (US Air Force)
The F-22 is a 5th-gen stealth fighter with:
- **Sleek, diamond-shaped fuselage** (aerodynamic, pointed)
- **Stealthy design** - angular edges, no curved surfaces
- **Single vertical tail fin** (not twin)
- **Compact, proportional wings** - medium length, squared edges
- **Air inlets on fuselage sides** (not prominent)
- **Narrow, elongated cockpit** area
- **Minimalist, integrated design** - no external protrusions
- **Low-observable profile** - sharp angles dominate

### Base Model → F-22 Modifications
**Current State:** Twin-engine, canard (small front wings), swept-back tail fins
**Target:** Single-tail, stealthy, diamond profile

**Voxel Modifications:**
1. **Fuselage:** Make more pointed/tapered toward nose, less chunky
   - Reduce fuselage width at nose by 30%
   - Create angular edges instead of rounded surfaces
   - Narrow the belly section
   
2. **Engine/Tail Section:** 
   - Reduce to single vertical stabilizer (remove one side)
   - Move vertical fin more to center
   - Make tail taper sharper
   
3. **Wings:**
   - Reduce canard wings (small front wings) size by 50%
   - Keep main wings but make edges more angular/squared
   - Reduce wing thickness
   
4. **Cockpit:**
   - Make narrower and more pointed
   - Slightly raised (traditional fighter canopy position)
   
5. **Color Scheme:** 
   - Accent: Metallic blue (#0099ff) - steel/titanium look
   - Dark gray belly, blue-gray body

---

## 2. X-47 Switchblade - Agile Strike Fighter

### Real Aircraft: F-16 Fighting Falcon / FA-50 (Compact multirole fighter)
The Switchblade is an agile, nimble fighter with:
- **Small, compact fuselage** (50% smaller than base)
- **Single vertical tail fin** - proportional to body
- **Short, stubby wings** - low aspect ratio (faster turning)
- **Prominent air intakes** on sides
- **Sleek, dart-like profile** - pointed nose
- **Quick, twitchy appearance** - aggressive stance
- **Single engine** look (narrow profile)
- **Afterburner nozzle** prominent

### Base Model → Switchblade Modifications
**Current State:** Large twin-engine fighter
**Target:** Small, agile, compact single-engine fighter

**Voxel Modifications:**
1. **Overall Scaling:** Reduce entire model to 70% of current size
   - Narrower fuselage (tighter profile)
   - More compact appearance
   
2. **Fuselage:**
   - Shorten by 25%
   - Make narrower (single-engine thickness)
   - Create angular, aggressive lines
   - Pointed nose with slight upturn
   
3. **Wings:**
   - Reduce length by 40% (stubby wings)
   - Increase thickness (sturdy for aggressive maneuvers)
   - Square/blunt wing tips (not swept)
   - Position slightly lower on fuselage
   
4. **Tail:**
   - Single, shorter vertical fin (30% smaller than base)
   - More upright position
   - No horizontal stabilizers (simplified)
   
5. **Inlets:** 
   - Add prominent angular inlets on fuselage sides
   - Make darker/inset appearance
   
6. **Color Scheme:**
   - Accent: Crimson red (#ff3333) - aggressive, sharp
   - Matte black or dark gray body
   - Red canopy section for intensity

---

## 3. A-10 Ironclad - Heavy Assault Gunship

### Real Aircraft: A-10 Thunderbolt II (Warthog)
The Ironclad is a heavily armored, powerful aircraft:
- **Bulky, broad fuselage** (stocky, strong)
- **Twin vertical tail fins** (widely spaced for stability)
- **Short, stubby, high-mounted wings** (low stall speed)
- **Pronounced twin engines** - visible as large bumps
- **Flat, boxy profile** (functional, not aerodynamic)
- **Massive air intakes** visible
- **Heavy, tank-like appearance** - built for punishment
- **Straight leading edges** on wings
- **Landing gear visible** under fuselage

### Base Model → Ironclad Modifications
**Current State:** Twin-engine fighter
**Target:** Heavy assault gunship with visible armor/bulk

**Voxel Modifications:**
1. **Fuselage:**
   - Increase width by 40% (broader, stockier)
   - Keep length similar but make taller profile
   - Boxy, functional design instead of sleek
   - Visible panel lines/armor plating voxels
   
2. **Wings:**
   - Reduce length by 20% (shorter, stubbier)
   - Increase thickness dramatically (heavy armor)
   - Raise wing position (high-mounted)
   - Straight leading edges (no sweep)
   - Blunt wing tips
   
3. **Engines:**
   - Make engines much more prominent/visible
   - Increase intake diameter (larger air scoops)
   - Add visible turbine/exhaust details
   
4. **Tail:**
   - Keep twin fins but space wider apart
   - Make fins larger/more prominent (stability system)
   - Add small horizontal stabilizers
   
5. **Landing Gear Suggestion:**
   - Add subtle voxel details showing landing gear pods
   - Create raised fuselage underside bumps
   
6. **Armor Details:**
   - Add texture via voxel arrangement (panel-like appearance)
   - Visible reinforcement areas
   
7. **Color Scheme:**
   - Accent: Dark olive green (#55aa55) - military
   - Tan/beige belly
   - Weathered appearance with gray accents

---

## 4. SR-71 Wraith - Reconnaissance Jet

### Real Aircraft: SR-71 Blackbird
The Wraith is a sleek, elongated reconnaissance jet:
- **Extremely long, slender fuselage** (high length-to-width ratio)
- **Very narrow profile** (speed optimized, slim)
- **Twin vertical tail fins** - tall, prominent
- **Tiny, stubby wings** (minimal lift needed for speed)
- **Pointed, needle-sharp nose** (hypersonic-designed)
- **Smooth, streamlined body** (no bumps or protrusions)
- **Dark, stealthy appearance** - matte black/purple
- **Air intakes integrated into fuselage**
- **Sleek, elegant profile** - built for speed/stealth

### Base Model → Wraith Modifications
**Current State:** Stocky twin-engine fighter
**Target:** Elongated, needle-like reconnaissance jet

**Voxel Modifications:**
1. **Fuselage:**
   - Increase length by 50% (very long and slender)
   - Reduce width by 30% (very narrow, slip through air)
   - Create needle-sharp point at nose (6-8 voxels long)
   - Taper to very thin tail section
   - Smooth, streamlined appearance
   
2. **Wings:**
   - Reduce to minimal proportions (tiny wings)
   - Very thin, blade-like appearance
   - Only 60% length of base
   - Positioned closer to tail (balance for long fuselage)
   - Diamond/thin profile
   
3. **Tail:**
   - Keep twin fins but make them taller/more prominent
   - Twin fins positioned wider (stability for long body)
   - Make fins more blade-like
   - Add small horizontal stabilizers
   
4. **Cockpit:**
   - Minimal, integrated into smooth fuselage
   - No bubble canopy - smooth fairing
   
5. **Engine/Inlets:**
   - Integrate inlets smoothly into sides
   - No prominent external intake bumps
   - Single, centralized exhaust appearance
   
6. **Stealth Features:**
   - Completely smooth, no external protrusions
   - Rounded edges where they exist (aerodynamic)
   - Integrated design throughout
   
7. **Color Scheme:**
   - Accent: Deep purple (#9966ff) - mysterious/stealth
   - Matte black body
   - Purple navigation lights (glowing effect)

---

## 5. XF-108 Archon - Advanced Experimental Fighter

### Real Aircraft: Concept (F-14 Tomcat / Advanced Fighter Hybrid)
The Archon is an advanced, futuristic experimental fighter:
- **Sleek, modern fuselage** with advanced shaping
- **Variable-geometry appearance** (suggests advanced tech)
- **Twin vertical tail fins** - tall, swept-back
- **Prominent canards** (active control surfaces)
- **Medium-length, advanced wings** with active surfaces
- **Integrated air inlets** (stealthy design)
- **Advanced, aggressive styling** - angular, purposeful
- **Delta/canard hybrid layout** (futuristic)
- **Glowing elements** (advanced systems, lights)

### Base Model → Archon Modifications
**Current State:** Su-27 with canards and twin fins
**Target:** Advanced experimental fighter with active surfaces

**Voxel Modifications:**
1. **Fuselage:**
   - Streamline and modernize shape
   - Create faceted, angular design (high-tech)
   - Increase cockpit prominence slightly
   - Add subtle bulges for "advanced systems"
   - Sleek, purposeful lines throughout
   
2. **Canards (Small Front Wings):**
   - Enlarge significantly (50% larger)
   - Make more angular, active-looking
   - Add articulated appearance (variable geometry)
   - Position slightly raised (aggressive stance)
   
3. **Main Wings:**
   - Keep good size but refine edges
   - Add slight canard-wing integration
   - Create leading-edge extensions (LEX)
   - Angular, purposeful design
   
4. **Tail:**
   - Keep twin fins but make them more angular/swept
   - Increase height/prominence (advanced stability system)
   - Add small horizontal canards if space allows
   - Very sleek, sharp appearance
   
5. **Advanced Features:**
   - Add subtle voxel "sensor" bumps/facets on fuselage
   - Create articulated surface appearance (variable geometry)
   - Integration of air inlets as design elements
   
6. **Cockpit:**
   - Make slightly raised/prominent (advanced avionics)
   - Add subtle glow effect voxels
   
7. **Glowing Elements:**
   - Glowing nav lights (red, green)
   - Glowing cockpit area
   - Slight glow from engine section
   
8. **Color Scheme:**
   - Accent: Metallic gold/amber (#ffaa00) - advanced/premium
   - Dark blue-gray body
   - Gold accents on leading edges
   - Glowing white/blue cockpit

---

## Animations & Effects by Aircraft Type

### F-22 Falcon - Smooth, Precise Control Animations

**Control Surfaces:**

- **Ailerons:** Fast, snappy movements (±15° rotation) - responsive to input
- **Elevators:** Subtle, smooth pitch adjustments (±12°)
- **Rudder:** Minimal yaw control (±8°) - stealth jets use pitch/roll primarily
- **Canards:** Slight, coordinated movements with main control surfaces

**Engine Effects:**

- **Afterburner Glow:** Blue-white glow (#66ccff) - steady, intense
- **Engine Flare:** Pulsing glow effect synchronized with speed changes
- **Exhaust Trail:** Thin, sharp-edged trail (high-speed, clean)
- **Air Intake:** Subtle shimmer voxels at intake areas during acceleration

**Flight Dynamics Animation:**

- **Banking:** Wings tilt smoothly with banking animation
- **Pitch-up Animation:** Nose rises elegantly during climb
- **Speed Shimmer:** Cockpit area has slight blue glow that intensifies with speed
- **Stealth Mode Feel:** Subtle shimmering around fuselage edges (camouflage effect)

---

### X-47 Switchblade - Aggressive, Twitchy Animations

**Control Surfaces:**

- **Ailerons:** Ultra-fast snap rolls (±20° rotation) - quick, jerky movements
- **Elevators:** Rapid pitch changes (±18°) - aggressive climb/dive
- **Rudder:** Active yaw control (±12°) - nimble turning
- **Canards:** Exaggerated movements (±15°) - visible adjustment for tight maneuvers

**Engine Effects:**

- **Afterburner Glow:** Bright crimson-red glow (#ff5555) - pulsing/aggressive
- **Afterburner Flare:** Multiple pulse waves (staccato effect) - feels like bursts
- **Exhaust Trail:** Wide, turbulent trail with visible smoke particles
- **Intake Flashing:** Prominent intake voxels pulse/glow when accelerating

**Flight Dynamics Animation:**

- **Violent Banking:** Sharp, aggressive wing tilts with angular motion
- **Rapid Pitch:** Quick snap pitches for aggressive maneuvers
- **Turbulence Effect:** Body slightly wobbles/shakes when at high speed (instability feel)
- **Afterburner Pulse:** Fuselage has rhythmic glow pulses matching acceleration
- **Damage Flash:** Inlets flash red briefly when taking damage (visual stress indicator)

---

### A-10 Ironclad - Heavy, Powerful Animations

**Control Surfaces:**

- **Ailerons:** Slow, deliberate movements (±10° rotation) - heavy, resistant
- **Elevators:** Gentle pitch control (±8°) - requires more time to maneuver
- **Rudder:** Strong yaw movements (±10°) - wide turns, not quick ones
- **Canards:** Minimal movement (±5°) - stabilizers, not active control

**Engine Effects:**

- **Afterburner Glow:** Deep orange-yellow glow (#ffaa44) - hot, powerful
- **Engine Rumble Visual:** Entire fuselage shakes/vibrates during afterburner use
- **Turbine Visible:** Engine section has rotating voxel animation (turbine spinning)
- **Exhaust Trail:** Thick, heavy trail with large smoke plumes - visible weight/power

**Flight Dynamics Animation:**

- **Heavy Banking:** Slow, deliberate wing tilts with lag/momentum
- **Momentum Buildup:** Takes time to reach maneuver speeds (accelerates sluggishly)
- **Landing Gear Animation:** Visible landing gear extends/retracts smoothly
- **Armor Plating Flash:** Visible armor panels briefly illuminate when struck (damage absorption)
- **Engine Vibration:** Continuous subtle vibration during powered flight
- **Afterburner Kick:** Visible surge/acceleration when afterburner engages

---

### SR-71 Wraith - Swift, Elegant Animations

**Control Surfaces:**

- **Ailerons:** Smooth, flowing movements (±12° rotation) - graceful adjustments
- **Elevators:** Gentle, precise pitch (±10°) - minimal movement needed for control
- **Rudder:** Subtle yaw control (±6°) - primarily speed-based control
- **Canards:** Barely visible movements (±4°) - passive, not active

**Engine Effects:**

- **Afterburner Glow:** Deep purple-blue glow (#7744ff) - exotic, otherworldly
- **Smooth Acceleration:** Glow gradually intensifies (no pulsing - continuous power)
- **Hypersonic Trail:** Very thin, elongated trail that stretches far behind aircraft
- **Stealth Shimmer:** Entire fuselage has subtle purple shimmer/distortion effect
- **Engine Flare:** Glowing engine section pulses with deep purple light

**Flight Dynamics Animation:**

- **Smooth Banking:** Elegant, flowing wing tilts with minimal rotation
- **High-Speed Shimmer:** Transparent shimmer effect around entire fuselage at high speeds
- **Stealth Visual:** Subtle transparency/invisibility effect when using stealth (if implemented)
- **Pursuit Animation:** Trail extends dynamically, showing distance traveled
- **Speed Lines:** Faint directional lines appear around fuselage at maximum speed
- **Minimal Damage Reaction:** Aircraft shows less visible damage effects (minimalist design)

---

### XF-108 Archon - Advanced, Active Animations

**Control Surfaces:**

- **Ailerons:** Dynamic, variable movements (±18° rotation) - changes based on speed/g-forces
- **Elevators:** Active, responsive pitch (±15°) - smooth with rapid transitions
- **Rudder:** Coordinated active yaw (±10°) - works with canards for agility
- **Canards:** Prominent, active movements (±16°) - large visible adjustments
- **Flaps/Surfaces:** Additional articulated surfaces with independent animations

**Engine Effects:**

- **Afterburner Glow:** Metallic gold-white glow (#ffdd66) - advanced technology feel
- **Multi-stage Glow:** Two-layer glow (inner blue core + gold outer layer)
- **Plasma Effect:** Sparking particle effects around exhaust during afterburner
- **Advanced Shimmer:** Holographic-like shimmer effect around entire airframe
- **Intake Animation:** Intake voxels rotate/adjust during flight (active air management)

**Flight Dynamics Animation:**

- **Active Surface Animation:** All control surfaces move coordinatedly, appearing AI-controlled
- **G-Force Glow:** Cockpit area glows brighter under high g-force turns
- **Variable Geometry Feel:** Fuselage subtly changes shape/posture for aerodynamic optimization
- **System Activation:** Glowing voxel details (sensors, systems) pulse/light up during maneuvers
- **Advanced Trail:** Trail has multiple colors (gold + blue) creating advanced tech appearance
- **Energy Visualization:** Outer fuselage glow intensifies with stored energy/power
- **Stability Assist Visual:** Small offset corrections visible as quick surface adjustments
- **Warning Glow:** Red pulsing glow on specific panel areas when taking damage

---

## Animation Implementation Notes

### Shared Animation Framework

All aircraft should use:

1. **Control Surface Rotation** - Quaternion-based smooth rotation
2. **Glow Intensity Animation** - Based on throttle/afterburner state
3. **Trail System** - Dynamic particle trails with aircraft-specific colors
4. **Damage Effects** - Color/glow changes when health is reduced

### Control Surface Speed Tiers

- **Fast:** Switchblade, Archon (±15-20°, instant response)
- **Normal:** Falcon, Wraith (±10-12°, 0.1s lerp)
- **Slow:** Ironclad (±8-10°, 0.2s lerp with momentum)

### Afterburner Implementation

- **Color Mapping:**
  - Falcon: #66ccff (blue-white)
  - Switchblade: #ff5555 (crimson)
  - Ironclad: #ffaa44 (deep orange)
  - Wraith: #7744ff (purple-blue)
  - Archon: #ffdd66 (gold-white)

- **Glow Pattern:**
  - Switchblade: Pulsing (staccato)
  - Falcon: Steady (continuous)
  - Ironclad: Throbbing (heavy)
  - Wraith: Smooth gradient (increasing)
  - Archon: Multi-layer (complex)

### Cockpit Glow Animations

- **Falcon:** Blue (#0099ff) - subtle, professional
- **Switchblade:** Red (#ff3333) - intense, aggressive
- **Ironclad:** Green (#55aa55) - muted, utilitarian
- **Wraith:** Purple (#9966ff) - ethereal, mysterious
- **Archon:** Gold (#ffaa00) - advanced, premium

---

## Modification Priority & Difficulty

### Easiest (Color-Only Changes)

- **F-22 Falcon** - Can start with fuselage tapering + reduced canards
- **A-10 Ironclad** - Mainly fuselage widening + wing modifications

### Medium Complexity

- **X-47 Switchblade** - Requires scaling down entire model + wing reshaping
- **SR-71 Wraith** - Requires significant fuselage elongation + wing reduction

### Most Complex

- **XF-108 Archon** - Requires balanced modifications across all sections, glowing elements

---

## Implementation Strategy

### Phase 1: Build Individual Models

1. Create separate functions for each aircraft (vs. current single design)
2. Modify voxel placement based on above specifications
3. Apply unique material colors

### Phase 2: Cockpit & Details

1. Add prominent features (larger engines for A-10, longer nose for Wraith)
2. Create articulated sections for Archon
3. Add visual indicators (glowing elements, damage resistance appearance)

### Phase 3: Polish & Testing

1. Ensure visual distinctiveness in hangar preview
2. Verify proportions scale properly
3. Test rotation/visibility in 3D space

---

## Visual Comparison Matrix

| Feature | F-22 | Switchblade | Ironclad | Wraith | Archon |
| --- | --- | --- | --- | --- | --- |
| **Fuselage** | Pointed, angular | Compact, aggressive | Bulky, boxy | Elongated, needle | Modern, faceted |
| **Wings** | Medium, sleek | Short, stubby | Short, sturdy | Minimal, thin | Medium, active |
| **Tail** | Single fin | Single fin | Twin fins, wide | Twin fins, tall | Twin fins, swept |
| **Size** | Standard | Small (70%) | Large (130%) | Long (150% length) | Standard |
| **Profile** | Diamond | Dart | Tank | Needle | Delta-canard |
| **Visual Feel** | Stealthy | Agile | Armored | Swift | Advanced |


