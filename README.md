# Skyfall Protocol

> **Voxel Ace: Defender** - An arcade flight combat game with roguelite progression

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Phase](https://img.shields.io/badge/Phase-6%20of%2015-blue)

## 🎮 About

Voxel Ace: Defender is a fast-paced arcade flight combat game set in **Year 2157**. Humanity's last hope floats above the clouds - the flying fortress **BASTION**. As a Voxel Ace pilot, you must defend BASTION from endless waves of drone swarms in the **Skyfall Protocol**.

### Features
- **Multi-target Lock-on System** - Lock up to 5 enemies simultaneously
- **Dual Weapons** - Regenerating missiles + infinite cannon
- **Territorial AI** - Enemies patrol, engage, and retreat based on POIs
- **Combo Scoring** - Chain kills for massive multipliers
- **Tactical Radar** - Real-time minimap with threat awareness
- **Multiple Enemy Types** - Scouts, Fighters, Heavies, Elites *(coming soon)*
- **Player Aircraft Garage** - 5 unlockable ships *(coming soon)*
- **Wave-based Combat** - 15 waves across 3 acts *(coming soon)*
- **Boss Encounters** - Epic multi-phase battles *(coming soon)*

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 Controls

| Action | Key/Button |
|--------|------------|
| Pitch/Yaw | Mouse Movement |
| Roll | A / D |
| Throttle Up | W |
| Throttle Down | S |
| Fire Cannon | Left Click |
| Fire Missile | Right Click |
| Cycle Lock | Tab |

See [CONTROLS-GUIDE.md](./CONTROLS-GUIDE.md) for detailed controls.

## 📊 Development Progress

| Phase | Status |
|-------|--------|
| ✅ Phases 1-5 | Combat Core Complete |
| 🔲 Phase 6 | Enemy Variety (NEXT) |
| 🔲 Phases 7-15 | Planned |

**Progress: 5/15 phases complete (33%)**

## 📁 Documentation

| Document | Purpose |
|----------|---------|
| [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) | Full 15-phase implementation plan with specs |
| [PROGRESS-CHECKLIST.md](./PROGRESS-CHECKLIST.md) | Quick-reference progress tracker |
| [CONTROLS-GUIDE.md](./CONTROLS-GUIDE.md) | Player controls reference |
| [WEAPONS-SYSTEM-PROPOSAL.md](./WEAPONS-SYSTEM-PROPOSAL.md) | Original weapons design doc |

## 🏗️ Project Structure

```
voxel-ace-defender/
├── components/          # React UI components
│   ├── Crosshair.tsx   # Lock-on indicators
│   ├── RadarHUD.tsx    # Tactical radar display
│   ├── ScoreHUD.tsx    # Score and combo
│   ├── TargetingHUD.tsx # Lock slots
│   └── WeaponsHUD.tsx  # Missile/cannon status
├── game/               # Core game logic
│   ├── CannonController.ts
│   ├── EnemyAI.ts
│   ├── EnemyManager.ts
│   ├── ExplosionManager.ts
│   ├── GameEngine.ts
│   ├── MissileController.ts
│   ├── PlayerJet.ts
│   ├── ScoreManager.ts
│   └── TargetingController.ts
├── App.tsx             # Main React app
├── index.tsx           # Entry point
└── *.md                # Documentation
```

## 🛠️ Tech Stack

- **React 19.2** - UI framework
- **Three.js 0.182** - 3D rendering
- **TypeScript 5.8** - Type safety
- **Vite 6.4** - Build tool

## 🎨 Game Design

### The Skyfall Protocol

> *The clouds have swallowed the Earth. Above the storm, BASTION floats - humanity's last sanctuary. The swarm approaches. Defend what remains.*

**Core Loop:**
1. Launch from BASTION into combat
2. Defend territories from drone waves
3. Survive escalating enemy compositions
4. Return to BASTION for upgrades
5. Progress through 3 Acts
6. Unlock new aircraft

### Enemy Classes
| Type | Role | Threat |
|------|------|--------|
| Phantom | Scout | ★ |
| Viper | Fighter | ★★ |
| Warden | Heavy | ★★★ |
| Specter | Elite | ★★★★ |

### Player Aircraft
| Ship | Style | Unlock |
|------|-------|--------|
| Falcon | Balanced | Default |
| Switchblade | Speed | 1000 pts |
| Ironclad | Tank | Act 1 |
| Wraith | Stealth | Act 2 |
| Archon | Elite | Campaign |

## 📝 License

This project is for personal/educational use.

---

*Built with ❤️ by Voxel Ace Team*

