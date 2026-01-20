import * as THREE from 'three';

/**
 * InfinityGrid - An infinite grid with curved horizon effect
 * Creates the illusion of flying over a vast grid plane that curves away at the horizon
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
    // Create a custom shader for the infinite grid with fade-out effect
    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {
        gridColor: { value: new THREE.Color(0x00ffff) },
        backgroundColor: { value: new THREE.Color(0x0a1628) },
        fogNear: { value: 500 },
        fogFar: { value: 4000 },
        gridScale: { value: 50.0 },
        lineWidth: { value: 0.02 },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying float vDistance;
        
        uniform float curveRadius;
        
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          // Calculate distance from camera for fog
          vDistance = length(worldPosition.xyz - cameraPosition);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 gridColor;
        uniform vec3 backgroundColor;
        uniform float fogNear;
        uniform float fogFar;
        uniform float gridScale;
        uniform float lineWidth;
        uniform float time;
        
        varying vec3 vWorldPosition;
        varying float vDistance;
        
        float grid(vec2 st, float scale, float lineWidth) {
          vec2 grid = abs(fract(st * scale - 0.5) - 0.5) / fwidth(st * scale);
          float line = min(grid.x, grid.y);
          return 1.0 - min(line, 1.0);
        }
        
        void main() {
          // Calculate grid pattern
          vec2 coord = vWorldPosition.xz;
          
          // Multiple grid scales for depth
          float smallGrid = grid(coord, 1.0 / gridScale, lineWidth);
          float largeGrid = grid(coord, 1.0 / (gridScale * 5.0), lineWidth * 2.0);
          
          float gridPattern = max(smallGrid * 0.5, largeGrid);
          
          // Add subtle pulse animation
          float pulse = sin(time * 0.5) * 0.1 + 0.9;
          gridPattern *= pulse;
          
          // Calculate fog factor
          float fogFactor = smoothstep(fogNear, fogFar, vDistance);
          
          // Mix grid color with background based on fog
          vec3 color = mix(gridColor * gridPattern, backgroundColor, fogFactor);
          
          // Add glow effect near lines
          float glow = gridPattern * (1.0 - fogFactor) * 0.5;
          color += gridColor * glow;
          
          // Final alpha based on grid visibility
          float alpha = (1.0 - fogFactor) * (gridPattern * 0.8 + 0.2);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
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
    // Create a horizon glow ring
    const geometry = new THREE.RingGeometry(this.gridSize * 0.8, this.gridSize, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x00aaff) },
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
