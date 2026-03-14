import { Routes, Route, Navigate } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Contact } from '@/pages/Contact'
import { Menu } from '@/pages/Menu'
import { Checkout } from '@/pages/Checkout'
import { OrderConfirmation } from '@/pages/OrderConfirmation'
import { AdminLogin } from '@/pages/admin/AdminLogin'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminMenu } from '@/pages/admin/AdminMenu'
import { AdminOrders } from '@/pages/admin/AdminOrders'
import { AdminAnnouncements } from '@/pages/admin/AdminAnnouncements'
import { AdminReports } from '@/pages/admin/AdminReports'
import { AdminAccount } from '@/pages/admin/AdminAccount'
import { AdminPayouts } from '@/pages/admin/AdminPayouts'
import { AdminRoute } from '@/components/layout/AdminRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
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
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="account" element={<AdminAccount />} />
        </Route>
      </Routes>
      <CartDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  )
}

export default App
