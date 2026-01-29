import { test, Page, Locator } from '@playwright/test';
import path from 'path';

type Language = 'en' | 'ja';

function getScreenshotDir(lang: Language) {
  return lang === 'en'
    ? path.join(__dirname, '../../../docs/guides/images')
    : path.join(__dirname, '../../../docs/ja/guides/images');
}

// Helper to take element screenshot with padding
async function elementScreenshot(
  element: Locator,
  category: string,
  name: string,
  lang: Language,
  padding = 100
) {
  const filePath = path.join(getScreenshotDir(lang), category, `${name}.png`);

  try {
    await element.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    console.log(`Element not found: ${category}/${name}`);
    return false;
  }

  const box = await element.boundingBox();
  if (!box) {
    console.log(`No bounding box for: ${category}/${name}`);
    return false;
  }

  const page = element.page();
  const viewport = page.viewportSize();

  const clip = {
    x: Math.max(0, box.x - padding),
    y: Math.max(0, box.y - padding),
    width: Math.min(box.width + padding * 2, (viewport?.width || 1440) - Math.max(0, box.x - padding)),
    height: Math.min(box.height + padding * 2, (viewport?.height || 900) - Math.max(0, box.y - padding)),
  };

  await page.screenshot({ path: filePath, clip });
  console.log(`Screenshot saved: ${filePath}`);
  return true;
}

async function screenshot(page: Page, category: string, name: string, lang: Language) {
  const filePath = path.join(getScreenshotDir(lang), category, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`Screenshot saved: ${filePath}`);
}

async function wait(page: Page, ms = 500) {
  await page.waitForTimeout(ms);
}

async function setLanguage(page: Page, lang: Language) {
  await page.evaluate((language) => {
    localStorage.setItem('sol-flow-language', language);
  }, lang);
}

async function skipOnboarding(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('sol-flow-onboarding-complete', 'true');
  });
  await page.reload();
  await wait(page, 1000);
}

async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await wait(page, 1000);
  try {
    await page.waitForSelector('.react-flow, header', { timeout: 15000 });
  } catch {
    console.log('Warning: Could not find react-flow or header');
  }
  await wait(page, 1000);
}

async function closeAllModals(page: Page) {
  // Press Escape multiple times to close any open modals
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Escape');
    await wait(page, 100);
  }
  await wait(page, 300);
}

