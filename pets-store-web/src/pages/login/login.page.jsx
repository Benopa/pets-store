import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { loginAuth } from '@/entities/auth';

const { Title, Text } = Typography;

export const LoginPage = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const { notification } = App.useApp();

  const handleFinish = async ({ email, password }) => {
    const result = await dispatch(loginAuth({ email, password }));
    // Бэкенд отдаёт 401; из соображений безопасности не уточняем, что именно неверно.
    if (loginAuth.rejected.match(result)) {
      notification.error({
        message: 'Ошибка входа',
        description: 'Неправильный логин или пароль',
        // По центру экрана, чтобы сразу привлечь внимание.
        placement: 'top',
        top: Math.max(24, window.innerHeight / 2 - 60),
      });
    }
  };

  return (
    <div className="min-h-dvh md:min-h-[calc(100dvh-8rem)] grid place-items-center bg-white md:bg-transparent -mx-4 -my-8 md:mx-0 md:my-0 px-6 py-8">
      <Card
        className="w-full max-w-sm border-0! md:border! shadow-none md:shadow-lg bg-transparent! md:bg-white! rounded-none! md:rounded-lg!"
        classNames={{ body: 'p-0! md:p-8!' }}
      >
        <div className="text-center mb-6">
          <div className="md:hidden mb-2 text-lg font-semibold text-stone-800">Pets Store</div>
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-[#9850fd] text-white text-2xl mx-auto mb-3">
            🐾
          </span>
          <Title level={3} className="!mb-1">
            Вход
          </Title>
          <Text type="secondary" className="hidden md:block">
            Войдите, чтобы посмотреть каталог
          </Text>
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

          <div className="text-right -mt-2">
            <Link to="/forgot-password" className="text-[#9850fd] text-sm">
              Забыли пароль?
            </Link>
          </div>

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
