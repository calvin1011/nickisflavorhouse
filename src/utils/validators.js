import { z } from 'zod'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use date format YYYY-MM-DD')
const timeString = z.string().min(1, 'Time is required')
const phoneString = z.string().min(10, 'Enter a valid phone number').max(20)

export const cateringSchema = z.object({
  event_date: dateString,
  event_time: timeString,
  event_location: z.string().min(1, 'Event location is required').max(500),
  guest_count: z.coerce.number().int().min(1, 'Guest count must be at least 1').max(5000),
  catering_notes: z.string().max(2000).optional().default(''),
})

export const checkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Enter a valid email'),
  phone: phoneString,
  order_type: z.enum(['pickup', 'catering'], { required_error: 'Select order type' }),
  pickup_date: dateString.optional(),
  pickup_time: timeString.optional(),
  notes: z.string().max(2000).optional().default(''),
  catering: cateringSchema.optional(),
}).refine(
  (data) => {
    if (data.order_type === 'pickup') {
      return !!data.pickup_date && !!data.pickup_time
    }
    return true
  },
  { message: 'Pickup date and time are required for pickup orders', path: ['pickup_date'] }
).refine(
  (data) => {
    if (data.order_type === 'catering') {
      return !!data.catering
    }
    return true
  },
  { message: 'Catering details are required for catering orders', path: ['catering'] }
)

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(1, 'Message is required').max(5000),
})
