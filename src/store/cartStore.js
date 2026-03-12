import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * @typedef {Object} CartLineItem
 * @property {string} id - menu_items.id
 * @property {string} name
 * @property {number} price - cents per unit
 * @property {number} quantity
 * @property {string} [image_url]
 * @property {boolean} [is_catering]
 */

/**
 * @param {CartLineItem} item
 * @param {number} qty
 */
function clampQuantity(item, qty) {
  const min = 1
  const max = 99
  return Math.min(Math.max(Number(qty) || min, min), max)
}

export const useCartStore = create(
  persist(
    (set) => ({
      items: /** @type {CartLineItem[]} */ ([]),
      drawerOpen: false,

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          const qty = clampQuantity(item, existing ? existing.quantity + quantity : quantity)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: qty } : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: qty,
                image_url: item.image_url,
                is_catering: item.is_catering,
              },
            ],
          }
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id)
          if (!item) return state
          const qty = clampQuantity(item, quantity)
          if (qty <= 0) return { items: state.items.filter((i) => i.id !== id) }
          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, quantity: qty } : i
            ),
          }
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'nickis-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export function getCartSubtotal(state) {
  return state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}
