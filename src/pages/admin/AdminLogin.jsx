import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema } from '@/utils/validators'

const inputClass =
  'mt-1 block w-full rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-brand-foreground shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
const labelClass = 'block text-sm font-medium text-brand-foreground'

export function AdminLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, initialized, signIn } = useAuth()
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (initialized && isAuthenticated) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [initialized, isAuthenticated, navigate])

  const onSubmit = async (data) => {
    setError(null)
    try {
      await signIn(data.email, data.password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed')
    }
  }

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-background">
        <p className="text-brand-foreground/70">Loading…</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-brand-foreground">
          Admin sign in
        </h1>
        <p className="mt-1 text-sm text-brand-foreground/70">
          Sign in to manage orders and menu.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 rounded-lg border border-brand-muted/30 bg-white/50 p-6"
        >
          <div>
            <label htmlFor="admin-email" className={labelClass}>
              Email
            </label>
            <input
              id="admin-email"
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
            <label htmlFor="admin-password" className={labelClass}>
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
