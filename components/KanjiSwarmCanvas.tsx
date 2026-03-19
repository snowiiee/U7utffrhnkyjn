'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GPUComputationRenderer } from 'three-stdlib';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import gsap from 'gsap';

const simVs = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const simFs = `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uExitProgress;
  uniform vec2 uAttractorPosition;
  uniform float uGravity;
  uniform float uExplosionForce;
  uniform float uNoiseMix;

  // Simplex 3D Noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D(texturePosition, uv);
    vec3 pos = tmpPos.xyz;
    float life = tmpPos.w;

    // 1. Calculate direction to the attractor (The Drop)
    vec2 dirToAttractor = uAttractorPosition - pos.xy;
    float distToAttractor = length(dirToAttractor);
    vec2 dropVelocity = normalize(dirToAttractor) * (distToAttractor * 0.1) * uGravity; 

    // 2. Calculate the Explosion (The Big Bang)
    float angle = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453) * 3.14159 * 2.0;
    vec2 randomDir = vec2(cos(angle), sin(angle));
    vec2 dirFromCenter = normalize(pos.xy * 0.1 + randomDir);
    
    // Generate a random multiplier per particle to shatter the perfect ring/halo
    float randomForce = fract(sin(dot(uv, vec2(93.989, 67.345))) * 24634.6345);
    // Map it to a range (e.g., 0.2 to 1.5) so some blast far and some stay close
    float forceMultiplier = 0.2 + (randomForce * 1.3); 
    
    vec2 explosionVelocity = dirFromCenter * (uExplosionForce * forceMultiplier);

    // 3. Ambient flow (Simplex noise)
    vec3 noise = vec3(
      snoise(vec3(pos.x * 0.15, pos.y * 0.15, uTime * 0.05)),
      snoise(vec3(pos.y * 0.15, pos.z * 0.15, uTime * 0.05)),
      snoise(vec3(pos.z * 0.15, pos.x * 0.15, uTime * 0.05))
    );
    vec3 noiseVelocity = noise * 0.005;

    // Mouse repulsion (Organic Repulsion)
    vec3 dir = pos - uMouse;
    float dist = length(dir);
    
    // Break the perfect mathematical circle by mixing noise into the repulsion radius
    float repulsionRadius = 3.0 + snoise(vec3(pos.x * 0.5, pos.y * 0.5, uTime * 0.2)) * 1.5;
    
    if (dist < repulsionRadius) {
      noiseVelocity += normalize(dir) * (repulsionRadius - dist) * 0.01;
    }

    // Return to center slowly if too far
    if (length(pos) > 6.0) {
      noiseVelocity -= normalize(pos) * 0.005;
    }

    // 4. Combine them based on the timeline!
    vec2 finalVelocity = mix(dropVelocity + explosionVelocity, noiseVelocity.xy, uNoiseMix);
    vec3 velocity = vec3(finalVelocity, noiseVelocity.z * uNoiseMix);

    // Exit animation (Warp drive explosion)
    if (uExitProgress > 0.0) {
      vec3 warpDir = normalize(pos + vec3(0.0, 0.0, 2.0));
      velocity += warpDir * uExitProgress * 0.8;
    }

    pos += velocity;

    gl_FragColor = vec4(pos, life);
  }
`;

