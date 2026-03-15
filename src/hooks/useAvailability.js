import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Format PostgreSQL time "HH:MM:SS" or "HH:MM" to "HH:mm" for input[type="time"] */
function timeToInputValue(t) {
  if (!t) return ''
  const s = String(t)
  const part = s.slice(0, 5)
  return part.length === 5 ? part : s
}

/** Format "HH:mm" for display (e.g. "17:00" -> "5:00 PM") */
function formatTimeForDisplay(t) {
  if (!t) return ''
  const [h, m] = String(t).slice(0, 5).split(':').map(Number)
  if (h === 0 && m === 0) return '12:00 AM'
  if (h === 23 && m === 59) return '11:59 PM'
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function useAvailability() {
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAvailability = useCallback(async () => {
    if (!supabase) {
      setError(new Error('Supabase client not configured'))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('pickup_availability_by_day')
        .select('id, day_of_week, is_available, min_time, max_time, updated_at')
        .order('day_of_week')

      if (fetchError) throw fetchError
      const byDay = {}
      for (const row of data ?? []) {
        byDay[row.day_of_week] = {
          id: row.id,
          day_of_week: row.day_of_week,
          day_name: DAY_NAMES[row.day_of_week],
          is_available: row.is_available,
          min_time: row.min_time,
          max_time: row.max_time,
          updated_at: row.updated_at,
        }
      }
      setAvailability(byDay)
    } catch (err) {
      setError(err)
      setAvailability(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  const updateDay = useCallback(
    async (dayOfWeek, { is_available, min_time, max_time }) => {
      if (!supabase || !availability?.[dayOfWeek]) return
      const slot = availability[dayOfWeek]
      const payload = {
        is_available: is_available ?? slot.is_available,
        updated_at: new Date().toISOString(),
      }
      if (payload.is_available) {
        payload.min_time = min_time ?? slot.min_time
        payload.max_time = max_time ?? slot.max_time
      } else {
        payload.min_time = null
        payload.max_time = null
      }
      const { error: updateError } = await supabase
        .from('pickup_availability_by_day')
        .update(payload)
        .eq('id', slot.id)
      if (updateError) throw updateError
      await fetchAvailability()
    },
    [availability, fetchAvailability]
  )

  const slotsByDay = availability
    ? DAY_NAMES.map((name, i) => ({
        day_of_week: i,
        day_name: name,
        ...availability[i],
      }))
    : []

  return {
    availability,
    byDay: availability,
    slotsByDay,
    loading,
    error,
    refetch: fetchAvailability,
    updateDay,
  }
}

/**
 * Get day of week (0-6) from date string YYYY-MM-DD.
 */
export function getDayOfWeek(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  return new Date(dateStr + 'T12:00:00').getDay()
}

/**
 * Get availability for a given date. byDay = hook's availability (keyed by day_of_week 0-6).
 * @returns {{ notAvailable: true } | { minTime: string, maxTime: string } | null}
 */
export function getAvailabilityForDate(dateStr, byDay) {
  if (!dateStr || !byDay) return null
  const dayOfWeek = getDayOfWeek(dateStr)
  if (dayOfWeek === null) return null
  const slot = byDay[dayOfWeek]
  if (!slot) return null
  if (!slot.is_available) return { notAvailable: true, dayName: slot.day_name }
  return {
    minTime: timeToInputValue(slot.min_time) || '00:00',
    maxTime: timeToInputValue(slot.max_time) || '23:59',
  }
}

/**
 * Human-readable summary of weekly pickup hours for customer-facing display.
 * @param {{ [day_of_week]: { day_name, is_available, min_time, max_time } }} byDay - from useAvailability().byDay
 */
export function formatPickupHoursSummary(byDay) {
  if (!byDay || typeof byDay !== 'object') return []
  return DAY_NAMES.map((name, i) => {
    const slot = byDay[i]
    if (!slot) return { day: name, text: '—' }
    if (!slot.is_available) return { day: name, text: 'Not available' }
    const min = timeToInputValue(slot.min_time)
    const max = timeToInputValue(slot.max_time)
    return {
      day: name,
      text: `${formatTimeForDisplay(min)} – ${formatTimeForDisplay(max)}`,
    }
  })
}

export { DAY_NAMES, timeToInputValue, formatTimeForDisplay }
