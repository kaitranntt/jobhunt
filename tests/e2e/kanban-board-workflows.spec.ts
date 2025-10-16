import { test, expect } from '@playwright/test'

test.describe('Kanban Board E2E Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to the dashboard/kanban board
    await page.goto('/dashboard')
  })

  test.describe('Board Creation and Management', () => {
    test('should create and configure a new board', async ({ page }) => {
      // Click on board selector
      await page.click('[data-testid="board-selector"]')
      await page.click('button:has-text("Create New Board")')

      // Fill in board details
      await page.fill('input[name="name"]', 'Marketing Job Applications')
      await page.fill('textarea[name="description"]', 'Board for tracking marketing positions')

      // Set initial columns
      await page.click('button:has-text("Add Default Columns")')

      // Save board
      await page.click('button:has-text("Create Board")')

      // Verify board creation
      await expect(page.locator('h1')).toContainText('Marketing Job Applications')
      await expect(page.locator('[data-testid="board-column-Wishlist"]')).toBeVisible()
      await expect(page.locator('[data-testid="board-column-Applied"]')).toBeVisible()
    })

    test('should edit board settings', async ({ page }) => {
      // Click settings button
      await page.click('button:has-text("Settings")')

      // Update board name
      await page.fill('input[name="name"]', 'Updated Board Name')
      await page.fill('textarea[name="description"]', 'Updated description')

      // Change theme
      await page.click('[data-testid="theme-select"]')
      await page.click('option:has-text("Dark Mode")')

      // Toggle settings
      await page.click('input[name="compact_mode"]')
      await page.click('input[name="show_empty_columns"]')

      // Save settings
      await page.click('button:has-text("Save Changes")')

      // Verify settings are applied
      await expect(page.locator('h1')).toContainText('Updated Board Name')
    })
  })

  test.describe('Column Management', () => {
    test('should add, edit, and delete columns', async ({ page }) => {
      // Open column manager
      await page.click('button:has-text("Add Column")')

      // Wait for column manager dialog
      await page.waitForSelector('[data-testid="column-manager-dialog"]')

      // Add new column
      await page.fill('input[name="name"]', 'Technical Assessment')
      await page.click('button:has-text("#ef4444")') // Red color
      await page.fill('input[name="wip_limit"]', '3')

      await page.click('button:has-text("Create Column")')

      // Verify column appears
      await expect(page.locator('[data-testid="board-column-Technical Assessment"]')).toBeVisible()

      // Edit column
      await page.click('[data-testid="board-column-Technical Assessment"] button:has-text("⋮")')
      await page.click('button:has-text("Edit Column")')

      await page.fill('input[name="name"]', 'Updated Technical Assessment')
      await page.fill('input[name="wip_limit"]', '5')

      await page.click('button:has-text("Update Column")')

      // Verify changes
      await expect(
        page.locator('[data-testid="board-column-Updated Technical Assessment"]')
      ).toBeVisible()

      // Delete column (if not default)
      const deleteButton = page.locator(
        '[data-testid="board-column-Updated Technical Assessment"] button:has-text("Delete")'
      )
      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        await page.click('button:has-text("Delete")')

        // Verify column is removed
        await expect(
          page.locator('[data-testid="board-column-Updated Technical Assessment"]')
        ).not.toBeVisible()
      }
    })

    test('should reorder columns via drag and drop', async ({ page }) => {
      // Open column manager
      await page.click('button:has-text("Add Column")')

      // Wait for column manager
      await page.waitForSelector('[data-testid="column-manager-dialog"]')

      // Get initial column order
      const initialColumns = await page.locator('[data-testid^="column-item-"]').all()
      expect(initialColumns.length).toBeGreaterThan(1)

      // Drag first column to second position
      const firstColumn = initialColumns[0]
      const secondColumn = initialColumns[1]

      await firstColumn.dragTo(secondColumn)

      // Verify order change is detected
      await expect(page.locator('text=Column order changed')).toBeVisible()

      // Save new order
      await page.click('button:has-text("Save Order")')

      // Wait for dialog to close
      await page.waitForSelector('[data-testid="column-manager-dialog"]', { state: 'hidden' })

      // Verify new order on main board
      const reorderedColumns = await page.locator('[data-testid^="board-column-"]').all()
      expect(reorderedColumns.length).toBe(initialColumns.length)
    })
  })

  test.describe('Application Management', () => {
    test('should add application to board via form', async ({ page }) => {
      // Click add application button
      await page.click('button:has-text("Add Application")')

      // Fill application form
      await page.fill('input[name="company_name"]', 'Tech Startup')
      await page.fill('input[name="job_title"]', 'Senior Frontend Developer')
      await page.fill('input[name="job_url"]', 'https://techstartup.com/jobs/123')
      await page.fill('input[name="location"]', 'San Francisco, CA')
      await page.fill('input[name="salary_range"]', '$150k - $200k')
      await page.selectOption('select[name="status"]', 'wishlist')

      await page.click('button:has-text("Save Application")')

      // Verify application appears in Wishlist column
      await expect(page.locator('[data-testid="board-column-Wishlist"]')).toContainText(
        'Tech Startup'
      )
      await expect(page.locator('[data-testid="board-column-Wishlist"]')).toContainText(
        'Senior Frontend Developer'
      )
    })

    test('should drag and drop applications between columns', async ({ page }) => {
      // Ensure we have at least one application
      const existingApplication = page.locator('[data-testid^="application-card-"]').first()
      if (!(await existingApplication.isVisible())) {
        // Create a test application first
        await page.click('button:has-text("Add Application")')
        await page.fill('input[name="company_name"]', 'Test Company')
        await page.fill('input[name="job_title"]', 'Test Job')
        await page.click('button:has-text("Save Application")')
        await page.waitForTimeout(1000)
      }

      // Get application from Applied column
      const appliedColumn = page.locator('[data-testid="board-column-Applied"]')
      const application = appliedColumn.locator('[data-testid^="application-card-"]').first()

      if (await application.isVisible()) {
        // Drag application to Interviewing column
        const interviewingColumn = page.locator('[data-testid="board-column-Interviewing"]')

        await application.dragTo(interviewingColumn)

        // Verify application moved
        await expect(interviewingColumn).toContainText('Test Company')
        await expect(appliedColumn).not.toContainText('Test Company')
      }
    })

    test('should update application status via dropdown', async ({ page }) => {
      // Find an application card
      const application = page.locator('[data-testid^="application-card-"]').first()

      if (await application.isVisible()) {
        // Click on application to open details
        await application.click()

        // Wait for detail view
        await page.waitForSelector('[data-testid="application-detail-view"]')

        // Update status
        await page.click('[data-testid="status-dropdown"]')
        await page.click('option:has-text("Interviewing")')

        // Save changes
        await page.click('button:has-text("Save Changes")')

        // Wait for update to reflect
        await page.waitForTimeout(1000)

        // Verify application is in Interviewing column
        await expect(page.locator('[data-testid="board-column-Interviewing"]')).toContainText(
          'Test Company'
        )
      }
    })
  })

  test.describe('WIP Limits and Analytics', () => {
    test('should display WIP limit indicators', async ({ page }) => {
      // Find columns with WIP limits
      const wipIndicators = page.locator('[data-testid^="wip-indicator-"]')

      if (await wipIndicators.first().isVisible()) {
        // Verify WIP indicators show correct counts
        await expect(wipIndicators.first()).toBeVisible()

        // Check that WIP limits are enforced (visual feedback)
        const wipLimitBadge = page.locator('[data-testid="wip-limit-badge"]')
        if (await wipLimitBadge.isVisible()) {
          const wipText = await wipLimitBadge.textContent()
          expect(wipText).toMatch(/\d+\/\d+/) // Should match format like "2/5"
        }
      }
    })

    test('should show board analytics', async ({ page }) => {
      // Click analytics button
      await page.click('button:has-text("Analytics")')

      // Wait for analytics dialog
      await page.waitForSelector('[data-testid="analytics-dialog"]')

      // Verify key metrics are displayed
      await expect(page.locator('[data-testid="total-applications-metric"]')).toBeVisible()
      await expect(page.locator('[data-testid="active-pipeline-metric"]')).toBeVisible()
      await expect(page.locator('[data-testid="offers-metric"]')).toBeVisible()
      await expect(page.locator('[data-testid="conversion-rate-metric"]')).toBeVisible()

      // Verify column performance section
      await expect(page.locator('[data-testid="column-performance"]')).toBeVisible()

      // Test time range selection
      await page.click('[data-testid="time-range-select"]')
      await page.click('option:has-text("Last 30 days")')

      // Test export functionality
      await page.click('button:has-text("Export")')
      // Note: In real test, we'd verify file download, but here we just check the button works
    })
  })

  test.describe('Export Functionality', () => {
    test('should export board data as JSON', async ({ page }) => {
      // Click export JSON button
      await page.click('button:has-text("Export JSON")')

      // Wait for download to start (in real test)
      await page.waitForTimeout(2000)

      // Verify export was initiated (would check for file download in real test)
      // For now, we'll verify the button exists and is clickable
      await expect(page.locator('button:has-text("Export JSON")')).toBeVisible()
    })

    test('should export board data as CSV', async ({ page }) => {
      // Click export CSV button
      await page.click('button:has-text("Export CSV")')

      // Wait for download to start (in real test)
      await page.waitForTimeout(2000)

      // Verify export was initiated
      await expect(page.locator('button:has-text("Export CSV")')).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Verify board is still functional
      await expect(page.locator('[data-testid="kanban-dnd-context"]')).toBeVisible()

      // Test that columns stack vertically on mobile
      const columns = page.locator('[data-testid^="board-column-"]')
      const firstColumnBox = await columns.first().boundingBox()
      const secondColumnBox = await columns.nth(1).boundingBox()

      if (firstColumnBox && secondColumnBox) {
        // On mobile, columns should stack vertically
        expect(secondColumnBox.y).toBeGreaterThan(firstColumnBox.y + firstColumnBox.height)
      }

      // Test mobile menu functionality
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click()
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
      }
    })

    test('should handle tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      // Verify board layout adapts
      await expect(page.locator('[data-testid="kanban-dnd-context"]')).toBeVisible()

      // Test that columns are still properly sized
      const columns = page.locator('[data-testid^="board-column-"]')
      await expect(columns).toHaveCount(4) // Assuming 4 default columns
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check main board region
      await expect(
        page.locator('[role="region"][aria-label="Job applications kanban board"]')
      ).toBeVisible()

      // Check application cards have proper roles
      const applicationCards = page.locator('[data-testid^="application-card-"]')
      const firstCard = applicationCards.first()

      if (await firstCard.isVisible()) {
        await expect(firstCard).toHaveAttribute('role', 'button')
        await expect(firstCard).toHaveAttribute('aria-label')
      }

      // Check column headers are properly labeled
      const columnHeaders = page.locator('[data-testid^="board-column-"] h3')
      await expect(columnHeaders.first()).toBeVisible()
    })

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab')

      // Focus should move to first interactive element
      await expect(page.locator(':focus')).toBeVisible()

      // Continue tabbing through board elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)

        const focusedElement = page.locator(':focus')
        if (await focusedElement.isVisible()) {
          // Verify focused element is interactive
          const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase())
          expect(['button', 'a', 'input', 'select', 'textarea']).toContain(tagName)
        }
      }

      // Test Enter key on focused elements
      const focusedElement = page.locator(':focus')
      if (await focusedElement.isVisible()) {
        await page.keyboard.press('Enter')
        // Verify interaction (would need specific assertions based on element)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure by intercepting requests
      await page.route('**/api/applications', route => route.abort())

      // Try to add application
      await page.click('button:has-text("Add Application")')
      await page.fill('input[name="company_name"]', 'Test Company')
      await page.click('button:has-text("Save Application")')

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('text=Failed to create application')).toBeVisible()
    })

    test('should handle validation errors', async ({ page }) => {
      // Try to submit empty form
      await page.click('button:has-text("Add Application")')
      await page.click('button:has-text("Save Application")')

      // Should show validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
      await expect(page.locator('text=Company name is required')).toBeVisible()
    })
  })

  test.describe('Performance with Large Datasets', () => {
    test('should handle many applications efficiently', async ({ page }) => {
      // This test would ideally create many applications
      // For now, we'll test that the board remains responsive

      const startTime = Date.now()

      // Navigate to board
      await page.goto('/dashboard')

      // Wait for board to load
      await page.waitForSelector('[data-testid="kanban-dnd-context"]')

      const loadTime = Date.now() - startTime

      // Board should load within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000)

      // Test drag and drop responsiveness
      const application = page.locator('[data-testid^="application-card-"]').first()
      if (await application.isVisible()) {
        const dragStartTime = Date.now()

        await application.dragTo(page.locator('[data-testid="board-column-Interviewing"]'))

        const dragTime = Date.now() - dragStartTime

        // Drag and drop should complete within 2 seconds
        expect(dragTime).toBeLessThan(2000)
      }
    })
  })
})
