import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { contactSchema } from '@/utils/validators'

const inputClass =
  'mt-1 block w-full rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-brand-foreground shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
const labelClass = 'block text-sm font-medium text-brand-foreground'

export function Contact() {
  const [submitStatus, setSubmitStatus] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: { name: '', email: '', message: '' },
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data) => {
    setSubmitStatus(null)
    try {
      const res = await fetch(`${window.location.origin}/api/send-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitStatus({ type: 'error', message: json.error || 'Could not send message' })
        return
      }
      setSubmitStatus({ type: 'success', message: 'Message sent. We\'ll get back to you soon.' })
      reset()
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err.message || 'Network error' })
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-brand-foreground">
          Contact
        </h1>
        <p className="mt-4 text-brand-foreground/80">
          Have a question or want to place a custom order? Get in touch.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 rounded-lg border border-brand-muted/30 bg-white/50 p-6 space-y-4"
        >
          <div>
            <label htmlFor="contact-name" className={labelClass}>
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              autoComplete="name"
              className={inputClass}
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="contact-email" className={labelClass}>
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              autoComplete="email"
              className={inputClass}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="contact-message" className={labelClass}>
              Message
            </label>
            <textarea
              id="contact-message"
              rows={5}
              className={inputClass}
              {...register('message')}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.message.message}
              </p>
            )}
          </div>
          {submitStatus && (
            <p
              className={`text-sm ${submitStatus.type === 'success' ? 'text-green-700' : 'text-red-600'}`}
              role="alert"
            >
              {submitStatus.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  )
}
