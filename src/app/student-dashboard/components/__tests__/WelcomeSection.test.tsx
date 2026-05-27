/**
 * WelcomeSection.tsx — component testlar.
 *
 * - userName ko'rsatiladi
 * - stats raqamlari to'g'ri render
 * - streak rang darajalari (0 / 1-6 / 7-29 / 30+)
 * - "Mahoratli o'quvchi" badge faqat 30+ uchun
 * - cold-start (enrolledCount=0) → "birinchi kursingizni boshlang" matni
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WelcomeSection from '../WelcomeSection';

function makeStats(overrides: Partial<{
  coursesCompleted: number;
  certificatesEarned: number;
  streakCurrent: number;
  streakLongest: number;
  activeToday: boolean;
  enrolledCount: number;
}> = {}) {
  return {
    coursesCompleted: overrides.coursesCompleted ?? 0,
    certificatesEarned: overrides.certificatesEarned ?? 0,
    streak: {
      current: overrides.streakCurrent ?? 0,
      longest: overrides.streakLongest ?? 0,
      activeToday: overrides.activeToday ?? false,
    },
    enrolledCount: overrides.enrolledCount,
  };
}

describe('WelcomeSection', () => {
  it('userName matnida ko\'rsatiladi', () => {
    render(<WelcomeSection userName="Aziz" stats={makeStats()} />);
    expect(screen.getByText(/Xush kelibsiz, Aziz/i)).toBeInTheDocument();
  });

  it('cold start (enrolledCount=0) → "birinchi kursingizni boshlang" matni', () => {
    render(
      <WelcomeSection
        userName="Aziz"
        stats={makeStats({ enrolledCount: 0 })}
      />,
    );
    expect(screen.getByText(/birinchi kursingizni boshlang/i)).toBeInTheDocument();
  });

  it('streak.current=0 → fire emoji ko\'rsatilmaydi, badge yo\'q', () => {
    const { container } = render(
      <WelcomeSection userName="Aziz" stats={makeStats({ streakCurrent: 0 })} />,
    );
    expect(container.textContent).not.toContain('🔥');
    expect(screen.queryByText(/Mahoratli o'quvchi/i)).not.toBeInTheDocument();
  });

  it('streak.current=5 (1-6 oraliq) → fire emoji, badge yo\'q', () => {
    const { container } = render(
      <WelcomeSection
        userName="Aziz"
        stats={makeStats({ streakCurrent: 5, streakLongest: 5 })}
      />,
    );
    expect(container.textContent).toContain('🔥');
    expect(screen.queryByText(/Mahoratli o'quvchi/i)).not.toBeInTheDocument();
  });

  it('streak.current=30+ → "Mahoratli o\'quvchi" badge ko\'rinadi', () => {
    render(
      <WelcomeSection
        userName="Aziz"
        stats={makeStats({ streakCurrent: 42, streakLongest: 42 })}
      />,
    );
    expect(screen.getByText(/Mahoratli o'quvchi/i)).toBeInTheDocument();
  });

  it('stats raqamlari to\'g\'ri ko\'rsatiladi (coursesCompleted, certificatesEarned, streak)', () => {
    const { container } = render(
      <WelcomeSection
        userName="Aziz"
        stats={makeStats({
          coursesCompleted: 7,
          certificatesEarned: 3,
          streakCurrent: 12,
          streakLongest: 15,
        })}
      />,
    );
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    // streak — emoji + 12 raqami bir blokda
    expect(container.textContent).toContain('🔥');
    expect(container.textContent).toContain('12');
    expect(container.textContent).toContain('Eng uzun: 15 kun');
  });
});
