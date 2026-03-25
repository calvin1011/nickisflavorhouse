import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAvailability, getAvailabilityForDate } from '@/hooks/useAvailability'
import { PickupHoursSummary } from '@/components/checkout/PickupHoursSummary'
import { specialOrderSchema } from '@/utils/validators'
import { sanitizeString } from '@/lib/sanitize'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const inputClass =
  'mt-1 block w-full rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-brand-foreground shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'

const labelClass = 'block text-sm font-medium text-brand-foreground'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function SpecialOrder() {
  const navigate = useNavigate()
  const { byDay } = useAvailability()
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(null)
  const [deliveryDistance, setDeliveryDistance] = useState(null)
  const [deliveryError, setDeliveryError] = useState('')
  const [checkingDistance, setCheckingDistance] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      order_type: 'pickup',
      pickup_date: '',
      pickup_time: '',
      special_order_details: '',
      notes: '',
    },
    resolver: zodResolver(specialOrderSchema),
  })

  const orderType = watch('order_type')
  const pickupDate = watch('pickup_date')
  const pickupSlots = getAvailabilityForDate(pickupDate, byDay)
  const pickupNotAvailable = pickupSlots?.notAvailable === true

  useEffect(() => {
    if (orderType !== 'delivery') {
      setDeliveryFee(null)
      setDeliveryDistance(null)
      setDeliveryError('')
    }
  }, [orderType])

  function getFirstErrorMessage(errs) {
    if (!errs || typeof errs !== 'object') return null
    for (const value of Object.values(errs)) {
      if (value?.message && typeof value.message === 'string') return value.message
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = getFirstErrorMessage(value)
        if (nested) return nested
      }
    }
    return null
  }

  const onValidationFailed = (fieldErrors) => {
    setSubmitError(getFirstErrorMessage(fieldErrors) || 'Please fix the errors above and try again.')
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-field-error]')
      if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const onSubmit = async (data) => {
    setSubmitError(null)
    if (!paymentMethod) {
      setSubmitError('Please select a payment method')
      return
    }
    if (orderType === 'delivery') {
      if (!deliveryAddress.trim()) {
        setSubmitError('Please enter your delivery address')
        return
      }
      if (deliveryFee == null || deliveryError) {
        setSubmitError('Please wait for delivery fee to be calculated or fix the address')
        return
      }
    }

    setSubmitLoading(true)
    try {
      const payload = {
        name: sanitizeString(data.name),
        email: sanitizeString(data.email),
        phone: sanitizeString(data.phone),
        order_type: data.order_type,
        pickup_date: data.pickup_date || undefined,
        pickup_time: data.pickup_time || undefined,
        special_order_details: sanitizeString(data.special_order_details),
        notes: sanitizeString(data.notes),
        payment_method: paymentMethod,
      }
      if (orderType === 'delivery') {
        payload.delivery_address = sanitizeString(deliveryAddress)
        payload.delivery_fee = deliveryFee
        payload.delivery_distance_miles = parseFloat(deliveryDistance)
      }

      const res = await fetch(`${window.location.origin}/api/special-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(json.error || 'Something went wrong')
        setSubmitLoading(false)
        return
      }
      const order = json.order
      if (!order?.id) {
        setSubmitError('Something went wrong. Please try again.')
        setSubmitLoading(false)
        return
      }

      navigate(
        `/order-confirmation?order_id=${order.id}&method=${paymentMethod}&special=true`,
        { state: { order, items: [] } }
      )
    } catch (err) {
      setSubmitError(err.message || 'Network error')
    }
    setSubmitLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-brand-foreground">
          Request a Special Order
        </h1>
        <p className="mt-2 text-brand-foreground/70">
          Describe what you&apos;d like and we&apos;ll get back to you with pricing and availability.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit, onValidationFailed)}
          className="mt-8 space-y-8"
        >
          <div>
            <label htmlFor="special_order_details" className={labelClass}>
              What would you like?
            </label>
            <textarea
              id="special_order_details"
              rows={5}
              className={inputClass}
              placeholder="Describe your custom order in detail (flavors, quantity, dietary needs, occasion, etc.)"
              {...register('special_order_details')}
            />
            {errors.special_order_details && (
              <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                {errors.special_order_details.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-brand-foreground">
              Your details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className={labelClass}>
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={inputClass}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={inputClass}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <span className={labelClass}>Order type</span>
              <div className="mt-2 flex gap-4 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="pickup"
                    {...register('order_type')}
                    className="border-brand-muted text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-brand-foreground">Pickup</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="delivery"
                    {...register('order_type')}
                    className="border-brand-muted text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-brand-foreground">Delivery</span>
                </label>
              </div>
              {errors.order_type && (
                <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                  {errors.order_type.message}
                </p>
              )}
            </div>

            {orderType === 'delivery' && (
              <div className="space-y-2">
                <label htmlFor="delivery_address" className={labelClass}>
                  Delivery address
                </label>
                <input
                  id="delivery_address"
                  type="text"
                  placeholder="Enter your full address"
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value)
                    setDeliveryFee(null)
                    setDeliveryError('')
                  }}
                  onBlur={async () => {
                    if (!deliveryAddress.trim()) return
                    setCheckingDistance(true)
                    setDeliveryError('')
                    try {
                      const res = await fetch(`${window.location.origin}/api/delivery-fee`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ customerAddress: deliveryAddress }),
                      })
                      const data = await res.json()
                      if (!res.ok) {
                        setDeliveryError(data.error || 'Could not calculate distance')
                        setDeliveryFee(null)
                      } else {
                        setDeliveryFee(data.fee)
                        setDeliveryDistance(data.miles)
                      }
                    } catch {
                      setDeliveryError('Could not calculate distance. Please try again.')
                    } finally {
                      setCheckingDistance(false)
                    }
                  }}
                  className={inputClass}
                />
                {checkingDistance && (
                  <p className="text-sm text-brand-foreground/60">Calculating distance...</p>
                )}
                {deliveryError && (
                  <p className="text-sm text-red-600" role="alert">{deliveryError}</p>
                )}
                {deliveryFee != null && !deliveryError && (
                  <p className="text-sm text-green-700 font-medium">
                    {deliveryDistance} miles away. Delivery fee will be calculated with your quote.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <PickupHoursSummary orderType={orderType} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pickup_date" className={labelClass}>
                    {orderType === 'delivery' ? 'Preferred delivery date' : 'Preferred pickup date'}
                  </label>
                  <input
                    id="pickup_date"
                    type="date"
                    className={inputClass}
                    min={todayStr()}
                    {...register('pickup_date')}
                  />
                  {pickupNotAvailable && (
                    <p className="mt-1 text-sm text-amber-700" role="alert">
                      {orderType === 'delivery'
                        ? `Delivery is not available on ${pickupSlots?.dayName}. Please choose another date.`
                        : `Pickup is not available on ${pickupSlots?.dayName}. Please choose another date.`}
                    </p>
                  )}
                  {errors.pickup_date && (
                    <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                      {errors.pickup_date.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="pickup_time" className={labelClass}>
                    {orderType === 'delivery' ? 'Preferred delivery time' : 'Preferred pickup time'}
                  </label>
                  <input
                    id="pickup_time"
                    type="time"
                    className={inputClass}
                    min={pickupNotAvailable ? undefined : pickupSlots?.minTime}
                    max={pickupNotAvailable ? undefined : pickupSlots?.maxTime}
                    disabled={pickupNotAvailable}
                    {...register('pickup_time')}
                  />
                  {pickupSlots && !pickupNotAvailable && (
                    <p className="mt-1 text-xs text-brand-foreground/60">
                      Available {pickupSlots.minTime}–{pickupSlots.maxTime}
                    </p>
                  )}
                  {errors.pickup_time && (
                    <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                      {errors.pickup_time.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className={labelClass}>
                Additional notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                className={inputClass}
                placeholder="Allergies, special requests, anything else we should know..."
                {...register('notes')}
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t border-brand-muted/30 pt-4">
            <h2 className="font-display text-lg font-semibold text-brand-foreground">
              Payment method
            </h2>
            <div className="flex flex-col gap-4" style={{ gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className="text-left rounded-xl p-4 border-2 transition-colors w-full"
                style={{
                  borderColor: paymentMethod === 'stripe' ? 'var(--brand-primary)' : 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <strong className="text-brand-primary">Pay by Card</strong>
                <p className="text-brand-muted text-sm mt-1">
                  Full amount charged securely via Stripe once we confirm your order
                </p>
              </button>

              <div
                className="rounded-xl p-4 border-2 transition-colors"
                style={{
                  borderColor: ['cashapp', 'zelle', 'cash'].includes(paymentMethod) ? 'var(--brand-primary)' : 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <strong className="text-brand-primary">Pay at Pickup</strong>
                <p className="text-brand-muted text-sm mt-1 mb-3">
                  Choose your preferred method below
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cashapp')}
                    className="flex items-center gap-2 rounded-lg py-2.5 px-4 font-bold border-2 border-[#00D632] transition-colors"
                    style={{
                      backgroundColor: paymentMethod === 'cashapp' ? '#00D632' : '#f0fdf4',
                      color: paymentMethod === 'cashapp' ? '#fff' : '#00D632',
                    }}
                  >
                    <span>$</span> Cash App: $nickiydoll
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('zelle')}
                    className="flex items-center gap-2 rounded-lg py-2.5 px-4 font-bold border-2 border-[#6D1ED4] transition-colors"
                    style={{
                      backgroundColor: paymentMethod === 'zelle' ? '#6D1ED4' : '#faf5ff',
                      color: paymentMethod === 'zelle' ? '#fff' : '#6D1ED4',
                    }}
                  >
                    <span>Z</span> Zelle: naomieb75@icloud.com
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className="flex items-center gap-2 rounded-lg py-2.5 px-4 font-bold border-2 border-[#1A1A1A] transition-colors"
                    style={{
                      backgroundColor: paymentMethod === 'cash' ? '#1A1A1A' : '#f9f9f9',
                      color: paymentMethod === 'cash' ? '#fff' : '#1A1A1A',
                    }}
                  >
                    Cash: Exact change only
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-brand-muted/30 pt-4">
            <p className="mb-4 rounded-lg border border-brand-muted/30 bg-brand-background p-4 text-sm text-brand-foreground/80">
              Pricing will be confirmed after we review your request. You won&apos;t be charged until we reach out with a quote.
            </p>
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full rounded-md bg-brand-primary px-4 py-3 font-medium text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Submitting…' : 'Submit special order request'}
            </button>
            {submitError && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {submitError}
              </p>
            )}
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}
