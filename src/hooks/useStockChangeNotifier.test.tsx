import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStockChangeNotifier } from './useStockChangeNotifier';

// ─── 1) MOCKS ─────────────────────────────────────────────────────────────────────
// 1.1) Spy for `notify(...)`
const mockNotify = vi.fn();
vi.mock('../hooks/useCustomSnackbar', () => ({
  __esModule: true,
  useCustomSnackbar: () => ({ notify: mockNotify }),
}));

// 1.2) Stub out `react-i18next` so that `t()` returns obvious strings.
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (key.endsWith('removed_unavailable')) {
        return `removed:${opts.name}`;
      }
      if (key.endsWith('quantity_reduced')) {
        return `reduced:${opts.name}:${opts.count}`;
      }
      return key;
    },
  }),
}));

// ─── 2) HELPER COMPONENT ───────────────────────────────────────────────────────────
// We cast `{ id, name, quantity }` to `any` so that TypeScript won’t complain
// about missing fields. In real code, CartItem has other required properties,
// but for this test we only care about `id`, `name`, and `quantity`.
function TestComponent(props: { items: any[]; isReloading: boolean }) {
  useStockChangeNotifier(props.items as any, props.isReloading);
  return null;
}

// ─── 3) TEST SUITE ────────────────────────────────────────────────────────────────
describe('useStockChangeNotifier', () => {
  beforeEach(() => {
    mockNotify.mockReset();
  });

  it('does not notify when isReloading is false (initial mount)', () => {
    const initial = [{ id: '1', name: 'A', quantity: 2 }];
    render(<TestComponent items={initial} isReloading={false} />);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('notifies removal of unavailable item when isReloading turns true and item was removed', () => {
    const initial = [{ id: '1', name: 'A', quantity: 2 }];
    const { rerender } = render(
      <TestComponent items={initial} isReloading={false} />
    );
    expect(mockNotify).not.toHaveBeenCalled();

    // Now "reload" with an empty array:
    act(() => {
      rerender(<TestComponent items={[]} isReloading={true} />);
    });

    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith('removed:A', 'warning');
  });

  it('notifies quantity reduction when isReloading=true and quantity decreases', () => {
    const initial = [{ id: '2', name: 'B', quantity: 5 }];
    const { rerender } = render(
      <TestComponent items={initial} isReloading={false} />
    );
    expect(mockNotify).not.toHaveBeenCalled();

    // "Reload" with quantity dropping from 5 → 3
    act(() => {
      rerender(
        <TestComponent
          items={[{ id: '2', name: 'B', quantity: 3 }]}
          isReloading={true}
        />
      );
    });

    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith('reduced:B:3', 'warning');
  });

  it('does NOT notify when isReloading=true but quantity stays the same', () => {
    const initial = [{ id: '3', name: 'C', quantity: 4 }];
    const { rerender } = render(
      <TestComponent items={initial} isReloading={false} />
    );
    expect(mockNotify).not.toHaveBeenCalled();

    // Now "reload" with same quantity 4 → 4
    act(() => {
      rerender(
        <TestComponent
          items={[{ id: '3', name: 'C', quantity: 4 }]}
          isReloading={true}
        />
      );
    });

    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('handles multiple reloads correctly (remove + reduce + no-op)', () => {
    const initial = [
      { id: '1', name: 'A', quantity: 2 },
      { id: '2', name: 'B', quantity: 3 },
    ];
    const { rerender } = render(
      <TestComponent items={initial} isReloading={false} />
    );
    expect(mockNotify).not.toHaveBeenCalled();

    // First reload: remove A and reduce B from 3→1
    act(() => {
      rerender(
        <TestComponent
          items={[{ id: '2', name: 'B', quantity: 1 }]}
          isReloading={true}
        />
      );
    });
    expect(mockNotify).toHaveBeenCalledTimes(2);
    expect(mockNotify).toHaveBeenNthCalledWith(1, 'removed:A', 'warning');
    expect(mockNotify).toHaveBeenNthCalledWith(2, 'reduced:B:1', 'warning');

    mockNotify.mockClear();

    // After that, prevRef.current is [{ id:'2', name:'B', quantity:1 }].
    // Next reload: B goes 1→5 (an increase), so no notification.
    act(() => {
      rerender(
        <TestComponent
          items={[{ id: '2', name: 'B', quantity: 5 }]}
          isReloading={true}
        />
      );
    });
    expect(mockNotify).not.toHaveBeenCalled();
  });
});
