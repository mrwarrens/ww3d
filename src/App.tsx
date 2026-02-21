import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'

export default function App() {
  return (
    <>
      <div id="info">
        Left-click drag: draw board &middot; Right-click drag: orbit &middot; Scroll: zoom
      </div>
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 100, position: [3, 2, 3] }}
        gl={{ antialias: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>
    </>
  )
}
