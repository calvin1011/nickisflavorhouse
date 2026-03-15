import { z } from 'zod'

const dateString = z
  .string()
  .min(1, 'Pick a date')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date')
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
  order_type: z.enum(['pickup', 'delivery', 'catering'], { required_error: 'Select order type' }),
  pickup_date: dateString.optional(),
  pickup_time: timeString.optional(),
  notes: z.string().max(2000).optional().default(''),
  catering: cateringSchema.optional(),
}).refine(
  (data) => {
    if (data.order_type === 'pickup' || data.order_type === 'delivery') {
      return !!data.pickup_date && !!data.pickup_time
    }
    return true
  },
  { message: 'Date and time are required', path: ['pickup_date'] }
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

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500),
  description: z.string().max(2000).optional().default(''),
  category_id: z.string().uuid('Select a category'),
  price: z.coerce.number().int().min(0, 'Price must be 0 or more'),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
  is_catering: z.boolean().optional().default(false),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
  min_price: z.coerce.number().int().min(0).optional().nullable(),
  max_price: z.coerce.number().int().min(0).optional().nullable(),
})

const minPasswordLength = 8
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(minPasswordLength, `New password must be at least ${minPasswordLength} characters`),
    confirm_password: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'New passwords do not match',
    path: ['confirm_password'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
  })
