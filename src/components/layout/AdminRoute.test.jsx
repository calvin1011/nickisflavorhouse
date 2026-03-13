import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector) =>
    selector({
      user: null,
      session: null,
      initialized: true,
      clearAuth: () => {},
    }),
  initAuthListener: () => () => {},
}))

import App from '@/App'

describe('AdminRoute', () => {
  it('redirects to login when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /Admin sign in/i })).toBeInTheDocument()
  })
})
