import { describe, it, expect, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { act } from 'react'
import { useEditableInput } from '../src/hooks/useEditableInput'

function makeSkipBlurRef() {
  return { current: false }
}

function mockKeyEvent(key: string) {
  const blur = vi.fn()
  return {
    event: {
      key,
      preventDefault: vi.fn(),
      currentTarget: { blur },
    } as unknown as React.KeyboardEvent<HTMLInputElement>,
    blur,
  }
}

describe('useEditableInput', () => {
  it('initializes draft to externalValue', () => {
    const skipBlurRef = makeSkipBlurRef()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5"',
        parse: parseFloat,
        format: v => `${v}"`,
        onCommit: vi.fn(),
        skipBlurRef,
      })
    )
    expect(result.current.draft).toBe('5"')
  })

  it('syncs draft when externalValue changes', async () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result, rerender } = renderHook(
      ({ val }: { val: string }) =>
        useEditableInput({
          externalValue: val,
          parse: parseFloat,
          format: v => `${v}"`,
          onCommit,
          skipBlurRef,
        }),
      { initialProps: { val: '5"' } }
    )
    expect(result.current.draft).toBe('5"')
    await act(async () => {
      rerender({ val: '10"' })
    })
    expect(result.current.draft).toBe('10"')
  })

  it('calls onCommit with parsed value and normalizes draft on valid blur', async () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5',
        parse: parseFloat,
        format: v => v.toFixed(2),
        onCommit,
        skipBlurRef,
      })
    )
    act(() => { result.current.setDraft('7') })
    act(() => { result.current.onBlur() })
    expect(onCommit).toHaveBeenCalledWith(7)
    expect(result.current.draft).toBe('7.00')
  })

  it('resets draft to externalValue on invalid blur without calling onCommit', async () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5',
        parse: (s) => { const v = parseFloat(s); if (isNaN(v)) throw new Error(); return v },
        format: v => v.toFixed(1),
        onCommit,
        skipBlurRef,
      })
    )
    act(() => { result.current.setDraft('not-a-number') })
    act(() => { result.current.onBlur() })
    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.draft).toBe('5')
  })

  it('resets draft when validate returns false, without calling onCommit', async () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5',
        parse: parseFloat,
        format: v => v.toFixed(1),
        validate: v => v > 0,
        onCommit,
        skipBlurRef,
      })
    )
    act(() => { result.current.setDraft('-3') })
    act(() => { result.current.onBlur() })
    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.draft).toBe('5')
  })

  it('skips blur commit and clears skipBlurRef when skipBlurRef is true', () => {
    const skipBlurRef = makeSkipBlurRef()
    skipBlurRef.current = true
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5',
        parse: parseFloat,
        format: v => v.toFixed(1),
        onCommit,
        skipBlurRef,
      })
    )
    act(() => { result.current.setDraft('99') })
    act(() => { result.current.onBlur() })
    expect(onCommit).not.toHaveBeenCalled()
    expect(skipBlurRef.current).toBe(false)
  })

  it('ArrowUp increments by step and calls onCommit', () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5',
        parse: parseFloat,
        format: v => v.toFixed(1),
        onCommit,
        step: 1,
        skipBlurRef,
      })
    )
    const { event } = mockKeyEvent('ArrowUp')
    act(() => { result.current.onKeyDown(event) })
    expect(onCommit).toHaveBeenCalledWith(6)
    expect(result.current.draft).toBe('6.0')
  })

  it('ArrowDown decrements by step and calls onCommit', () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5',
        parse: parseFloat,
        format: v => v.toFixed(1),
        onCommit,
        step: 1,
        skipBlurRef,
      })
    )
    const { event } = mockKeyEvent('ArrowDown')
    act(() => { result.current.onKeyDown(event) })
    expect(onCommit).toHaveBeenCalledWith(4)
    expect(result.current.draft).toBe('4.0')
  })

  it('ArrowDown clamps to minValue', () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '1',
        parse: parseFloat,
        format: v => v.toFixed(4),
        onCommit,
        step: 1,
        minValue: 0.0625,
        skipBlurRef,
      })
    )
    // Step down from 1: 1 - 1 = 0, clamped to 0.0625
    const { event } = mockKeyEvent('ArrowDown')
    act(() => { result.current.onKeyDown(event) })
    expect(onCommit).toHaveBeenCalledWith(0.0625)
  })

  it('arrow keys are ignored when step is not provided', () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5',
        parse: parseFloat,
        format: v => v.toFixed(1),
        onCommit,
        skipBlurRef,
      })
    )
    const { event } = mockKeyEvent('ArrowUp')
    act(() => { result.current.onKeyDown(event) })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('Enter commits then sets skipBlurRef and blurs', () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5',
        parse: parseFloat,
        format: v => v.toFixed(1),
        onCommit,
        skipBlurRef,
      })
    )
    act(() => { result.current.setDraft('8') })
    const { event, blur } = mockKeyEvent('Enter')
    act(() => { result.current.onKeyDown(event) })
    expect(onCommit).toHaveBeenCalledWith(8)
    expect(skipBlurRef.current).toBe(true)
    expect(blur).toHaveBeenCalled()
  })

  it('Escape resets draft to externalValue, sets skipBlurRef, and blurs without calling onCommit', () => {
    const skipBlurRef = makeSkipBlurRef()
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useEditableInput({
        externalValue: '5',
        parse: parseFloat,
        format: v => v.toFixed(1),
        onCommit,
        skipBlurRef,
      })
    )
    act(() => { result.current.setDraft('99') })
    const { event, blur } = mockKeyEvent('Escape')
    act(() => { result.current.onKeyDown(event) })
    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.draft).toBe('5')
    expect(skipBlurRef.current).toBe(true)
    expect(blur).toHaveBeenCalled()
  })
})
