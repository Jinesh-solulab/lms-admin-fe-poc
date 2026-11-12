import { Link } from 'react-router-dom';
import { Alert, Button, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { FilePdfOutlined, LockFilled, PlayCircleOutlined, QuestionCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { api, ModuleRiderRow, TrainingModule } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../i18n';
import { AssignmentStatusTag, ProgressSteps, STATUS_COLORS } from '../../components/Status';
import { StatusBar } from '../../components/StatusBar';
import { fmtDate } from '../../utils/format';

export function ProgressTab({ module: m }: { module: TrainingModule }) {
  const { t } = useI18n();
  const { data, loading, error, reload } = useAsync(async () => {
    const [stats, rows] = await Promise.all([api.moduleStats(m.id), api.moduleRiders(m.id)]);
    return { stats, rows };
  }, [m.id]);

  const s = data?.stats;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button icon={<ReloadOutlined />} onClick={reload} loading={loading && !!data}>
          {t('common.refresh')}
        </Button>
      </div>
      {error && <Alert type="error" showIcon message={error} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('progress.assignments')} loading={!s} style={{ height: '100%' }}>
            {s && (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Statistic title={t('dash.assigned')} value={s.assigned} />
                  </Col>
                  <Col span={8}>
                    <Statistic title={t('dash.completionRate')} value={s.completionRate} suffix="%" />
                  </Col>
                  <Col span={8}>
                    <Statistic title={t('dash.notStarted')} value={s.notStarted} />
                  </Col>
                </Row>
                <StatusBar completed={s.completed} pending={s.pending} overdue={s.overdue} />
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('progress.content')} loading={!s} style={{ height: '100%' }}>
            {s && (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={
                      <>
                        <PlayCircleOutlined /> {t('progress.videoCompleted')}
                      </>
                    }
                    value={s.videoCompleted}
                    suffix={`/ ${s.assigned}`}
                  />
                  <Typography.Text type="secondary">{t('progress.avgWatched', { n: s.avgVideoPercent })}</Typography.Text>
                </Col>
                <Col span={12}>
                  <Statistic
                    title={
                      <>
                        <FilePdfOutlined /> {t('progress.pdfViewed')}
                      </>
                    }
                    value={s.pdfViewed}
                    suffix={`/ ${s.assigned}`}
                  />
                </Col>
                {s.quiz ? (
                  <>
                    <Col span={12}>
                      <Statistic
                        title={
                          <>
                            <QuestionCircleOutlined /> {t('progress.quizPassed')}
                          </>
                        }
                        value={s.quiz.passed}
                        suffix={`/ ${s.quiz.attempted}`}
                      />
                      <Typography.Text type="secondary">
                        {t('progress.passRate', { n: s.quiz.passRate, failed: s.quiz.failed })}
                      </Typography.Text>
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={t('progress.avgBestScore')}
                        value={s.quiz.avgBestScore ?? '—'}
                        suffix={`/ ${s.quiz.totalQuestions}`}
                      />
                      <Typography.Text type="secondary">
                        {t('progress.passMarkAttempts', { pass: s.quiz.passMark, attempts: s.quiz.totalAttempts })}
                      </Typography.Text>
                    </Col>
                  </>
                ) : (
                  <Col span={24}>
                    <Typography.Text type="secondary">{t('progress.noQuiz')}</Typography.Text>
                  </Col>
                )}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      <Card title={t('progress.perRider')} styles={{ body: { padding: 0 } }}>
        <Table<ModuleRiderRow>
          rowKey={(r) => r.rider?.id || r.progress.moduleId + r.dueAt}
          loading={!data && loading}
          dataSource={data?.rows || []}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          columns={[
            {
              title: t('rider.rider'),
              render: (_, r) =>
                r.rider ? (
                  <div>
                    <Link to={`/riders/${r.rider.id}`}>{r.rider.name || r.rider.phone}</Link>{' '}
                    {r.rider.isBlocked && (
                      <Tag color="error" icon={<LockFilled />}>
                        {t('rider.blocked')}
                      </Tag>
                    )}
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }} dir="ltr">
                        {r.rider.phone}
                      </Typography.Text>
                    </div>
                  </div>
                ) : (
                  '—'
                ),
            },
            { title: t('rider.city'), width: 110, render: (_, r) => r.rider?.city || '—' },
            {
              title: t('dash.status'),
              dataIndex: 'status',
              width: 130,
              filters: [
                { text: t('status.pending'), value: 'assigned' },
                { text: t('status.completed'), value: 'completed' },
                { text: t('status.overdue'), value: 'overdue' },
              ],
              onFilter: (v, r) => r.status === v,
              render: (_, r) => <AssignmentStatusTag status={r.status} />,
            },
            { title: t('progress.progress'), width: 240, render: (_, r) => <ProgressSteps p={r.progress} /> },
            {
              title: t('assign.dueAt'),
              dataIndex: 'dueAt',
              width: 170,
              sorter: (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
              render: (d: string, r) => (
                <Typography.Text style={r.status === 'overdue' ? { color: STATUS_COLORS.critical } : undefined}>{fmtDate(d)}</Typography.Text>
              ),
            },
            { title: t('progress.completedAt'), dataIndex: 'completedAt', width: 170, render: (d: string | null) => fmtDate(d) },
          ]}
        />
      </Card>
    </Space>
  );
}
