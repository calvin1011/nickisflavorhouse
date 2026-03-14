import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/formatCurrency'

/**
 * @param {{ subtotal: number; onClose?: () => void }} props - subtotal in dollars
 */
export function CartSummary({ subtotal, onClose }) {
  return (
    <div className="border-t border-brand-muted/30 bg-brand-background p-4">
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between pt-1 text-base">
          <dt className="font-medium text-brand-foreground/80">Order total</dt>
          <dd className="font-semibold text-brand-foreground">
            {formatCurrency(subtotal)}
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
