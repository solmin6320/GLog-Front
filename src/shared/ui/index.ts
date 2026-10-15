/**
 * 공통 UI 컴포넌트 (계약서 1장). 화면은 이 배럴로만 가져온다: `import { Button } from '@/shared/ui'`.
 */

// 아이콘 · 버튼 · 링크
export { Icon } from './Icon';
export type { IconName } from './Icon';
export { Button, LinkButton } from './Button';
export { IconButton } from './IconButton';
export { TextLink } from './TextLink';

// 배지 · 칩 · 아바타
export { Pill } from './Pill';
export type { PillTone } from './Pill';
export { StatusBadge } from './StatusBadge';
export { Tag } from './Tag';
export { TeamTag } from './TeamTag';
export { CategoryChip } from './CategoryChip';
export { Avatar } from './Avatar';
export { Logo } from './Logo';

// 잔디 · 숫자
export { WeekStrip } from './WeekStrip';
export type { StripDay } from './WeekStrip';
export { GrassHeatmap } from './GrassHeatmap';
export { WarningGauge } from './WarningGauge';
export { BigStat } from './BigStat';

// 레이아웃 · 컨테이너
export { PageContainer } from './PageContainer';
export { PageTitle } from './PageTitle';
export { SectionHeader } from './SectionHeader';
export { Card } from './Card';
export { InfoBox } from './InfoBox';
export { Foot } from './Foot';
export { Hint } from './Hint';
export { Divider } from './Divider';

// 탭
export { Segmented } from './Segmented';
export { Tabs } from './Tabs';

// 폼
export { TextField } from './TextField';
export { TextArea } from './TextArea';
export { Select } from './Select';
export { SearchInput } from './SearchInput';
export { RadioCard } from './RadioCard';
export { Switch } from './Switch';

// 표 · 목록
export { DataTable } from './DataTable';
export type { Column } from './DataTable';
export { RowItem, RowList } from './RowList';

// 상태
export { EmptyState } from './EmptyState';
export { CardSkeleton, ListSkeleton, PageSkeleton, Skeleton, TableSkeleton } from './Skeleton';
export { Spinner } from './Spinner';
export { FullState } from './FullState';
export type { FullStateKind } from './FullState';
export { QueryBoundary } from './QueryBoundary';
export { LoadMore } from './LoadMore';

// 오버레이
export { ToastProvider, useToast } from './Toast';
export { ConfirmProvider, useConfirm } from './Confirm';
export type { ConfirmOptions } from './Confirm';
export { Modal } from './Modal';
export { Kbd } from './Kbd';
export { VisuallyHidden } from './VisuallyHidden';
