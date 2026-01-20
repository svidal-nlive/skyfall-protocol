/**
 * StoryManager - Manages all narrative content for Skyfall Protocol
 * Includes briefings, dialogues, and story progression
 */

export interface BriefingData {
  commanderName: string;
  commanderTitle: string;
  missionTitle: string;
  briefingText: string[];
  objectives: string[];
  waveNumber: number;
  actNumber: number;
  isBoss?: boolean;
  bossName?: string;
}

export interface WaveCompleteDialogue {
  title: string;
  subtitle: string;
  commanderQuote?: string;
}

export interface GameOverDialogue {
  title: string;
  subtitle: string;
  commanderQuote: string;
}

// ============================================
// COMMANDER DATA
// ============================================
const COMMANDERS = {
  reyes: {
    commanderName: 'Commander Reyes',
    commanderTitle: 'Bastion Defense Command',
  },
  chen: {
    commanderName: 'Admiral Chen',
    commanderTitle: 'Fleet Operations',
  },
  ghost: {
    commanderName: 'Ghost',
    commanderTitle: 'Intelligence Division',
  },
};

// ============================================
// ACT 1: FIRST CONTACT (Waves 1-5)
// ============================================
const ACT1_BRIEFINGS: Record<number, BriefingData> = {
  1: {
    ...COMMANDERS.reyes,
    missionTitle: 'First Contact',
    briefingText: [
      "Welcome to Bastion, pilot. I'm Commander Reyes. I'll be your eyes in the sky.",
      "Our long-range sensors have detected unidentified aircraft approaching our airspace. Initial scans suggest light reconnaissance drones.",
      "This is your first official sortie. Engage and destroy all hostiles. Show them that Bastion's skies are defended.",
      "Stay sharp out there. These Phantoms are fast, but they're fragile. Good hunting.",
    ],
    objectives: [
      'Destroy all Phantom drones',
      'Protect Bastion airspace',
      'Return safely',
    ],
    waveNumber: 1,
    actNumber: 1,
  },
  2: {
    ...COMMANDERS.reyes,
    missionTitle: 'Escalating Threat',
    briefingText: [
      "Good work on your first sortie. But the swarm is adapting.",
      "We're seeing heavier contacts mixed with the Phantoms now. These Vipers are more aggressive - they'll actively engage.",
      "Watch your six. They like to flank.",
    ],
    objectives: [
      'Destroy all hostile aircraft',
      'Maintain combat awareness',
    ],
    waveNumber: 2,
    actNumber: 1,
  },
  3: {
    ...COMMANDERS.reyes,
    missionTitle: 'Hunter Becomes Hunted',
    briefingText: [
      "Intel suggests the swarm is testing our defenses. They're probing for weaknesses.",
      "Expect more Vipers this time. They've started using basic combat tactics.",
      "Don't underestimate them. They learn fast.",
    ],
    objectives: [
      'Neutralize Viper squadron',
      'Eliminate support Phantoms',
    ],
    waveNumber: 3,
    actNumber: 1,
  },
  4: {
    ...COMMANDERS.reyes,
    missionTitle: 'Heavy Metal',
    briefingText: [
      "We've got a problem. Scanners are picking up something big.",
      "It's a Warden-class heavy. Slow, but heavily armored and packing serious firepower.",
      "Take out the escorts first, then focus fire on the Warden. Its armor is thick, but not invincible.",
    ],
    objectives: [
      'Destroy Viper escorts',
      'Eliminate Warden heavy',
    ],
    waveNumber: 4,
    actNumber: 1,
  },
  5: {
    ...COMMANDERS.reyes,
    missionTitle: 'Carrier Strike',
    briefingText: [
      "Pilot, we have a Priority Alpha contact. A Carrier Drone has entered our airspace.",
      "This is the source of the swarm. It's launching Phantoms continuously and has heavy missile batteries.",
      "Target its engine cores - there are four of them. Destroy all four to bring it down.",
      "This is the fight we've been waiting for. Take that monster out of our sky. Bastion is counting on you.",
    ],
    objectives: [
      'Destroy Carrier Drone engine cores (0/4)',
      'Survive Phantom reinforcements',
      'Protect Bastion',
    ],
    waveNumber: 5,
    actNumber: 1,
    isBoss: true,
    bossName: 'Carrier Drone',
  },
};

