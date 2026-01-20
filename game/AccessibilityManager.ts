/**
 * AccessibilityManager - Handles accessibility settings
 * 
 * Features:
 * - Colorblind mode filters (protanopia, deuteranopia, tritanopia)
 * - HUD opacity adjustment
 * - HUD scale adjustment
 * - Motion reduction
 * - Settings persistence
 */

export type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface AccessibilitySettings {
  colorblindMode: ColorblindMode;
  hudOpacity: number;      // 0.3 - 1.0
  hudScale: number;        // 0.8 - 1.5
  reducedMotion: boolean;
  screenShakeEnabled: boolean;
  flashEffectsEnabled: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  colorblindMode: 'none',
  hudOpacity: 1.0,
  hudScale: 1.0,
  reducedMotion: false,
  screenShakeEnabled: true,
  flashEffectsEnabled: true,
};

// CSS filter values for colorblind modes
const COLORBLIND_FILTERS: Record<ColorblindMode, string> = {
  none: 'none',
  // Protanopia (red-blind) - shifts reds toward greens/yellows
  protanopia: 'url(#protanopia-filter)',
  // Deuteranopia (green-blind) - most common, shifts greens toward reds
  deuteranopia: 'url(#deuteranopia-filter)',
  // Tritanopia (blue-blind) - shifts blues toward greens
  tritanopia: 'url(#tritanopia-filter)',
};

class AccessibilityManager {
  private settings: AccessibilitySettings;
  private filterElement: SVGSVGElement | null = null;
  
  constructor() {
    this.settings = this.loadSettings();
    this.createColorblindFilters();
    this.applySettings();
  }
  
  /**
   * Load settings from localStorage
   */
  private loadSettings(): AccessibilitySettings {
    try {
      const saved = localStorage.getItem('skyfall-accessibility');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }
  
  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('skyfall-accessibility', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save accessibility settings:', e);
    }
  }
  
  /**
   * Create SVG filters for colorblind modes
   */
  private createColorblindFilters(): void {
    // Check if filters already exist
    if (document.getElementById('colorblind-filters')) {
      return;
    }
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'colorblind-filters');
    svg.setAttribute('style', 'position: absolute; width: 0; height: 0;');
    svg.innerHTML = `
      <defs>
        <!-- Protanopia (red-blind) simulation -->
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567, 0.433, 0,     0, 0
            0.558, 0.442, 0,     0, 0
            0,     0.242, 0.758, 0, 0
            0,     0,     0,     1, 0
          "/>
        </filter>
        
        <!-- Deuteranopia (green-blind) simulation -->
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625, 0.375, 0,   0, 0
            0.7,   0.3,   0,   0, 0
            0,     0.3,   0.7, 0, 0
            0,     0,     0,   1, 0
          "/>
        </filter>
        
        <!-- Tritanopia (blue-blind) simulation -->
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.95, 0.05,  0,     0, 0
            0,    0.433, 0.567, 0, 0
            0,    0.475, 0.525, 0, 0
            0,    0,     0,     1, 0
          "/>
        </filter>
      </defs>
    `;
    
    document.body.appendChild(svg);
    this.filterElement = svg;
  }
  
  /**
   * Apply current settings to the DOM
   */
  private applySettings(): void {
    // Apply colorblind filter to game canvas
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.filter = COLORBLIND_FILTERS[this.settings.colorblindMode];
    }
    
    // Apply HUD opacity and scale via CSS custom properties
    document.documentElement.style.setProperty(
      '--hud-opacity',
      this.settings.hudOpacity.toString()
    );
    document.documentElement.style.setProperty(
      '--hud-scale',
      this.settings.hudScale.toString()
    );
    
    // Dispatch settings update event
    window.dispatchEvent(new CustomEvent('accessibility-settings-change', {
      detail: { ...this.settings }
    }));
  }
  
  /**
   * Get current settings
   */
  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }
  
  /**
   * Set colorblind mode
   */
  public setColorblindMode(mode: ColorblindMode): void {
    this.settings.colorblindMode = mode;
    this.saveSettings();
    this.applySettings();
  }
  
  /**
   * Set HUD opacity (0.3 - 1.0)
   */
  public setHudOpacity(opacity: number): void {
    this.settings.hudOpacity = Math.max(0.3, Math.min(1.0, opacity));
    this.saveSettings();
    this.applySettings();
  }
  
  /**
   * Set HUD scale (0.8 - 1.5)
   */
  public setHudScale(scale: number): void {
    this.settings.hudScale = Math.max(0.8, Math.min(1.5, scale));
    this.saveSettings();
    this.applySettings();
  }
  
  /**
   * Set reduced motion preference
   */
  public setReducedMotion(enabled: boolean): void {
    this.settings.reducedMotion = enabled;
    this.saveSettings();
    this.applySettings();
  }
  
  /**
   * Set screen shake enabled
   */
  public setScreenShakeEnabled(enabled: boolean): void {
    this.settings.screenShakeEnabled = enabled;
    this.saveSettings();
    this.applySettings();
  }
  
  /**
   * Set flash effects enabled
   */
  public setFlashEffectsEnabled(enabled: boolean): void {
    this.settings.flashEffectsEnabled = enabled;
    this.saveSettings();
    this.applySettings();
  }
  
  /**
   * Reset to defaults
   */
  public resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.applySettings();
  }
  
  /**
   * Check if screen shake should be applied
   */
  public shouldApplyScreenShake(): boolean {
    return this.settings.screenShakeEnabled && !this.settings.reducedMotion;
  }
  
  /**
   * Check if flash effects should be applied
   */
  public shouldApplyFlashEffects(): boolean {
    return this.settings.flashEffectsEnabled && !this.settings.reducedMotion;
  }
}

// Singleton instance
export const accessibilityManager = new AccessibilityManager();
