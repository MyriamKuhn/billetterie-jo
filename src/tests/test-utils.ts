import TestRenderer from 'react-test-renderer'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { render, type RenderOptions } from '@testing-library/react'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

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

/**
 * A "wrapper" component that instantiates BrowserRouter + LocalizationProvider,
 * but written without any JSX so you never hit that erasableSyntaxOnly error.
 */
const AllProviders: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement(
    BrowserRouter,
    null,
    React.createElement(
      LocalizationProvider,
      { dateAdapter: AdapterDayjs },
      children
    )
  )

/**
 * A custom render function for RTL that uses our AllProviders wrapper.
 */
function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// re-export everything from RTL so you can import both
export * from '@testing-library/react'
export { renderWithProviders }