// ============================================
// ACT 2: ESCALATION (Waves 6-10)
// ============================================
const ACT2_BRIEFINGS: Record<number, BriefingData> = {
  6: {
    ...COMMANDERS.chen,
    missionTitle: 'New Command',
    briefingText: [
      "Pilot, I'm Admiral Chen. Commander Reyes has been reassigned to coordinate fleet defense.",
      "The destruction of the Carrier Drone didn't stop them. If anything, they're more aggressive now.",
      "We're detecting mixed formations - Vipers and Wardens working together. Coordinated tactics.",
      "They're learning from us. We need to stay one step ahead.",
    ],
    objectives: [
      'Destroy mixed enemy formation',
      'Adapt to new tactics',
    ],
    waveNumber: 6,
    actNumber: 2,
  },
  7: {
    ...COMMANDERS.chen,
    missionTitle: 'Swarm Tactics',
    briefingText: [
      "Multiple contacts incoming. All Phantoms, but... there's a lot of them.",
      "They're using swarm tactics now. Overwhelming numbers instead of brute force.",
      "Stay mobile. Don't let them surround you.",
    ],
    objectives: [
      'Survive the Phantom swarm',
      'Destroy all hostiles',
    ],
    waveNumber: 7,
    actNumber: 2,
  },
  8: {
    ...COMMANDERS.ghost,
    missionTitle: 'Ghost Protocol',
    briefingText: [
      "Pilot, this is Ghost. I work with the Intelligence Division. We need to talk.",
      "We've intercepted something troubling. A new enemy type - designation 'Specter'.",
      "These things can cloak. Brief, but enough to throw off your targeting. Trust your instincts.",
      "One Specter is mixing with Wardens and Vipers. Find it. Kill it. We need to understand them.",
    ],
    objectives: [
      'Identify and destroy Specter',
      'Eliminate escort formation',
    ],
    waveNumber: 8,
    actNumber: 2,
  },
  9: {
    ...COMMANDERS.ghost,
    missionTitle: 'Shadow War',
    briefingText: [
      "The Specters are more dangerous than we thought. They're elite units - smarter, faster, unpredictable.",
      "Three Specters are inbound with Warden support. This is a kill squad.",
      "Watch the shimmer. When they decloak, you have a brief window. Make it count.",
    ],
    objectives: [
      'Destroy all Specters',
      'Neutralize Warden support',
    ],
    waveNumber: 9,
    actNumber: 2,
  },
  10: {
    ...COMMANDERS.chen,
    missionTitle: 'Command Strike',
    briefingText: [
      "Priority Alpha, pilot. We've located their Command Ship.",
      "This is the brain of their operation in our sector. Heavily shielded, deploying Warden escorts.",
      "Phase one: Take out the escorts. Phase two: Wait for its shield rotation to expose the bridge.",
      "The bridge is only vulnerable in phase three. Be patient. Be precise. End this.",
    ],
    objectives: [
      'Destroy Warden escorts',
      'Survive energy beam attacks',
      'Destroy Command Ship bridge',
    ],
    waveNumber: 10,
    actNumber: 2,
    isBoss: true,
    bossName: 'Command Ship',
  },
};

// ============================================
// ACT 3: SKYFALL PROTOCOL (Waves 11-15)
// ============================================
const ACT3_BRIEFINGS: Record<number, BriefingData> = {
  11: {
    ...COMMANDERS.reyes,
    missionTitle: 'Skyfall Protocol',
    briefingText: [
      "Pilot. It's Reyes. I'm taking direct command of this operation.",
      "What you're about to face... we've never seen anything like it. The swarm is mobilizing everything.",
      "Specters and Wardens in force. Elite units only. They're throwing their best at us.",
      "This is Skyfall Protocol. We hold nothing back. Neither will they.",
    ],
    objectives: [
      'Destroy elite enemy formation',
      'Survive at all costs',
    ],
    waveNumber: 11,
    actNumber: 3,
  },
  12: {
    ...COMMANDERS.reyes,
    missionTitle: 'Breaking Point',
    briefingText: [
      "They keep coming. Viper squadrons, Specter escorts. It's relentless.",
      "Our other pilots are engaging across multiple fronts. You're alone out there.",
      "But you're our best. Prove it.",
    ],
    objectives: [
      'Destroy Viper armada',
      'Eliminate Specter threats',
    ],
    waveNumber: 12,
    actNumber: 3,
  },
  13: {
    ...COMMANDERS.ghost,
    missionTitle: 'No Retreat',
    briefingText: [
      "Pilot, Ghost here. I've cracked their communications.",
      "They're afraid of you. Specifically. You've become a priority target.",
      "Everything they have left is coming for you. Specters, Vipers, Wardens. All of them.",
      "Make them regret it.",
    ],
    objectives: [
      'Survive the assault',
      'Destroy all hostiles',
    ],
    waveNumber: 13,
    actNumber: 3,
  },
  14: {
    ...COMMANDERS.reyes,
    missionTitle: 'The Last Stand',
    briefingText: [
      "Six Specters. Their entire remaining elite force.",
      "This is their last stand. Or ours.",
      "You know what to do, pilot. Finish this.",
    ],
    objectives: [
      'Destroy all Specters',
      'Clear the path to the Queen',
    ],
    waveNumber: 14,
    actNumber: 3,
  },
  15: {
    ...COMMANDERS.reyes,
    missionTitle: 'The Swarm Queen',
    briefingText: [
      "Pilot... the Queen is here. The source of everything. The hive mind controlling the swarm.",
      "She's massive. Organic and mechanical merged into something... terrifying.",
      "Three phases. First, she'll deploy her Specter guard. Then, tracking drone bombs. Finally, her core will be exposed.",
      "This is it. Everything we've fought for. Every pilot we've lost. It all comes down to this moment.",
      "Destroy the Swarm Queen. End this war. For Bastion. For humanity.",
    ],
    objectives: [
      'Survive Specter swarm (Phase 1)',
      'Evade tracking drone bombs (Phase 2)',
      'Destroy the Queen\'s Core (Phase 3)',
    ],
    waveNumber: 15,
    actNumber: 3,
    isBoss: true,
    bossName: 'The Swarm Queen',
  },
};

