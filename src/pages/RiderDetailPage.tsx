import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Table,
  Timeline,
  Typography,
} from 'antd';
import { LockOutlined, SaveOutlined, UnlockOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { api, BlockLog, Lang, LANGS, RiderAssignment, RiderDetails } from '../api';
import { useAsync } from '../hooks/useAsync';
import { LANG_NAME_KEY, useI18n } from '../i18n';
import { AssignmentStatusTag, BlockActionTag, ProgressSteps, RiderStateTag, STATUS_COLORS } from '../components/Status';
import { fmtDate } from '../utils/format';

export function RiderDetailPage() {
  const { id = '' } = useParams();
  const { t, pick } = useI18n();
  const { data, loading, error, reload } = useAsync(() => api.rider(id), [id]);
  const [blockOpen, setBlockOpen] = useState(false);
  const [unblockOpen, setUnblockOpen] = useState(false);

  if (error) return <Alert type="error" showIcon message={error} />;
  if (loading && !data) return <Skeleton active />;
  if (!data) return null;
  const { rider: r } = data;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb items={[{ title: <Link to="/riders">{t('nav.riders')}</Link> }, { title: r.name || r.phone }]} />
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {r.name || t('rider.noName')}
          </Typography.Title>
          <Space size={8} style={{ marginTop: 4 }}>
            <Typography.Text type="secondary" dir="ltr">
              {r.phone}
            </Typography.Text>
            <RiderStateTag user={r} />
          </Space>
        </div>
        {r.isBlocked ? (
          <Button type="primary" icon={<UnlockOutlined />} onClick={() => setUnblockOpen(true)}>
            {t('rider.unblock')}
          </Button>
        ) : (
          <Button danger icon={<LockOutlined />} onClick={() => setBlockOpen(true)}>
            {t('rider.block')}
          </Button>
        )}
      </div>

      {r.isBlocked && r.block && (
        <Alert
          type="error"
          showIcon
          message={r.block.message}
          description={
            <Space direction="vertical" size={0}>
              <span>
                {t('rider.blockedAt')}: {fmtDate(r.block.blockedAt)} ·{' '}
                {r.block.blockedBy === 'SYSTEM' ? t('log.bySystem') : t('log.byAdmin')}
              </span>
              {r.block.kind === 'MODULE_OVERDUE' && r.block.moduleTitle && (
                <span>
                  {t('rider.overdueModule')}:{' '}
                  {r.block.moduleId ? <Link to={`/modules/${r.block.moduleId}`}>{pick(r.block.moduleTitle)}</Link> : pick(r.block.moduleTitle)} ·{' '}
                  {t('rider.wasDue')} {fmtDate(r.block.dueAt)}
                </span>
              )}
              <span>{t('rider.unblockHint')}</span>
            </Space>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <ProfileCard details={data} onSaved={reload} />
        </Col>
        <Col xs={24} lg={15}>
          <Card title={t('rider.assignments')} styles={{ body: { padding: 0 } }}>
            <Table<RiderAssignment>
              rowKey="moduleId"
              dataSource={data.assignments}
              pagination={false}
              scroll={{ x: 700 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('rider.noAssignments')} /> }}
              columns={[
                {
                  title: t('module.title'),
                  render: (_, a) => <Link to={`/modules/${a.moduleId}?tab=progress`}>{pick(a.title) || '—'}</Link>,
                },
                { title: t('dash.status'), width: 130, render: (_, a) => <AssignmentStatusTag status={a.status} /> },
                { title: t('progress.progress'), width: 230, render: (_, a) => <ProgressSteps p={a.progress} /> },
                {
                  title: t('assign.dueAt'),
                  width: 170,
                  render: (_, a) => (
                    <div>
                      <Typography.Text type={a.status === 'overdue' ? 'danger' : undefined}>{fmtDate(a.dueAt)}</Typography.Text>
                      {a.completedAt && (
                        <div>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {t('progress.completedAt')}: {fmtDate(a.completedAt)}
                          </Typography.Text>
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('rider.blockHistory')}>
        <BlockHistory logs={data.blockHistory} />
      </Card>

      <BlockModal open={blockOpen} riderId={r.id} onClose={() => setBlockOpen(false)} onDone={reload} />
      <UnblockModal
        open={unblockOpen}
        riderId={r.id}
        hasOverdue={data.assignments.some((a) => a.status === 'overdue')}
        onClose={() => setUnblockOpen(false)}
        onDone={reload}
      />
    </Space>
  );
}

interface ProfileValues {
  name: string;
  city?: string;
  language: Lang;
  isActive: boolean;
}

function ProfileCard({ details, onSaved }: { details: RiderDetails; onSaved: () => void }) {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [form] = Form.useForm<ProfileValues>();
  const [busy, setBusy] = useState(false);
  const r = details.rider;

  useEffect(() => {
    form.resetFields();
  }, [r, form]);

  const save = async (v: ProfileValues) => {
    setBusy(true);
    try {
      const res = await api.updateRider(r.id, {
        name: v.name?.trim() || '',
        city: v.city?.trim() || undefined,
        language: v.language,
        isActive: v.isActive,
      });
      message.success(res.message);
      onSaved();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={t('rider.profile')}>
      <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('rider.phone')}>
          <span dir="ltr">{r.phone}</span>
        </Descriptions.Item>
        <Descriptions.Item label={t('rider.joined')}>{fmtDate(r.createdAt)}</Descriptions.Item>
      </Descriptions>
      <Form<ProfileValues>
        form={form}
        layout="vertical"
        onFinish={save}
        initialValues={{ name: r.name, city: r.city || undefined, language: r.language, isActive: r.isActive }}
      >
        <Form.Item name="name" label={t('rider.name')}>
          <Input />
        </Form.Item>
        <Form.Item name="city" label={t('rider.city')}>
          <Input />
        </Form.Item>
        <Form.Item name="language" label={t('rider.language')} extra={t('rider.languageHelp')}>
          <Select options={LANGS.map((l) => ({ value: l, label: t(LANG_NAME_KEY[l]) }))} />
        </Form.Item>
        <Form.Item name="isActive" label={t('rider.account')} valuePropName="checked" extra={t('rider.accountHelp')}>
          <Switch checkedChildren={t('rider.active')} unCheckedChildren={t('rider.inactive')} />
        </Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={busy}>
          {t('common.save')}
        </Button>
      </Form>
    </Card>
  );
}

function BlockHistory({ logs }: { logs: BlockLog[] }) {
  const { t } = useI18n();
  if (!logs.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('rider.noHistory')} />;
  return (
    <Timeline
      items={logs.map((l) => ({
        color: l.action === 'UNBLOCK' ? STATUS_COLORS.good : l.action === 'BLOCK' ? STATUS_COLORS.critical : STATUS_COLORS.warning,
        children: (
          <div>
            <Space size={8} wrap>
              <BlockActionTag action={l.action} />
              <Typography.Text strong>{fmtDate(l.createdAt)}</Typography.Text>
              <Typography.Text type="secondary">· {l.by === 'SYSTEM' ? t('log.bySystem') : t('log.byAdmin')}</Typography.Text>
            </Space>
            {l.reason && <div>{l.reason}</div>}
            {l.note && (
              <div>
                <Typography.Text type="secondary">
                  {t('log.note')}: {l.note}
                </Typography.Text>
              </div>
            )}
            {l.newDueAt && (
              <div>
                <Typography.Text type="secondary">
                  {t('log.newDueAt')}: {fmtDate(l.newDueAt)}
                </Typography.Text>
              </div>
            )}
          </div>
        ),
      }))}
    />
  );
}

function BlockModal({ open, riderId, onClose, onDone }: { open: boolean; riderId: string; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [form] = Form.useForm<{ reason: string }>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    let v: { reason: string };
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    setBusy(true);
    try {
      const res = await api.blockRider(riderId, v.reason.trim());
      message.success(res.message);
      form.resetFields();
      onClose();
      onDone();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('rider.blockTitle')}
      onCancel={onClose}
      onOk={submit}
      okText={t('rider.block')}
      okButtonProps={{ danger: true }}
      cancelText={t('common.cancel')}
      confirmLoading={busy}
      destroyOnClose
    >
      <Typography.Paragraph type="secondary">{t('rider.blockBody')}</Typography.Paragraph>
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label={t('rider.blockReason')}
          rules={[
            { required: true, whitespace: true, message: t('form.required') },
            { min: 2, max: 500 },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 3 }} maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function UnblockModal({
  open,
  riderId,
  hasOverdue,
  onClose,
  onDone,
}: {
  open: boolean;
  riderId: string;
  hasOverdue: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [form] = Form.useForm<{ note?: string; newDueAt?: Dayjs }>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    let v: { note?: string; newDueAt?: Dayjs };
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    setBusy(true);
    try {
      const res = await api.unblockRider(riderId, {
        note: v.note?.trim() || undefined,
        newDueAt: v.newDueAt ? v.newDueAt.toISOString() : undefined,
      });
      message.success(
        res.data.rescheduledAssignments
          ? `${res.message} · ${t('rider.rescheduled', { n: res.data.rescheduledAssignments })}`
          : res.message,
      );
      form.resetFields();
      onClose();
      onDone();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('rider.unblockTitle')}
      onCancel={onClose}
      onOk={submit}
      okText={t('rider.unblock')}
      cancelText={t('common.cancel')}
      confirmLoading={busy}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="note" label={t('log.note')}>
          <Input.TextArea autoSize={{ minRows: 2 }} maxLength={500} showCount />
        </Form.Item>
        {hasOverdue && (
          <Form.Item name="newDueAt" label={t('rider.newDueAt')} extra={t('rider.newDueAtHelp')}>
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD MMM YYYY, HH:mm"
              disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}
        {!hasOverdue && <Typography.Text type="secondary">{t('rider.unblockNoOverdue')}</Typography.Text>}
      </Form>
    </Modal>
  );
}
