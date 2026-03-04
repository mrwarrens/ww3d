import * as THREE from 'three'
import type { ManifoldToplevel, Mesh as ManifoldMesh } from 'manifold-3d'

let manifoldPromise: Promise<ManifoldToplevel> | null = null

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
