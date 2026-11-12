import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  App,
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Form,
  InputNumber,
  Radio,
  Row,
  Select,
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { api, AssignBody, AssignResult, TrainingModule } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../i18n';
import { fmtDate } from '../../utils/format';

type Target = 'all' | 'city' | 'riders';
type DueMode = 'default' | 'date' | 'minutes';

interface Values {
  target: Target;
  city?: string;
  userIds?: string[];
  dueMode: DueMode;
  dueAt?: Dayjs;
  dueInMinutes?: number;
  updateExisting?: boolean;
}

/** Remote rider search for the "specific riders" picker. */
function useRiderOptions() {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const search = (q: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.riders({ search: q || undefined, limit: 30 });
        setOptions(
          res.items.map((r) => ({
            value: r.id,
            label: `${r.name || '—'} · ${r.phone}${r.city ? ` · ${r.city}` : ''}`,
          })),
        );
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  useEffect(() => {
    search('');
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { options, loading, search };
}

export function AssignTab({ module: m }: { module: TrainingModule }) {
  const { t } = useI18n();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssignResult | null>(null);
  const riders = useRiderOptions();
  const { data: cities } = useAsync(() => api.byCity());
  const target = Form.useWatch('target', form);
  const dueMode = Form.useWatch('dueMode', form);

  const send = async (body: AssignBody) => {
    setBusy(true);
    try {
      const res = await api.assign(m.id, body);
      setResult(res.data);
      message.success(res.message);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onFinish = (v: Values) => {
    const body: AssignBody = {};
    if (v.target === 'city') body.city = v.city?.trim();
    if (v.target === 'riders') body.userIds = v.userIds;
    if (v.dueMode === 'date' && v.dueAt) body.dueAt = v.dueAt.toISOString();
    if (v.dueMode === 'minutes') body.dueInMinutes = v.dueInMinutes;
    if (v.updateExisting) body.updateExisting = true;

    if (v.target === 'all') {
      modal.confirm({
        title: t('assign.confirmAllTitle'),
        content: t('assign.confirmAllBody'),
        okText: t('assign.submit'),
        cancelText: t('common.cancel'),
        onOk: () => send(body),
      });
    } else {
      void send(body);
    }
  };

  const hasContent = !!(m.video || m.pdf || m.quiz?.totalQuestions);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card>
          {!hasContent && <Alert type="warning" showIcon message={t('assign.noContent')} style={{ marginBottom: 16 }} />}
          <Form<Values>
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ target: 'city', dueMode: 'default', dueInMinutes: 2, updateExisting: false }}
          >
            <Form.Item name="target" label={t('assign.who')}>
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="city">{t('assign.byCity')}</Radio.Button>
                <Radio.Button value="riders">{t('assign.byRiders')}</Radio.Button>
                <Radio.Button value="all">{t('assign.all')}</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {target === 'city' && (
              <Form.Item name="city" label={t('rider.city')} rules={[{ required: true, whitespace: true, message: t('form.required') }]}>
                <AutoComplete
                  placeholder="Riyadh"
                  options={(cities || []).filter((c) => c.city !== 'Unknown').map((c) => ({ value: c.city, label: `${c.city} (${c.riders})` }))}
                  filterOption={(input, opt) => String(opt?.value || '').toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            )}

            {target === 'riders' && (
              <Form.Item name="userIds" label={t('assign.riders')} rules={[{ required: true, message: t('form.required') }]}>
                <Select
                  mode="multiple"
                  showSearch
                  filterOption={false}
                  onSearch={riders.search}
                  loading={riders.loading}
                  options={riders.options}
                  placeholder={t('assign.searchRiders')}
                />
              </Form.Item>
            )}

            <Form.Item name="dueMode" label={t('assign.deadline')}>
              <Radio.Group>
                <Radio value="default">{t('assign.dueDefault', { n: m.deadlineDays })}</Radio>
                <Radio value="date">{t('assign.dueDate')}</Radio>
                <Radio value="minutes">{t('assign.dueMinutes')}</Radio>
              </Radio.Group>
            </Form.Item>

            {dueMode === 'date' && (
              <Form.Item name="dueAt" label={t('assign.dueAt')} rules={[{ required: true, message: t('form.required') }]}>
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="DD MMM YYYY, HH:mm"
                  disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}

            {dueMode === 'minutes' && (
              <Form.Item
                name="dueInMinutes"
                label={t('assign.minutesFromNow')}
                extra={t('assign.minutesHelp')}
                rules={[{ required: true, message: t('form.required') }]}
              >
                <InputNumber min={1} max={60 * 24 * 365} style={{ width: '100%' }} />
              </Form.Item>
            )}

            <Form.Item name="updateExisting" valuePropName="checked" extra={t('assign.updateExistingHelp')}>
              <Checkbox>{t('assign.updateExisting')}</Checkbox>
            </Form.Item>

            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={busy}>
              {t('assign.submit')}
            </Button>
          </Form>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        {result ? (
          <Card title={t('assign.resultTitle')}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label={t('assign.matched')}>{result.matchedRiders}</Descriptions.Item>
              <Descriptions.Item label={t('assign.newly')}>{result.newlyAssigned}</Descriptions.Item>
              <Descriptions.Item label={t('assign.already')}>{result.alreadyAssigned}</Descriptions.Item>
              <Descriptions.Item label={t('assign.updated')}>{result.updatedExisting}</Descriptions.Item>
              <Descriptions.Item label={t('assign.dueAt')}>{fmtDate(result.dueAt)}</Descriptions.Item>
            </Descriptions>
            {result.matchedRiders === 0 && (
              <Alert type="warning" showIcon message={t('assign.noneMatched')} style={{ marginTop: 12 }} />
            )}
          </Card>
        ) : (
          <Alert type="info" showIcon message={t('assign.howTitle')} description={t('assign.howBody')} />
        )}
      </Col>
    </Row>
  );
}
