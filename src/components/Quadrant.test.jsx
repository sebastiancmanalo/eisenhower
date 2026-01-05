import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Quadrant from './Quadrant.jsx';

describe('Quadrant Estimate Formatting', () => {
  it('should format estimateMinutesTotal as "1h 05m" for 65 minutes', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      urgent: true,
      important: true,
      estimateMinutesTotal: 65
    };

    render(
      <Quadrant
        title="Do First"
        subtitle="Urgent & Important"
        backgroundColor="var(--color-bg-q1)"
        tasks={[task]}
        onTaskClick={() => {}}
      />
    );

    const timeBadge = screen.getByText('1h 05m');
    expect(timeBadge).toBeInTheDocument();
  });

  it('should format estimateMinutesTotal as "30m" for 30 minutes', () => {
    const task = {
      id: '2',
      title: 'Test Task 2',
      urgent: false,
      important: true,
      estimateMinutesTotal: 30
    };

    render(
      <Quadrant
        title="Schedule"
        subtitle="Important, Not Urgent"
        backgroundColor="var(--color-bg-q2)"
        tasks={[task]}
        onTaskClick={() => {}}
      />
    );

    const timeBadge = screen.getByText('30m');
    expect(timeBadge).toBeInTheDocument();
  });

  it('should format estimateMinutesTotal as "2h" for 120 minutes (no minutes)', () => {
    const task = {
      id: '3',
      title: 'Test Task 3',
      urgent: true,
      important: false,
      estimateMinutesTotal: 120
    };

    render(
      <Quadrant
        title="Delegate"
        subtitle="Urgent, Not Important"
        backgroundColor="var(--color-bg-q3)"
        tasks={[task]}
        onTaskClick={() => {}}
      />
    );

    const timeBadge = screen.getByText('2h');
    expect(timeBadge).toBeInTheDocument();
  });
});


