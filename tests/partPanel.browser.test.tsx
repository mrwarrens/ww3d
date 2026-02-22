import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import PartPanel from '../src/components/PartPanel'
import { createPart } from '../src/models/Part'

const testPart = createPart({
  name: 'Shelf',
  length: 24,
  width: 8,
  thickness: 0.75,
  position: { x: 0, y: 0.375, z: 0 },
})

describe('PartPanel', () => {
  it('renders nothing when part is null', async () => {
    const { container } = await render(<PartPanel part={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the part name', async () => {
    const screen = await render(<PartPanel part={testPart} />)
    await expect.element(screen.getByText('Shelf')).toBeVisible()
  })

  it('renders length in fractional inches', async () => {
    const screen = await render(<PartPanel part={testPart} />)
    await expect.element(screen.getByText(/L: 24"/)).toBeVisible()
  })

  it('renders width in fractional inches', async () => {
    const screen = await render(<PartPanel part={testPart} />)
    await expect.element(screen.getByText(/W: 8"/)).toBeVisible()
  })

  it('renders thickness in fractional inches', async () => {
    const screen = await render(<PartPanel part={testPart} />)
    await expect.element(screen.getByText(/T: 3\/4"/)).toBeVisible()
  })
})