// ============================================
// WAVE COMPLETE DIALOGUES
// ============================================
const WAVE_COMPLETE_DIALOGUES: Record<number, WaveCompleteDialogue> = {
  1: {
    title: 'WAVE COMPLETE',
    subtitle: 'First blood. Well done, pilot.',
    commanderQuote: 'Not bad for a rookie. But it gets harder from here.',
  },
  2: {
    title: 'WAVE COMPLETE',
    subtitle: 'Hostiles neutralized.',
    commanderQuote: 'Good kills. Keep that momentum.',
  },
  3: {
    title: 'WAVE COMPLETE',
    subtitle: 'Enemy formation destroyed.',
    commanderQuote: 'You\'re adapting faster than they are. Good.',
  },
  4: {
    title: 'WAVE COMPLETE',
    subtitle: 'Warden eliminated.',
    commanderQuote: 'Those heavies are tough, but you made it look easy.',
  },
  5: {
    title: 'ACT 1 COMPLETE',
    subtitle: 'CARRIER DRONE DESTROYED',
    commanderQuote: 'Outstanding, pilot! The Carrier is down! Bastion is safe... for now.',
  },
  6: {
    title: 'WAVE COMPLETE',
    subtitle: 'Mixed formation destroyed.',
    commanderQuote: 'Their coordination is improving. So is yours.',
  },
  7: {
    title: 'WAVE COMPLETE',
    subtitle: 'Swarm neutralized.',
    commanderQuote: 'You cut through them like they were nothing.',
  },
  8: {
    title: 'WAVE COMPLETE',
    subtitle: 'Specter eliminated.',
    commanderQuote: 'Intel confirmed. The Specter is down. Good work.',
  },
  9: {
    title: 'WAVE COMPLETE',
    subtitle: 'Elite threats neutralized.',
    commanderQuote: 'Three Specters. Incredible. You\'re the real deal.',
  },
  10: {
    title: 'ACT 2 COMPLETE',
    subtitle: 'COMMAND SHIP DESTROYED',
    commanderQuote: 'The Command Ship is down! Their operations in this sector are crippled!',
  },
  11: {
    title: 'WAVE COMPLETE',
    subtitle: 'Skyfall engaged.',
    commanderQuote: 'That was just the beginning. Stay focused.',
  },
  12: {
    title: 'WAVE COMPLETE',
    subtitle: 'Armada destroyed.',
    commanderQuote: 'You\'re unstoppable. Keep pushing.',
  },
  13: {
    title: 'WAVE COMPLETE',
    subtitle: 'All hostiles eliminated.',
    commanderQuote: 'They threw everything at you and failed. One more push.',
  },
  14: {
    title: 'WAVE COMPLETE',
    subtitle: 'Path cleared.',
    commanderQuote: 'The Queen awaits. This ends now.',
  },
  15: {
    title: 'VICTORY',
    subtitle: 'THE SWARM QUEEN IS DESTROYED',
    commanderQuote: 'You did it... The Queen is dead. The swarm is broken. Humanity owes you everything, pilot.',
  },
};

