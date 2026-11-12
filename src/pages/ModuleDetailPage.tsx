import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Breadcrumb, Skeleton, Space, Tabs, Tag, Typography } from 'antd';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../i18n';
import { DetailsTab } from './module/DetailsTab';
import { ContentTab } from './module/ContentTab';
import { QuizTab } from './module/QuizTab';
import { AssignTab } from './module/AssignTab';
import { ProgressTab } from './module/ProgressTab';

const TABS = ['details', 'content', 'quiz', 'assign', 'progress'] as const;

export function ModuleDetailPage() {
  const { id = '' } = useParams();
  const { t, pick } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab = (TABS as readonly string[]).includes(params.get('tab') || '') ? params.get('tab')! : 'details';
  const { data: m, setData, loading, error } = useAsync(() => api.module(id), [id]);

  if (error) return <Alert type="error" showIcon message={error} />;
  if (loading && !m) return <Skeleton active />;
  if (!m) return null;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb items={[{ title: <Link to="/modules">{t('nav.modules')}</Link> }, { title: pick(m.title) }]} />
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {pick(m.title)}
          </Typography.Title>
          <Space size={4} style={{ marginTop: 4 }}>
            {m.isActive ? <Tag color="success">{t('module.active')}</Tag> : <Tag>{t('module.inactive')}</Tag>}
            <Tag>{`v${m.version}`}</Tag>
            <Typography.Text type="secondary">{t('module.deadlineDaysValue', { n: m.deadlineDays })}</Typography.Text>
          </Space>
        </div>
      </div>

      <Tabs
        activeKey={tab}
        onChange={(k) => setParams({ tab: k }, { replace: true })}
        destroyInactiveTabPane
        items={[
          { key: 'details', label: t('module.tab.details'), children: <DetailsTab module={m} onSaved={setData} /> },
          { key: 'content', label: t('module.tab.content'), children: <ContentTab module={m} onSaved={setData} /> },
          { key: 'quiz', label: t('module.tab.quiz'), children: <QuizTab module={m} onSaved={setData} /> },
          { key: 'assign', label: t('module.tab.assign'), children: <AssignTab module={m} /> },
          { key: 'progress', label: t('module.tab.progress'), children: <ProgressTab module={m} /> },
        ]}
      />
    </Space>
  );
}
