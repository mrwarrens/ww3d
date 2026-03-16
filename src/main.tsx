import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import CutListView from './components/CutListView'

function Root() {
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route === '#/cutlist' ? <CutListView /> : <App />
}

createRoot(document.getElementById('root')!).render(<Root />)
