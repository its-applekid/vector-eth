import * as THREE from 'three';
import './style.css';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// Responsive camera distance - closer on mobile for full vertical view
const isMobile = window.innerWidth < 768;
// Position camera to see both pyramids - centered between them
const pyramidMidpoint = (1.1 - 0.9) / 2; // Average of top and bottom Y positions
camera.position.set(0, pyramidMidpoint + 1.5, isMobile ? 4 : 6); // Centered, looking slightly down
camera.lookAt(0, pyramidMidpoint, 0); // Look at center point between pyramids

// Renderer setup
const renderer = new THREE.WebGLRenderer({ 
  antialias: false, // Disable for more retro look
  canvas: document.querySelector('#app')
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Lock to 1:1 for chunky pixels

// Retro vertex jitter shader (PS1/SNES style)
const vertexShader = `
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    // Vertex snapping for retro effect
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float snapScale = 0.02; // Adjust for more/less jitter
    mvPosition.xyz = floor(mvPosition.xyz / snapScale) * snapScale;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float opacity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    // Simple flat shading with lighting
    vec3 light = normalize(vec3(1.0, 1.0, 1.0));
    float dProd = max(0.0, dot(vNormal, light));
    
    // Quantize brightness for retro banding
    float brightness = floor(dProd * 4.0) / 4.0;
    brightness = brightness * 0.6 + 0.4; // Ensure minimum brightness
    
    vec3 finalColor = color * brightness;
    gl_FragColor = vec4(finalColor, opacity);
  }
`;

// Create custom material with retro shader
const createRetroMaterial = (color) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      time: { value: 0 }
    },
    vertexShader,
    fragmentShader,
    flatShading: true
  });
};

// Create Ethereum logo geometry (two pyramids)
// Scale up on mobile for better vertical fill
const logoScale = isMobile ? 1.8 : 1;

// Top pyramid - less tall than before
const topPyramidGeometry = new THREE.ConeGeometry(
  logoScale,      // base radius
  logoScale * 1.8, // height (reduced from 2.5)
  4               // 4 radial segments = square base
);

// Bottom pyramid
const bottomPyramidGeometry = new THREE.ConeGeometry(
  logoScale,      // base radius
  logoScale * 1.5, // height
  4               // 4 radial segments = square base
);

// Create custom material with transparency
const createTransparentMaterial = (color, opacity) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      time: { value: 0 },
      opacity: { value: opacity }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    flatShading: true
  });
};

// Top pyramid (flat bottom, point up)
const topPyramid = new THREE.Mesh(
  topPyramidGeometry,
  createTransparentMaterial(0x8c8cff, 0.8) // Translucent purple-blue
);
topPyramid.position.y = 1.1 * logoScale; // Slightly apart
topPyramid.rotation.y = 0; // Start with vertex facing camera
scene.add(topPyramid);

// Bottom pyramid (flat top, point down - flip the same geometry)
const bottomPyramid = new THREE.Mesh(
  bottomPyramidGeometry,
  createTransparentMaterial(0x4c4ccc, 0.8) // Translucent darker blue
);
bottomPyramid.position.y = -0.9 * logoScale; // Slightly apart
bottomPyramid.rotation.x = Math.PI; // Flip upside down
bottomPyramid.rotation.y = 0; // Start with vertex facing camera
scene.add(bottomPyramid);

// Add some retro stars in the background
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 200; i++) {
  const x = (Math.random() - 0.5) * 100;
  const y = (Math.random() - 0.5) * 100;
  const z = (Math.random() - 0.5) * 100;
  starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

const starMaterial = new THREE.PointsMaterial({ 
  color: 0xffffff, 
  size: 0.1,
  sizeAttenuation: true
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Animation with 2-second pauses
let time = 0;
let rotationPhaseTime = 0; // Time within current rotation phase
let currentTargetAngle = 0; // Current pause angle (0 or π)
let isInPause = true; // Start in pause
let pauseStartTime = 0; // When current pause started

const PAUSE_DURATION = 2.0; // 2 seconds
const ROTATION_DISTANCE = Math.PI / 2; // 90° between pauses
const BASE_ROTATION_SPEED = 0.15; // Slower rotation speed
const EASE_DURATION = 0.5; // Ease in/out duration (in seconds)

function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = 0.016; // ~60fps
  time += deltaTime;
  
  if (isInPause) {
    // In pause state
    const pauseElapsed = time - pauseStartTime;
    
    if (pauseElapsed >= PAUSE_DURATION) {
      // Pause finished, start rotating to next target
      isInPause = false;
      rotationPhaseTime = 0;
      // Next target is 90° away
      currentTargetAngle = (currentTargetAngle + Math.PI / 2) % (Math.PI * 2);
    }
  } else {
    // In rotation state
    rotationPhaseTime += deltaTime;
    
    // Calculate progress through rotation (0 to 1)
    const rotationDuration = ROTATION_DISTANCE / BASE_ROTATION_SPEED;
    const progress = Math.min(rotationPhaseTime / rotationDuration, 1);
    
    // Apply easing at start and end
    let easedProgress;
    const easeFraction = EASE_DURATION / rotationDuration;
    
    if (progress < easeFraction) {
      // Ease in at start using sine
      const t = progress / easeFraction;
      easedProgress = easeFraction * (1 - Math.cos(t * Math.PI / 2));
    } else if (progress > 1 - easeFraction) {
      // Ease out at end using sine
      const t = (progress - (1 - easeFraction)) / easeFraction;
      easedProgress = (1 - easeFraction) + easeFraction * Math.sin(t * Math.PI / 2);
    } else {
      // Linear in middle
      easedProgress = progress;
    }
    
    // Calculate current angle (start from previous target, rotate to current target)
    const startAngle = (currentTargetAngle - ROTATION_DISTANCE + Math.PI * 4) % (Math.PI * 2);
    const currentAngle = startAngle + easedProgress * ROTATION_DISTANCE;
    
    // Apply rotation
    topPyramid.rotation.y = currentAngle;
    bottomPyramid.rotation.y = currentAngle;
    
    // Check if rotation complete
    if (progress >= 1) {
      // Enter pause state
      isInPause = true;
      pauseStartTime = time;
      // Snap to exact target angle
      topPyramid.rotation.y = currentTargetAngle;
      bottomPyramid.rotation.y = currentTargetAngle;
    }
  }
  
  // Bob animation (middle ground, continues during pause)
  topPyramid.position.y = (1.1 * logoScale) + Math.sin(time) * 0.065;
  bottomPyramid.position.y = (-0.9 * logoScale) - Math.sin(time) * 0.065;
  
  // Update shader time
  topPyramid.material.uniforms.time.value = time;
  bottomPyramid.material.uniforms.time.value = time;
  
  // Slow star rotation
  stars.rotation.y = time * 0.05;
  
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  const wasMobile = camera.position.z < 5;
  const nowMobile = window.innerWidth < 768;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Adjust camera distance on mobile/desktop switch
  if (wasMobile !== nowMobile) {
    const pyramidMidpoint = (1.1 - 0.9) / 2;
    camera.position.set(0, pyramidMidpoint + 1.5, nowMobile ? 4 : 6);
    camera.lookAt(0, pyramidMidpoint, 0);
  }
});

animate();
