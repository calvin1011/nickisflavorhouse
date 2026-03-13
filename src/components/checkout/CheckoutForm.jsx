import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useCartStore, getCartSubtotal } from '@/store/cartStore'
import { checkoutSchema } from '@/utils/validators'
import { sanitizeOrder } from '@/lib/sanitize'
import { formatCurrency } from '@/utils/formatCurrency'
import { DepositSummary } from './DepositSummary'
import { CateringForm } from './CateringForm'
import { PaymentButton } from './PaymentButton'
import { CartItem } from '@/components/cart/CartItem'

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
  catering: {
    event_date: '',
    event_time: '',
    event_location: '',
    guest_count: 1,
    catering_notes: '',
  },
}

export function CheckoutForm() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const subtotalCents = useCartStore(getCartSubtotal)
  const hasCatering = items.some((i) => i.is_catering)

  const [step, setStep] = useState(1)

  const methods = useForm({
    defaultValues,
    resolver: zodResolver(checkoutSchema),
  })

  const orderType = methods.watch('order_type')
  const showCatering = orderType === 'catering' || hasCatering

  const onSubmit = () => {
    // Payment is handled by PaymentButton via handleSubmit(PaymentButton.onSubmit)
    // This is only called if form is invalid and submit is triggered elsewhere
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
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
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
              <DepositSummary subtotalCents={subtotalCents} />
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
                <label className={labelClass}>Order type</label>
                <div className="mt-2 flex gap-4">
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

              {orderType === 'pickup' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pickup_date" className={labelClass}>
                      Pickup date
                    </label>
                    <input
                      id="pickup_date"
                      type="date"
                      className={inputClass}
                      {...methods.register('pickup_date')}
                    />
                    {methods.formState.errors.pickup_date && (
                      <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                        {methods.formState.errors.pickup_date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="pickup_time" className={labelClass}>
                      Pickup time
                    </label>
                    <input
                      id="pickup_time"
                      type="time"
                      className={inputClass}
                      {...methods.register('pickup_time')}
                    />
                    {methods.formState.errors.pickup_time && (
                      <p className="mt-1 text-sm text-red-600" role="alert" data-field-error>
                        {methods.formState.errors.pickup_time.message}
                      </p>
                    )}
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

            <div className="border-t border-brand-muted/30 pt-4">
              <DepositSummary subtotalCents={subtotalCents} />
              <PaymentButton
                className="mt-4 w-full rounded-md bg-brand-primary px-4 py-3 font-medium text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
              >
                Pay Deposit
              </PaymentButton>
            </div>
          </>
        )}
      </form>
    </FormProvider>
  )
}
