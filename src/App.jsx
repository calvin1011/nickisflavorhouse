import { Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Contact } from '@/pages/Contact'
import { Menu } from '@/pages/Menu'
import { Checkout } from '@/pages/Checkout'
import { OrderConfirmation } from '@/pages/OrderConfirmation'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { useCartStore } from '@/store/cartStore'

function App() {
  const drawerOpen = useCartStore((s) => s.drawerOpen)
  const closeDrawer = useCartStore((s) => s.closeDrawer)

  return (
    <>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-confirmation" element={<OrderConfirmation />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="*" element={<AdminDashboard />} />
      </Route>
    </Routes>
      <CartDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  )
}

export default App
