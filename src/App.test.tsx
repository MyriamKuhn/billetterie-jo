import { render, screen } from '@testing-library/react'
import App from './App'

test('affiche le titre Vite + React', () => {
  render(<App />)
  // on recherche maintenant "Vite + React"
  expect(screen.getByText(/Vite \+ React/i)).toBeInTheDocument()
})
