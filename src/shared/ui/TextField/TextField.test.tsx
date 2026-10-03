import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { TextArea } from '../TextArea';
import { TextField } from './TextField';

describe('TextField', () => {
  it('라벨 연결 · 필수 표시 · 선택 문구', () => {
    render(
      <>
        <TextField label="제목" required />
        <TextField label="관련 커밋" optionalLabel="선택" />
      </>,
    );
    const title = screen.getByLabelText(/제목/);
    expect(title).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('선택')).toBeInTheDocument();
    expect(screen.getByLabelText(/관련 커밋/)).not.toHaveAttribute('aria-required');
  });

  it('오류 · 도움말을 aria-describedby로 묶는다', () => {
    render(<TextField label="제목" hint="50자까지 쓸 수 있어요." error="제목을 입력해 주세요." />);
    const input = screen.getByRole('textbox', { name: '제목' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/제목을 입력해 주세요\..*50자까지 쓸 수 있어요\./);
  });

  it('글자 수 n/max (비제어)', async () => {
    render(<TextField label="제목" counter maxLength={50} />);
    expect(screen.getByText('0/50')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: '제목' }), 'abc');
    expect(screen.getByText('3/50')).toBeInTheDocument();
  });

  it('글자 수 (제어) + ref 전달', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField ref={ref} label="제목" counter maxLength={20} value="hello" onChange={() => {}} />);
    expect(screen.getByText('5/20')).toBeInTheDocument();
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('TextArea도 같은 규칙', () => {
    render(<TextArea label="한 일" required error="한 일을 입력해 주세요." counter maxLength={500} defaultValue="ab" />);
    const ta = screen.getByRole('textbox', { name: /한 일/ });
    expect(ta.tagName).toBe('TEXTAREA');
    expect(ta).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('2/500')).toBeInTheDocument();
  });
});
