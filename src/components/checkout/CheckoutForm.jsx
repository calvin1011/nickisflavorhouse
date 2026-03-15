import { useState, useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useCartStore, getCartSubtotal } from '@/store/cartStore'
import { useAvailability, getAvailabilityForDate } from '@/hooks/useAvailability'
import { PickupHoursSummary } from './PickupHoursSummary'
import { checkoutSchema } from '@/utils/validators'
import { formatCurrency } from '@/utils/formatCurrency'
import { sanitizeString } from '@/lib/sanitize'
import { CateringForm } from './CateringForm'
import { CartItem } from '@/components/cart/CartItem'
import { supabase } from '@/lib/supabase'

const inputClass =
  'mt-1 block w-full rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-brand-foreground shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'

const labelClass = 'block text-sm font-medium text-brand-foreground'

const defaultValues = {
  name: '',
  email: '',
  phone: '',
  order_type: 'pickup',
  pickup_date: '',
  pickup_time: '',
  notes: '',
  catering: undefined,
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function OrderTotalSummary({ subtotal, deliveryFee }) {
  const total = subtotal + (deliveryFee || 0)
  return (
    <div className="rounded-lg border border-brand-muted/30 bg-brand-background p-4">
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between pt-1 text-base">
          <dt className="font-medium text-brand-foreground/80">Order total</dt>
          <dd className="font-semibold text-brand-foreground">
            {formatCurrency(total)}
          </dd>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-brand-foreground/70">
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
        )}
        {deliveryFee > 0 && (
          <div className="flex justify-between text-brand-foreground/70">
            <dt>Delivery fee</dt>
            <dd>{formatCurrency(deliveryFee)}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export function CheckoutForm() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore(getCartSubtotal)
  const clearCart = useCartStore((s) => s.clearCart)
  const hasCatering = items.some((i) => i.is_catering)
  const { byDay } = useAvailability()

  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(null)
  const [deliveryDistance, setDeliveryDistance] = useState(null)
  const [deliveryError, setDeliveryError] = useState('')
  const [checkingDistance, setCheckingDistance] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [validationMessage, setValidationMessage] = useState(null)

  const methods = useForm({
    defaultValues,
    resolver: zodResolver(checkoutSchema),
  })

  const orderType = methods.watch('order_type')
  const pickupDate = methods.watch('pickup_date')
  const pickupTime = methods.watch('pickup_time')
  const showCatering = orderType === 'catering' || hasCatering
  const pickupSlots = getAvailabilityForDate(pickupDate, byDay)
  const pickupNotAvailable = pickupSlots?.notAvailable === true
  const orderTotal = subtotal + (orderType === 'delivery' && deliveryFee != null ? deliveryFee : 0)

  useEffect(() => {
    const currentCatering = methods.getValues('catering')
    if (showCatering && !currentCatering) {
      methods.setValue('catering', {
        event_date: '',
        event_time: '',
        event_location: '',
        guest_count: 1,
        catering_notes: '',
      })
    } else if (!showCatering && currentCatering) {
      methods.setValue('catering', undefined)
    }
  }, [showCatering, methods])

  useEffect(() => {
    if ((orderType === 'pickup' || orderType === 'delivery') && pickupNotAvailable && methods.getValues('pickup_time')) {
      methods.setValue('pickup_time', '')
    }
  }, [orderType, pickupNotAvailable, methods])

  useEffect(() => {
    if (orderType !== 'delivery') {
      setDeliveryFee(null)
      setDeliveryDistance(null)
      setDeliveryError('')
    }
  }, [orderType])

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
    setValidationMessage(getFirstErrorMessage(errors) || 'Please fix the errors above and try again.')
    setSubmitError(null)
    requestAnimationFrame(() => {
      const fieldError = document.querySelector('[data-field-error]')
      if (fieldError?.scrollIntoView) fieldError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const handleSubmitForm = async (data) => {
    setValidationMessage(null)
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
      if (!data.pickup_date || !data.pickup_time) {
        setSubmitError('Please select delivery date and time')
        return
      }
    }

    setSubmitLoading(true)
    const form = { name: data.name, email: data.email, phone: data.phone, orderType: data.order_type, notes: data.notes }

    if (paymentMethod === 'stripe') {
      try {
        const payload = {
          name: sanitizeString(form.name),
          email: sanitizeString(form.email),
          phone: sanitizeString(form.phone),
          order_type: data.order_type,
          pickup_date: data.pickup_date || undefined,
          pickup_time: data.pickup_time || undefined,
          notes: sanitizeString(form.notes),
          catering: data.catering,
          items: items.map(({ id, name, price, quantity, is_catering }) => ({
            id,
            name,
            price,
            quantity,
            is_catering: !!is_catering,
          })),
          subtotal,
          paymentMethod: 'stripe',
        }
        if (orderType === 'delivery') {
          payload.delivery_address = sanitizeString(deliveryAddress)
          payload.delivery_fee = deliveryFee
          payload.delivery_distance_miles = parseFloat(deliveryDistance)
        }
        const res = await fetch(`${window.location.origin}/api/create-checkout`, {
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
        if (json.url) {
          window.location.href = json.url
          return
        }
        setSubmitError('No payment link received')
      } catch (err) {
        setSubmitError(err.message || 'Network error')
      }
      setSubmitLoading(false)
      return
    }

    const orderNumber = `NFH-${Date.now().toString().slice(-6)}`
    const orderRecord = {
      order_number: orderNumber,
      customer_name: sanitizeString(form.name),
      customer_email: sanitizeString(form.email),
      customer_phone: sanitizeString(form.phone),
      order_type: data.order_type,
      subtotal,
      deposit_amount: 0,
      balance_due: 0,
      payment_status: 'pending',
      payment_method: paymentMethod,
      status: 'pending',
      notes: sanitizeString(form.notes),
      pickup_date: (data.order_type === 'pickup' || data.order_type === 'delivery') ? data.pickup_date || null : null,
      pickup_time: (data.order_type === 'pickup' || data.order_type === 'delivery') ? data.pickup_time || null : null,
      delivery_address: orderType === 'delivery' ? sanitizeString(deliveryAddress) : null,
      delivery_fee: orderType === 'delivery' ? deliveryFee : 0,
      delivery_distance_miles: orderType === 'delivery' && deliveryDistance != null ? parseFloat(deliveryDistance) : null,
    }
    if (data.catering && data.order_type === 'catering') {
      orderRecord.is_catering = true
      orderRecord.event_date = data.catering.event_date || null
      orderRecord.event_time = data.catering.event_time || null
      orderRecord.event_location = data.catering.event_location || null
      orderRecord.guest_count = data.catering.guest_count ?? null
      orderRecord.catering_notes = data.catering.catering_notes || null
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single()

    if (orderError || !order) {
      console.error(orderError)
      setSubmitError('Something went wrong. Please try again.')
      setSubmitLoading(false)
      return
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      console.error(itemsError)
      setSubmitError('Could not save order items. Please contact us.')
      setSubmitLoading(false)
      return
    }

    const orderForNotify = { ...order, items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })) }
    try {
      const tokenRes = await fetch(`${window.location.origin}/api/notify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const tokenData = tokenRes.ok ? await tokenRes.json().catch(() => null) : null
      if (tokenData?.token && tokenData?.createdAt) {
        await fetch(`${window.location.origin}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: orderForNotify,
            orderId: order.id,
            createdAt: tokenData.createdAt,
            token: tokenData.token,
          }),
        })
      }
    } catch {
      // non-blocking
    }

    clearCart()
    navigate(`/order-confirmation?order_id=${order.id}&method=${paymentMethod}`, {
      state: { order, items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })) },
    })
    setSubmitLoading(false)
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-brand-muted/30 bg-white/50 p-6 text-center">
        <p className="text-brand-foreground/80">Your cart is empty.</p>
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="mt-4 text-brand-primary hover:underline"
        >
          Browse menu
        </button>
      </div>
    )
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmitForm, onValidationFailed)} className="space-y-8">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-semibold text-brand-foreground">
                Review your order
              </h2>
              <ul className="divide-y divide-brand-muted/20 rounded-lg border border-brand-muted/30 bg-white/50">
                {items.map((item) => (
                  <li key={item.id}>
                    <CartItem {...item} />
                  </li>
                ))}
              </ul>
              <OrderTotalSummary subtotal={subtotal} deliveryFee={orderType === 'delivery' ? deliveryFee : 0} />
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-md bg-brand-primary px-4 py-3 font-medium text-white hover:bg-brand-primary-dark transition-colors"
            >
              Continue to details
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-brand-foreground/80 hover:text-brand-foreground text-sm"
            >
              Back to cart
            </button>

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
                    {...methods.register('name')}
                  />
                  {methods.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                      {methods.formState.errors.name.message}
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
                    {...methods.register('email')}
                  />
                  {methods.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                      {methods.formState.errors.email.message}
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
                    {...methods.register('phone')}
                  />
                  {methods.formState.errors.phone && (
                    <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                      {methods.formState.errors.phone.message}
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
                      {...methods.register('order_type')}
                      className="border-brand-muted text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-brand-foreground">Pickup</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="delivery"
                      {...methods.register('order_type')}
                      className="border-brand-muted text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-brand-foreground">Delivery</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="catering"
                      {...methods.register('order_type')}
                      className="border-brand-muted text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-brand-foreground">Catering</span>
                  </label>
                </div>
                {methods.formState.errors.order_type && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                    {methods.formState.errors.order_type.message}
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
                      {deliveryDistance} miles away — {formatCurrency(deliveryFee)} delivery fee
                    </p>
                  )}
                </div>
              )}

              {(orderType === 'pickup' || orderType === 'delivery') && (
                <div className="space-y-4">
                  <PickupHoursSummary orderType={orderType} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="pickup_date" className={labelClass}>
                        {orderType === 'delivery' ? 'Delivery date' : 'Pickup date'}
                      </label>
                      <input
                        id="pickup_date"
                        type="date"
                        className={inputClass}
                        min={todayStr()}
                        {...methods.register('pickup_date')}
                      />
                      {pickupNotAvailable && (
                        <p className="mt-1 text-sm text-amber-700" role="alert">
                          {orderType === 'delivery'
                            ? `Delivery is not available on ${pickupSlots?.dayName}. Please choose another date.`
                            : `Pickup is not available on ${pickupSlots?.dayName}. Please choose another date.`}
                        </p>
                      )}
                      {methods.formState.errors.pickup_date && (
                        <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                          {methods.formState.errors.pickup_date.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="pickup_time" className={labelClass}>
                        {orderType === 'delivery' ? 'Delivery time' : 'Pickup time'}
                      </label>
                      <input
                        id="pickup_time"
                        type="time"
                        className={inputClass}
                        min={pickupNotAvailable ? undefined : pickupSlots?.minTime}
                        max={pickupNotAvailable ? undefined : pickupSlots?.maxTime}
                        disabled={pickupNotAvailable}
                        {...methods.register('pickup_time')}
                      />
                      {pickupSlots && !pickupNotAvailable && (
                        <p className="mt-1 text-xs text-brand-foreground/60">
                          Available {pickupSlots.minTime}–{pickupSlots.maxTime}
                        </p>
                      )}
                      {methods.formState.errors.pickup_time && (
                        <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                          {methods.formState.errors.pickup_time.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showCatering && <CateringForm />}

              <div>
                <label htmlFor="notes" className={labelClass}>
                  Order notes (optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className={inputClass}
                  placeholder="Allergies, special requests..."
                  {...methods.register('notes')}
                />
                {methods.formState.errors.notes && (
                  <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                    {methods.formState.errors.notes.message}
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
                    Full amount charged securely via Stripe
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
                      <span>$</span> Cash App — $nickiydoll
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
                      <span>Z</span> Zelle — naomieb75@icloud.com
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
                      Cash — Exact change only
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-brand-muted/30 pt-4">
              <OrderTotalSummary
                subtotal={subtotal}
                deliveryFee={orderType === 'delivery' ? deliveryFee : 0}
              />
              <button
                type="submit"
                disabled={submitLoading || (orderType === 'delivery' && (deliveryFee == null || !!deliveryError || !pickupDate || !pickupTime))}
                className="mt-4 w-full rounded-md bg-brand-primary px-4 py-3 font-medium text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
              >
                {submitLoading ? 'Processing…' : `Place order — ${formatCurrency(orderTotal)}`}
              </button>
              {validationMessage && (
                <p className="mt-2 text-sm text-amber-700" role="alert">
                  {validationMessage}
                </p>
              )}
              {submitError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {submitError}
                </p>
              )}
            </div>
          </>
        )}
      </form>
    </FormProvider>
  )
}
