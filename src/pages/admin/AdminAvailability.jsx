import { useState, useEffect } from 'react'
import { useAvailability } from '@/hooks/useAvailability'

export function AdminAvailability() {
  const { weekday, weekend, loading, error, updateSlot } = useAvailability()
  const [saving, setSaving] = useState(null)
  const [weekdayMin, setWeekdayMin] = useState('')
  const [weekdayMax, setWeekdayMax] = useState('')
  const [weekendMin, setWeekendMin] = useState('')
  const [weekendMax, setWeekendMax] = useState('')

  useEffect(() => {
    if (weekday) {
      setWeekdayMin(weekday.minTime)
      setWeekdayMax(weekday.maxTime)
    }
    if (weekend) {
      setWeekendMin(weekend.minTime)
      setWeekendMax(weekend.maxTime)
    }
  }, [weekday, weekend])

  const handleWeekdaySubmit = async (e) => {
    e.preventDefault()
    setSaving('weekday')
    try {
      await updateSlot('weekday', { min_time: weekdayMin, max_time: weekdayMax })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  const handleWeekendSubmit = async (e) => {
    e.preventDefault()
    setSaving('weekend')
    try {
      await updateSlot('weekend', { min_time: weekendMin, max_time: weekendMax })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-brand-foreground/70">Loading availability…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>Failed to load availability: {error.message}</p>
        </div>
      </div>
    )
  }

  const inputClass =
    'mt-1 block w-32 rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-sm text-brand-foreground focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
  const labelClass = 'block text-sm font-medium text-brand-foreground'

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-brand-foreground">
          Pickup availability
        </h1>
        <p className="mt-1 text-sm text-brand-foreground/70">
          Set when customers can choose pickup times. Weekday = Mon–Fri; Weekend = Sat–Sun. These
          times sync to the checkout form so customers only see valid slots.
        </p>

        <div className="mt-8 space-y-8">
          <section className="rounded-lg border border-brand-muted/30 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-brand-foreground">
              Weekdays (Mon–Fri)
            </h2>
            <p className="mt-1 text-sm text-brand-foreground/70">
              No pickups before the minimum time (e.g. 5:00 PM).
            </p>
            <form onSubmit={handleWeekdaySubmit} className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="weekday-min" className={labelClass}>
                  Earliest time
                </label>
                <input
                  id="weekday-min"
                  type="time"
                  className={inputClass}
                  value={weekdayMin}
                  onChange={(e) => setWeekdayMin(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="weekday-max" className={labelClass}>
                  Latest time
                </label>
                <input
                  id="weekday-max"
                  type="time"
                  className={inputClass}
                  value={weekdayMax}
                  onChange={(e) => setWeekdayMax(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={saving === 'weekday'}
                className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark disabled:opacity-50"
              >
                {saving === 'weekday' ? 'Saving…' : 'Save weekdays'}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-brand-muted/30 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-brand-foreground">
              Weekend (Sat–Sun)
            </h2>
            <p className="mt-1 text-sm text-brand-foreground/70">
              Set the time window for weekend pickups.
            </p>
            <form onSubmit={handleWeekendSubmit} className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="weekend-min" className={labelClass}>
                  Earliest time
                </label>
                <input
                  id="weekend-min"
                  type="time"
                  className={inputClass}
                  value={weekendMin}
                  onChange={(e) => setWeekendMin(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="weekend-max" className={labelClass}>
                  Latest time
                </label>
                <input
                  id="weekend-max"
                  type="time"
                  className={inputClass}
                  value={weekendMax}
                  onChange={(e) => setWeekendMax(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={saving === 'weekend'}
                className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark disabled:opacity-50"
              >
                {saving === 'weekend' ? 'Saving…' : 'Save weekend'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
