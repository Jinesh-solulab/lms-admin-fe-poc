import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, Dropdown, Grid, Layout, Menu, Segmented, Space, Typography } from 'antd';
import {
  BookOutlined,
  DashboardOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { api, Lang, LANGS } from '../api';
import { useAuth } from '../auth';
import { LANG_NATIVE, useI18n } from '../i18n';

const { Header, Sider, Content } = Layout;

export function LanguageSwitch() {
  const { lang, setLang } = useI18n();
  const { user } = useAuth();
  return (
    <Segmented<Lang>
      size="small"
      value={lang}
      options={LANGS.map((l) => ({ label: LANG_NATIVE[l], value: l }))}
      onChange={(l) => {
        setLang(l);
        // Saved on the admin's profile so API messages follow it.
        if (user) api.setLanguage(l).catch(() => undefined);
      }}
    />
  );
}

export function AppLayout() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [collapsed, setCollapsed] = useState(false);

  const section = '/' + (location.pathname.split('/')[1] || 'dashboard');
  const items = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">{t('nav.dashboard')}</Link> },
    { key: '/modules', icon: <BookOutlined />, label: <Link to="/modules">{t('nav.modules')}</Link> },
    { key: '/riders', icon: <TeamOutlined />, label: <Link to="/riders">{t('nav.riders')}</Link> },
    { key: '/block-logs', icon: <HistoryOutlined />, label: <Link to="/block-logs">{t('nav.blockLogs')}</Link> },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        collapsed={isMobile ? collapsed : false}
        onCollapse={setCollapsed}
        trigger={null}
        width={232}
        theme="light"
        className="app-sider"
      >
        <div className="brand">
          <span className="brand-mark">L</span>
          <div>
            <div className="brand-title">{t('app.name')}</div>
            <div className="brand-sub">{t('app.adminPanel')}</div>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[section]}
          items={items}
          onClick={() => isMobile && setCollapsed(true)}
          style={{ borderInlineEnd: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space>
            {isMobile && <Button type="text" icon={<MenuOutlined />} onClick={() => setCollapsed((c) => !c)} />}
          </Space>
          <Space size="middle">
            <LanguageSwitch />
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: t('auth.logout'),
                    onClick: () => {
                      logout();
                      navigate('/login');
                    },
                  },
                ],
              }}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                {!isMobile && <Typography.Text>{user?.name || user?.email}</Typography.Text>}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
