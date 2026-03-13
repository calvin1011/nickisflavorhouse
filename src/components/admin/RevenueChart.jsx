import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function formatAxisDollars(value) {
  if (value >= 1000) return `$${value / 1000}k`
  return `$${value}`
}

export function RevenueChart({ data, title = 'Revenue over time' }) {
  if (!data?.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-brand-muted/30 bg-white text-sm text-brand-foreground/70">
        No data for this range.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-brand-muted/30 bg-white p-4">
      {title && (
        <h3 className="mb-4 font-medium text-brand-foreground">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-brand-muted/30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'var(--brand-foreground)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatAxisDollars}
            tick={{ fontSize: 12, fill: 'var(--brand-foreground)' }}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--brand-muted)',
            }}
          />
          <Bar
            dataKey="revenue"
            fill="var(--brand-primary)"
            radius={[4, 4, 0, 0]}
            name="Revenue"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
