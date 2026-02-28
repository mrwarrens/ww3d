import type * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { CAMERA_PRESETS } from '../utils/constants'

export function useCameraPreset(
  camera: THREE.Camera,
  controls: OrbitControlsImpl | null,
) {
  function goToPreset(name: keyof typeof CAMERA_PRESETS) {
    const { position, target } = CAMERA_PRESETS[name]
    camera.position.set(position[0], position[1], position[2])
    if (controls) {
      controls.target.set(target[0], target[1], target[2])
      controls.update()
    }
  }

  return goToPreset
}
