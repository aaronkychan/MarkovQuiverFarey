// Three.js utility functions

import * as THREE from 'three';

export function createHyperbolicArc(start: THREE.Vector3, end: THREE.Vector3, center: THREE.Vector3): THREE.Curve {
  // Placeholder: create a curve for hyperbolic geodesic
  return new THREE.QuadraticBezierCurve3(start, center, end);
}

export function addTriangleToScene(scene: THREE.Scene, vertices: THREE.Vector3[]): void {
  const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

export function setupRaycaster(camera: THREE.Camera, mouse: THREE.Vector2, objects: THREE.Object3D[]): THREE.Intersection[] {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(objects);
}