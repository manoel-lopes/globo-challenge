import { useEffect, useState } from 'react'

export function useDebouncedValue<TValue>(value: TValue, delayMs = 350): TValue {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
