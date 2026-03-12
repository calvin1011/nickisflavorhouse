import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App', () => {
  it('renders home with brand name', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /Nicki's Flavor House/i })).toBeInTheDocument()
  })

  it('renders menu placeholder at /menu', () => {
    render(
      <MemoryRouter initialEntries={['/menu']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/Menu coming soon/i)).toBeInTheDocument()
  })
})
