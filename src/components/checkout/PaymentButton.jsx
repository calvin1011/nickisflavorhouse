import { useState, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { useCartStore, getCartSubtotal } from '@/store/cartStore'
import { sanitizeOrder } from '@/lib/sanitize'

/**
 * POSTs checkout payload to create-checkout API and redirects to Stripe.
 * Must be used inside FormProvider with checkoutSchema; validates form first.
 */
export function PaymentButton({ children = 'Pay Deposit', disabled, className }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationMessage, setValidationMessage] = useState(null)
  const { handleSubmit, formState } = useFormContext()
  const items = useCartStore((s) => s.items)
  const subtotalCents = useCartStore(getCartSubtotal)
  const buttonRef = useRef(null)

  function getFirstErrorMessage(errors) {
    if (!errors || typeof errors !== 'object') return null
    for (const value of Object.values(errors)) {
      if (value?.message && typeof value.message === 'string') return value.message
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = getFirstErrorMessage(value)
        if (nested) return nested
      }
    }
    return null
  }

  const onValidationFailed = (errors) => {
    const message = getFirstErrorMessage(errors) || 'Please fix the errors above and try again.'
    setValidationMessage(message)
    setError(null)
    requestAnimationFrame(() => {
      const fieldError = document.querySelector('[data-field-error]')
      if (fieldError && typeof fieldError.scrollIntoView === 'function') {
        fieldError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (buttonRef.current && typeof buttonRef.current.scrollIntoView === 'function') {
        buttonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  const onSubmit = async (data) => {
    setValidationMessage(null)
    setError(null)
    setLoading(true)
    const sanitized = sanitizeOrder(data)
    const payload = {
      ...sanitized,
      items: items.map(({ id, name, price, quantity, is_catering }) => ({
        id,
        name,
        price,
        quantity,
        is_catering: !!is_catering,
      })),
      subtotal_cents: subtotalCents,
    }

    try {
      const res = await fetch(`${window.location.origin}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Something went wrong')
        setLoading(false)
        return
      }
      if (json.url) {
        window.location.href = json.url
        return
      }
      setError('No payment link received')
    } catch (err) {
      setError(err.message || 'Network error')
    }
    setLoading(false)
  }

  const isDisabled = disabled || formState.isSubmitting || loading

  return (
    <div className="space-y-2" ref={buttonRef}>
      <button
        type="button"
        onClick={handleSubmit(onSubmit, onValidationFailed)}
        disabled={isDisabled}
        className={className}
      >
        {loading ? 'Redirecting…' : children}
      </button>
      {validationMessage && (
        <p className="text-sm text-amber-700 dark:text-amber-400" role="alert">
          {validationMessage}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