const renderVs = `
  uniform sampler2D texturePosition;
  uniform float uExitProgress;
  attribute vec2 reference;
  attribute float kanjiIndex;
  varying vec2 vUv;
  varying float vKanjiIndex;

  void main() {
    vUv = uv;
    vKanjiIndex = kanjiIndex;
    vec4 tmpPos = texture2D(texturePosition, reference);
    vec3 pos = tmpPos.xyz;
    
    float scale = 1.0 + uExitProgress * 3.0;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (200.0 * scale) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const renderFs = `
  uniform sampler2D uTexture;
  uniform float uExitProgress;
  varying vec2 vUv;
  varying float vKanjiIndex;

  void main() {
    float grid = 8.0;
    float col = mod(vKanjiIndex, grid);
    float row = floor(vKanjiIndex / grid);
    
    vec2 spriteUv = (gl_PointCoord / grid) + vec2(col / grid, row / grid);
    
    vec4 texColor = texture2D(uTexture, spriteUv);
    if (texColor.a < 0.1) discard;
    
    float alpha = texColor.a * 0.3 * (1.0 - uExitProgress);
    vec3 color = mix(texColor.rgb, vec3(1.0, 1.0, 1.0), uExitProgress);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

function createKanjiTexture() {
  const canvas = document.createElement('canvas');
  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const grid = 8;
  const cellSize = size / grid;
  ctx.font = `${cellSize * 0.7}px sans-serif`;
  
  const kanji = "水火木金土日月星風雷雲雨雪氷光闇天海山川花草木鳥虫魚獣竜神鬼魂命力気心愛信望夢幻影音色香味触時空天地人男女老幼生死善悪美醜真偽".split('');
  
  for(let i=0; i<grid; i++) {
    for(let j=0; j<grid; j++) {
      const char = kanji[Math.floor(Math.random() * kanji.length)];
      ctx.fillText(char, j * cellSize + cellSize/2, i * cellSize + cellSize/2);
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function Swarm({ exitProgressRef }: { exitProgressRef: React.MutableRefObject<number> }) {
  const { gl } = useThree();
  const startTime = useRef(performance.now());
  const getElapsedTime = () => (performance.now() - startTime.current) / 1000;
  
  const size = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024 ? 256 : (window.innerWidth > 768 ? 128 : 128);
    }
    return 128;
  }, []);
  
  const { gpuCompute, positionVariable } = useMemo(() => {
    const compute = new GPUComputationRenderer(size, size, gl);
    const dtPosition = compute.createTexture();
    const arr = dtPosition.image.data;
    if (!arr) return { gpuCompute: null, positionVariable: null };
    for(let i=0; i<arr.length; i+=4) {
      arr[i] = (Math.random() - 0.5) * 0.05;
      arr[i+1] = 15.0 + (Math.random() - 0.5) * 0.05;
      arr[i+2] = (Math.random() - 0.5) * 0.05;
      arr[i+3] = Math.random(); 
    }
    const variable = compute.addVariable('texturePosition', simFs, dtPosition);
    variable.material.uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(0, 0, 0) },
      uExitProgress: { value: 0 },
      uAttractorPosition: { value: new THREE.Vector2(0, 15.0) },
      uGravity: { value: 1.0 },
      uExplosionForce: { value: 0.0 },
      uNoiseMix: { value: 0.0 }
    };
    variable.wrapS = THREE.RepeatWrapping;
    variable.wrapT = THREE.RepeatWrapping;
    compute.setVariableDependencies(variable, [variable]);
    const error = compute.init();
    if (error !== null) console.error(error);
    return { gpuCompute: compute, positionVariable: variable };
  }, [size, gl]);
  
  const particles = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(size * size * 3);
    const references = new Float32Array(size * size * 2);
    const kanjiIndices = new Float32Array(size * size);
    
    for(let i=0; i<size*size; i++) {
      const x = (i % size) / size;
      const y = Math.floor(i / size) / size;
      references[i*2] = x;
      references[i*2+1] = y;
      kanjiIndices[i] = Math.floor(Math.random() * 64);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('reference', new THREE.BufferAttribute(references, 2));
    geometry.setAttribute('kanjiIndex', new THREE.BufferAttribute(kanjiIndices, 1));
    return geometry;
  }, [size]);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        texturePosition: { value: null },
        uTexture: { value: createKanjiTexture() },
        uExitProgress: { value: 0 }
      },
      vertexShader: renderVs,
      fragmentShader: renderFs,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);
  
  const mouse = useRef(new THREE.Vector3(0, 0, 0));
  const hasMoved = useRef(false);

  useEffect(() => {
    const uniforms = positionVariable.material.uniforms;
    const tl = gsap.timeline();

    tl.to(uniforms.uAttractorPosition.value, {
      y: 0,
      duration: 2.2,
      ease: "power4.out"
    }, 0)
    .to(uniforms.uGravity, {
      value: 0.0,
      duration: 1.0,
      ease: "power2.inOut"
    }, 1.5)
    .to(uniforms.uExplosionForce, {
      value: 0.2,
      duration: 0.5,
      ease: "power3.out"
    }, 1.8)
    .to(uniforms.uExplosionForce, {
      value: 0.0,
      duration: 2.0,
      ease: "power2.out"
    }, 2.3)
    .to(uniforms.uNoiseMix, {
      value: 1.0,
      duration: 2.5,
      ease: "power2.inOut"
    }, 2.0);
  }, [positionVariable]);

  useEffect(() => {
    const onMove = () => { hasMoved.current = true; };
    window.addEventListener('pointermove', onMove, { once: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state) => {
    const elapsedTime = getElapsedTime();
    
    if (!hasMoved.current) {
      const t = elapsedTime * 0.5;
      const ghostX = Math.sin(t) * 3.0 + Math.cos(t * 0.8) * 1.5;
      const ghostY = Math.cos(t * 1.2) * 2.0 + Math.sin(t * 0.5) * 1.0;
      mouse.current.lerp(new THREE.Vector3(ghostX, ghostY, 0), 0.05);
    } else {
      const aspect = window.innerWidth / window.innerHeight;
      const targetX = state.pointer.x * 4.14 * aspect;
      const targetY = state.pointer.y * 4.14;
      mouse.current.lerp(new THREE.Vector3(targetX, targetY, 0), 0.1);
    }
    
    positionVariable.material.uniforms.uTime.value = elapsedTime;
    positionVariable.material.uniforms.uMouse.value = mouse.current;
    positionVariable.material.uniforms.uExitProgress.value = exitProgressRef.current;
    
    gpuCompute.compute();
    
    material.uniforms.texturePosition.value = (gpuCompute.getCurrentRenderTarget(positionVariable as any) as any).texture;
    material.uniforms.uExitProgress.value = exitProgressRef.current;
  });
  
  useEffect(() => {
    return () => {
      gpuCompute.dispose();
      material.dispose();
      particles.dispose();
      material.uniforms.uTexture.value.dispose();
    };
  }, [gpuCompute, material, particles]);
  
  return <points geometry={particles} material={material} />;
}

export default function KanjiSwarmCanvas({ exitProgressRef }: { exitProgressRef: React.MutableRefObject<number> }) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#000000']} />
        <Swarm exitProgressRef={exitProgressRef} />
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
