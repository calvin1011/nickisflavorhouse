import { useFormContext } from 'react-hook-form'

const inputClass =
  'mt-1 block w-full rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-brand-foreground shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'

const labelClass = 'block text-sm font-medium text-brand-foreground'

export function CateringForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div className="space-y-4 rounded-lg border border-brand-muted/30 bg-white/50 p-4">
      <h3 className="font-display text-lg font-semibold text-brand-foreground">
        Catering details
      </h3>
      <div>
        <label htmlFor="catering.event_date" className={labelClass}>
          Event date
        </label>
        <input
          id="catering.event_date"
          type="date"
          className={inputClass}
          {...register('catering.event_date')}
        />
        {errors.catering?.event_date && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.catering.event_date.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="catering.event_time" className={labelClass}>
          Event time
        </label>
        <input
          id="catering.event_time"
          type="time"
          className={inputClass}
          {...register('catering.event_time')}
        />
        {errors.catering?.event_time && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.catering.event_time.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="catering.event_location" className={labelClass}>
          Event location
        </label>
        <input
          id="catering.event_location"
          type="text"
          className={inputClass}
          placeholder="Address or venue name"
          {...register('catering.event_location')}
        />
        {errors.catering?.event_location && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.catering.event_location.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="catering.guest_count" className={labelClass}>
          Guest count
        </label>
        <input
          id="catering.guest_count"
          type="number"
          min={1}
          max={5000}
          className={inputClass}
          {...register('catering.guest_count', { valueAsNumber: true })}
        />
        {errors.catering?.guest_count && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.catering.guest_count.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="catering.catering_notes" className={labelClass}>
          Catering notes (optional)
        </label>
        <textarea
          id="catering.catering_notes"
          rows={3}
          className={inputClass}
          placeholder="Dietary needs, setup time, etc."
          {...register('catering.catering_notes')}
        />
        {errors.catering?.catering_notes && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.catering.catering_notes.message}
          </p>
        )}
      </div>
    </div>
  )
}
