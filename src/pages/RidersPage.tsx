import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, App, AutoComplete, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api, Lang, LANGS, RiderListItem, RiderQuery } from '../api';
import { useAsync } from '../hooks/useAsync';
import { LANG_NAME_KEY, useI18n } from '../i18n';
import { RiderStateTag } from '../components/Status';
import { fmtDay } from '../utils/format';

const PAGE_SIZE = 20;

export function RidersPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);

  // Filters live in the URL so dashboard links (?status=blocked, ?city=Riyadh) and the back button work.
  const query: RiderQuery = {
    status: (params.get('status') as RiderQuery['status']) || undefined,
    city: params.get('city') || undefined,
    search: params.get('search') || undefined,
    page: Number(params.get('page')) || 1,
    limit: PAGE_SIZE,
  };
  const setFilter = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, loading, error, reload } = useAsync(() => api.riders(query), [params.toString()]);
  const { data: cities } = useAsync(() => api.byCity());
  const cityOptions = (cities || []).filter((c) => c.city !== 'Unknown').map((c) => ({ value: c.city }));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('nav.riders')}
          </Typography.Title>
          <Typography.Text type="secondary">{t('riders.subtitle', { n: data?.total ?? '…' })}</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
          {t('riders.add')}
        </Button>
      </div>

      <Card size="small">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input.Search
              allowClear
              defaultValue={query.search}
              placeholder={t('riders.searchPlaceholder')}
              onSearch={(v) => setFilter({ search: v.trim() || undefined })}
            />
          </Col>
          <Col xs={12} md={7}>
            <Select
              style={{ width: '100%' }}
              value={query.status || 'all'}
              onChange={(v) => setFilter({ status: v === 'all' ? undefined : v })}
              options={[
                { value: 'all', label: t('riders.filterAll') },
                { value: 'active', label: t('riders.filterActive') },
                { value: 'blocked', label: t('riders.filterBlocked') },
              ]}
            />
          </Col>
          <Col xs={12} md={7}>
            <Select
              style={{ width: '100%' }}
              allowClear
              placeholder={t('riders.filterCity')}
              value={query.city}
              onChange={(v?: string) => setFilter({ city: v })}
              options={cityOptions.map((c) => ({ value: c.value, label: c.value }))}
            />
          </Col>
        </Row>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      <Card styles={{ body: { padding: 0 } }}>
        <Table<RiderListItem>
          rowKey="id"
          loading={loading}
          dataSource={data?.items || []}
          scroll={{ x: 860 }}
          onRow={(r) => ({ onClick: () => navigate(`/riders/${r.id}`), style: { cursor: 'pointer' } })}
          pagination={{
            current: query.page,
            pageSize: PAGE_SIZE,
            total: data?.total || 0,
            showSizeChanger: false,
            onChange: (p) => setFilter({ page: p }),
          }}
          columns={[
            {
              title: t('rider.rider'),
              render: (_, r) => (
                <div>
                  <Link to={`/riders/${r.id}`} onClick={(e) => e.stopPropagation()}>
                    {r.name || t('rider.noName')}
                  </Link>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }} dir="ltr">
                      {r.phone}
                    </Typography.Text>
                  </div>
                </div>
              ),
            },
            { title: t('rider.city'), dataIndex: 'city', width: 120, render: (c: string | null) => c || '—' },
            {
              title: t('rider.language'),
              dataIndex: 'language',
              width: 100,
              render: (l: Lang) => t(LANG_NAME_KEY[l] ?? 'lang.en'),
            },
            {
              title: t('riders.training'),
              width: 200,
              render: (_, r) => (
                <Space size={4} direction="vertical">
                  <Typography.Text>{t('riders.completedOf', { done: r.assignments.completed, total: r.assignments.total })}</Typography.Text>
                  {r.assignments.overdue > 0 && (
                    <Typography.Text type="danger" style={{ fontSize: 12 }}>
                      {t('riders.overdueCount', { n: r.assignments.overdue })}
                    </Typography.Text>
                  )}
                </Space>
              ),
            },
            {
              title: t('dash.status'),
              width: 260,
              render: (_, r) => (
                <div>
                  <RiderStateTag user={r} />
                  {r.isBlocked && r.block && (
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: r.block.message }}>
                        {r.block.message}
                      </Typography.Text>
                    </div>
                  )}
                </div>
              ),
            },
            { title: t('rider.joined'), dataIndex: 'createdAt', width: 120, render: (d: string) => fmtDay(d) },
          ]}
        />
      </Card>

      <CreateRiderModal
        open={creating}
        cityOptions={cityOptions}
        onClose={() => setCreating(false)}
        onCreated={() => reload()}
      />
    </Space>
  );
}

interface CreateValues {
  phone: string;
  name?: string;
  city?: string;
  language: Lang;
}

function CreateRiderModal({
  open,
  cityOptions,
  onClose,
  onCreated,
}: {
  open: boolean;
  cityOptions: { value: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateValues>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    let v: CreateValues;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    setBusy(true);
    try {
      const res = await api.createRider({
        phone: v.phone.trim(),
        name: v.name?.trim() || undefined,
        city: v.city?.trim() || undefined,
        language: v.language,
      });
      message.success(res.message);
      form.resetFields();
      onClose();
      onCreated();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('riders.add')}
      onCancel={onClose}
      onOk={submit}
      okText={t('common.create')}
      cancelText={t('common.cancel')}
      confirmLoading={busy}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ language: 'ar' }}>
        <Form.Item
          name="phone"
          label={t('rider.phone')}
          extra={t('riders.phoneHelp')}
          rules={[{ required: true, whitespace: true, message: t('form.required') }]}
        >
          <Input dir="ltr" placeholder="05XXXXXXXX" inputMode="tel" />
        </Form.Item>
        <Form.Item name="name" label={t('rider.name')}>
          <Input />
        </Form.Item>
        <Form.Item name="city" label={t('rider.city')}>
          <AutoComplete options={cityOptions} placeholder="Riyadh" filterOption />
        </Form.Item>
        <Form.Item name="language" label={t('rider.language')}>
          <Select options={LANGS.map((l) => ({ value: l, label: t(LANG_NAME_KEY[l]) }))} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
