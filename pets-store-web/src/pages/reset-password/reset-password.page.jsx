import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { App, Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { resetPassword } from '@/entities/auth';

const { Title, Text } = Typography;

export const ResetPasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);

  const handleFinish = async ({ password }) => {
    setLoading(true);
    const result = await dispatch(resetPassword({ token, password }));
    setLoading(false);
    if (resetPassword.rejected.match(result)) {
      notification.error({
        message: 'Не удалось сбросить пароль',
        // Бэкенд отдаёт понятный русский текст (например, «Ссылка недействительна или устарела»).
        description: result.payload || 'Попробуйте запросить ссылку ещё раз.',
        placement: 'top',
        top: Math.max(24, window.innerHeight / 2 - 60),
      });
      return;
    }
    notification.success({
      message: 'Пароль обновлён',
      description: 'Теперь войдите с новым паролем.',
      placement: 'top',
      top: Math.max(24, window.innerHeight / 2 - 60),
    });
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] grid place-items-center px-4">
      <Card className="w-full max-w-sm shadow-lg" styles={{ body: { padding: 32 } }}>
        <div className="text-center mb-6">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-[#9850fd] text-white text-2xl mx-auto mb-3">
            🔑
          </span>
          <Title level={3} className="!mb-1">
            Новый пароль
          </Title>
          <Text type="secondary">Придумайте новый пароль для входа</Text>
        </div>

        {token ? (
          <Form layout="vertical" requiredMark={false} onFinish={handleFinish}>
            <Form.Item
              name="password"
              label="Новый пароль"
              rules={[
                { required: true, message: 'Введите пароль' },
                { min: 6, message: 'Минимум 6 символов' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-stone-400" />}
                placeholder="••••••••"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="Повторите пароль"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Повторите пароль' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Пароли не совпадают'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-stone-400" />}
                placeholder="••••••••"
                size="large"
              />
            </Form.Item>

            <Form.Item className="!mb-0 !mt-6">
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                Сохранить пароль
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Alert
            type="error"
            showIcon
            message="Ссылка недействительна"
            description="Похоже, в ссылке нет токена. Запросите восстановление пароля заново."
          />
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
