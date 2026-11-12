import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Select, Space, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { api, BlockLog } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../i18n';
import { BlockActionTag } from '../components/Status';
import { fmtDate } from '../utils/format';

export function BlockLogsPage() {
  const { t } = useI18n();
  const [limit, setLimit] = useState(100);
  const { data, loading, error, reload } = useAsync(() => api.blockLogs({ limit }), [limit]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('nav.blockLogs')}
          </Typography.Title>
          <Typography.Text type="secondary">{t('logs.subtitle')}</Typography.Text>
        </div>
        <Space>
          <Select
            value={limit}
            onChange={setLimit}
            options={[100, 200, 500].map((n) => ({ value: n, label: t('logs.lastN', { n }) }))}
          />
          <Button icon={<ReloadOutlined />} onClick={reload} loading={loading && !!data}>
            {t('common.refresh')}
          </Button>
        </Space>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card styles={{ body: { padding: 0 } }}>
        <Table<BlockLog>
          rowKey="_id"
          loading={!data && loading}
          dataSource={data || []}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 25, hideOnSinglePage: true }}
          columns={[
            { title: t('logs.time'), dataIndex: 'createdAt', width: 170, render: (d: string) => fmtDate(d) },
            {
              title: t('rider.rider'),
              width: 190,
              render: (_, l) =>
                l.rider ? (
                  <div>
                    <Link to={`/riders/${l.userId}`}>{l.rider.name || l.rider.phone}</Link>
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }} dir="ltr">
                        {l.rider.phone}
                      </Typography.Text>
                    </div>
                  </div>
                ) : (
                  '—'
                ),
            },
            {
              title: t('logs.action'),
              dataIndex: 'action',
              width: 130,
              filters: [
                { text: t('log.action.BLOCK'), value: 'BLOCK' },
                { text: t('log.action.UNBLOCK'), value: 'UNBLOCK' },
                { text: t('log.action.OVERDUE'), value: 'OVERDUE' },
              ],
              onFilter: (v, l) => l.action === v,
              render: (_, l) => <BlockActionTag action={l.action} />,
            },
            {
              title: t('logs.kind'),
              dataIndex: 'kind',
              width: 140,
              render: (k: BlockLog['kind']) => <Tag>{k === 'MODULE_OVERDUE' ? t('log.kind.MODULE_OVERDUE') : t('log.kind.MANUAL')}</Tag>,
            },
            {
              title: t('logs.reason'),
              render: (_, l) => (
                <div>
                  {l.reason || '—'}
                  {l.note && (
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {t('log.note')}: {l.note}
                      </Typography.Text>
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: t('logs.by'),
              dataIndex: 'by',
              width: 120,
              render: (b: string) => (b === 'SYSTEM' ? t('log.bySystem') : t('log.byAdmin')),
            },
            {
              title: t('logs.dates'),
              width: 200,
              render: (_, l) => (
                <div style={{ fontSize: 12 }}>
                  {l.dueAt && (
                    <div>
                      {t('logs.due')}: {fmtDate(l.dueAt)}
                    </div>
                  )}
                  {l.newDueAt && (
                    <div>
                      {t('log.newDueAt')}: {fmtDate(l.newDueAt)}
                    </div>
                  )}
                  {!l.dueAt && !l.newDueAt && '—'}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
