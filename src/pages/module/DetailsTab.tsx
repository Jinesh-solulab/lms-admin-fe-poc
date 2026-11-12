import { useEffect, useState } from 'react';
import { App, Button, Card, Col, Form, InputNumber, Row, Switch } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { api, Localized, ModuleBody, TrainingModule } from '../../api';
import { useI18n } from '../../i18n';
import { LocalizedFields } from '../../components/LocalizedFields';

interface Values {
  title: Localized;
  description: Partial<Localized>;
  deadlineDays: number;
  videoCompletePercent: number;
  isActive: boolean;
}

const norm = (l?: Partial<Localized> | null): Localized => ({
  en: (l?.en || '').trim(),
  ar: (l?.ar || '').trim(),
  ur: (l?.ur || '').trim(),
});
const same = (a: Localized, b: Localized) => a.en === b.en && a.ar === b.ar && a.ur === b.ur;

export function DetailsTab({ module: m, onSaved }: { module: TrainingModule; onSaved: (m: TrainingModule) => void }) {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    form.resetFields(); // show the saved (trimmed) values
  }, [m.updatedAt, form]);

  const save = async (v: Values) => {
    // Send only what changed: a title/description change bumps the module version (phones re-download).
    const body: ModuleBody = {};
    const title = norm(v.title);
    const description = norm(v.description);
    if (!same(title, norm(m.title))) body.title = title;
    if (!same(description, norm(m.description))) body.description = description;
    if (v.deadlineDays !== m.deadlineDays) body.deadlineDays = v.deadlineDays;
    if (v.videoCompletePercent !== m.videoCompletePercent) body.videoCompletePercent = v.videoCompletePercent;
    if (v.isActive !== m.isActive) body.isActive = v.isActive;
    if (!Object.keys(body).length) {
      message.info(t('common.noChanges'));
      return;
    }
    setBusy(true);
    try {
      const res = await api.updateModule(m.id, body);
      message.success(res.message);
      onSaved({ ...m, ...res.data, assignments: m.assignments });
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Form<Values>
        form={form}
        layout="vertical"
        onFinish={save}
        initialValues={{
          title: m.title,
          description: m.description || { en: '', ar: '', ur: '' },
          deadlineDays: m.deadlineDays,
          videoCompletePercent: m.videoCompletePercent,
          isActive: m.isActive,
        }}
      >
        <LocalizedFields name={['title']} label={t('module.title')} required />
        <LocalizedFields name={['description']} label={t('module.description')} textarea />
        <Row gutter={12}>
          <Col xs={24} md={8}>
            <Form.Item name="deadlineDays" label={t('module.deadlineDays')} extra={t('module.deadlineDaysHelp')} rules={[{ required: true }]}>
              <InputNumber min={1} max={365} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="videoCompletePercent"
              label={t('module.videoCompletePercent')}
              extra={t('module.videoCompletePercentHelp')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={100} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="isActive" label={t('module.state')} valuePropName="checked" extra={t('module.activeHelp')}>
              <Switch checkedChildren={t('module.active')} unCheckedChildren={t('module.inactive')} />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={busy}>
          {t('common.save')}
        </Button>
      </Form>
    </Card>
  );
}
