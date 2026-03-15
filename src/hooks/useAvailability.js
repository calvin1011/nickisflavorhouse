import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/** Format PostgreSQL time "HH:MM:SS" or "HH:MM" to "HH:mm" for input[type="time"] */
function timeToInputValue(t) {
  if (!t) return ''
  const s = String(t)
  const part = s.slice(0, 5)
  return part.length === 5 ? part : s
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
        .from('pickup_availability')
        .select('id, day_type, min_time, max_time, updated_at')
        .order('day_type')

      if (fetchError) throw fetchError
      const byDay = {}
      for (const row of data ?? []) {
        byDay[row.day_type] = {
          id: row.id,
          day_type: row.day_type,
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

  const updateSlot = useCallback(
    async (dayType, { min_time, max_time }) => {
      if (!supabase || !availability?.[dayType]) return
      const slot = availability[dayType]
      const { error: updateError } = await supabase
        .from('pickup_availability')
        .update({
          min_time: min_time || slot.min_time,
          max_time: max_time ?? slot.max_time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slot.id)
      if (updateError) throw updateError
      await fetchAvailability()
    },
    [availability, fetchAvailability]
  )

  const weekday = availability?.weekday
    ? {
        minTime: timeToInputValue(availability.weekday.min_time),
        maxTime: timeToInputValue(availability.weekday.max_time),
      }
    : null
  const weekend = availability?.weekend
    ? {
        minTime: timeToInputValue(availability.weekend.min_time),
        maxTime: timeToInputValue(availability.weekend.max_time),
      }
    : null

  return {
    availability,
    weekday,
    weekend,
    loading,
    error,
    refetch: fetchAvailability,
    updateSlot,
  }
}

/**
 * Returns whether a given date (YYYY-MM-DD) is a weekend (Sat/Sun).
 * getDay(): 0 = Sun, 6 = Sat, 1-5 = Mon-Fri.
 */
export function isWeekend(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const day = new Date(dateStr + 'T12:00:00').getDay()
  return day === 0 || day === 6
}

/**
 * Get min/max time strings for an input[type="time"] for the given date.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {{ weekday: { minTime, maxTime }, weekend: { minTime, maxTime } }} availability - from useAvailability (weekday/weekend from hook)
 * @returns {{ minTime: string, maxTime: string } | null }
 */
export function getAvailabilityForDate(dateStr, weekday, weekend) {
  if (!dateStr || (!weekday && !weekend)) return null
  const slot = isWeekend(dateStr) ? weekend : weekday
  if (!slot) return null
  return { minTime: slot.minTime || '00:00', maxTime: slot.maxTime || '23:59' }
}
