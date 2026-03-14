import { formatCurrency } from '@/utils/formatCurrency'

/**
 * Order total only (full payment upfront). subtotal in dollars.
 */
export function DepositSummary({ subtotal }) {
  return (
    <div className="rounded-lg border border-brand-muted/30 bg-brand-background p-4">
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between pt-1 text-base">
          <dt className="font-medium text-brand-foreground/80">Order total</dt>
          <dd className="font-semibold text-brand-foreground">
            {formatCurrency(subtotal)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
