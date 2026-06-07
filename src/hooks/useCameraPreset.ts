import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { CAMERA_PRESETS } from '../utils/constants'
import type { Part } from '../models/Part'
import type { Assembly } from '../models/Assembly'

function computeSceneBounds(parts: Part[], assemblies: Assembly[]): { center: THREE.Vector3; radius: number } | null {
  const visible = parts.filter((p) => p.visible !== false && p.parentId == null)
  if (visible.length === 0) return null

  const assemblyPosMap = new Map(assemblies.map((a) => [a.id, a.position]))

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (const p of visible) {
    const asmPos = p.assemblyId ? assemblyPosMap.get(p.assemblyId) : null
    const wx = asmPos ? p.position.x + asmPos.x : p.position.x
    const wy = asmPos ? p.position.y + asmPos.y : p.position.y
    const wz = asmPos ? p.position.z + asmPos.z : p.position.z
    minX = Math.min(minX, wx - p.length / 2)
    maxX = Math.max(maxX, wx + p.length / 2)
    minY = Math.min(minY, wy - p.thickness / 2)
    maxY = Math.max(maxY, wy + p.thickness / 2)
    minZ = Math.min(minZ, wz - p.width / 2)
    maxZ = Math.max(maxZ, wz + p.width / 2)
  }

  const center = new THREE.Vector3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  )
  const radius = Math.max(
    0.5,
    Math.sqrt(
      Math.pow((maxX - minX) / 2, 2) +
      Math.pow((maxY - minY) / 2, 2) +
      Math.pow((maxZ - minZ) / 2, 2),
    ),
  )

  return { center, radius }
}

function cameraDistanceForRadius(radius: number, camera: THREE.Camera): number {
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 75
  const halfFov = (fov * Math.PI / 180) / 2
  return (radius / Math.tan(halfFov)) * 1.5
}

export function useCameraPreset(
  camera: THREE.Camera,
  controls: OrbitControlsImpl | null,
  parts: Part[],
  assemblies: Assembly[],
) {
  function getBounds() {
    const bounds = computeSceneBounds(parts, assemblies)
    if (!bounds) return { target: new THREE.Vector3(0, 0, 0), distance: 20 }
    return { target: bounds.center, distance: cameraDistanceForRadius(bounds.radius, camera) }
  }

  function goToPreset(name: keyof typeof CAMERA_PRESETS) {
    const { position, target: defaultTarget } = CAMERA_PRESETS[name]
    const { target, distance } = getBounds()
    const dir = new THREE.Vector3(...position)
      .sub(new THREE.Vector3(...defaultTarget))
      .normalize()
    camera.position.copy(target.clone().addScaledVector(dir, distance))
    if (controls) {
      controls.target.copy(target)
      controls.update()
    }
  }

  function frameAll() {
    const { target, distance } = getBounds()
    const currentTarget = controls ? controls.target : new THREE.Vector3(0, 0, 0)
    const dir = camera.position.clone().sub(currentTarget).normalize()
    if (dir.lengthSq() < 0.001) dir.set(1, 1, 1).normalize()
    camera.position.copy(target.clone().addScaledVector(dir, distance))
    if (controls) {
      controls.target.copy(target)
      controls.update()
    }
  }

  return { goToPreset, frameAll }
}
