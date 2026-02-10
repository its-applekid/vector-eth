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
camera.position.z = isMobile ? 3.5 : 5;

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
    gl_FragColor = vec4(finalColor, 1.0);
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
const pyramidGeometry = new THREE.TetrahedronGeometry(logoScale, 0); // Low poly!

// Top pyramid (pointing up)
const topPyramid = new THREE.Mesh(
  pyramidGeometry,
  createRetroMaterial(0x8c8cff) // Purple-ish blue
);
topPyramid.position.y = 0.6 * logoScale;
scene.add(topPyramid);

// Bottom pyramid (pointing down - flip it)
const bottomPyramid = new THREE.Mesh(
  pyramidGeometry,
  createRetroMaterial(0x4c4ccc) // Darker blue
);
bottomPyramid.position.y = -0.6 * logoScale;
bottomPyramid.rotation.x = Math.PI; // Flip upside down
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

// Animation
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  
  time += 0.01;
  
  // Rotate the logo
  topPyramid.rotation.y = time * 0.5;
  bottomPyramid.rotation.y = time * 0.5;
  
  // Slight bob animation
  topPyramid.position.y = (0.6 * logoScale) + Math.sin(time) * 0.1;
  bottomPyramid.position.y = (-0.6 * logoScale) - Math.sin(time) * 0.1;
  
  // Update shader time
  topPyramid.material.uniforms.time.value = time;
  bottomPyramid.material.uniforms.time.value = time;
  
  // Slow star rotation
  stars.rotation.y = time * 0.05;
  
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  const wasMobile = camera.position.z < 4.5;
  const nowMobile = window.innerWidth < 768;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Adjust camera distance on mobile/desktop switch
  if (wasMobile !== nowMobile) {
    camera.position.z = nowMobile ? 3.5 : 5;
  }
});

animate();
