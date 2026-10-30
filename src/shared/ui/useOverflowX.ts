import { useEffect, useRef, useState } from 'react';

/**
 * 가로로 넘치는지 잰다 (내부용). 넘칠 때만 스크롤 영역을 키보드로 갈 수 있게(tabIndex=0) 하려고 쓴다.
 * jsdom처럼 ResizeObserver가 없으면 window resize로 대신한다.
 */
export function useOverflowX<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth + 1);
    check();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, []);
  return [ref, overflow] as const;
}
