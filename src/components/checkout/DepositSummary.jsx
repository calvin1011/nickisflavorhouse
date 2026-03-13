import { formatCurrency } from '@/utils/formatCurrency'
import { calculateDeposit, calculateBalanceDue } from '@/utils/depositCalc'

/**
 * @param {{ subtotal: number }} props - subtotal in dollars
 */
export function DepositSummary({ subtotal }) {
  const deposit = calculateDeposit(subtotal)
  const balanceDue = calculateBalanceDue(subtotal, deposit)

  return (
    <div className="rounded-lg border border-brand-muted/30 bg-brand-background p-4">
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-brand-foreground/80">Subtotal</dt>
          <dd className="font-medium text-brand-foreground">
            {formatCurrency(subtotal)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-brand-foreground/80">Deposit (50%)</dt>
          <dd className="font-medium text-brand-foreground">
            {formatCurrency(deposit)}
          </dd>
        </div>
        <div className="flex justify-between pt-2 text-base">
          <dt className="font-medium text-brand-foreground/80">Balance due at pickup</dt>
          <dd className="font-semibold text-brand-foreground">
            {formatCurrency(balanceDue)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
