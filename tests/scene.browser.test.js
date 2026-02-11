import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { scene, camera, renderer, controls, createCube } from '../src/main.js'

describe('App scene setup', () => {
  it('creates a scene with the correct background color', () => {
    expect(scene).toBeInstanceOf(THREE.Scene)
    expect(scene.background.getHexString()).toBe('1a1a2e')
  })

  it('configures a perspective camera at the expected position', () => {
    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera)
    expect(camera.fov).toBe(60)
    expect(camera.position.x).toBeCloseTo(3, 1)
    expect(camera.position.y).toBeCloseTo(2, 1)
    expect(camera.position.z).toBeCloseTo(3, 1)
  })

  it('attaches a WebGL canvas to the document', () => {
    expect(renderer).toBeInstanceOf(THREE.WebGLRenderer)
    const canvas = renderer.domElement
    expect(canvas.tagName).toBe('CANVAS')
    expect(document.body.contains(canvas)).toBe(true)
  })

  it('sets up orbit controls with damping', () => {
    expect(controls.enableDamping).toBe(true)
    expect(controls.dampingFactor).toBe(0.08)
  })

  it('places an initial cube at (0, 0.5, 0)', () => {
    const meshes = scene.children.filter(c => c.isMesh)
    expect(meshes.length).toBeGreaterThanOrEqual(1)
    const first = meshes[0]
    expect(first.position.x).toBe(0)
    expect(first.position.y).toBe(0.5)
    expect(first.position.z).toBe(0)
  })

  it('includes a grid helper in the scene', () => {
    const grids = scene.children.filter(c => c.type === 'GridHelper')
    expect(grids).toHaveLength(1)
  })

  it('includes ambient and directional lights', () => {
    const lights = scene.children.filter(c => c.isLight)
    expect(lights).toHaveLength(2)

    const ambient = lights.find(l => l.isAmbientLight)
    const directional = lights.find(l => l.isDirectionalLight)
    expect(ambient).toBeDefined()
    expect(directional).toBeDefined()
    expect(directional.position.x).toBe(5)
    expect(directional.position.y).toBe(8)
    expect(directional.position.z).toBe(4)
  })

  it('adds a new cube to the scene via createCube()', () => {
    const before = scene.children.filter(c => c.isMesh).length
    createCube(new THREE.Vector3(2, 0.5, 3))
    const after = scene.children.filter(c => c.isMesh).length
    expect(after).toBe(before + 1)

    const newest = scene.children.filter(c => c.isMesh).pop()
    expect(newest.position.x).toBe(2)
    expect(newest.position.y).toBe(0.5)
    expect(newest.position.z).toBe(3)
  })

  it('creates cubes with edge wireframes as children', () => {
    const meshes = scene.children.filter(c => c.isMesh)
    const cube = meshes[0]
    const wireframes = cube.children.filter(c => c.isLineSegments)
    expect(wireframes).toHaveLength(1)
  })
})