// Create tests for both languages
for (const lang of ['en', 'ja'] as Language[]) {
  const langName = lang === 'en' ? 'English' : 'Japanese';

  test.describe(`Sol-Flow Screenshots (${langName})`, () => {
    test.setTimeout(180000); // Increase timeout for all the screenshots

    test('Landing Page', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Set language before navigating
      await page.goto('/');
      await setLanguage(page, lang);
      await page.reload();
      await wait(page, 2000);

      // Landing page hero
      await screenshot(page, 'landing', 'landing-hero', lang);

      // Get Started button
      const getStartedText = lang === 'en' ? 'Get Started' : '今すぐ始める';
      const getStartedBtn = page.locator(`button:has-text("${getStartedText}"), a:has-text("${getStartedText}")`).first();
      await elementScreenshot(getStartedBtn, 'landing', 'get-started-button', lang, 300);
    });

    test('All Features', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Set language before navigating
      await page.goto('/app');
      await setLanguage(page, lang);
      await skipOnboarding(page);
      await waitForPageReady(page);

      // === HEADER COMPONENTS ===
      const header = page.locator('header');
      await elementScreenshot(header, 'layout', 'header-overview', lang, 50);

      // Search bar
      const searchArea = page.locator('[data-tour="search"]');
      await elementScreenshot(searchArea, 'search', 'search-bar', lang, 200);

      // Search with results
      const searchInput = searchArea.locator('input');
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.click();
        await searchInput.fill('transfer');
        await wait(page, 500);
        await elementScreenshot(searchArea, 'search', 'search-results', lang, 250);
        await searchInput.clear();
        await page.keyboard.press('Escape');
      }

      // Import button
      await elementScreenshot(page.locator('[data-tour="import"]'), 'import', 'import-button', lang, 250);

      // Export dropdown
      const exportArea = page.locator('[data-tour="export"]');
      if (await exportArea.isVisible({ timeout: 2000 })) {
        await elementScreenshot(exportArea, 'export', 'export-button', lang, 250);
        await exportArea.locator('button').first().click();
        await wait(page, 300);
        await elementScreenshot(exportArea, 'export', 'export-menu', lang, 200);
        await page.keyboard.press('Escape');
      }

      // Layout toggle
      const layoutBtns = page.locator('header').locator('button[title*="Grid"], button[title*="Hierarchy"]').first();
      if (await layoutBtns.isVisible({ timeout: 2000 })) {
        const layoutArea = layoutBtns.locator('..');
        await elementScreenshot(layoutArea, 'layout', 'layout-toggle', lang, 250);
      }

      // === SIDEBAR ===
      const sidebar = page.locator('[data-tour="sidebar"]');
      await elementScreenshot(sidebar, 'sidebar', 'sidebar-overview', lang, 100);

      // Legend
      const legendBtn = sidebar.locator('button:has-text("Legend")');
      if (await legendBtn.isVisible({ timeout: 2000 })) {
        await legendBtn.click();
        await wait(page, 300);
        await elementScreenshot(legendBtn.locator('..'), 'sidebar', 'sidebar-legend', lang, 150);
      }

      // === CANVAS ===
      await screenshot(page, 'canvas', 'canvas-overview', lang);

      // Zoom controls
      const zoomControls = page.locator('.react-flow__controls');
      await elementScreenshot(zoomControls, 'canvas', 'zoom-controls', lang, 200);

      // === NODES - Individual node screenshots ===
      const nodesWithInternal = page.locator('.react-flow__node:has(button:has-text("Internal"))');
      const nodeCount = await nodesWithInternal.count();

      let targetNode = nodesWithInternal.first();
      if (nodeCount === 0) {
        targetNode = page.locator('.react-flow__node').first();
      }

      if (await targetNode.isVisible({ timeout: 5000 })) {
        const internalToggle = targetNode.locator('button:has-text("Internal")').first();

        // Collapse Internal/Private section first
        if (await internalToggle.isVisible({ timeout: 2000 })) {
          const chevronDown = internalToggle.locator('svg.lucide-chevron-down');
          if (await chevronDown.isVisible({ timeout: 500 })) {
            await internalToggle.evaluate((el) => (el as HTMLElement).click());
            await wait(page, 300);
          }
        }

        // Screenshot: collapsed node
        await elementScreenshot(targetNode, 'nodes', 'node-collapsed', lang, 20);

        // Expand Internal/Private section
        if (await internalToggle.isVisible({ timeout: 2000 })) {
          const chevronRight = internalToggle.locator('svg.lucide-chevron-right');
          if (await chevronRight.isVisible({ timeout: 500 })) {
            await internalToggle.evaluate((el) => (el as HTMLElement).click());
            await wait(page, 300);
          }
        }

        // Screenshot: expanded node
        await elementScreenshot(targetNode, 'nodes', 'node-expanded', lang, 20);

        // Screenshot: node header with detail button
        await elementScreenshot(targetNode, 'nodes', 'detail-button', lang, 20);

        // === FUNCTION FLOW - Multiple examples ===
        const functionItemCount = await targetNode.locator('.function-item').count();
        console.log(`Found ${functionItemCount} function items in node`);

        // Example 1: Click on transferFrom if available, otherwise first function
        const transferFromItem = targetNode.locator('.function-item:has-text("transferFrom")').first();
        const hasTransferFrom = await transferFromItem.isVisible({ timeout: 1000 });

        const firstFunctionItem = hasTransferFrom ? transferFromItem : targetNode.locator('.function-item').first();

        if (await firstFunctionItem.isVisible({ timeout: 2000 })) {
          console.log('Clicking function item (transferFrom or first)...');
          await firstFunctionItem.evaluate((el) => (el as HTMLElement).click());
          await wait(page, 800);

          const functionFlowModal = page.locator('.fixed.inset-0.z-50');
          const modalVisible = await functionFlowModal.isVisible({ timeout: 3000 });
          console.log(`Function flow modal visible: ${modalVisible}`);

          if (modalVisible) {
            // Screenshot: function flow modal - first example
            await screenshot(page, 'function-flow', 'function-flow-modal', lang);

            // Close the modal
            await page.keyboard.press('Escape');
            await wait(page, 500);
          }
        }

        // Example 2: Click on a different function - use the second function item
        const allFunctionItems = targetNode.locator('.function-item');
        const totalFunctions = await allFunctionItems.count();
        console.log(`Total functions in node: ${totalFunctions}`);

        if (totalFunctions >= 2) {
          // Get the second function item (index 1)
          const secondFunctionItem = allFunctionItems.nth(1);
          if (await secondFunctionItem.isVisible({ timeout: 1000 })) {
            console.log('Clicking second function item...');
            await secondFunctionItem.evaluate((el) => (el as HTMLElement).click());
            await wait(page, 800);

            const functionFlowModal2 = page.locator('.fixed.inset-0.z-50');
            if (await functionFlowModal2.isVisible({ timeout: 2000 })) {
              // Screenshot: function flow modal - second example
              await screenshot(page, 'function-flow', 'function-flow-modal-2', lang);

              await page.keyboard.press('Escape');
              await wait(page, 500);
            }
          }
        }

        // === CONTRACT DETAIL MODAL - All tabs ===
        const detailBtn = targetNode.locator('button[title="View contract details"]');
        if (await detailBtn.isVisible({ timeout: 2000 })) {
          await detailBtn.evaluate((el) => (el as HTMLElement).click());
          await wait(page, 500);

          // Screenshot: detail overview
          await screenshot(page, 'contract-detail', 'detail-overview', lang);

          // Wait a bit more for modal to fully render
          await wait(page, 500);

          // Tab buttons are in a flex container with "Variables", "Structs", etc.
          // Find buttons with tab text directly in the page
          const variablesTabDirect = page.locator('button:has-text("Variables")').first();
          const tabsVisible = await variablesTabDirect.isVisible({ timeout: 2000 });
          console.log(`Variables tab directly visible: ${tabsVisible}`);

          if (tabsVisible) {
            const tabCount = await page.locator('button:has-text("Variables"), button:has-text("Events"), button:has-text("Functions")').count();
            console.log(`Found ${tabCount} tab-like buttons`);

            // Variables tab - click it first using evaluate to bypass pointer interception
            await variablesTabDirect.evaluate((el) => (el as HTMLElement).click());
            await wait(page, 300);
            await screenshot(page, 'contract-detail', 'detail-variables', lang);

            // Structs tab
            const structsTab = page.locator('button:has-text("Structs")').first();
            if (await structsTab.isVisible({ timeout: 1000 })) {
              await structsTab.evaluate((el) => (el as HTMLElement).click());
              await wait(page, 300);
              await screenshot(page, 'contract-detail', 'detail-structs', lang);
            }

            // Events tab
            const eventsTab = page.locator('button:has-text("Events")').first();
            if (await eventsTab.isVisible({ timeout: 1000 })) {
              await eventsTab.evaluate((el) => (el as HTMLElement).click());
              await wait(page, 300);
              await screenshot(page, 'contract-detail', 'detail-events', lang);
            }

            // Errors tab
            const errorsTab = page.locator('button:has-text("Errors")').first();
            if (await errorsTab.isVisible({ timeout: 1000 })) {
              await errorsTab.evaluate((el) => (el as HTMLElement).click());
              await wait(page, 300);
              await screenshot(page, 'contract-detail', 'detail-errors', lang);
            }

            // Functions tab
            const functionsTab = page.locator('button:has-text("Functions")').first();
            if (await functionsTab.isVisible({ timeout: 1000 })) {
              await functionsTab.evaluate((el) => (el as HTMLElement).click());
              await wait(page, 300);
              await screenshot(page, 'contract-detail', 'detail-functions', lang);
            }

            // Source tab
            const sourceTab = page.locator('button:has-text("Source")').first();
            if (await sourceTab.isVisible({ timeout: 1000 })) {
              await sourceTab.evaluate((el) => (el as HTMLElement).click());
              await wait(page, 300);
              await screenshot(page, 'contract-detail', 'detail-source', lang);
            }
          } else {
            console.log('Tab container not found - Variables tab not visible');
          }

          // Close the modal
          await page.keyboard.press('Escape');
          await wait(page, 500);
          await closeAllModals(page);
        }
      }

      // Make sure all modals are closed
      await closeAllModals(page);
      await wait(page, 500);

      // === IMPORT MODAL ===
      const importBtn = page.locator('[data-tour="import"]');
      if (await importBtn.isVisible({ timeout: 2000 })) {
        await importBtn.evaluate((el) => (el as HTMLElement).click());
        await wait(page, 500);

        await screenshot(page, 'import', 'import-modal', lang);

        const dropZone = page.locator('.border-dashed');
        await elementScreenshot(dropZone, 'import', 'import-drag', lang, 150);
      }

      // Reload page to ensure clean state (modals were causing issues)
      await page.reload();
      await setLanguage(page, lang);
      await skipOnboarding(page);
      await waitForPageReady(page);

      // === EDGES - Click on a contract to highlight edges ===
      // Hide the sidebar using JavaScript
      await page.evaluate(() => {
        const sidebar = document.querySelector('[data-tour="sidebar"]');
        if (sidebar) (sidebar as HTMLElement).style.display = 'none';
      });
      await wait(page, 300);

      // Zoom in first to make nodes larger
      const zoomBtns = page.locator('.react-flow__controls button');
      for (let i = 0; i < await zoomBtns.count(); i++) {
        const btn = zoomBtns.nth(i);
        const title = await btn.getAttribute('title');
        if (title && (title.toLowerCase().includes('zoom in') || title === '+')) {
          for (let j = 0; j < 5; j++) {
            await btn.evaluate((el) => (el as HTMLElement).click());
            await wait(page, 100);
          }
          break;
        }
      }
      await wait(page, 500);

      // Find and click on Ownable or ERC20 node to highlight edges
      const edgeTargetNode = page.locator('.react-flow__node').filter({ hasText: /Ownable|ERC20/ }).first();

      if (await edgeTargetNode.isVisible({ timeout: 3000 })) {
        // Click to highlight the edges
        await edgeTargetNode.evaluate((el) => (el as HTMLElement).click());
        await wait(page, 1000);

        // Get the node position
        const box = await edgeTargetNode.boundingBox();
        if (box) {
          const viewport = page.viewportSize() || { width: 1440, height: 900 };

          // Calculate clip region centered on the node
          const clipWidth = 700;
          const clipHeight = 500;
          const clipX = Math.max(0, box.x + box.width / 2 - clipWidth / 2);
          const clipY = Math.max(0, box.y + box.height / 2 - clipHeight / 2);

          // Take screenshot with clip centered on the node
          const filePath = path.join(getScreenshotDir(lang), 'edges', 'edges-overview.png');
          await page.screenshot({
            path: filePath,
            clip: {
              x: clipX,
              y: clipY,
              width: Math.min(clipWidth, viewport.width - clipX),
              height: Math.min(clipHeight, viewport.height - clipY),
            },
          });
          console.log(`Screenshot saved: ${filePath}`);
        }
      } else {
        console.log('Target node not visible');
        await screenshot(page, 'edges', 'edges-overview', lang);
      }

      // === PROJECT MANAGER BUTTON ===
      // The Projects button has FolderOpen icon and "Projects" text
      const projectsBtn = page.locator('header button:has-text("Projects")');
      if (await projectsBtn.isVisible({ timeout: 2000 })) {
        await elementScreenshot(projectsBtn, 'projects', 'library-button', lang, 100);
        await projectsBtn.click();
        await wait(page, 500);

        // Screenshot: library/project list modal
        await screenshot(page, 'projects', 'library-list', lang);

        await closeAllModals(page);
      } else {
        // Fallback: try the project name button which also opens the manager
        const projectNameBtn = page.locator('header button').filter({ hasText: /OpenZeppelin|Contracts/ }).first();
        if (await projectNameBtn.isVisible({ timeout: 1000 })) {
          await elementScreenshot(projectNameBtn, 'projects', 'library-button', lang, 100);
          await projectNameBtn.click();
          await wait(page, 500);
          await screenshot(page, 'projects', 'library-list', lang);
          await closeAllModals(page);
        }
      }
    });

    test('Proxy Patterns', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Directly load the sample-uups library via localStorage
      await page.goto('/app');
      await page.evaluate(() => {
        localStorage.setItem('sol-flow-current-library', 'sample-uups');
      });
      await setLanguage(page, lang);
      await skipOnboarding(page);
      await page.reload();
      await waitForPageReady(page);
      await wait(page, 2000);

      // Check if UUPS sample loaded
      const uupsNode = page.locator('.react-flow__node').filter({ hasText: /Counter|UUPS|Proxy/ }).first();
      const uupsNodeVisible = await uupsNode.isVisible({ timeout: 5000 });
      console.log(`UUPS node visible: ${uupsNodeVisible}`);

      if (uupsNodeVisible) {
        // Fit view to show all nodes
        const fitViewBtn = page.locator('.react-flow__controls button[title*="fit"]').first();
        if (await fitViewBtn.isVisible({ timeout: 1000 })) {
          await fitViewBtn.evaluate((el) => (el as HTMLElement).click());
          await wait(page, 500);
        }

        // Screenshot: proxy pattern overview
        await screenshot(page, 'proxy-patterns', 'erc7546-overview', lang);

        // Screenshot: individual proxy node
        await elementScreenshot(uupsNode, 'proxy-patterns', 'erc7546-node', lang, 30);

        // Screenshot: proxy badge closeup - same as node but with smaller padding
        await elementScreenshot(uupsNode, 'proxy-patterns', 'erc7546-badge', lang, 15);
      } else {
        // Fallback: use OpenZeppelin and find proxy-related contracts
        console.log('UUPS sample not loaded, using OpenZeppelin');
        await page.evaluate(() => {
          localStorage.setItem('sol-flow-current-library', 'openzeppelin');
        });
        await page.reload();
        await waitForPageReady(page);
        await wait(page, 2000);

        // Find a proxy-related contract
        const proxyNode = page.locator('.react-flow__node').filter({ hasText: /Proxy|Upgradeable/ }).first();
        if (await proxyNode.isVisible({ timeout: 3000 })) {
          await screenshot(page, 'proxy-patterns', 'erc7546-overview', lang);
          await elementScreenshot(proxyNode, 'proxy-patterns', 'erc7546-node', lang, 30);
        } else {
          console.log('No proxy-related nodes found');
        }
      }
    });

    test('Edit Mode', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      await page.goto('/app');
      await setLanguage(page, lang);
      await skipOnboarding(page);
      await waitForPageReady(page);

      // Import a contract file to create a project (edit mode only works with imported projects)
      const importBtn = page.locator('[data-tour="import"]');
      if (await importBtn.isVisible({ timeout: 2000 })) {
        await importBtn.click();
        await wait(page, 500);

        // Set project name
        const projectNameInput = page.locator('input[placeholder*="project name"]');
        if (await projectNameInput.isVisible({ timeout: 1000 })) {
          await projectNameInput.fill('Screenshot Test');
        }

        // Use the hidden file input to upload our test contract
        const fileInput = page.locator('input[type="file"][accept=".sol"]');
        await fileInput.setInputFiles(path.join(__dirname, 'test-contract.sol'));
        await wait(page, 1000);

        // Click import button
        const importConfirmBtn = page.locator('button:has-text("Import")').last();
        if (await importConfirmBtn.isVisible({ timeout: 2000 })) {
          await importConfirmBtn.click();
          await wait(page, 3000); // Wait for import to complete
        }
      }

      await closeAllModals(page);
      await wait(page, 1000);

      // Find edit mode button (should be visible now that we have an imported project)
      const editBtn = page.locator('[data-tour="edit-mode"]');
      if (await editBtn.isVisible({ timeout: 3000 })) {
        // Screenshot: edit button (before clicking)
        await elementScreenshot(editBtn, 'edit-mode', 'edit-button', lang, 100);

        await editBtn.click();
        await wait(page, 500);

        // Screenshot: edit mode enabled (button should change)
        await elementScreenshot(editBtn, 'edit-mode', 'edit-mode-active', lang, 100);

        // Click edit button again to disable
        await editBtn.click();
        await wait(page, 300);
      } else {
        console.log('Edit mode button not visible after import');
      }
    });

    test('Mobile View', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      await page.goto('/app');
      await setLanguage(page, lang);
      await skipOnboarding(page);
      await waitForPageReady(page);

      await screenshot(page, 'mobile', 'mobile-overview', lang);

      const menuBtn = page.locator('button[title="Open Sidebar"]');
      if (await menuBtn.isVisible({ timeout: 2000 })) {
        await elementScreenshot(menuBtn, 'mobile', 'mobile-menu-button', lang, 120);

        await menuBtn.click();
        await wait(page, 500);

        const sidebar = page.locator('[data-tour="sidebar"]');
        await elementScreenshot(sidebar, 'mobile', 'mobile-sidebar', lang, 50);
      }
    });

    test('Onboarding', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      await page.goto('/app');
      await page.evaluate(() => localStorage.clear());
      await setLanguage(page, lang);
      await page.reload();
      await wait(page, 2000);

      const onboardingContent = page.locator('.fixed').first();
      await elementScreenshot(onboardingContent, 'landing', 'onboarding-welcome', lang, 10);

      // Click next button (Japanese: 次へ, English: Next)
      const nextBtnText = lang === 'ja' ? '次へ' : 'Next';
      const nextBtn = page.locator(`button:has-text("${nextBtnText}")`);
      if (await nextBtn.isVisible({ timeout: 2000 })) {
        await nextBtn.click();
        await wait(page, 500);
        await elementScreenshot(onboardingContent, 'landing', 'onboarding-step2', lang, 10);
      }
    });
  });
}
