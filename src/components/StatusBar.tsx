import { Space, Tooltip, Typography } from 'antd';
import { CheckCircleFilled, ClockCircleOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useI18n } from '../i18n';
import { pct } from '../utils/format';
import { STATUS_COLORS } from './Status';

/**
 * Part-to-whole bar for assignment status: completed | pending | overdue (a true partition of all assignments).
 * Status colors + icon + label in the legend, 2px gaps between segments, hover tooltip per segment.
 */
export function StatusBar({
  completed,
  pending,
  overdue,
  height = 12,
  legend = true,
}: {
  completed: number;
  pending: number;
  overdue: number;
  height?: number;
  legend?: boolean;
}) {
  const { t } = useI18n();
  const total = completed + pending + overdue;
  const segs = [
    { key: 'completed', label: t('status.completed'), value: completed, color: STATUS_COLORS.good, icon: <CheckCircleFilled /> },
    { key: 'pending', label: t('status.pending'), value: pending, color: STATUS_COLORS.neutral, icon: <ClockCircleOutlined /> },
    { key: 'overdue', label: t('status.overdue'), value: overdue, color: STATUS_COLORS.critical, icon: <ExclamationCircleFilled /> },
  ];

  return (
    <div>
      <div className="status-bar" style={{ height }} role="img" aria-label={segs.map((s) => `${s.label} ${s.value}`).join(', ')}>
        {total === 0 ? (
          <div className="status-bar-empty" />
        ) : (
          segs
            .filter((s) => s.value > 0)
            .map((s) => (
              <Tooltip key={s.key} title={`${s.label}: ${s.value} (${pct(s.value, total)}%)`}>
                <div className="status-bar-seg" style={{ flexGrow: s.value, background: s.color }} />
              </Tooltip>
            ))
        )}
      </div>
      {legend && (
        <Space size={16} wrap style={{ marginTop: 8 }}>
          {segs.map((s) => (
            <Typography.Text key={s.key} type="secondary" style={{ fontSize: 12 }}>
              <span style={{ color: s.color }}>{s.icon}</span> {s.label}{' '}
              <Typography.Text strong style={{ fontSize: 12 }}>
                {s.value}
              </Typography.Text>{' '}
              ({pct(s.value, total)}%)
            </Typography.Text>
          ))}
        </Space>
      )}
    </div>
  );
}
