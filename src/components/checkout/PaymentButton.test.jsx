import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checkoutSchema } from '@/utils/validators'
import { PaymentButton } from './PaymentButton'
import { useCartStore } from '@/store/cartStore'

const validPickupDefaults = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '5551234567',
  order_type: 'pickup',
  pickup_date: '2025-04-01',
  pickup_time: '14:00',
  notes: '',
  catering: undefined,
}

const invalidPickupDefaults = {
  ...validPickupDefaults,
  pickup_date: '',
  pickup_time: '',
}

function TestForm({ defaultValues, children }) {
  const methods = useForm({
    defaultValues,
    resolver: zodResolver(checkoutSchema),
  })
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  )
}

describe('PaymentButton', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch
  const originalLocation = window.location

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    const location = { href: '', assign: vi.fn(), replace: vi.fn() }
    Object.defineProperty(window, 'location', { value: location, writable: true })
    useCartStore.setState({
      items: [
        { id: 'item-1', name: 'Item One', price: 10, quantity: 1, is_catering: false },
      ],
    })
    vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  it('renders Pay Deposit button by default', () => {
    render(
      <TestForm defaultValues={validPickupDefaults}>
        <PaymentButton />
      </TestForm>
    )
    expect(screen.getByRole('button', { name: /pay deposit/i })).toBeInTheDocument()
  })

  it('shows validation message when form is invalid and button is clicked', async () => {
    render(
      <TestForm defaultValues={invalidPickupDefaults}>
        <PaymentButton />
      </TestForm>
    )
    const button = screen.getByRole('button', { name: /pay deposit/i })
    fireEvent.click(button)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(
        alert.textContent.includes('Pickup date and time are required') ||
          alert.textContent.includes('Pick a date') ||
          alert.textContent.includes('Pick a valid date') ||
          alert.textContent.includes('Time is required')
      ).toBe(true)
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls create-checkout API with payload when form is valid', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ url: 'https://stripe.com/checkout' }) })

    render(
      <TestForm defaultValues={validPickupDefaults}>
        <PaymentButton />
      </TestForm>
    )
    const button = screen.getByRole('button', { name: /pay deposit/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/create-checkout'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.name).toBe('Jane Doe')
    expect(body.email).toBe('jane@example.com')
    expect(body.order_type).toBe('pickup')
    expect(body.pickup_date).toBe('2025-04-01')
    expect(body.items).toHaveLength(1)
    expect(body.items[0]).toMatchObject({ id: 'item-1', name: 'Item One', price: 10, quantity: 1 })
    expect(body.subtotal).toBe(10)
  })

  it('redirects to Stripe URL when API returns url', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ url: 'https://stripe.com/session' }) })

    render(
      <TestForm defaultValues={validPickupDefaults}>
        <PaymentButton />
      </TestForm>
    )
    fireEvent.click(screen.getByRole('button', { name: /pay deposit/i }))

    await waitFor(() => {
      expect(window.location.href).toBe('https://stripe.com/session')
    })
  })

  it('shows API error message when create-checkout returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Validation failed' }) })

    render(
      <TestForm defaultValues={validPickupDefaults}>
        <PaymentButton />
      </TestForm>
    )
    fireEvent.click(screen.getByRole('button', { name: /pay deposit/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Validation failed')
    })
  })

  it('shows generic error when API returns non-ok without error body', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) })

    render(
      <TestForm defaultValues={validPickupDefaults}>
        <PaymentButton />
      </TestForm>
    )
    fireEvent.click(screen.getByRole('button', { name: /pay deposit/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
    })
  })

  it('shows loading state and disables button while submitting', async () => {
    let resolveFetch
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolveFetch = r
        })
    )

    render(
      <TestForm defaultValues={validPickupDefaults}>
        <PaymentButton />
      </TestForm>
    )
    const button = screen.getByRole('button', { name: /pay deposit/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent(/redirecting/i)
    })

    resolveFetch({ ok: true, json: async () => ({ url: 'https://stripe.com/x' }) })
    await waitFor(() => {
      expect(window.location.href).toBe('https://stripe.com/x')
    })
  })
})
