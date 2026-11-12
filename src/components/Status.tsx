import { Progress, Space, Tag, Tooltip, Typography } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  ExclamationCircleFilled,
  FilePdfOutlined,
  LockFilled,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { AssignmentStatus, BlockAction, ProgressView, User } from '../api';
import { useI18n } from '../i18n';

/**
 * Status colors are reserved for state and always paired with an icon + label
 * (never color alone): good = completed, critical = overdue / blocked.
 */
export const STATUS_COLORS = {
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
  neutral: '#8c95a1',
};

export function AssignmentStatusTag({ status }: { status: AssignmentStatus | null }) {
  const { t } = useI18n();
  if (status === 'completed')
    return (
      <Tag color="success" icon={<CheckCircleFilled />}>
        {t('status.completed')}
      </Tag>
    );
  if (status === 'overdue')
    return (
      <Tag color="error" icon={<ExclamationCircleFilled />}>
        {t('status.overdue')}
      </Tag>
    );
  return (
    <Tag color="processing" icon={<ClockCircleOutlined />}>
      {t('status.pending')}
    </Tag>
  );
}

export function RiderStateTag({ user }: { user: Pick<User, 'isBlocked' | 'isActive' | 'block'> }) {
  const { t } = useI18n();
  if (user.isBlocked)
    return (
      <Tooltip title={user.block?.message}>
        <Tag color="error" icon={<LockFilled />}>
          {t('rider.blocked')}
        </Tag>
      </Tooltip>
    );
  if (!user.isActive)
    return (
      <Tag icon={<StopOutlined />} color="default">
        {t('rider.inactive')}
      </Tag>
    );
  return (
    <Tag color="success" icon={<CheckCircleFilled />}>
      {t('rider.active')}
    </Tag>
  );
}

export function BlockActionTag({ action }: { action: BlockAction }) {
  const { t } = useI18n();
  if (action === 'BLOCK')
    return (
      <Tag color="error" icon={<LockFilled />}>
        {t('log.action.BLOCK')}
      </Tag>
    );
  if (action === 'UNBLOCK')
    return (
      <Tag color="success" icon={<CheckCircleFilled />}>
        {t('log.action.UNBLOCK')}
      </Tag>
    );
  return (
    <Tag color="warning" icon={<ExclamationCircleFilled />}>
      {t('log.action.OVERDUE')}
    </Tag>
  );
}

const Done = ({ ok }: { ok: boolean }) =>
  ok ? (
    <CheckCircleFilled style={{ color: STATUS_COLORS.good }} />
  ) : (
    <CloseCircleFilled style={{ color: STATUS_COLORS.neutral }} />
  );

/** Compact per-rider progress: overall % plus video / PDF / quiz steps. */
export function ProgressSteps({ p }: { p: ProgressView }) {
  const { t } = useI18n();
  return (
    <Space direction="vertical" size={2} style={{ minWidth: 180 }}>
      <Progress
        percent={p.percent}
        size="small"
        strokeColor={p.completed ? STATUS_COLORS.good : undefined}
        format={(v) => `${v}%`}
      />
      <Space size={12} wrap>
        {p.required.video && (
          <Tooltip title={t('progress.video')}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <PlayCircleOutlined /> {p.videoPercent}% <Done ok={p.videoCompleted} />
            </Typography.Text>
          </Tooltip>
        )}
        {p.required.pdf && (
          <Tooltip title={t('progress.pdf')}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <FilePdfOutlined /> <Done ok={p.pdfViewed} />
            </Typography.Text>
          </Tooltip>
        )}
        {p.required.quiz && (
          <Tooltip
            title={t('progress.quizTip', {
              best: p.bestScore ?? '—',
              total: p.quizTotal,
              pass: p.quizPassMark ?? '—',
              attempts: p.quizAttempts,
            })}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <QuestionCircleOutlined /> {p.bestScore ?? '—'}/{p.quizTotal} <Done ok={p.quizPassed} />
            </Typography.Text>
          </Tooltip>
        )}
      </Space>
    </Space>
  );
}
