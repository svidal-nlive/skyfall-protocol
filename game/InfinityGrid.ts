import * as THREE from 'three';

/**
 * InfinityGrid - An infinite moon surface with curved horizon effect
 * Creates the illusion of flying over a vast lunar landscape that curves away at the horizon
 * Includes optional cyan grid overlay for sci-fi aesthetic
 */
export class InfinityGrid {
  public mesh: THREE.Group;
  
  private gridMesh: THREE.Mesh;
  private horizonMesh: THREE.Mesh;
  
  private gridSize = 10000;
  private gridDivisions = 200;
  private curveRadius = 8000; // Radius of the "world sphere" for horizon curve
  
  constructor() {
    this.mesh = new THREE.Group();
    
    this.gridMesh = this.createGrid();
    this.horizonMesh = this.createHorizonCurve();
    
    this.mesh.add(this.gridMesh);
    this.mesh.add(this.horizonMesh);
  }

  private createGrid(): THREE.Mesh {
    // Create a custom shader for flat grass terrain with grid overlay
    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {
        // Grid colors (vibrant cyan overlay)
        gridColor: { value: new THREE.Color(0x00ffff) },
        glowColor: { value: new THREE.Color(0x00ff88) },  // Green-cyan glow
        // Terrain surface colors (flat grass green)
        surfaceColor: { value: new THREE.Color(0x228833) },  // Grass green
        craterColor: { value: new THREE.Color(0x228833) },   // Same grass green (flat)
        highlightColor: { value: new THREE.Color(0x228833) }, // Same grass green (flat)
        // Fog (atmospheric, greenish)
        fogColor: { value: new THREE.Color(0x88aa88) },  // Light green atmospheric fog
        fogNear: { value: 400 },
        fogFar: { value: 5000 },
        // Grid settings
        gridScale: { value: 50.0 },
        lineWidth: { value: 0.01 },
        gridOpacity: { value: 0.0 },  // Grid invisible - flat grass only
        // Animation
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying float vDistance;
        varying vec2 vUv;
        
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vUv = uv;
          
          // Calculate distance from camera for fog
          vDistance = length(worldPosition.xyz - cameraPosition);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 gridColor;
        uniform vec3 glowColor;
        uniform vec3 surfaceColor;
        uniform vec3 craterColor;
        uniform vec3 highlightColor;
        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;
        uniform float gridScale;
        uniform float lineWidth;
        uniform float gridOpacity;
        uniform float time;
        
        varying vec3 vWorldPosition;
        varying float vDistance;
        varying vec2 vUv;
        
        // Hash for noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        // 2D noise
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        // FBM for terrain
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for(int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        // Crater function
        float crater(vec2 p, vec2 center, float radius) {
          float dist = length(p - center);
          float rim = smoothstep(radius * 0.9, radius, dist) * (1.0 - smoothstep(radius, radius * 1.1, dist));
          float inside = 1.0 - smoothstep(0.0, radius * 0.8, dist);
          return inside * 0.3 - rim * 0.2;
        }
        
        // Grid pattern
        float grid(vec2 st, float scale, float lineWidth) {
          vec2 grid = abs(fract(st * scale - 0.5) - 0.5) / fwidth(st * scale);
          float line = min(grid.x, grid.y);
          return 1.0 - min(line, 1.0);
        }
        
        void main() {
          vec2 coord = vWorldPosition.xz;
          
          // === MOON SURFACE ===
          
          // Base terrain noise at multiple scales
          float terrain = fbm(coord * 0.001);
          terrain += fbm(coord * 0.005) * 0.3;
          terrain += fbm(coord * 0.02) * 0.1;
          
          // Add some craters (positioned by noise)
          float craterPattern = 0.0;
          for(int i = 0; i < 8; i++) {
            float fi = float(i);
            vec2 craterPos = vec2(
              hash(vec2(fi * 123.456, fi * 789.012)) * 2000.0 - 1000.0,
              hash(vec2(fi * 456.789, fi * 012.345)) * 2000.0 - 1000.0
            );
            float radius = 50.0 + hash(vec2(fi, fi * 2.0)) * 150.0;
            vec2 localCoord = mod(coord + 1000.0, 2000.0) - 1000.0;
            craterPattern += crater(localCoord, craterPos, radius);
          }
          
          terrain += craterPattern;
          
          // Map terrain to colors
          vec3 moonColor = mix(craterColor, surfaceColor, smoothstep(-0.2, 0.3, terrain));
          moonColor = mix(moonColor, highlightColor, smoothstep(0.4, 0.7, terrain));
          
          // Add subtle variation
          float microDetail = noise(coord * 0.1) * 0.1;
          moonColor += vec3(microDetail * 0.5);
          
          // === GRID OVERLAY ===
          
          // Multiple grid scales
          float smallGrid = grid(coord, 1.0 / gridScale, lineWidth);
          float largeGrid = grid(coord, 1.0 / (gridScale * 5.0), lineWidth * 2.0);
          
          // Grid fades with distance
          float distanceFade = 1.0 - smoothstep(0.0, 2500.0, vDistance);
          float gridPattern = max(smallGrid * 0.5 * distanceFade, largeGrid * 0.8);
          
          // Subtle pulse
          float pulse = sin(time * 0.3) * 0.1 + 0.95;
          gridPattern *= pulse;
          
          // === COMBINE ===
          
          // Calculate fog
          float fogFactor = smoothstep(fogNear, fogFar, vDistance);
          
          // Start with moon surface
          vec3 color = moonColor;
          
          // Add subtle grid overlay
          float gridGlow = gridPattern * gridOpacity * (1.0 - fogFactor * 0.5);
          color += gridColor * gridGlow * 0.8;
          color += glowColor * gridGlow * 0.3;
          
          // Apply fog
          color = mix(color, fogColor, fogFactor * 0.9);
          
          // Horizon glow
          float horizonGlow = smoothstep(3000.0, 5000.0, vDistance) * 0.15;
          color += vec3(0.2, 0.6, 0.3) * horizonGlow;  // Green horizon glow
          
          // Alpha
          float alpha = 1.0 - fogFactor * 0.2;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    // Create curved grid geometry
    const geometry = this.createCurvedPlaneGeometry(this.gridSize, this.gridDivisions, this.curveRadius);
    
    const mesh = new THREE.Mesh(geometry, gridMaterial);
    mesh.rotation.x = 0; // Flat on XZ plane
    
    return mesh;
  }

  private createCurvedPlaneGeometry(size: number, divisions: number, curveRadius: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    
    const halfSize = size / 2;
    const step = size / divisions;
    
    // Create vertices with spherical curve
    for (let z = 0; z <= divisions; z++) {
      for (let x = 0; x <= divisions; x++) {
        const xPos = -halfSize + x * step;
        const zPos = -halfSize + z * step;
        
        // Calculate distance from center
        const dist = Math.sqrt(xPos * xPos + zPos * zPos);
        
        // Apply spherical curve - points further from center curve downward
        // This creates the horizon illusion
        let yPos = 0;
        if (dist > 0) {
          // Spherical dropoff
          const angle = dist / curveRadius;
          yPos = -curveRadius * (1 - Math.cos(angle));
        }
        
        vertices.push(xPos, yPos, zPos);
        uvs.push(x / divisions, z / divisions);
      }
    }
    
    // Create indices
    for (let z = 0; z < divisions; z++) {
      for (let x = 0; x < divisions; x++) {
        const a = x + z * (divisions + 1);
        const b = x + 1 + z * (divisions + 1);
        const c = x + (z + 1) * (divisions + 1);
        const d = x + 1 + (z + 1) * (divisions + 1);
        
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  private createHorizonCurve(): THREE.Mesh {
    // Create a horizon glow ring with green color
    const geometry = new THREE.RingGeometry(this.gridSize * 0.8, this.gridSize, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x44aa44) },  // Green glow
        innerRadius: { value: this.gridSize * 0.8 },
        outerRadius: { value: this.gridSize },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec2 vUv;
        
        void main() {
          float alpha = smoothstep(0.0, 0.5, vUv.y) * (1.0 - vUv.y);
          gl_FragColor = vec4(color, alpha * 0.3);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -100;
    
    return mesh;
  }

  /**
   * Update grid position to follow player, creating infinite effect
   */
  public update(playerPosition: THREE.Vector3, time: number) {
    // Snap grid to player position (quantized to grid scale for seamless tiling)
    const gridScale = 50;
    const snapX = Math.floor(playerPosition.x / gridScale) * gridScale;
    const snapZ = Math.floor(playerPosition.z / gridScale) * gridScale;
    
    this.mesh.position.x = snapX;
    this.mesh.position.z = snapZ;
    
    // Update shader time uniform
    const material = this.gridMesh.material as THREE.ShaderMaterial;
    if (material.uniforms.time) {
      material.uniforms.time.value = time;
    }
  }

  public dispose() {
    this.gridMesh.geometry.dispose();
    (this.gridMesh.material as THREE.Material).dispose();
    this.horizonMesh.geometry.dispose();
    (this.horizonMesh.material as THREE.Material).dispose();
  }
}
