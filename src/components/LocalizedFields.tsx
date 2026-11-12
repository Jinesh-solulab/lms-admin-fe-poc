import { Col, Form, Input, Row } from 'antd';
import { useI18n } from '../i18n';

type Path = (string | number)[];

/**
 * English + Arabic + Urdu inputs for one { en, ar, ur } value.
 * Arabic and Urdu inputs are RTL. Urdu is never required: riders see English when it is empty.
 */
export function LocalizedFields({
  name,
  label,
  required,
  textarea,
  placeholder,
}: {
  name: Path;
  label?: string;
  required?: boolean;
  textarea?: boolean;
  placeholder?: { en?: string; ar?: string; ur?: string };
}) {
  const { t } = useI18n();
  const rules = required ? [{ required: true, whitespace: true, message: t('form.required') }] : [];
  const title = (langLabel: string) => (label ? `${label} · ${langLabel}` : langLabel);

  const field = (dir: 'ltr' | 'rtl', ph?: string) =>
    textarea ? (
      <Input.TextArea dir={dir} placeholder={ph} maxLength={2000} autoSize={{ minRows: 2, maxRows: 6 }} />
    ) : (
      <Input dir={dir} placeholder={ph} maxLength={2000} />
    );

  return (
    <Row gutter={12}>
      <Col xs={24} md={8}>
        <Form.Item name={[...name, 'en']} label={title(t('lang.en'))} rules={rules}>
          {field('ltr', placeholder?.en)}
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name={[...name, 'ar']} label={title(t('lang.ar'))} rules={rules}>
          {field('rtl', placeholder?.ar)}
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name={[...name, 'ur']} label={title(t('lang.ur'))} tooltip={t('lang.urOptional')}>
          {field('rtl', placeholder?.ur)}
        </Form.Item>
      </Col>
    </Row>
  );
}
