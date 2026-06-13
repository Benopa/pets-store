import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Card, DatePicker, Form, Input, Segmented, Typography } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { registerAuth } from '../../features';

const { Title, Text } = Typography;

export const RegisterPage = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleFinish = ({ firstName, lastName, birthDate, email, password, role }) => {
    dispatch(
      registerAuth({
        firstName,
        lastName,
        // DatePicker отдаёт dayjs — приводим к формату YYYY-MM-DD для бэкенда.
        birthDate: birthDate.format('YYYY-MM-DD'),
        email,
        password,
        role,
      }),
    );
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] grid place-items-center px-4 py-8">
      <Card className="w-full max-w-md shadow-lg" styles={{ body: { padding: 32 } }}>
        <div className="text-center mb-6">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-[#9850fd] text-white text-2xl mx-auto mb-3">
            🐾
          </span>
          <Title level={3} className="!mb-1">
            Регистрация
          </Title>
          <Text type="secondary">Создайте аккаунт покупателя или продавца</Text>
        </div>

        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={handleFinish}
          initialValues={{ role: 'buyer' }}
        >
          <Form.Item name="role" label="Я регистрируюсь как">
            <Segmented
              block
              options={[
                { label: 'Покупатель', value: 'buyer' },
                { label: 'Продавец', value: 'seller' },
              ]}
            />
          </Form.Item>

          <div className="flex gap-3">
            <Form.Item
              name="firstName"
              label="Имя"
              className="flex-1"
              rules={[{ required: true, message: 'Введите имя' }]}
            >
              <Input
                prefix={<UserOutlined className="text-stone-400" />}
                placeholder="Иван"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Фамилия"
              className="flex-1"
              rules={[{ required: true, message: 'Введите фамилию' }]}
            >
              <Input placeholder="Иванов" size="large" />
            </Form.Item>
          </div>

          <Form.Item
            name="birthDate"
            label="Дата рождения"
            rules={[{ required: true, message: 'Укажите дату рождения' }]}
          >
            <DatePicker
              className="w-full"
              size="large"
              format="DD.MM.YYYY"
              placeholder="дд.мм.гггг"
              suffixIcon={<CalendarOutlined className="text-stone-400" />}
              // запрещаем выбор будущих дат
              disabledDate={(current) => current && current.valueOf() > Date.now()}
            />
          </Form.Item>

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
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Text type="secondary">Уже есть аккаунт? </Text>
          <Link to="/login" className="text-[#9850fd]">
            Войти
          </Link>
        </div>
      </Card>
    </div>
  );
};
