import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Segmented } from './Segmented';

function Harness() {
  const [v, setV] = useState<'ts' | 'dev'>('ts');
  return (
    <Segmented
      ariaLabel="글 종류"
      value={v}
      onChange={setV}
      items={[
        { value: 'ts', label: '트러블슈팅', count: 3 },
        { value: 'dev', label: '개발일지', count: 1 },
      ]}
    />
  );
}

describe('Segmented', () => {
  it('클릭 · 화살표로 바꾼다', async () => {
    render(<Harness />);
    expect(screen.getByRole('tablist', { name: '글 종류' })).toBeInTheDocument();
    const [ts, dev] = screen.getAllByRole('tab');
    expect(ts).toHaveAttribute('aria-selected', 'true');
    expect(ts).toHaveTextContent('트러블슈팅3');
    await userEvent.click(dev!);
    expect(dev).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}');
    expect(ts).toHaveAttribute('aria-selected', 'true');
    expect(ts).toHaveFocus();
    expect(dev).toHaveAttribute('tabindex', '-1');
  });
});
