import { ReactNode, useState } from 'react';
import { Alert, App, Button, Card, Col, Descriptions, Empty, Progress, Row, Typography, Upload } from 'antd';
import { FilePdfOutlined, PlayCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { api, TrainingModule } from '../../api';
import { useI18n } from '../../i18n';
import { fmtBytes } from '../../utils/format';

type Kind = 'video' | 'pdf';

const ACCEPT: Record<Kind, string> = {
  video: 'video/*,.mp4,.mov,.m4v,.webm,.mkv,.3gp',
  pdf: 'application/pdf,.pdf',
};
// Defaults of MAX_VIDEO_MB / MAX_PDF_MB in lms-backend/.env (shown as a hint only; the server enforces it).
const MAX_MB: Record<Kind, number> = { video: 500, pdf: 50 };

export function ContentTab({ module, onSaved }: { module: TrainingModule; onSaved: (m: TrainingModule) => void }) {
  const { t } = useI18n();
  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Alert type="info" showIcon message={t('content.versionNote')} />
      </Col>
      <Col xs={24} lg={12}>
        <FileCard kind="video" module={module} onSaved={onSaved} title={t('module.video')} icon={<PlayCircleOutlined />} />
      </Col>
      <Col xs={24} lg={12}>
        <FileCard kind="pdf" module={module} onSaved={onSaved} title={t('module.pdf')} icon={<FilePdfOutlined />} />
      </Col>
    </Row>
  );
}

function FileCard({
  kind,
  module: m,
  onSaved,
  title,
  icon,
}: {
  kind: Kind;
  module: TrainingModule;
  onSaved: (m: TrainingModule) => void;
  title: string;
  icon: ReactNode;
}) {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [progress, setProgress] = useState<number | null>(null);
  const file = m[kind];

  const doUpload = async (f: File) => {
    if (f.size > MAX_MB[kind] * 1024 * 1024) {
      message.error(t('content.tooLarge', { mb: MAX_MB[kind] }));
      return;
    }
    setProgress(0);
    try {
      const res = await (kind === 'video' ? api.uploadVideo : api.uploadPdf)(m.id, f, setProgress);
      message.success(res.message);
      onSaved({ ...m, ...res.data, assignments: m.assignments });
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <Card
      title={
        <span>
          {icon} {title}
        </span>
      }
      extra={
        <Upload
          accept={ACCEPT[kind]}
          showUploadList={false}
          disabled={progress !== null}
          beforeUpload={(f) => {
            void doUpload(f);
            return false; // we upload ourselves (with progress)
          }}
        >
          <Button icon={<UploadOutlined />} type={file ? 'default' : 'primary'} loading={progress !== null}>
            {file ? t('content.replace') : t('content.upload')}
          </Button>
        </Upload>
      }
    >
      {progress !== null && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">{t('content.uploading')}</Typography.Text>
          <Progress percent={progress} />
        </div>
      )}
      {file ? (
        <>
          {kind === 'video' ? (
            <video src={file.url} controls preload="metadata" className="video-preview" />
          ) : (
            <Button href={file.url} target="_blank" rel="noreferrer" icon={<FilePdfOutlined />} style={{ marginBottom: 16 }}>
              {t('content.openPdf')}
            </Button>
          )}
          <Descriptions size="small" column={1} style={{ marginTop: 12 }}>
            <Descriptions.Item label={t('content.fileName')}>{file.originalName}</Descriptions.Item>
            <Descriptions.Item label={t('content.size')}>{fmtBytes(file.sizeBytes)}</Descriptions.Item>
            <Descriptions.Item label={t('content.type')}>{file.mimeType}</Descriptions.Item>
          </Descriptions>
        </>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('content.none', { mb: MAX_MB[kind] })} />
      )}
    </Card>
  );
}
