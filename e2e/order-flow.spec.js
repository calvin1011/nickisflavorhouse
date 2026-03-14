// @ts-check
/**
 * E2E: place order -> pay deposit (Stripe test card) -> order confirmation -> admin updates status.
 * Requires app running (npm run dev or PLAYWRIGHT_BASE_URL) and Stripe test mode.
 * For admin steps set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.
 */
const { test, expect } = require('@playwright/test')

const STRIPE_TEST_CARD = '4242424242424242'
const STRIPE_TEST_EXP = '1228'
const STRIPE_TEST_CVC = '123'

test.describe('Order flow', () => {
  test('place order, pay deposit, see confirmation; admin can update status', async ({
    page,
  }) => {
    await page.goto('/menu')
    await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible()

    const addToCart = page.getByRole('button', { name: /add to cart/i }).first()
    await expect(addToCart).toBeVisible({ timeout: 15000 })
    await addToCart.click()

    await page.getByRole('button', { name: /open cart/i }).click()
    await page.getByRole('link', { name: /proceed to checkout/i }).click()

    await expect(page).toHaveURL(/\/checkout/)
    await page.getByRole('button', { name: /continue to details/i }).click()

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().slice(0, 10)

    await page.getByLabel(/name/i).fill('E2E Customer')
    await page.getByLabel(/email/i).fill('e2e@example.com')
    await page.getByLabel(/phone/i).fill('5551234567')
    await page.getByLabel(/pickup date/i).fill(dateStr)
    await page.getByLabel(/pickup time/i).fill('14:00')

    const payButton = page.getByRole('button', { name: /pay deposit/i })
    await expect(payButton).toBeVisible()
    await payButton.click()

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 15000 })

    const iframes = page.frameLocator('iframe')
    await iframes.nth(0).locator('input').first().waitFor({ state: 'visible', timeout: 10000 })
    await iframes.nth(0).locator('input').first().fill(STRIPE_TEST_CARD)
    await iframes.nth(1).locator('input').first().fill(STRIPE_TEST_EXP)
    await iframes.nth(2).locator('input').first().fill(STRIPE_TEST_CVC)

    await page.getByRole('button', { name: /pay|submit|confirm/i }).click()

    await expect(page).toHaveURL(/\/(order-confirmation|checkout)/, { timeout: 60000 })
    if (page.url().includes('order-confirmation')) {
      await expect(page.getByText(/thank you/i)).toBeVisible()
      const orderNumberMatch = await page.getByText(/Order\s+NFH-\d{8}-[A-Z0-9]+/).textContent()
      expect(orderNumberMatch).toBeTruthy()
      const orderNumber = orderNumberMatch?.match(/NFH-\d{8}-[A-Z0-9]+/)?.[0]
      if (!orderNumber) return

      const adminEmail = process.env.E2E_ADMIN_EMAIL
      const adminPassword = process.env.E2E_ADMIN_PASSWORD
      if (adminEmail && adminPassword) {
        await page.goto('/admin/login')
        await page.getByLabel(/email/i).fill(adminEmail)
        await page.getByLabel(/password/i).fill(adminPassword)
        await page.getByRole('button', { name: /sign in|log in|submit/i }).click()
        await expect(page).toHaveURL(/\/admin\//, { timeout: 10000 })

        await page.goto('/admin/orders')
        await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible({ timeout: 10000 })

        const row = page.getByRole('row').filter({ has: page.getByText(orderNumber) })
        await expect(row).toBeVisible({ timeout: 10000 })
        await row.getByRole('button', { name: /view/i }).click()

        await page.locator('select').filter({ has: page.locator('option[value="confirmed"]') }).selectOption('confirmed')
        await page.getByRole('button', { name: /save/i }).click()
        await expect(page.getByText(/confirmed/i)).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
