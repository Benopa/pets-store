import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { loginAuth } from '../../features';

const { Title, Text } = Typography;

export const LoginPage = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleFinish = ({ email, password }) => {
    dispatch(loginAuth({ email, password }));
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] grid place-items-center px-4">
      <Card className="w-full max-w-sm shadow-lg" styles={{ body: { padding: 32 } }}>
        <div className="text-center mb-6">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-[#9850fd] text-white text-2xl mx-auto mb-3">
            🐾
          </span>
          <Title level={3} className="!mb-1">
            Вход
          </Title>
          <Text type="secondary">Войдите, чтобы посмотреть каталог</Text>
        </div>

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
          <Form.Item
            name="password"
            label="Пароль"
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

          {error && <Alert type="error" message={error} showIcon className="mb-4" />}

          <Form.Item className="!mb-0 !mt-6">
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Войти
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Text type="secondary">Нет аккаунта? </Text>
          <Link to="/register" className="text-[#9850fd]">
            Зарегистрироваться
          </Link>
        </div>
      </Card>
    </div>
  );
};
