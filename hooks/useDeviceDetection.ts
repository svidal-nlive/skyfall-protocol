/**
 * useDeviceDetection - Hook for detecting device type and input capabilities
 * 
 * Detects:
 * - Touch capability (mobile/tablet)
 * - Screen size breakpoints
 * - Pointer type (coarse = touch, fine = mouse)
 */

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type InputType = 'touch' | 'mouse' | 'hybrid';

export interface DeviceInfo {
  deviceType: DeviceType;
  inputType: InputType;
  isTouchDevice: boolean;
  isDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// Breakpoint thresholds
const BREAKPOINTS = {
  xs: 0,      // Portrait mobile
  sm: 480,    // Landscape mobile
  md: 768,    // Tablet
  lg: 1024,   // Desktop
  xl: 1440,   // Large desktop
};

/**
 * Detect if device has touch capability
 */
function detectTouchCapability(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Detect primary pointer type
 */
function detectPointerType(): 'coarse' | 'fine' | 'none' {
  if (typeof window === 'undefined') return 'fine';
  
  if (window.matchMedia('(pointer: coarse)').matches) {
    return 'coarse'; // Touch primary
  } else if (window.matchMedia('(pointer: fine)').matches) {
    return 'fine'; // Mouse primary
  }
  return 'none';
}

/**
 * Detect if device can hover (typically desktop)
 */
function detectHoverCapability(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Get current breakpoint based on screen width
 */
function getBreakpoint(width: number): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Determine device type based on screen size and touch capability
 */
function getDeviceType(width: number, hasTouch: boolean): DeviceType {
  // Use both screen size AND touch capability for more accurate detection
  if (width < BREAKPOINTS.sm) {
    return 'mobile';
  } else if (width < BREAKPOINTS.lg) {
    // Between 480-1024px could be tablet or small desktop
    return hasTouch ? 'tablet' : 'desktop';
  } else {
    // 1024px+ is typically desktop, but could be large tablet
    return hasTouch && width < 1366 ? 'tablet' : 'desktop';
  }
}

/**
 * Determine input type
 */
function getInputType(hasTouch: boolean, canHover: boolean): InputType {
  if (hasTouch && canHover) {
    return 'hybrid'; // Touch laptop or desktop with touchscreen
  } else if (hasTouch) {
    return 'touch';
  }
  return 'mouse';
}

/**
 * Hook to detect device type and capabilities
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Initial state (SSR-safe defaults)
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        inputType: 'mouse',
        isTouchDevice: false,
        isDesktop: true,
        isMobile: false,
        isTablet: false,
        isPortrait: false,
        isLandscape: true,
        screenWidth: 1920,
        screenHeight: 1080,
        breakpoint: 'xl',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const hasTouch = detectTouchCapability();
    const canHover = detectHoverCapability();
    const deviceType = getDeviceType(width, hasTouch);
    const inputType = getInputType(hasTouch, canHover);

    return {
      deviceType,
      inputType,
      isTouchDevice: hasTouch,
      isDesktop: deviceType === 'desktop',
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isPortrait: height > width,
      isLandscape: width >= height,
      screenWidth: width,
      screenHeight: height,
      breakpoint: getBreakpoint(width),
    };
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const hasTouch = detectTouchCapability();
      const canHover = detectHoverCapability();
      const deviceType = getDeviceType(width, hasTouch);
      const inputType = getInputType(hasTouch, canHover);

      setDeviceInfo({
        deviceType,
        inputType,
        isTouchDevice: hasTouch,
        isDesktop: deviceType === 'desktop',
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isPortrait: height > width,
        isLandscape: width >= height,
        screenWidth: width,
        screenHeight: height,
        breakpoint: getBreakpoint(width),
      });
    };

    // Update on resize
    window.addEventListener('resize', updateDeviceInfo);
    
    // Update on orientation change (mobile)
    window.addEventListener('orientationchange', updateDeviceInfo);

    // Initial update
    updateDeviceInfo();

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

/**
 * Simple hook to check if device should show touch controls
 * Only returns true for devices that are primarily touch-based (no hover capability)
 * This excludes touchscreen laptops/desktops that have a mouse
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Must have touch AND not have hover capability (pure touch devices)
    // This ensures touchscreen laptops still get mouse controls
    const hasTouch = detectTouchCapability();
    const canHover = detectHoverCapability();
    const pointerType = detectPointerType();
    // Show touch controls only if:
    // 1. Device has touch capability AND
    // 2. Device does NOT have fine pointer (mouse) OR cannot hover
    return hasTouch && (pointerType === 'coarse' || !canHover);
  });

  useEffect(() => {
    const updateTouchState = () => {
      const hasTouch = detectTouchCapability();
      const canHover = detectHoverCapability();
      const pointerType = detectPointerType();
      setIsTouch(hasTouch && (pointerType === 'coarse' || !canHover));
    };
    updateTouchState();
    // Listen for pointer type changes (e.g., connecting/disconnecting mouse)
    window.addEventListener('resize', updateTouchState);
    return () => window.removeEventListener('resize', updateTouchState);
  }, []);

  return isTouch;
}

/**
 * Simple hook to get current breakpoint
 */
export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>(() => {
    if (typeof window === 'undefined') return 'lg';
    return getBreakpoint(window.innerWidth);
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

export default useDeviceDetection;
