import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { App, Alert, Button, Card, Form, Input, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { forgotPassword } from '@/entities/auth';

const { Title, Text } = Typography;

export const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const { notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // Dev-stub: реального письма нет, поэтому ссылку из ответа показываем прямо на экране.
  const [devResetUrl, setDevResetUrl] = useState(null);

  const handleFinish = async ({ email }) => {
    setLoading(true);
    const result = await dispatch(forgotPassword({ email }));
    setLoading(false);
    if (forgotPassword.rejected.match(result)) {
      notification.error({
        message: 'Не удалось отправить ссылку',
        description: 'Попробуйте ещё раз чуть позже.',
        placement: 'top',
        top: Math.max(24, window.innerHeight / 2 - 60),
      });
      return;
    }
    setSent(true);
    setDevResetUrl(result.payload?.resetUrl ?? null);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] grid place-items-center px-4">
      <Card className="w-full max-w-sm shadow-lg" styles={{ body: { padding: 32 } }}>
        <div className="text-center mb-6">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-[#9850fd] text-white text-2xl mx-auto mb-3">
            🔑
          </span>
          <Title level={3} className="!mb-1">
            Восстановление пароля
          </Title>
          <Text type="secondary">Введите email — пришлём ссылку для сброса</Text>
        </div>

        {sent ? (
          <div className="space-y-4">
            <Alert
              type="success"
              showIcon
              message="Проверьте почту"
              description="Если такой email зарегистрирован, мы отправили на него ссылку для сброса пароля."
            />
            {devResetUrl && (
              <Alert
                type="info"
                showIcon
                message="Демо-режим (письмо не отправляется)"
                description={
                  <Link to={devResetUrl.replace(/^.*?(?=\/reset-password)/, '')}>
                    Открыть страницу сброса пароля
                  </Link>
                }
              />
            )}
          </div>
        ) : (
          <Form layout="vertical" requiredMark={false} onFinish={handleFinish}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Введите email' },
                { type: 'email', message: 'Некорректный email' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-stone-400" />}
                placeholder="you@example.com"
                size="large"
              />
            </Form.Item>

            <Form.Item className="!mb-0 !mt-6">
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                Отправить ссылку
              </Button>
            </Form.Item>
          </Form>
        )}

        <div className="text-center mt-4">
          <Link to="/login" className="text-[#9850fd]">
            Вернуться ко входу
          </Link>
        </div>
      </Card>
    </div>
  );
};
