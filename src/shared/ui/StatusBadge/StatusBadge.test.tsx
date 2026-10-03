import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('색 · 아이콘 · 글자', () => {
    const { container } = render(<StatusBadge kind="judgment" status="FAIL" context="profile" />);
    expect(screen.getByText('미달 (경고)')).toHaveAttribute('data-tone', 'bad');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('모르는 값이면 아무것도 안 그린다', () => {
    const { container } = render(<StatusBadge kind="teamRole" role="MEMBER" />);
    expect(container).toBeEmptyDOMElement();
  });
});
