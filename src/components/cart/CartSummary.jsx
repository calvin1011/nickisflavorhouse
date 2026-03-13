import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatCurrency'
import { calculateDeposit, calculateBalanceDue } from '@/utils/depositCalc'

/**
 * @param {{ subtotal: number; onClose?: () => void }} props - subtotal in dollars
 */
export function CartSummary({ subtotal, onClose }) {
  const deposit = calculateDeposit(subtotal)
  const balanceDue = calculateBalanceDue(subtotal, deposit)

  return (
    <div className="border-t border-brand-muted/30 bg-brand-background p-4">
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
      <Link
        to="/checkout"
        onClick={onClose}
        className="mt-4 flex w-full items-center justify-center rounded-md bg-brand-primary px-4 py-3 font-medium text-white hover:bg-brand-primary-dark transition-colors"
      >
        Proceed to Checkout
      </Link>
    </div>
  )
}
