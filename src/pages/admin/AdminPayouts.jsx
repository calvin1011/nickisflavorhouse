import { useState, useEffect } from 'react'
import { ExternalLink, Wallet } from 'lucide-react'
import { formatDollars } from '@/utils/formatCurrency'

export function AdminPayouts() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${window.location.origin}/api/payouts`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 500 ? 'Failed to load payouts' : res.statusText)
        return res.json()
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-brand-foreground">Payouts</h1>
        <p className="mt-4 text-brand-foreground/70">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-brand-foreground">Payouts</h1>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>{error.message}</p>
        </div>
        <p className="mt-4 text-sm text-brand-foreground/70">
          You can still open Stripe to view balance and withdraw:{' '}
          <a
            href="https://dashboard.stripe.com/payouts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-primary underline"
          >
            Stripe Payouts
          </a>
        </p>
      </div>
    )
  }

  const availableDollars = (data?.balance?.available_cents ?? 0) / 100
  const pendingDollars = (data?.balance?.pending_cents ?? 0) / 100
  const payouts = data?.payouts ?? []
  const dashboardUrl = data?.dashboard_url ?? 'https://dashboard.stripe.com/payouts'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-brand-foreground">
          Payouts
        </h1>
        <p className="mt-1 text-sm text-brand-foreground/70">
          Stripe balance and recent payouts. Withdraw funds and manage bank settings in Stripe.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-brand-muted/30 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-brand-foreground/70">
            <Wallet className="h-4 w-4" />
            Available balance
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-foreground">
            {formatDollars(availableDollars)}
          </p>
          <p className="mt-1 text-xs text-brand-foreground/60">
            Ready to pay out to your bank
          </p>
        </div>
        <div className="rounded-lg border border-brand-muted/30 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-brand-foreground/70">
            Pending balance
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-foreground">
            {formatDollars(pendingDollars)}
          </p>
          <p className="mt-1 text-xs text-brand-foreground/60">
            Funds not yet available (e.g. from recent charges)
          </p>
        </div>
      </div>

      <div className="mb-6">
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors"
        >
          View payouts and withdraw in Stripe
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-brand-foreground">
          Recent payouts
        </h2>
        <p className="mt-1 text-sm text-brand-foreground/70">
          Last 10 payouts. Full history in Stripe Dashboard.
        </p>
        {payouts.length === 0 ? (
          <p className="mt-4 rounded-lg border border-brand-muted/30 bg-white py-8 text-center text-sm text-brand-foreground/70">
            No payouts yet
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-brand-muted/30 bg-white">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-muted/30 bg-brand-muted/10">
                  <th className="px-4 py-3 font-medium text-brand-foreground">Date</th>
                  <th className="px-4 py-3 font-medium text-brand-foreground text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-brand-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-brand-muted/20 last:border-0"
                  >
                    <td className="px-4 py-3 text-brand-foreground/90">
                      {p.arrival_date
                        ? new Date(p.arrival_date * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : p.created
                          ? new Date(p.created * 1000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-brand-foreground/90">
                      {formatDollars((p.amount_cents ?? 0) / 100)}
                    </td>
                    <td className="px-4 py-3 text-brand-foreground/80 capitalize">
                      {p.status ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
