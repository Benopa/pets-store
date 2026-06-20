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
  SafetyOutlined,
} from '@ant-design/icons';
import { fetchModerators, createModerator, deleteModerator } from '@/entities/moderator';

const { Title, Text } = Typography;

const fullName = (m) =>
  [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email || 'Модератор';

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
};

export const ModeratorsManager = () => {
  const dispatch = useDispatch();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const { items, loading, creating } = useSelector((state) => state.moderators);

  useEffect(() => {
    dispatch(fetchModerators());
  }, [dispatch]);

  const handleFinish = async (vals) => {
    const name = vals.name.trim();
    const [firstName, ...rest] = name.split(' ');
    const result = await dispatch(
      createModerator({
        email: vals.login.trim(),
        password: vals.password,
        firstName: firstName || undefined,
        lastName: rest.join(' ') || undefined,
      }),
    );
    if (createModerator.fulfilled.match(result)) {
      form.resetFields();
      message.success('Модератор создан');
    } else {
      message.error(result.payload || 'Не удалось создать модератора');
    }
  };

  const confirmDelete = (m) => {
    modal.confirm({
      title: `Удалить модератора «${fullName(m)}»?`,
      content: 'Он потеряет доступ к проверке товаров.',
      okText: 'Удалить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: async () => {
        const result = await dispatch(deleteModerator(m.id));
        if (deleteModerator.fulfilled.match(result)) {
          message.success('Модератор удалён');
        } else {
          message.error(result.payload || 'Не удалось удалить модератора');
        }
      },
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {/* Создание */}
      <Card className="border border-stone-200" styles={{ body: { padding: 24 } }}>
        <Title level={4} className="!mt-0 !mb-1">
          Новый модератор
        </Title>
        <Text type="secondary" className="block mb-4">
          Модератор входит по email и паролю и проверяет товары продавцов.
        </Text>
        <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
          <Form.Item name="name" label="Имя" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input
              prefix={<UserOutlined className="text-stone-400" />}
              size="large"
              placeholder="Имя модератора"
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
              placeholder="moderator@example.com"
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
              Создать модератора
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Существующие */}
      <Card className="border border-stone-200" styles={{ body: { padding: 24 } }}>
        <Title level={4} className="!mt-0 !mb-4">
          Модераторы{' '}
          <Text type="secondary" className="text-base">
            · {items.length}
          </Text>
        </Title>
        {loading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : items.length === 0 ? (
          <Empty description="Модераторов пока нет" className="!my-8" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={items}
            renderItem={(m) => (
              <List.Item
                className="!px-0"
                actions={[
                  <Tooltip title="Удалить" key="del">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => confirmDelete(m)}
                    />
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ backgroundColor: '#13c2c2' }} icon={<SafetyOutlined />} />
                  }
                  title={fullName(m)}
                  description={
                    <span className="text-stone-400">
                      {m.email} · создан {formatDate(m.createdAt)}
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
