import { useState, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import type React from 'react'

interface UseEditableInputOptions {
  externalValue: string
  parse: (s: string) => number
  format: (v: number) => string
  validate?: (v: number) => boolean
  onCommit: (v: number) => void
  step?: number
  minValue?: number
  skipBlurRef: MutableRefObject<boolean>
}

interface UseEditableInputResult {
  draft: string
  setDraft: (v: string) => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function useEditableInput({
  externalValue,
  parse,
  format,
  validate,
  onCommit,
  step,
  minValue,
  skipBlurRef,
}: UseEditableInputOptions): UseEditableInputResult {
  const [draft, setDraft] = useState(externalValue)

  useEffect(() => {
    setDraft(externalValue)
  }, [externalValue])

  function tryCommit(value: string): boolean {
    try {
      const parsed = parse(value)
      if (validate && !validate(parsed)) {
        setDraft(externalValue)
        return false
      }
      onCommit(parsed)
      setDraft(format(parsed))
      return true
    } catch {
      setDraft(externalValue)
      return false
    }
  }

  function onBlur() {
    if (skipBlurRef.current) {
      skipBlurRef.current = false
      return
    }
    tryCommit(draft)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (step !== undefined && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      let current: number
      try { current = parse(draft) } catch { try { current = parse(externalValue) } catch { current = minValue ?? 0 } }
      const rawValue = current + (e.key === 'ArrowUp' ? step : -step)
      const clamped = minValue !== undefined ? Math.max(minValue, rawValue) : rawValue
      const newValue = parseFloat(clamped.toFixed(10))
      setDraft(format(newValue))
      onCommit(newValue)
    } else if (e.key === 'Enter') {
      tryCommit(draft)
      skipBlurRef.current = true
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setDraft(externalValue)
      skipBlurRef.current = true
      e.currentTarget.blur()
    }
  }

  return { draft, setDraft, onBlur, onKeyDown }
}
