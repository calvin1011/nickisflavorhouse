const CASHAPP_URL = 'https://cash.app/$nickiydoll'

export default function PaymentLinks({ paymentMethod, subtotal }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.5rem',
        textAlign: 'center',
      }}
    >
      <h3
        style={{
          fontFamily: 'Playfair Display, serif',
          color: 'var(--color-primary)',
          fontSize: '1.2rem',
          marginBottom: '0.4rem',
        }}
      >
        You're almost done!
      </h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
        Please pay <strong>${Number(subtotal).toFixed(2)}</strong> at pickup using the method you selected
      </p>

      {paymentMethod === 'cashapp' && (
        <a
          href={CASHAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#00D632',
            color: '#fff',
            fontWeight: '700',
            fontSize: '1rem',
            padding: '0.875rem 2rem',
            borderRadius: '50px',
            textDecoration: 'none',
          }}
        >
          Open Cash App → $nickiydoll
        </a>
      )}

      {paymentMethod === 'zelle' && (
        <div>
          <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#6D1ED4' }}>
            Zelle to: naomieb75@icloud.com
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            Open your bank app and send via Zelle
          </p>
        </div>
      )}

      {paymentMethod === 'cash' && (
        <div
          style={{
            backgroundColor: '#fef9c3',
            border: '1px solid #fde047',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          <p style={{ fontWeight: '700', fontSize: '1rem', color: '#854d0e' }}>
            Please bring exact change: ${Number(subtotal).toFixed(2)}
          </p>
          <p style={{ color: '#92400e', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            We are unable to make change at pickup
          </p>
        </div>
      )}
    </div>
  )
}
