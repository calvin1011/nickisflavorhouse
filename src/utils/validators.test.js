import { describe, it, expect } from 'vitest'
import { checkoutSchema, cateringSchema, contactSchema, loginSchema, changePasswordSchema } from './validators'

describe('checkoutSchema', () => {
  const validPickup = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '5551234567',
    order_type: 'pickup',
    pickup_date: '2025-04-01',
    pickup_time: '14:00',
    notes: '',
  }

  it('accepts valid pickup order', () => {
    expect(checkoutSchema.parse(validPickup)).toEqual(validPickup)
  })

  it('rejects pickup without date and time', () => {
    expect(() =>
      checkoutSchema.parse({
        ...validPickup,
        pickup_date: '',
        pickup_time: '',
      })
    ).toThrow()
  })

  it('rejects invalid email', () => {
    expect(() =>
      checkoutSchema.parse({ ...validPickup, email: 'not-an-email' })
    ).toThrow()
  })

  it('rejects short phone', () => {
    expect(() =>
      checkoutSchema.parse({ ...validPickup, phone: '123' })
    ).toThrow()
  })

  const validCatering = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '5551234567',
    order_type: 'catering',
    notes: '',
    catering: {
      event_date: '2025-05-15',
      event_time: '18:00',
      event_location: '123 Main St',
      guest_count: 50,
      catering_notes: '',
    },
  }

  it('accepts valid catering order', () => {
    expect(checkoutSchema.parse(validCatering)).toEqual(validCatering)
  })

  it('rejects catering without catering details', () => {
    expect(() =>
      checkoutSchema.parse({
        name: 'Jane',
        email: 'j@x.com',
        phone: '5551234567',
        order_type: 'catering',
      })
    ).toThrow()
  })
})

describe('cateringSchema', () => {
  it('accepts valid catering details', () => {
    const data = {
      event_date: '2025-06-01',
      event_time: '12:00',
      event_location: 'Venue Name',
      guest_count: 25,
      catering_notes: 'Vegetarian options',
    }
    expect(cateringSchema.parse(data)).toEqual({ ...data, catering_notes: 'Vegetarian options' })
  })

  it('rejects guest_count below 1', () => {
    expect(() =>
      cateringSchema.parse({
        event_date: '2025-06-01',
        event_time: '12:00',
        event_location: 'Venue',
        guest_count: 0,
      })
    ).toThrow()
  })
})

describe('contactSchema', () => {
  it('accepts valid contact form', () => {
    const data = { name: 'Jane', email: 'j@x.com', message: 'Hello' }
    expect(contactSchema.parse(data)).toEqual(data)
  })

  it('rejects empty message', () => {
    expect(() =>
      contactSchema.parse({ name: 'Jane', email: 'j@x.com', message: '' })
    ).toThrow()
  })
})

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const data = { email: 'admin@example.com', password: 'secret123' }
    expect(loginSchema.parse(data)).toEqual(data)
  })

  it('rejects empty password', () => {
    expect(() =>
      loginSchema.parse({ email: 'a@b.com', password: '' })
    ).toThrow()
  })

  it('rejects invalid email', () => {
    expect(() =>
      loginSchema.parse({ email: 'not-email', password: 'pass' })
    ).toThrow()
  })
})

describe('changePasswordSchema', () => {
  it('accepts valid change password', () => {
    const data = {
      current_password: 'oldpass123',
      new_password: 'newpass123',
      confirm_password: 'newpass123',
    }
    expect(changePasswordSchema.parse(data)).toEqual(data)
  })

  it('rejects when new password and confirm do not match', () => {
    expect(() =>
      changePasswordSchema.parse({
        current_password: 'old',
        new_password: 'newpass123',
        confirm_password: 'otherpass',
      })
    ).toThrow()
  })

  it('rejects new password shorter than 8 characters', () => {
    expect(() =>
      changePasswordSchema.parse({
        current_password: 'oldpass123',
        new_password: 'short',
        confirm_password: 'short',
      })
    ).toThrow()
  })

  it('rejects when new password equals current password', () => {
    expect(() =>
      changePasswordSchema.parse({
        current_password: 'samepass123',
        new_password: 'samepass123',
        confirm_password: 'samepass123',
      })
    ).toThrow()
  })
})
