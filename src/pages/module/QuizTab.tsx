import { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Col, Empty, Form, Input, InputNumber, Radio, Row, Space, Tooltip, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, MinusCircleOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { api, Localized, TrainingModule } from '../../api';
import { useI18n } from '../../i18n';
import { LocalizedFields } from '../../components/LocalizedFields';

interface QuestionValue {
  id?: string;
  text: Localized;
  options: Localized[];
  correctIndex: number;
}
interface Values {
  passMark: number;
  questions: QuestionValue[];
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const blank = (): Localized => ({ en: '', ar: '', ur: '' });
const emptyQuestion = (): QuestionValue => ({ text: blank(), options: [blank(), blank(), blank()], correctIndex: 0 });
const trim = (l: Localized): Localized => ({ en: (l?.en || '').trim(), ar: (l?.ar || '').trim(), ur: (l?.ur || '').trim() });

export function QuizTab({ module: m, onSaved }: { module: TrainingModule; onSaved: (m: TrainingModule) => void }) {
  const { t } = useI18n();
  const { message } = App.useApp();
  // Untyped form on purpose: nested list paths like ['questions', 0, 'correctIndex'] fight antd's typed NamePath.
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const questions = Form.useWatch('questions', form) as QuestionValue[] | undefined;
  const count = questions?.length ?? m.quiz?.totalQuestions ?? 0;

  const initial: Values = m.quiz
    ? {
        passMark: m.quiz.passMark,
        questions: m.quiz.questions.map((q) => ({ id: q.id, text: q.text, options: q.options, correctIndex: q.correctIndex })),
      }
    : { passMark: 1, questions: [] };

  // After a save the server returns ids for new questions: reload the form from it so the next save keeps them.
  useEffect(() => {
    form.resetFields();
  }, [m.updatedAt, form]);

  const correctPath = (qi: number) => ['questions', qi, 'correctIndex'];

  const save = async () => {
    let v: Values;
    try {
      v = (await form.validateFields()) as Values;
    } catch {
      message.error(t('form.fixErrors'));
      return;
    }
    const qs = v.questions || [];
    if (!qs.length) {
      message.error(t('quiz.needQuestion'));
      return;
    }
    if (v.passMark > qs.length) {
      message.error(t('quiz.passMarkTooHigh', { n: qs.length }));
      return;
    }
    setBusy(true);
    try {
      const res = await api.saveQuiz(m.id, {
        passMark: v.passMark,
        questions: qs.map((q) => ({
          // Keep existing ids so answers from phones that are still offline match after the edit.
          ...(q.id ? { id: q.id } : {}),
          text: trim(q.text),
          options: q.options.map(trim),
          correctIndex: Math.min(q.correctIndex ?? 0, q.options.length - 1),
        })),
      });
      message.success(res.message);
      onSaved({ ...m, ...res.data, assignments: m.assignments });
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={initial}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert type="info" showIcon message={t('quiz.help')} />

        <Form.List name="questions">
          {(fields, { add, remove, move }) => (
            <>
              {!fields.length && (
                <Card>
                  <Empty description={t('quiz.empty')} />
                </Card>
              )}
              {fields.map((field, qi) => (
                <Card
                  key={field.key}
                  size="small"
                  title={t('quiz.question', { n: qi + 1 })}
                  extra={
                    <Space size={4}>
                      <Tooltip title={t('quiz.moveUp')}>
                        <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={qi === 0} onClick={() => move(qi, qi - 1)} />
                      </Tooltip>
                      <Tooltip title={t('quiz.moveDown')}>
                        <Button
                          size="small"
                          type="text"
                          icon={<ArrowDownOutlined />}
                          disabled={qi === fields.length - 1}
                          onClick={() => move(qi, qi + 1)}
                        />
                      </Tooltip>
                      <Tooltip title={t('quiz.removeQuestion')}>
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(qi)} />
                      </Tooltip>
                    </Space>
                  }
                >
                  <Form.Item name={[field.name, 'id']} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name={[field.name, 'correctIndex']} hidden>
                    <InputNumber />
                  </Form.Item>

                  <LocalizedFields name={[field.name, 'text']} label={t('quiz.questionText')} required />

                  <div style={{ marginBottom: 8 }}>
                    <Typography.Text strong>{t('quiz.options')}</Typography.Text>{' '}
                    <Typography.Text type="secondary">{t('quiz.markCorrect')}</Typography.Text>
                  </div>

                  <Form.List name={[field.name, 'options']}>
                    {(optFields, { add: addOpt, remove: removeOpt }) => (
                      <>
                        {optFields.map((of, oi) => (
                          <Row key={of.key} gutter={8} wrap={false} align="top">
                            <Col flex="none" style={{ paddingTop: 5 }}>
                              <Form.Item noStyle shouldUpdate>
                                {() => (
                                  <Tooltip title={t('quiz.correct')}>
                                    <Radio
                                      checked={form.getFieldValue(correctPath(field.name)) === oi}
                                      onChange={() => form.setFieldValue(correctPath(field.name), oi)}
                                    />
                                  </Tooltip>
                                )}
                              </Form.Item>
                            </Col>
                            <Col flex="auto">
                              <Row gutter={8}>
                                <Col xs={24} md={8}>
                                  <Form.Item
                                    name={[of.name, 'en']}
                                    rules={[{ required: true, whitespace: true, message: t('form.required') }]}
                                  >
                                    <Input dir="ltr" placeholder={`${t('quiz.option', { n: oi + 1 })} · ${t('lang.en')}`} />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                  <Form.Item
                                    name={[of.name, 'ar']}
                                    rules={[{ required: true, whitespace: true, message: t('form.required') }]}
                                  >
                                    <Input dir="rtl" placeholder={`${t('quiz.option', { n: oi + 1 })} · ${t('lang.ar')}`} />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                  {/* Urdu is optional: riders see English when empty */}
                                  <Form.Item name={[of.name, 'ur']}>
                                    <Input dir="rtl" placeholder={`${t('quiz.option', { n: oi + 1 })} · ${t('lang.ur')}`} />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </Col>
                            <Col flex="none">
                              <Tooltip title={t('quiz.removeOption')}>
                                <Button
                                  type="text"
                                  icon={<MinusCircleOutlined />}
                                  disabled={optFields.length <= MIN_OPTIONS}
                                  onClick={() => {
                                    // Keep correctIndex pointing at the same option after the list shifts.
                                    const ci: number = form.getFieldValue(correctPath(field.name)) ?? 0;
                                    removeOpt(of.name);
                                    if (ci === oi) form.setFieldValue(correctPath(field.name), 0);
                                    else if (ci > oi) form.setFieldValue(correctPath(field.name), ci - 1);
                                  }}
                                />
                              </Tooltip>
                            </Col>
                          </Row>
                        ))}
                        {optFields.length < MAX_OPTIONS && (
                          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addOpt(blank())}>
                            {t('quiz.addOption')}
                          </Button>
                        )}
                      </>
                    )}
                  </Form.List>
                </Card>
              ))}
              <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(emptyQuestion())}>
                {t('quiz.addQuestion')}
              </Button>
            </>
          )}
        </Form.List>

        <Card>
          <Row gutter={16} align="bottom">
            <Col xs={24} md={10}>
              <Form.Item
                name="passMark"
                label={t('quiz.passMark')}
                extra={t('quiz.passMarkHelp', { n: count })}
                rules={[{ required: true, message: t('form.required') }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={1} max={Math.max(count, 1)} addonAfter={t('quiz.ofN', { n: count })} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={14} style={{ textAlign: 'end' }}>
              <Button type="primary" icon={<SaveOutlined />} loading={busy} onClick={save}>
                {t('quiz.save')}
              </Button>
            </Col>
          </Row>
        </Card>
      </Space>
    </Form>
  );
}
