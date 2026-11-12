import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { LanguageSwitch } from '../components/AppLayout';

export function LoginPage() {
  const { t } = useI18n();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/dashboard';
  if (user) return <Navigate to={from} replace />;

  const onFinish = async (v: { email: string; password: string }) => {
    setBusy(true);
    setError(null);
    try {
      await login(v.email.trim(), v.password);
      navigate(from, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-lang">
        <LanguageSwitch />
      </div>
      <Card className="login-card">
        <div className="brand" style={{ padding: 0, marginBottom: 24 }}>
          <span className="brand-mark">L</span>
          <div>
            <div className="brand-title">{t('app.name')}</div>
            <div className="brand-sub">{t('app.adminPanel')}</div>
          </div>
        </div>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          {t('auth.title')}
        </Typography.Title>
        <Typography.Paragraph type="secondary">{t('auth.subtitle')}</Typography.Paragraph>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label={t('auth.email')}
            rules={[{ required: true, type: 'email', message: t('auth.emailInvalid') }]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@hungerstation.local" autoComplete="username" dir="ltr" />
          </Form.Item>
          <Form.Item name="password" label={t('auth.password')} rules={[{ required: true, message: t('form.required') }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" dir="ltr" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={busy}>
            {t('auth.login')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
