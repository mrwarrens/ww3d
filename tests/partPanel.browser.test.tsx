import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { userEvent } from '@vitest/browser/context'
import PartPanel from '../src/components/PartPanel'
import { createPart } from '../src/models/Part'

const testPart = createPart({
  name: 'Shelf',
  length: 24,
  width: 8,
  thickness: 0.75,
  position: { x: 0, y: 0.375, z: 0 },
})

const secondPart = createPart({
  name: 'Side Panel',
  length: 12,
  width: 6,
  thickness: 0.75,
  position: { x: 1, y: 0.375, z: 1 },
})

afterEach(() => cleanup())

describe('PartPanel', () => {
  it('renders the part name in an input', async () => {
    const screen = await render(<PartPanel part={testPart} onUpdate={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /part name/i })
    await expect.element(input).toHaveValue('Shelf')
  })

  it('renders length in fractional inches', async () => {
    const screen = await render(<PartPanel part={testPart} onUpdate={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /length/i })
    await expect.element(input).toHaveValue('24"')
  })

  it('renders width in fractional inches', async () => {
    const screen = await render(<PartPanel part={testPart} onUpdate={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /width/i })
    await expect.element(input).toHaveValue('8"')
  })

  it('renders thickness in fractional inches', async () => {
    const screen = await render(<PartPanel part={testPart} onUpdate={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /thickness/i })
    await expect.element(input).toHaveValue('3/4"')
  })

  it('commits name on blur when non-empty', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /part name/i })
    await input.fill('Top Rail')
    await userEvent.keyboard('{Tab}')
    expect(onUpdate).toHaveBeenCalledWith({ name: 'Top Rail' })
  })

  it('commits name on Enter', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /part name/i })
    await input.fill('Bottom Rail')
    await userEvent.keyboard('{Enter}')
    expect(onUpdate).toHaveBeenCalledWith({ name: 'Bottom Rail' })
  })

  it('resets name on Escape without calling onUpdate', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /part name/i })
    await input.fill('Something else')
    await userEvent.keyboard('{Escape}')
    expect(onUpdate).not.toHaveBeenCalled()
    await expect.element(input).toHaveValue('Shelf')
  })

  it('does not commit name when blurred with empty value', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /part name/i })
    await input.fill('')
    await userEvent.keyboard('{Tab}')
    expect(onUpdate).not.toHaveBeenCalled()
    await expect.element(input).toHaveValue('Shelf')
  })

  it('commits name on Enter and retains the typed value', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /part name/i })
    await input.fill('Leg')
    await userEvent.keyboard('{Enter}')
    expect(onUpdate).toHaveBeenCalledWith({ name: 'Leg' })
    await expect.element(input).toHaveValue('Leg')
  })

  it('commits a valid fractional-inch length on Enter', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /length/i })
    await input.fill('3-1/2"')
    await userEvent.keyboard('{Enter}')
    expect(onUpdate).toHaveBeenCalledWith({ length: 3.5 })
  })

  it('commits a valid dimension on Tab (blur)', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /length/i })
    await input.fill('36"')
    await userEvent.keyboard('{Tab}')
    expect(onUpdate).toHaveBeenCalledWith({ length: 36 })
  })

  it('resets dimension input on invalid value blur without calling onUpdate', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /length/i })
    await input.fill('abc')
    await userEvent.keyboard('{Tab}')
    expect(onUpdate).not.toHaveBeenCalled()
    await expect.element(input).toHaveValue('24"')
  })

  it('resets all inputs when a different part is selected', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const nameInput = screen.getByRole('textbox', { name: /part name/i })
    await expect.element(nameInput).toHaveValue('Shelf')

    await screen.rerender(<PartPanel part={secondPart} onUpdate={onUpdate} />)
    await expect.element(nameInput).toHaveValue('Side Panel')

    const lengthInput = screen.getByRole('textbox', { name: /length/i })
    await expect.element(lengthInput).toHaveValue('12"')
  })

  it('renders Rx input with initial value 0.0', async () => {
    const screen = await render(<PartPanel part={testPart} onUpdate={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /rotation x/i })
    await expect.element(input).toHaveValue('0.0')
  })

  it('commits rotation.x on Enter with degrees converted to radians', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /rotation x/i })
    await input.fill('90')
    await userEvent.keyboard('{Enter}')
    expect(onUpdate).toHaveBeenCalledWith({
      rotation: expect.objectContaining({ x: expect.closeTo(Math.PI / 2, 5) }),
    })
  })

  it('resets Rx input on invalid value without calling onUpdate', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /rotation x/i })
    await input.fill('abc')
    await userEvent.keyboard('{Tab}')
    expect(onUpdate).not.toHaveBeenCalled()
    await expect.element(input).toHaveValue('0.0')
  })

  it('renders a color input with the part color as its value', async () => {
    const colorPart = createPart({
      name: 'Colored',
      length: 10,
      width: 5,
      thickness: 0.75,
      position: { x: 0, y: 0.375, z: 0 },
      color: '#ab1234',
    })
    const screen = await render(<PartPanel part={colorPart} onUpdate={vi.fn()} />)
    const colorInput = screen.container.querySelector('input[type="color"]') as HTMLInputElement
    expect(colorInput).not.toBeNull()
    expect(colorInput.value).toBe('#ab1234')
  })

  it('calls onUpdate with new color when color input changes', async () => {
    const colorPart = createPart({
      name: 'Colored',
      length: 10,
      width: 5,
      thickness: 0.75,
      position: { x: 0, y: 0.375, z: 0 },
      color: '#ab1234',
    })
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={colorPart} onUpdate={onUpdate} />)
    const colorInput = screen.container.querySelector('input[type="color"]') as HTMLInputElement
    const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    nativeValueSetter.call(colorInput, '#ff0000')
    colorInput.dispatchEvent(new Event('input', { bubbles: true }))
    expect(onUpdate).toHaveBeenCalledWith({ color: '#ff0000' })
  })

  it('color input shows part color on first render when color is a computed hex value', async () => {
    const hexColorPart = createPart({
      name: 'HexColored',
      length: 10,
      width: 5,
      thickness: 0.75,
      position: { x: 0, y: 0.375, z: 0 },
      color: '#4da652',
    })
    const screen = await render(<PartPanel part={hexColorPart} onUpdate={vi.fn()} />)
    const colorInput = screen.container.querySelector('input[type="color"]') as HTMLInputElement
    expect(colorInput).not.toBeNull()
    expect(colorInput.value).toBe('#4da652')
  })

  it('renders Px input with initial value matching position.x in fractional inches', async () => {
    const screen = await render(<PartPanel part={testPart} onUpdate={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /position x/i })
    await expect.element(input).toHaveValue('0"')
  })

  it('commits position.x on Enter', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /position x/i })
    await input.fill('5.5')
    await userEvent.keyboard('{Enter}')
    expect(onUpdate).toHaveBeenCalledWith({
      position: { ...testPart.position, x: 5.5 },
    })
  })

  it('resets Px input on invalid value without calling onUpdate', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /position x/i })
    await input.fill('abc')
    await userEvent.keyboard('{Tab}')
    expect(onUpdate).not.toHaveBeenCalled()
    await expect.element(input).toHaveValue('0"')
  })

  it('resets position drafts when switching to a different part', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const pxInput = screen.getByRole('textbox', { name: /position x/i })
    await expect.element(pxInput).toHaveValue('0"')

    await screen.rerender(<PartPanel part={secondPart} onUpdate={onUpdate} />)
    await expect.element(pxInput).toHaveValue('1"')
  })

  it('updates position inputs when the same part is moved (simulating drag)', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const pxInput = screen.getByRole('textbox', { name: /position x/i })
    const pzInput = screen.getByRole('textbox', { name: /position z/i })
    await expect.element(pxInput).toHaveValue('0"')
    await expect.element(pzInput).toHaveValue('0"')

    const movedPart = { ...testPart, position: { x: 3, y: 0.375, z: 5 } }
    await screen.rerender(<PartPanel part={movedPart} onUpdate={onUpdate} />)
    await expect.element(pxInput).toHaveValue('3"')
    await expect.element(pzInput).toHaveValue('5"')
  })

  it('resets rotation drafts when switching to a different part', async () => {
    const partWithRot = createPart({
      name: 'Tilted',
      length: 10,
      width: 5,
      thickness: 0.75,
      position: { x: 0, y: 0.375, z: 0 },
      rotation: { x: Math.PI / 2, y: 0, z: 0 },
    })
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={partWithRot} onUpdate={onUpdate} />)
    const rxInput = screen.getByRole('textbox', { name: /rotation x/i })
    await expect.element(rxInput).toHaveValue('90.0')

    await screen.rerender(<PartPanel part={testPart} onUpdate={onUpdate} />)
    await expect.element(rxInput).toHaveValue('0.0')
  })

  it('ArrowUp on Length input increments by 1/16" and calls onUpdate', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /length/i })
    await input.click()
    await userEvent.keyboard('{ArrowUp}')
    expect(onUpdate).toHaveBeenCalledWith({ length: expect.closeTo(24.0625, 4) })
    await expect.element(input).toHaveValue('24-1/16"')
  })

  it('ArrowDown on Length input decrements by 1/16" and calls onUpdate', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /length/i })
    await input.click()
    await userEvent.keyboard('{ArrowDown}')
    expect(onUpdate).toHaveBeenCalledWith({ length: expect.closeTo(23.9375, 4) })
    await expect.element(input).toHaveValue('23-15/16"')
  })

  it('ArrowDown on Thickness at minimum 1/16" stays at 1/16" and calls onUpdate', async () => {
    const thinPart = createPart({
      name: 'Thin',
      length: 12,
      width: 6,
      thickness: 0.0625,
      position: { x: 0, y: 0, z: 0 },
    })
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={thinPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /thickness/i })
    await input.click()
    await userEvent.keyboard('{ArrowDown}')
    expect(onUpdate).toHaveBeenCalledWith({ thickness: expect.closeTo(0.0625, 4) })
    await expect.element(input).toHaveValue('1/16"')
  })

  it('ArrowUp on Rotation X increments by 1 degree and calls onUpdate', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /rotation x/i })
    await input.click()
    await userEvent.keyboard('{ArrowUp}')
    expect(onUpdate).toHaveBeenCalledWith({
      rotation: expect.objectContaining({ x: expect.closeTo(Math.PI / 180, 5) }),
    })
    await expect.element(input).toHaveValue('1.0')
  })

  it('ArrowUp on Position X increments by 1/16" and calls onUpdate', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /position x/i })
    await input.click()
    await userEvent.keyboard('{ArrowUp}')
    expect(onUpdate).toHaveBeenCalledWith({
      position: expect.objectContaining({ x: expect.closeTo(0.0625, 4) }),
    })
    await expect.element(input).toHaveValue('1/16"')
  })

  it('displays position in fractional inches on initial render', async () => {
    const part = createPart({
      name: 'Board',
      length: 12,
      width: 6,
      thickness: 0.75,
      position: { x: 0.3, y: 0, z: 0 },
    })
    const screen = await render(<PartPanel part={part} onUpdate={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /position x/i })
    // 0.3 rounds to nearest 1/16": 5/16" (0.3125)
    await expect.element(input).toHaveValue('5/16"')
  })

  it('ArrowUp on Position X from non-binary-fraction starting value snaps to nearest 1/16"', async () => {
    const part = createPart({
      name: 'Board',
      length: 12,
      width: 6,
      thickness: 0.75,
      position: { x: 0.3, y: 0, z: 0 },
    })
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={part} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /position x/i })
    await input.click()
    // Display snaps 0.3 to nearest 1/16": 5/16" (0.3125)
    // Each ArrowUp adds 0.0625; after 5 presses: 0.3125 + 5*0.0625 = 0.625
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}')
    await expect.element(input).toHaveValue('5/8"')
    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
    expect(lastCall.position.x).toBe(0.625)
  })

  it('commits fractional-inch string in Position X on Enter', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /position x/i })
    await input.fill('1-1/2"')
    await userEvent.keyboard('{Enter}')
    expect(onUpdate).toHaveBeenCalledWith({
      position: { ...testPart.position, x: 1.5 },
    })
  })

  it('normalises decimal position input to fractional form on blur', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /position x/i })
    await input.fill('3.5')
    await userEvent.keyboard('{Tab}')
    expect(onUpdate).toHaveBeenCalledWith({
      position: { ...testPart.position, x: 3.5 },
    })
    await expect.element(input).toHaveValue('3-1/2"')
  })

  it('normalises decimal dimension input to fractional form on blur', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={testPart} onUpdate={onUpdate} />)
    const input = screen.getByRole('textbox', { name: /length/i })
    await input.fill('1.5')
    await userEvent.keyboard('{Tab}')
    expect(onUpdate).toHaveBeenCalledWith({ length: 1.5 })
    await expect.element(input).toHaveValue('1-1/2"')
  })

  it('dim inputs are wide enough to display long fractional values without scrolling', async () => {
    const longPart = createPart({
      name: 'Wide Board',
      length: 23.9375, // displays as "23-15/16"" — 9 characters
      width: 8,
      thickness: 0.75,
      position: { x: 0, y: 0.375, z: 0 },
    })
    const screen = await render(<PartPanel part={longPart} onUpdate={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: /length/i })
    await expect.element(input).toHaveValue('23-15/16"')
    const el = input.element() as HTMLInputElement
    const width = parseFloat(getComputedStyle(el).width)
    expect(width).toBeGreaterThanOrEqual(90)
  })
})
