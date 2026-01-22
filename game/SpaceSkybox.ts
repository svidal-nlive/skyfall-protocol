/**
 * SpaceSkybox - Procedural seamless daytime sky with atmospheric scattering
 * 
 * Uses a box geometry with inverted normals and procedural shaders
 * to create a seamless daytime sky environment
 */

import * as THREE from 'three';

interface SpaceSkyboxConfig {
  skyColorTop: number;     // Deep blue at zenith
  skyColorHorizon: number; // Lighter blue at horizon
  sunColor: number;        // Sun glow color
  hazeBrightness: number;  // Atmospheric haze intensity
  cloudDensity: number;    // Cloud coverage
  animationSpeed: number;
}

const DEFAULT_CONFIG: SpaceSkyboxConfig = {
  skyColorTop: 0x3388dd,      // Brighter deep blue
  skyColorHorizon: 0xaaddff,   // Light sky blue/cyan
  sunColor: 0xffffcc,          // Warm sun color
  hazeBrightness: 0.5,         // More atmospheric haze
  cloudDensity: 0.3,
  animationSpeed: 0.02,
};

export class SpaceSkybox {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private config: SpaceSkyboxConfig;

  constructor(config: Partial<SpaceSkyboxConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.material = this.createMaterial();
    this.mesh = this.createMesh();
  }

  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        skyColorTop: { value: new THREE.Color(this.config.skyColorTop) },
        skyColorHorizon: { value: new THREE.Color(this.config.skyColorHorizon) },
        sunColor: { value: new THREE.Color(this.config.sunColor) },
        hazeBrightness: { value: this.config.hazeBrightness },
        cloudDensity: { value: this.config.cloudDensity },
        sunDirection: { value: new THREE.Vector3(0.3, 0.6, 0.5).normalize() },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = normalize(worldPosition.xyz);
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 skyColorTop;
        uniform vec3 skyColorHorizon;
        uniform vec3 sunColor;
        uniform float hazeBrightness;
        uniform float cloudDensity;
        uniform vec3 sunDirection;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        // Hash functions for noise
        float hash(vec3 p) {
          p = fract(p * vec3(443.897, 441.423, 437.195));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }
        
        // 3D Simplex-like noise
        float noise3D(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float n = mix(
            mix(
              mix(hash(i), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
              f.y
            ),
            mix(
              mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
              f.y
            ),
            f.z
          );
          return n;
        }
        
        // Fractal Brownian Motion for clouds
        float fbm(vec3 p, int octaves) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 6; i++) {
            if(i >= octaves) break;
            value += amplitude * noise3D(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        // Cloud generation
        vec3 clouds(vec3 dir, float time) {
          // Only render clouds above horizon
          if(dir.y < 0.0) return vec3(0.0);
          
          // Project direction onto a cloud plane
          vec3 cloudPos = dir / (dir.y + 0.1) * 2.0;
          cloudPos.x += time * 0.05;  // Slowly drifting clouds
          
          // Multi-octave cloud noise
          float cloud = fbm(cloudPos * 0.5, 5);
          cloud = smoothstep(0.4, 0.7, cloud) * cloudDensity;
          
          // Fade clouds toward horizon
          float horizonFade = smoothstep(0.0, 0.3, dir.y);
          cloud *= horizonFade;
          
          // Cloud lighting (brighter toward sun)
          float sunDot = max(dot(dir, sunDirection), 0.0);
          vec3 cloudColor = mix(vec3(0.9, 0.9, 0.95), vec3(1.0, 1.0, 0.95), sunDot * 0.3);
          
          return cloudColor * cloud * 0.6;
        }
        
        void main() {
          vec3 dir = normalize(vWorldPosition);
          
          // Sky gradient based on elevation
          float elevation = dir.y * 0.5 + 0.5;  // 0 at horizon, 1 at zenith
          elevation = pow(elevation, 0.7);  // Adjust gradient curve
          
          // Base sky color
          vec3 color = mix(skyColorHorizon, skyColorTop, elevation);
          
          // Add atmospheric haze near horizon
          float hazeAmount = 1.0 - smoothstep(-0.1, 0.4, dir.y);
          vec3 hazeColor = mix(skyColorHorizon, vec3(0.9, 0.92, 0.95), 0.5);
          color = mix(color, hazeColor, hazeAmount * hazeBrightness);
          
          // Sun glow
          float sunDot = max(dot(dir, sunDirection), 0.0);
          float sunGlow = pow(sunDot, 8.0) * 0.4;
          float sunCore = pow(sunDot, 64.0) * 2.0;
          color += sunColor * sunGlow;
          color += vec3(1.0, 0.98, 0.9) * sunCore;
          
          // Add clouds
          vec3 cloudColor = clouds(dir, time);
          color = mix(color, color + cloudColor, cloudColor.r > 0.01 ? 1.0 : 0.0);
          
          // Subtle ground reflection (darker below horizon)
          if(dir.y < 0.0) {
            float groundFade = smoothstep(-0.3, 0.0, dir.y);
            vec3 groundColor = mix(vec3(0.15, 0.12, 0.1), skyColorHorizon, groundFade);
            color = groundColor;
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,  // Render inside of box
      depthWrite: false,
    });
  }

  private createMesh(): THREE.Mesh {
    // Large box geometry - camera will be inside
    const geometry = new THREE.BoxGeometry(50000, 50000, 50000);
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.renderOrder = -1000; // Render first (behind everything)
    return mesh;
  }

  public update(time: number, cameraPosition: THREE.Vector3) {
    // Keep skybox centered on camera
    this.mesh.position.copy(cameraPosition);
    
    // Update time uniform for animation
    this.material.uniforms.time.value = time;
  }

  public dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

export function initSpaceSkybox(scene: THREE.Scene): SpaceSkybox {
  const skybox = new SpaceSkybox();
  scene.add(skybox.mesh);
  return skybox;
}
