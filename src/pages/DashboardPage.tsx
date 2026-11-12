import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, App, Button, Card, Col, Progress, Row, Space, Statistic, Switch, Table, Typography } from 'antd';
import {
  BookOutlined,
  LockFilled,
  ReloadOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { api, CityRow, DashboardSummary, TrainingModule } from '../api';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../i18n';
import { StatusBar } from '../components/StatusBar';
import { STATUS_COLORS } from '../components/Status';
import { fmtDate, pct } from '../utils/format';

const REFRESH_MS = 15_000;

interface DashboardData {
  summary: DashboardSummary;
  cities: CityRow[];
  modules: TrainingModule[];
}

export function DashboardPage() {
  const { t, pick } = useI18n();
  const { message } = App.useApp();
  const [auto, setAuto] = useState(true);
  const [running, setRunning] = useState(false);

  const { data, loading, error, reload } = useAsync<DashboardData>(async () => {
    const [summary, cities, modules] = await Promise.all([api.summary(), api.byCity(), api.modules()]);
    return { summary, cities, modules };
  });

  // Auto refresh so offline syncs from the phone show up during the demo without touching the page.
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(reload, REFRESH_MS);
    return () => clearInterval(id);
  }, [auto, reload]);

  const runCheck = async () => {
    setRunning(true);
    try {
      const r = await api.runDeadlineCheck();
      message.success(r.message);
      reload();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const s = data?.summary;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div className="page-head">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('dash.title')}
          </Typography.Title>
          <Typography.Text type="secondary">
            {s ? t('dash.updatedAt', { time: fmtDate(s.generatedAt) }) : t('common.loading')}
          </Typography.Text>
        </div>
        <Space wrap>
          <Space size={6}>
            <Switch size="small" checked={auto} onChange={setAuto} />
            <Typography.Text type="secondary">{t('dash.autoRefresh')}</Typography.Text>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={reload} loading={loading && !!data}>
            {t('common.refresh')}
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={runCheck} loading={running}>
            {t('dash.runDeadlineCheck')}
          </Button>
        </Space>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card loading={!s}>
            <Statistic title={t('dash.totalRiders')} value={s?.totalRiders} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={!s}>
            <Statistic title={t('dash.activeRiders')} value={s?.activeRiders} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={!s}>
            <Statistic
              title={t('dash.blockedRiders')}
              value={s?.blockedRiders}
              prefix={<LockFilled style={{ color: STATUS_COLORS.critical }} />}
            />
            {s && s.blockedRiders > 0 && (
              <Link to="/riders?status=blocked">
                <Typography.Text style={{ fontSize: 12 }}>{t('dash.viewBlocked')}</Typography.Text>
              </Link>
            )}
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={!s}>
            <Statistic title={t('dash.activeModules')} value={s?.totalModules} prefix={<BookOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title={t('dash.completionTitle')} loading={!s}>
        {s && (
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={6}>
              <Statistic title={t('dash.completionRate')} value={s.completionRate} suffix="%" />
              <Typography.Text type="secondary">
                {t('dash.completedOf', { done: s.completed, total: s.totalAssignments })}
              </Typography.Text>
            </Col>
            <Col xs={24} md={18}>
              <StatusBar completed={s.completed} pending={s.pending} overdue={s.overdue} height={16} />
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={12} md={6}>
                  <Statistic title={t('dash.inProgress')} value={s.inProgress} valueStyle={{ fontSize: 20 }} />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic title={t('dash.notStarted')} value={s.notStarted} valueStyle={{ fontSize: 20 }} />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic title={t('dash.overdueRate')} value={s.overdueRate} suffix="%" valueStyle={{ fontSize: 20 }} />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic title={t('dash.assignments')} value={s.totalAssignments} valueStyle={{ fontSize: 20 }} />
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title={t('dash.byModule')} styles={{ body: { padding: 0 } }}>
            <Table<TrainingModule>
              rowKey="id"
              size="middle"
              loading={!data && loading}
              dataSource={data?.modules || []}
              pagination={false}
              scroll={{ x: 520 }}
              columns={[
                {
                  title: t('module.title'),
                  render: (_, m) => <Link to={`/modules/${m.id}?tab=progress`}>{pick(m.title)}</Link>,
                },
                {
                  title: t('dash.assigned'),
                  align: 'end',
                  width: 90,
                  render: (_, m) => m.assignments?.total ?? 0,
                },
                {
                  title: t('dash.status'),
                  width: 220,
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
                  title: t('dash.completionRate'),
                  align: 'end',
                  width: 110,
                  render: (_, m) => `${pct(m.assignments?.completed ?? 0, m.assignments?.total ?? 0)}%`,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('dash.byCity')} styles={{ body: { padding: 0 } }}>
            <Table<CityRow>
              rowKey="city"
              size="middle"
              loading={!data && loading}
              dataSource={data?.cities || []}
              pagination={false}
              scroll={{ x: 560 }}
              columns={[
                {
                  title: t('rider.city'),
                  dataIndex: 'city',
                  render: (c: string) => <Link to={`/riders?city=${encodeURIComponent(c)}`}>{c === 'Unknown' ? t('common.unknown') : c}</Link>,
                },
                { title: t('dash.riders'), dataIndex: 'riders', align: 'end', width: 80 },
                {
                  title: t('dash.blocked'),
                  dataIndex: 'blockedRiders',
                  align: 'end',
                  width: 90,
                  render: (v: number) =>
                    v ? (
                      <Typography.Text>
                        <LockFilled style={{ color: STATUS_COLORS.critical }} /> {v}
                      </Typography.Text>
                    ) : (
                      0
                    ),
                },
                { title: t('status.completed'), dataIndex: 'completed', align: 'end', width: 100 },
                { title: t('status.overdue'), dataIndex: 'overdue', align: 'end', width: 90 },
                {
                  title: t('dash.completionRate'),
                  dataIndex: 'completionRate',
                  width: 150,
                  render: (v: number) => <Progress percent={v} size="small" strokeColor={STATUS_COLORS.good} />,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
