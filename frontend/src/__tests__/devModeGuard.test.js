import { describe, it, expect } from 'vitest';

describe('Environment Mode Gating & Route Protection', () => {
  const evaluateMode = (envConfig) => {
    const isProd =
      envConfig.VITE_DEV_MODE === 'false' ||
      envConfig.VITE_DEV_MODE === '0' ||
      envConfig.VITE_DEV_MODE === 'off' ||
      envConfig.MODE === 'prod' ||
      envConfig.MODE === 'production';

    const isDev = !isProd;
    return { isDev, isProd };
  };

  const getVisibleNavItems = (isDev, userRole) => {
    const nav = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'applications', label: 'Applications' },
      { id: 'helpdesk', label: 'Help Desk' },
      { id: 'annexures', label: 'Standard Annexures' },
    ];

    if (userRole === 'CO') {
      nav.push({ id: 'manage-aggregator', label: 'Manage Aggregators' });
    }

    if (isDev) {
      nav.push({ id: 'qa-dashboard', label: 'QA & TDD Test Lab' });
      nav.push({ id: 'test-flow', label: 'Workflow Simulator' });
    }

    return nav;
  };

  it('correctly identifies production mode when VITE_DEV_MODE="false"', () => {
    const { isDev, isProd } = evaluateMode({ VITE_DEV_MODE: 'false' });
    expect(isDev).toBe(false);
    expect(isProd).toBe(true);
  });

  it('correctly identifies development mode when VITE_DEV_MODE="true"', () => {
    const { isDev, isProd } = evaluateMode({ VITE_DEV_MODE: 'true' });
    expect(isDev).toBe(true);
    expect(isProd).toBe(false);
  });

  it('completely hides QA & TDD navigation links in production mode', () => {
    const prodNav = getVisibleNavItems(false, 'CO');
    const devNav = getVisibleNavItems(true, 'CO');

    expect(prodNav.some((item) => item.id === 'qa-dashboard')).toBe(false);
    expect(prodNav.some((item) => item.id === 'test-flow')).toBe(false);

    expect(devNav.some((item) => item.id === 'qa-dashboard')).toBe(true);
    expect(devNav.some((item) => item.id === 'test-flow')).toBe(true);
  });
});
