import React from 'react'
import TestRenderer from 'react-test-renderer'

/**
 * Monte un hook et expose son résultat.
 */
export function renderHook<T>(hook: () => T) {
  let result!: T

  function HookWrapper() {
    result = hook()
    return null
  }

  // on remplace <HookWrapper /> par React.createElement
  TestRenderer.act(() => {
    TestRenderer.create(
      React.createElement(HookWrapper, null)
    )
  })

  return {
    /** getter pour accéder au résultat du hook */
    result: () => result,
  }
}
