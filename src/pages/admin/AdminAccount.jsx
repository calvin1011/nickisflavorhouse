import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/useAuth'
import { changePasswordSchema } from '@/utils/validators'

const inputClass =
  'mt-1 block w-full rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-brand-foreground shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
const labelClass = 'block text-sm font-medium text-brand-foreground'

export function AdminAccount() {
  const { user, updatePassword } = useAuth()
  const [status, setStatus] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data) => {
    setStatus(null)
    try {
      await updatePassword(data.current_password, data.new_password)
      setStatus({ type: 'success', message: 'Password updated. Use your new password next time you sign in.' })
      reset()
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Could not update password' })
    }
  }

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold text-brand-foreground">
        Account
      </h1>
      <p className="mt-1 text-brand-foreground/70">
        Signed in as {user?.email ?? '—'}
      </p>

      <section className="mt-8 max-w-md">
        <h2 className="font-display text-lg font-semibold text-brand-foreground">
          Change password
        </h2>
        <p className="mt-1 text-sm text-brand-foreground/70">
          After changing your password, use the new password to sign in. No one else can see or change it without your current password.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 space-y-4 rounded-lg border border-brand-muted/30 bg-white/50 p-6"
        >
          <div>
            <label htmlFor="account-current-password" className={labelClass}>
              Current password
            </label>
            <input
              id="account-current-password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              {...register('current_password')}
            />
            {errors.current_password && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.current_password.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="account-new-password" className={labelClass}>
              New password
            </label>
            <input
              id="account-new-password"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              {...register('new_password')}
            />
            {errors.new_password && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.new_password.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="account-confirm-password" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="account-confirm-password"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              {...register('confirm_password')}
            />
            {errors.confirm_password && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.confirm_password.message}
              </p>
            )}
          </div>
          {status && (
            <p
              className={`text-sm ${status.type === 'success' ? 'text-green-700' : 'text-red-600'}`}
              role="alert"
            >
              {status.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-60"
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  )
}
