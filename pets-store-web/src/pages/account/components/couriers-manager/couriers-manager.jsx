import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  App,
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Skeleton,
  Tooltip,
  Typography,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  KeyOutlined,
  PlusOutlined,
  DeleteOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { fetchCouriers, createCourier, deleteCourier } from '@/entities/courier';

const { Title, Text } = Typography;

const fullName = (c) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'Доставщик';

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
};

export const CouriersManager = () => {
  const dispatch = useDispatch();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const { items, loading, creating } = useSelector((state) => state.couriers);

  useEffect(() => {
    dispatch(fetchCouriers());
  }, [dispatch]);

  const handleFinish = async (vals) => {
    const name = vals.name.trim();
    const [firstName, ...rest] = name.split(' ');
    const result = await dispatch(
      createCourier({
        email: vals.login.trim(),
        password: vals.password,
        firstName: firstName || undefined,
        lastName: rest.join(' ') || undefined,
      }),
    );
    if (createCourier.fulfilled.match(result)) {
      form.resetFields();
      message.success('Доставщик создан');
    } else {
      message.error(result.payload || 'Не удалось создать доставщика');
    }
  };

  const confirmDelete = (c) => {
    modal.confirm({
      title: `Удалить доставщика «${fullName(c)}»?`,
      content: 'Он потеряет доступ к разделу доставки.',
      okText: 'Удалить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: async () => {
        const result = await dispatch(deleteCourier(c.id));
        if (deleteCourier.fulfilled.match(result)) {
          message.success('Доставщик удалён');
        } else {
          message.error(result.payload || 'Не удалось удалить доставщика');
        }
      },
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {/* Создание */}
      <Card className="border border-stone-200" styles={{ body: { padding: 24 } }}>
        <Title level={4} className="!mt-0 !mb-1">
          Новый доставщик
        </Title>
        <Text type="secondary" className="block mb-4">
          Доставщик входит по email и паролю, видит каталог и работает с разделом «Доставка».
        </Text>
        <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
          <Form.Item name="name" label="Имя" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input
              prefix={<UserOutlined className="text-stone-400" />}
              size="large"
              placeholder="Имя доставщика"
            />
          </Form.Item>
          <Form.Item
            name="login"
            label="Логин (email)"
            rules={[
              { required: true, message: 'Введите логин' },
              { type: 'email', message: 'Логин должен быть email' },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-stone-400" />}
              size="large"
              placeholder="courier@example.com"
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
              prefix={<KeyOutlined className="text-stone-400" />}
              size="large"
              placeholder="••••••••"
            />
          </Form.Item>
          <Form.Item className="!mb-0 !mt-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<PlusOutlined />}
              loading={creating}
            >
              Создать доставщика
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Существующие */}
      <Card className="border border-stone-200" styles={{ body: { padding: 24 } }}>
        <Title level={4} className="!mt-0 !mb-4">
          Доставщики{' '}
          <Text type="secondary" className="text-base">
            · {items.length}
          </Text>
        </Title>
        {loading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : items.length === 0 ? (
          <Empty description="Доставщиков пока нет" className="!my-8" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={items}
            renderItem={(c) => (
              <List.Item
                className="!px-0"
                actions={[
                  <Tooltip title="Удалить" key="del">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => confirmDelete(c)}
                    />
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#fa8c16' }} icon={<CarOutlined />} />}
                  title={fullName(c)}
                  description={
                    <span className="text-stone-400">
                      {c.email} · создан {formatDate(c.createdAt)}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};