// ============================================
// GAME OVER DIALOGUES
// ============================================
const GAME_OVER_DIALOGUES = {
  early: {
    title: 'MISSION FAILED',
    subtitle: 'Aircraft destroyed',
    commanderQuote: 'We\'ve lost the pilot. All units, fall back to defensive positions.',
  },
  mid: {
    title: 'MISSION FAILED',
    subtitle: 'Aircraft destroyed',
    commanderQuote: 'No... not you. We were so close. Bastion will remember your sacrifice.',
  },
  late: {
    title: 'MISSION FAILED',
    subtitle: 'Aircraft destroyed',
    commanderQuote: 'We were so close to ending this. Your sacrifice won\'t be forgotten, pilot.',
  },
  boss: {
    title: 'MISSION FAILED',
    subtitle: 'Aircraft destroyed during boss encounter',
    commanderQuote: 'The beast still lives. Another pilot will have to finish what you started.',
  },
};

// ============================================
// STORY MANAGER CLASS
// ============================================
class StoryManager {
  private static instance: StoryManager;

  private constructor() {}

  public static getInstance(): StoryManager {
    if (!StoryManager.instance) {
      StoryManager.instance = new StoryManager();
    }
    return StoryManager.instance;
  }

  /**
   * Get briefing data for a specific wave
   */
  public getBriefing(waveNumber: number): BriefingData | null {
    if (waveNumber <= 5) {
      return ACT1_BRIEFINGS[waveNumber] || null;
    } else if (waveNumber <= 10) {
      return ACT2_BRIEFINGS[waveNumber] || null;
    } else if (waveNumber <= 15) {
      return ACT3_BRIEFINGS[waveNumber] || null;
    }
    return null;
  }

  /**
   * Check if a wave should show a briefing
   * Briefings shown at: Wave 1, 5 (boss), 6, 10 (boss), 11, 15 (boss)
   * Plus waves 2-4, 7-9, 12-14 for full story
   */
  public shouldShowBriefing(waveNumber: number): boolean {
    // Show briefing for all waves in story mode
    return waveNumber >= 1 && waveNumber <= 15;
  }

  /**
   * Check if a wave is a boss wave
   */
  public isBossWave(waveNumber: number): boolean {
    return waveNumber === 5 || waveNumber === 10 || waveNumber === 15;
  }

  /**
   * Get act number for a wave
   */
  public getActNumber(waveNumber: number): number {
    if (waveNumber <= 5) return 1;
    if (waveNumber <= 10) return 2;
    return 3;
  }

  /**
   * Get wave complete dialogue
   */
  public getWaveCompleteDialogue(waveNumber: number): WaveCompleteDialogue {
    return WAVE_COMPLETE_DIALOGUES[waveNumber] || {
      title: 'WAVE COMPLETE',
      subtitle: 'Hostiles eliminated.',
    };
  }

  /**
   * Get game over dialogue based on wave
   */
  public getGameOverDialogue(waveNumber: number): GameOverDialogue {
    if (this.isBossWave(waveNumber)) {
      return GAME_OVER_DIALOGUES.boss;
    }
    if (waveNumber <= 4) {
      return GAME_OVER_DIALOGUES.early;
    }
    if (waveNumber <= 10) {
      return GAME_OVER_DIALOGUES.mid;
    }
    return GAME_OVER_DIALOGUES.late;
  }

  /**
   * Get act complete message
   */
  public getActCompleteMessage(actNumber: number): { title: string; message: string } {
    switch (actNumber) {
      case 1:
        return {
          title: 'ACT 1 COMPLETE: FIRST CONTACT',
          message: 'The Carrier Drone is destroyed. Bastion is safe... for now.',
        };
      case 2:
        return {
          title: 'ACT 2 COMPLETE: ESCALATION',
          message: 'The Command Ship is down. But the Queen still lives.',
        };
      case 3:
        return {
          title: 'CAMPAIGN COMPLETE: SKYFALL PROTOCOL',
          message: 'The Swarm Queen is destroyed. Humanity is saved. You are a legend.',
        };
      default:
        return {
          title: 'ACT COMPLETE',
          message: 'Proceed to the next act.',
        };
    }
  }

  /**
   * Get boss name for a wave
   */
  public getBossName(waveNumber: number): string | null {
    switch (waveNumber) {
      case 5: return 'Carrier Drone';
      case 10: return 'Command Ship';
      case 15: return 'The Swarm Queen';
      default: return null;
    }
  }

  /**
   * Get a random radio chatter line for combat
   */
  public getRandomRadioChatter(): string {
    const chatter = [
      'Contact ahead!',
      'Bogey on your six!',
      'Watch the crossfire!',
      'Good kill!',
      'Target down!',
      'Keep \'em coming!',
      'Missile away!',
      'Fox two!',
      'Splash one!',
      'Multiple contacts!',
    ];
    return chatter[Math.floor(Math.random() * chatter.length)];
  }
}

export const storyManager = StoryManager.getInstance();
export default StoryManager;
