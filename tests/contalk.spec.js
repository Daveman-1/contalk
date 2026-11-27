const { test, expect } = require('@playwright/test');

const ROUTES = [
  { path: '/', title: 'ConTalk — Chat Anonymously, Post & Meet Strangers' },
  { path: '/feed', title: 'Live Feed | ConTalk' },
  { path: '/browse', title: 'Direct Messages | ConTalk' },
  { path: '/rooms', title: 'Chat Rooms | ConTalk' },
  { path: '/random', title: 'Random Chat | ConTalk' },
  { path: '/login', title: 'Sign In | ConTalk' },
  { path: '/signup', title: 'Create Account | ConTalk' },
];

async function bypassSafetyGate(page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ct_safety_verified_v1',
      JSON.stringify({
        age: true,
        consent: true,
        captcha: true,
        timestamp: new Date().toISOString(),
      })
    );
  });
}

test.describe('ConTalk audit verification', () => {
  test('1. Viewport does not block pinch-zoom (WCAG 1.4.4)', async ({ request }) => {
    for (const route of ROUTES) {
      const res = await request.get(route.path);
      expect(res.status(), `GET ${route.path}`).toBe(200);
      const html = await res.text();
      const vpMatch = html.match(/<meta\s+name="viewport"\s+content="([^"]+)"/i);
      expect(vpMatch, `viewport tag on ${route.path}`).toBeTruthy();
      const vp = vpMatch[1];
      expect(vp).toContain('width=device-width');
      expect(vp).toContain('initial-scale=1');
      expect(vp).not.toMatch(/maximum-scale\s*=\s*1(\b|$)/i);
      expect(vp).not.toMatch(/user-scalable\s*=\s*no/i);
    }
  });

  test('2. Every route has its own server-rendered unique title and meta description', async ({ request }) => {
    const seenTitles = new Set();
    const seenDescriptions = new Set();

    for (const route of ROUTES) {
      const res = await request.get(route.path);
      expect(res.status()).toBe(200);
      const html = await res.text();

      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      expect(titleMatch, `<title> on ${route.path}`).toBeTruthy();
      const decodedTitle = titleMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'");
      expect(decodedTitle).toBe(route.title);
      seenTitles.add(decodedTitle);

      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      expect(descMatch, `<meta name="description"> on ${route.path}`).toBeTruthy();
      expect(descMatch[1].trim().length).toBeGreaterThan(20);
      seenDescriptions.add(descMatch[1].trim());
    }

    expect(seenTitles.size).toBe(ROUTES.length);
    expect(seenDescriptions.size).toBe(ROUTES.length);
  });

  test('3. Rooms count matches loaded rooms and includes all sidebar favorites', async ({ page }) => {
    await bypassSafetyGate(page);
    await page.goto('/rooms');

    // Wait for rooms to finish loading from /api/rooms
    await expect(page.getByRole('button', { name: /#general\s+General Lobby/i })).toBeVisible();
    await expect(page.getByText('No rooms match')).toHaveCount(0);

    // Confirm all 4 sidebar pinned rooms appear in the loaded channel list
    for (const name of ['General Lobby', 'Tech & Coding', 'Gaming', 'Confessions']) {
      await expect(page.getByText(name).first()).toBeVisible();
    }

    // Confirm Channels counter matches the real room list from /api/rooms
    const apiRes = await page.request.get('/api/rooms');
    const apiData = await apiRes.json();
    const realCount = apiData.rooms.length;
    expect(realCount).toBeGreaterThanOrEqual(4);

    const channelsRow = page.locator('div', { hasText: /^Channels/ }).first();
    await expect(channelsRow).toContainText(String(realCount));

    // Confirm "No rooms match" appears only when a search genuinely matches nothing
    const searchInput = page.getByPlaceholder('Search rooms...').first();
    await searchInput.fill('zzznonexistentroom123');
    await expect(page.getByText(/No rooms match/i)).toBeVisible();
  });

  test('4 & 6. Random Chat sentence is complete, CTA starts disabled until both options chosen, and no unbacked Human Verified claim', async ({ page }) => {
    await bypassSafetyGate(page);
    await page.addInitScript(() => {
      localStorage.removeItem('ct_gender');
      localStorage.removeItem('ct_looking_for');
    });

    await page.goto('/random');

    // Sentence should never be blank before period ("as .")
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/match with as\s*\./i);
    expect(bodyText).not.toContain('Human Verified');
    await expect(page.getByText(/18\+ Self-Confirmed/i)).toBeVisible();

    // Button starts disabled with "Select your options to start"
    const startBtn = page.getByRole('button', { name: 'Select your options to start' });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeDisabled();

    // Selecting only "I am" keeps button disabled
    await page.getByRole('button', { name: 'Male', exact: true }).first().click();
    await expect(startBtn).toBeDisabled();

    // Selecting "Match me with" enables button with chosen label
    await page.getByRole('button', { name: /Female/i }).last().click();
    const readyBtn = page.getByRole('button', { name: /Start Chat with Female/i });
    await expect(readyBtn).toBeEnabled();
  });

  test('5. Footer links exist across pages and all legal/safety pages return 200', async ({ page, request }) => {
    for (const legalPath of ['/terms', '/privacy', '/guidelines']) {
      const res = await request.get(legalPath);
      expect(res.status(), `GET ${legalPath}`).toBe(200);
    }

    await bypassSafetyGate(page);
    for (const routePath of ['/', '/feed', '/browse', '/rooms', '/random', '/login', '/signup']) {
      await page.goto(routePath);
      const footer = page.locator('footer').first();
      await expect(footer, `footer on ${routePath}`).toBeVisible();
      await expect(footer.locator('a[href="/terms"]')).toBeVisible();
      await expect(footer.locator('a[href="/privacy"]')).toBeVisible();
      await expect(footer.locator('a[href="/guidelines"]')).toBeVisible();
      await expect(footer.locator('a[href="/guidelines#safety"]')).toBeVisible();
    }
  });

  test('7 & 9. Signup consent links open in new tab with rel=noopener, submit stays disabled until verified, and Login has Forgot password?', async ({ page }) => {
    await page.goto('/signup');

    for (const href of ['/guidelines', '/terms', '/privacy']) {
      const link = page.locator(`form a[href="${href}"]`).first();
      await expect(link, `consent link ${href}`).toBeVisible();
      await expect(link).toHaveAttribute('target', '_blank');
      const rel = await link.getAttribute('rel');
      expect(rel || '').toContain('noopener');
    }

    const submitBtn = page.getByRole('button', { name: 'Create Account' });
    await expect(submitBtn).toBeDisabled();

    await page.goto('/login');
    const forgotBtn = page.getByRole('button', { name: 'Forgot password?' });
    await expect(forgotBtn).toBeVisible();
    await forgotBtn.click();
    await expect(page.getByText(/Password reset isn't available yet/i)).toBeVisible();
  });
});
