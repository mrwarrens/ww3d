import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(3, 2, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

// Shared geometry and edge geometry
const geometry = new THREE.BoxGeometry(1, 1, 1);
const edges = new THREE.EdgesGeometry(geometry);
const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });

function createCube(position) {
  const hue = Math.random();
  const color = new THREE.Color().setHSL(hue, 0.7, 0.6);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.copy(position);
  cube.add(new THREE.LineSegments(edges.clone(), lineMat));
  scene.add(cube);
  return cube;
}

// Initial cube at origin
createCube(new THREE.Vector3(0, 0.5, 0));

// Place cubes on double-click via raycasting onto the grid plane
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

renderer.domElement.addEventListener('dblclick', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(gridPlane, hit)) {
    // Snap to grid
    hit.x = Math.round(hit.x);
    hit.z = Math.round(hit.z);
    hit.y = 0.5;
    createCube(hit);
  }
});

// Grid helper
const grid = new THREE.GridHelper(10, 10, 0x444466, 0x333355);
scene.add(grid);

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(5, 8, 4);
scene.add(directional);

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Exports for testing
export { scene, camera, renderer, controls, createCube };
