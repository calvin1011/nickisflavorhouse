import { useState, useEffect } from 'react'
import { useAvailability, timeToInputValue } from '@/hooks/useAvailability'

export function AdminAvailability() {
  const { slotsByDay, loading, error, updateDay } = useAvailability()
  const [saving, setSaving] = useState(null)
  const [local, setLocal] = useState({})

  useEffect(() => {
    const next = {}
    for (const slot of slotsByDay) {
      next[slot.day_of_week] = {
        is_available: slot.is_available ?? true,
        min_time: timeToInputValue(slot.min_time) || '',
        max_time: timeToInputValue(slot.max_time) || '',
      }
    }
    setLocal(next)
  }, [slotsByDay])

  const handleSubmit = async (e, dayOfWeek) => {
    e.preventDefault()
    const values = local[dayOfWeek]
    if (!values) return
    setSaving(dayOfWeek)
    try {
      await updateDay(dayOfWeek, {
        is_available: values.is_available,
        min_time: values.is_available ? values.min_time : null,
        max_time: values.is_available ? values.max_time : null,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  const setLocalDay = (dayOfWeek, field, value) => {
    setLocal((prev) => ({
      ...prev,
      [dayOfWeek]: { ...prev[dayOfWeek], [field]: value },
    }))
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
          Set pickup hours for each day. Turn a day off to make it not available (no time needed).
          These times sync to the checkout so customers only see valid slots.
        </p>

        <div className="mt-8 space-y-4">
          {slotsByDay.map((slot) => {
            const values = local[slot.day_of_week] ?? {}
            const available = values.is_available !== false
            return (
              <section
                key={slot.day_of_week}
                className="rounded-lg border border-brand-muted/30 bg-white p-4"
              >
                <form
                  onSubmit={(e) => handleSubmit(e, slot.day_of_week)}
                  className="flex flex-wrap items-end gap-4"
                >
                  <div className="w-28 shrink-0">
                    <span className={labelClass}>{slot.day_name}</span>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        id={`available-${slot.day_of_week}`}
                        type="checkbox"
                        checked={available}
                        onChange={(e) =>
                          setLocalDay(slot.day_of_week, 'is_available', e.target.checked)
                        }
                        className="h-4 w-4 rounded border-brand-muted text-brand-primary focus:ring-brand-primary"
                      />
                      <label htmlFor={`available-${slot.day_of_week}`} className="text-sm">
                        Available
                      </label>
                    </div>
                  </div>
                  {available ? (
                    <>
                      <div>
                        <label
                          htmlFor={`min-${slot.day_of_week}`}
                          className={labelClass}
                        >
                          Earliest
                        </label>
                        <input
                          id={`min-${slot.day_of_week}`}
                          type="time"
                          className={inputClass}
                          value={values.min_time ?? ''}
                          onChange={(e) =>
                            setLocalDay(slot.day_of_week, 'min_time', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`max-${slot.day_of_week}`}
                          className={labelClass}
                        >
                          Latest
                        </label>
                        <input
                          id={`max-${slot.day_of_week}`}
                          type="time"
                          className={inputClass}
                          value={values.max_time ?? ''}
                          onChange={(e) =>
                            setLocalDay(slot.day_of_week, 'max_time', e.target.value)
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-brand-foreground/60">Not available</p>
                  )}
                  <button
                    type="submit"
                    disabled={saving === slot.day_of_week}
                    className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark disabled:opacity-50"
                  >
                    {saving === slot.day_of_week ? 'Saving…' : 'Save'}
                  </button>
                </form>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
