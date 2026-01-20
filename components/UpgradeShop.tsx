/**
 * UpgradeShop - Full-screen upgrade shop between waves
 * 
 * Phase 10: Upgrade Shop & Currency
 * - Category tabs (Weapons, Defense, Systems, Special)
 * - Upgrade cards with level, cost, effect
 * - Purchase button with visual feedback
 * - Ready for Combat button to proceed
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  UpgradeCategory, 
  UPGRADE_DEFINITIONS, 
  upgradeManager 
} from '../game/UpgradeManager';
import { currencyManager, CurrencyState } from '../game/CurrencyManager';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

interface UpgradeShopProps {
  onClose: () => void;
  waveNumber: number;
  isVisible: boolean;
  context?: 'game' | 'hangar';
}

interface UpgradeCardState {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: UpgradeCategory;
  currentLevel: number;
  maxLevel: number;
  nextCost: number;
  currentEffect: number;
  nextEffect: number;
  effectUnit: string;
  canPurchase: boolean;
  isMaxLevel: boolean;
}

const CATEGORIES: { id: UpgradeCategory; name: string; icon: string }[] = [
  { id: 'weapons', name: 'WEAPONS', icon: '🚀' },
  { id: 'defense', name: 'DEFENSE', icon: '🛡️' },
  { id: 'systems', name: 'SYSTEMS', icon: '📡' },
  { id: 'special', name: 'SPECIAL', icon: '⚡' },
];

export const UpgradeShop: React.FC<UpgradeShopProps> = ({ 
  onClose, 
  waveNumber,
  isVisible,
  context = 'game'
}) => {
  const { isMobile, isTablet } = useDeviceDetection();
  const [selectedCategory, setSelectedCategory] = useState<UpgradeCategory>('weapons');
  const [scrap, setScrap] = useState(currencyManager.getScrap());
  const [upgrades, setUpgrades] = useState<UpgradeCardState[]>([]);
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null);

  // Refresh upgrade states
  const refreshUpgrades = useCallback(() => {
    const states = UPGRADE_DEFINITIONS.map(def => {
      const state = upgradeManager.getUpgradeState(def.id);
      if (!state) return null;
      
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        currentLevel: state.currentLevel,
        maxLevel: def.maxLevel,
        nextCost: state.nextCost,
        currentEffect: state.currentEffect,
        nextEffect: state.nextEffect,
        effectUnit: def.effectUnit,
        canPurchase: state.canPurchase,
        isMaxLevel: state.isMaxLevel,
      };
    }).filter(Boolean) as UpgradeCardState[];
    
    setUpgrades(states);
  }, []);

  useEffect(() => {
    refreshUpgrades();
    setScrap(currencyManager.getScrap());
  }, [isVisible, refreshUpgrades]);

  useEffect(() => {
    const handleScrapUpdate = (e: CustomEvent<CurrencyState>) => {
      setScrap(e.detail.scrap);
      refreshUpgrades();
    };

    const handleUpgradePurchased = () => {
      refreshUpgrades();
    };

    window.addEventListener('scrap-update', handleScrapUpdate as EventListener);
    window.addEventListener('upgrade-purchased', handleUpgradePurchased as EventListener);

    return () => {
      window.removeEventListener('scrap-update', handleScrapUpdate as EventListener);
      window.removeEventListener('upgrade-purchased', handleUpgradePurchased as EventListener);
    };
  }, [refreshUpgrades]);

  const handlePurchase = (upgradeId: string) => {
    if (upgradeManager.purchase(upgradeId)) {
      setPurchaseAnimation(upgradeId);
      setTimeout(() => setPurchaseAnimation(null), 500);
    }
  };

  const categoryUpgrades = upgrades.filter(u => u.category === selectedCategory);

  if (!isVisible) return null;

  // Responsive checks
  const isSmall = isMobile || window.innerWidth < 600;

  // Styles
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(0, 10, 30, 0.98) 0%, rgba(0, 5, 15, 0.99) 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: isSmall ? '16px 12px' : '40px 20px',
    fontFamily: '"Orbitron", "Rajdhani", monospace',
    zIndex: 1000,
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: isSmall ? '16px' : '30px',
    width: '100%',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isSmall ? '22px' : '36px',
    fontWeight: 'bold',
    color: '#00ffff',
    textShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
    margin: 0,
    letterSpacing: '4px',
  };

  const waveInfoStyle: React.CSSProperties = {
    fontSize: isSmall ? '12px' : '16px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: '4px',
  };

  const scrapDisplayStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isSmall ? '8px' : '12px',
    marginTop: isSmall ? '10px' : '16px',
    padding: isSmall ? '8px 16px' : '12px 24px',
    background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.2) 0%, rgba(255, 100, 0, 0.1) 100%)',
    border: '2px solid rgba(255, 170, 0, 0.5)',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(255, 170, 0, 0.3)',
  };

  const scrapLabelStyle: React.CSSProperties = {
    fontSize: isSmall ? '10px' : '14px',
    color: 'rgba(255, 170, 0, 0.8)',
    textTransform: 'uppercase',
  };

  const scrapValueStyle: React.CSSProperties = {
    fontSize: isSmall ? '22px' : '32px',
    fontWeight: 'bold',
    color: '#ffaa00',
    textShadow: '0 0 15px rgba(255, 170, 0, 0.5)',
  };

  const categoryTabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: isSmall ? '4px' : '8px',
    marginBottom: isSmall ? '16px' : '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '100%',
  };

  const getTabStyle = (category: UpgradeCategory): React.CSSProperties => ({
    padding: isSmall ? '8px 12px' : '12px 24px',
    border: selectedCategory === category 
      ? '2px solid #00ffff' 
      : '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    background: selectedCategory === category 
      ? 'rgba(0, 255, 255, 0.1)' 
      : 'rgba(255, 255, 255, 0.05)',
    color: selectedCategory === category ? '#00ffff' : 'rgba(255, 255, 255, 0.6)',
    fontSize: isSmall ? '10px' : '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  });

  const upgradesGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isSmall ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: isSmall ? '10px' : '16px',
    maxWidth: '1200px',
    width: '100%',
    marginBottom: isSmall ? '16px' : '30px',
    padding: '0',
    flex: 1,
    overflowY: 'auto',
  };

  const getCardStyle = (upgrade: UpgradeCardState): React.CSSProperties => ({
    padding: isSmall ? '12px' : '20px',
    background: upgrade.isMaxLevel 
      ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 100, 50, 0.1) 100%)'
      : 'rgba(255, 255, 255, 0.05)',
    border: upgrade.isMaxLevel 
      ? '2px solid rgba(0, 255, 136, 0.5)' 
      : purchaseAnimation === upgrade.id
        ? '2px solid #00ff88'
        : '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    transform: purchaseAnimation === upgrade.id ? 'scale(1.02)' : 'scale(1)',
  });

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isSmall ? '8px' : '12px',
    marginBottom: isSmall ? '8px' : '12px',
  };

  const cardIconStyle: React.CSSProperties = {
    fontSize: isSmall ? '22px' : '28px',
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: isSmall ? '14px' : '18px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
  };

  const cardDescStyle: React.CSSProperties = {
    fontSize: isSmall ? '11px' : '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: isSmall ? '10px' : '16px',
    lineHeight: 1.4,
  };

  const levelBarContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: isSmall ? '8px' : '12px',
  };

  const getLevelDotStyle = (index: number, currentLevel: number, maxLevel: number): React.CSSProperties => ({
    width: isSmall ? '18px' : '24px',
    height: isSmall ? '6px' : '8px',
    borderRadius: '4px',
    background: index < currentLevel 
      ? '#00ffff' 
      : 'rgba(255, 255, 255, 0.2)',
    boxShadow: index < currentLevel 
      ? '0 0 8px rgba(0, 255, 255, 0.5)' 
      : 'none',
  });

  const effectTextStyle: React.CSSProperties = {
    fontSize: isSmall ? '12px' : '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: isSmall ? '10px' : '16px',
  };

  const effectValueStyle: React.CSSProperties = {
    color: '#00ff88',
    fontWeight: 'bold',
  };

  const nextEffectStyle: React.CSSProperties = {
    color: '#ffaa00',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  };

  const getPurchaseButtonStyle = (upgrade: UpgradeCardState): React.CSSProperties => ({
    padding: isSmall ? '8px 14px' : '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: isSmall ? '12px' : '14px',
    fontWeight: 'bold',
    cursor: upgrade.canPurchase ? 'pointer' : 'not-allowed',
    background: upgrade.isMaxLevel 
      ? 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)'
      : upgrade.canPurchase 
        ? 'linear-gradient(135deg, #ffaa00 0%, #ff6600 100%)'
        : 'rgba(255, 255, 255, 0.1)',
    color: upgrade.isMaxLevel || upgrade.canPurchase ? '#000' : 'rgba(255, 255, 255, 0.4)',
    transition: 'all 0.2s ease',
    opacity: upgrade.isMaxLevel ? 0.8 : 1,
  });

  const costStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: isSmall ? '14px' : '16px',
    fontWeight: 'bold',
    color: scrap >= (categoryUpgrades.find(u => u.id)?.nextCost || 0) 
      ? '#ffaa00' 
      : '#ff4444',
  };

  const readyButtonStyle: React.CSSProperties = {
    padding: isSmall ? '12px 24px' : '16px 48px',
    border: '2px solid #00ff88',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 200, 100, 0.1) 100%)',
    color: '#00ff88',
    fontSize: isSmall ? '14px' : '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    transition: 'all 0.2s ease',
    boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
    flexShrink: 0,
    marginTop: 'auto',
  };

  return (
    <div style={overlayStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>⚙️ UPGRADE SHOP</h1>
        {waveNumber > 0 && <p style={waveInfoStyle}>Preparing for Wave {waveNumber}</p>}
        
        <div style={scrapDisplayStyle}>
          <span style={{ fontSize: isSmall ? '20px' : '28px' }}>⚙️</span>
          <div>
            <div style={scrapLabelStyle}>SCRAP</div>
            <div style={scrapValueStyle}>{scrap}</div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={categoryTabsStyle}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            style={getTabStyle(cat.id)}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon} {!isSmall && cat.name}
          </button>
        ))}
      </div>

      {/* Upgrades Grid */}
      <div style={upgradesGridStyle}>
        {categoryUpgrades.map(upgrade => (
          <div key={upgrade.id} style={getCardStyle(upgrade)}>
            {/* Card Header */}
            <div style={cardHeaderStyle}>
              <span style={cardIconStyle}>{upgrade.icon}</span>
              <h3 style={cardTitleStyle}>{upgrade.name}</h3>
            </div>

            {/* Description */}
            <p style={cardDescStyle}>{upgrade.description}</p>

            {/* Level Bar */}
            <div style={levelBarContainerStyle}>
              {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                <div 
                  key={i} 
                  style={getLevelDotStyle(i, upgrade.currentLevel, upgrade.maxLevel)} 
                />
              ))}
            </div>

            {/* Effect Text */}
            <div style={effectTextStyle}>
              {upgrade.currentLevel > 0 ? (
                <>
                  Current: <span style={effectValueStyle}>
                    {upgrade.effectUnit === '+' && '+'}
                    {upgrade.currentEffect.toFixed(0)}
                    {upgrade.effectUnit === '%' && '%'}
                    {upgrade.effectUnit === 's' && 's'}
                  </span>
                  {!upgrade.isMaxLevel && (
                    <>
                      {' → Next: '}
                      <span style={nextEffectStyle}>
                        {upgrade.effectUnit === '+' && '+'}
                        {upgrade.nextEffect.toFixed(0)}
                        {upgrade.effectUnit === '%' && '%'}
                        {upgrade.effectUnit === 's' && 's'}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  Effect: <span style={nextEffectStyle}>
                    {upgrade.effectUnit === '+' && '+'}
                    {upgrade.nextEffect.toFixed(0)}
                    {upgrade.effectUnit === '%' && '%'}
                    {upgrade.effectUnit === 's' && 's'}
                  </span>
                </>
              )}
            </div>

            {/* Purchase Button */}
            <div style={buttonContainerStyle}>
              {!upgrade.isMaxLevel && (
                <div style={{
                  ...costStyle,
                  color: scrap >= upgrade.nextCost ? '#ffaa00' : '#ff4444'
                }}>
                  ⚙️ {upgrade.nextCost}
                </div>
              )}
              <button
                style={getPurchaseButtonStyle(upgrade)}
                onClick={() => handlePurchase(upgrade.id)}
                disabled={!upgrade.canPurchase || upgrade.isMaxLevel}
              >
                {upgrade.isMaxLevel ? '✓ MAXED' : 'UPGRADE'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ready Button */}
      <button
        style={readyButtonStyle}
        onClick={onClose}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.4) 0%, rgba(0, 200, 100, 0.2) 100%)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 200, 100, 0.1) 100%)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {context === 'hangar' ? '← RETURN TO HANGAR' : '🚀 READY FOR COMBAT'}
      </button>
    </div>
  );
};

export default UpgradeShop;
