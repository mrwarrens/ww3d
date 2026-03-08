import * as THREE from 'three'
import type { ManifoldToplevel, Mesh as ManifoldMesh } from 'manifold-3d'

let manifoldPromise: Promise<ManifoldToplevel> | null = null

/**
 * Convert a THREE.BufferGeometry to a Manifold instance.
 * Supports both indexed and non-indexed geometries.
 * Caller is responsible for disposing `geo` after this call.
 * Pass `ManifoldToplevel` (the full module, not just the Manifold class) as the second arg.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function threeGeoToManifold(geo: THREE.BufferGeometry, manifoldModule: any): any {
  const posArray = geo.attributes.position.array as Float32Array
  const vertProperties = new Float32Array(posArray)
  let triVerts: Uint32Array
  if (geo.index) {
    const indexArray = geo.index.array
    triVerts = new Uint32Array(indexArray.length)
    for (let i = 0; i < indexArray.length; i++) {
      triVerts[i] = indexArray[i]
    }
  } else {
    // Non-indexed: each group of 3 vertices is a triangle
    const vertCount = posArray.length / 3
    triVerts = new Uint32Array(vertCount)
    for (let i = 0; i < vertCount; i++) triVerts[i] = i
  }
  const mesh: ManifoldMesh = { numProp: 3, vertProperties, triVerts }
  return manifoldModule.Manifold.ofMesh(mesh)
}

/**
 * Build a Manifold ellipse solid (cylinder with elliptical cross-section).
 * The result is centered at origin with radii along X (length/2) and Z (width/2),
 * and height along Y (thickness) — matching the Board CSG coordinate system.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function manifoldEllipse(manifoldModule: any, length: number, width: number, thickness: number): any {
  return manifoldModule.Manifold.cylinder(1, 1, 1, 64, true)
    .rotate([90, 0, 0])
    .scale([length / 2, thickness, width / 2])
}

export function getManifold(): Promise<ManifoldToplevel> {
  if (!manifoldPromise) {
    manifoldPromise = import('manifold-3d').then(async ({ default: Module }) => {
      const m = await Module()
      m.setup()
      return m
    })
  }
  return manifoldPromise
}

export function manifoldMeshToThreeGeometry(mesh: ManifoldMesh): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const numVert = mesh.vertProperties.length / mesh.numProp

  const positions = new Float32Array(numVert * 3)
  for (let i = 0; i < numVert; i++) {
    positions[i * 3]     = mesh.vertProperties[i * mesh.numProp]
    positions[i * 3 + 1] = mesh.vertProperties[i * mesh.numProp + 1]
    positions[i * 3 + 2] = mesh.vertProperties[i * mesh.numProp + 2]
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.triVerts), 1))

  // Convert to non-indexed so each triangle gets its own vertices and exact
  // face normals — prevents <Outlines> from detecting the CSG triangulation
  // diagonal as a crease edge.
  const nonIndexed = geo.toNonIndexed()
  geo.dispose()
  nonIndexed.computeVertexNormals()
  return nonIndexed
}
