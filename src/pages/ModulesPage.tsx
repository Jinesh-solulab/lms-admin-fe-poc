import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, App, Button, Card, Col, Form, InputNumber, Modal, Row, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { FilePdfOutlined, PlayCircleOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { api, Localized, TrainingModule } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../i18n';
import { LocalizedFields } from '../components/LocalizedFields';
import { StatusBar } from '../components/StatusBar';
import { fmtDay } from '../utils/format';

export function ModulesPage() {
  const { t, pick, lang } = useI18n();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const { data, loading, error } = useAsync(() => api.modules());

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('nav.modules')}
          </Typography.Title>
          <Typography.Text type="secondary">{t('modules.subtitle')}</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
          {t('modules.new')}
        </Button>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Card styles={{ body: { padding: 0 } }}>
        <Table<TrainingModule>
          rowKey="id"
          loading={loading}
          dataSource={data || []}
          pagination={false}
          scroll={{ x: 900 }}
          onRow={(m) => ({ onClick: () => navigate(`/modules/${m.id}`), style: { cursor: 'pointer' } })}
          columns={[
            {
              title: t('module.title'),
              render: (_, m) => (
                <div>
                  <Link to={`/modules/${m.id}`} onClick={(e) => e.stopPropagation()}>
                    {pick(m.title)}
                  </Link>
                  {/* Second line: English when the UI is Arabic/Urdu, Arabic when the UI is English */}
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }} dir={lang === 'en' ? 'rtl' : 'ltr'}>
                      {lang === 'en' ? m.title.ar : m.title.en}
                    </Typography.Text>
                  </div>
                </div>
              ),
            },
            {
              title: t('module.content'),
              width: 220,
              render: (_, m) => (
                <Space size={4} wrap>
                  <ContentTag ok={!!m.video} icon={<PlayCircleOutlined />} label={t('module.video')} />
                  <ContentTag ok={!!m.pdf} icon={<FilePdfOutlined />} label={t('module.pdf')} />
                  <ContentTag
                    ok={!!m.quiz?.totalQuestions}
                    icon={<QuestionCircleOutlined />}
                    label={m.quiz ? t('module.quizCount', { n: m.quiz.totalQuestions }) : t('module.quiz')}
                  />
                </Space>
              ),
            },
            { title: t('module.deadlineDays'), dataIndex: 'deadlineDays', width: 110, align: 'end' },
            {
              title: t('dash.assigned'),
              width: 90,
              align: 'end',
              render: (_, m) => m.assignments?.total ?? 0,
            },
            {
              title: t('dash.status'),
              width: 200,
              render: (_, m) => (
                <StatusBar
                  completed={m.assignments?.completed ?? 0}
                  pending={m.assignments?.assigned ?? 0}
                  overdue={m.assignments?.overdue ?? 0}
                  height={10}
                  legend={false}
                />
              ),
            },
            {
              title: t('module.state'),
              width: 100,
              render: (_, m) => (m.isActive ? <Tag color="success">{t('module.active')}</Tag> : <Tag>{t('module.inactive')}</Tag>),
            },
            { title: t('module.version'), dataIndex: 'version', width: 80, align: 'end', render: (v: number) => `v${v}` },
            { title: t('common.created'), dataIndex: 'createdAt', width: 120, render: (d: string) => fmtDay(d) },
          ]}
        />
      </Card>

      <CreateModuleModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(m) => navigate(`/modules/${m.id}?tab=content`)}
      />
    </Space>
  );
}

function ContentTag({ ok, icon, label }: { ok: boolean; icon: ReactNode; label: string }) {
  const { t } = useI18n();
  return (
    <Tooltip title={ok ? undefined : t('module.missing')}>
      <Tag icon={icon} color={ok ? 'blue' : 'default'} style={ok ? undefined : { opacity: 0.55, textDecoration: 'line-through' }}>
        {label}
      </Tag>
    </Tooltip>
  );
}

interface CreateValues {
  title: Localized;
  description?: Partial<Localized>;
  deadlineDays: number;
  videoCompletePercent: number;
}

function CreateModuleModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (m: TrainingModule) => void;
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
      return; // field errors are shown inline
    }
    setBusy(true);
    try {
      const res = await api.createModule({
        title: { en: v.title.en.trim(), ar: v.title.ar.trim(), ur: v.title.ur?.trim() || '' },
        description: {
          en: v.description?.en?.trim() || '',
          ar: v.description?.ar?.trim() || '',
          ur: v.description?.ur?.trim() || '',
        },
        deadlineDays: v.deadlineDays,
        videoCompletePercent: v.videoCompletePercent,
      });
      message.success(res.message);
      form.resetFields();
      onClose();
      onCreated(res.data);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('modules.new')}
      onCancel={onClose}
      onOk={submit}
      okText={t('common.create')}
      cancelText={t('common.cancel')}
      confirmLoading={busy}
      width={960}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ deadlineDays: 7, videoCompletePercent: 90 }}>
        <LocalizedFields name={['title']} label={t('module.title')} required />
        <LocalizedFields name={['description']} label={t('module.description')} textarea />
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="deadlineDays" label={t('module.deadlineDays')} extra={t('module.deadlineDaysHelp')} rules={[{ required: true }]}>
              <InputNumber min={1} max={365} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="videoCompletePercent"
              label={t('module.videoCompletePercent')}
              extra={t('module.videoCompletePercentHelp')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={100} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
