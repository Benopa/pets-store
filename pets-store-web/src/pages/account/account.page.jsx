import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  IdcardOutlined,
  HeartOutlined,
  HistoryOutlined,
  ShoppingOutlined,
  ShopOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { fetchMe, updateProfile, changePassword } from '@/entities/auth';
import { fetchOrders, fetchSales } from '@/entities/order';
import { API_ORIGIN } from '@/shared/config';
import { ContactForm } from './components/contact-form';
import { FavoritesGrid } from './components/favorites-grid';
import { PurchaseHistory } from './components/purchase-history';
import { SalesHistory } from './components/sales-history';
import { ProductsManager } from './components/products-manager';
import { ModeratorsManager } from './components/moderators-manager';
import { StoresManager } from './components/stores-manager';

const { Title, Text } = Typography;

// Человекочитаемые роли + цвета тегов
const ROLE_META = {
  admin: { label: 'Администратор', color: 'red' },
  moderator: { label: 'Модератор', color: 'cyan' },
  seller: { label: 'Продавец', color: 'gold' },
  buyer: { label: 'Покупатель', color: 'purple' },
};

export const AccountPage = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [passwordForm] = Form.useForm();

  const { email, firstName, lastName, role, avatar, apiKey, loading, changingPassword } =
    useSelector((state) => state.auth);
  const orders = useSelector((state) => state.orders.items);
  const sales = useSelector((state) => state.orders.sales);
  const favIds = useSelector((state) => state.favorites.ids);

  // Профиль и заказы подтягиваем при входе в кабинет
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    if (!apiKey) return;
    dispatch(fetchOrders());
    // Продавцу дополнительно — история его продаж (товары, которые у него купили).
    if (role === 'seller') dispatch(fetchSales());
  }, [dispatch, apiKey, role]);

  const initialLoading = loading && !email;
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Без имени';
  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((s) => s[0]?.toUpperCase())
      .join('') || null;
  const roleMeta = ROLE_META[role] ?? { label: role ?? '—', color: 'default' };
  const avatarSrc = avatar ? `${API_ORIGIN}${avatar}` : null;
  const canSwitchType = role === 'buyer' || role === 'seller';
  const isAdmin = role === 'admin';
  const isSeller = role === 'seller';
  const isModerator = role === 'moderator';
  const isStaff = isAdmin || isModerator; // персонал — не покупает и не продаёт
  const canManage = isAdmin || isSeller;

  const favCount = favIds.length;
  // Покупателю показываем покупки и потраченное, продавцу — продажи и выручку.
  const purchasesCount = orders.length;
  const spent = orders.reduce((sum, o) => sum + (o.total != null ? Number(o.total) : 0), 0);
  const salesCount = sales.length;
  const revenue = sales.reduce((sum, s) => sum + (s.total != null ? Number(s.total) : 0), 0);

  const handleRoleChange = async (value) => {
    if (value === role) return;
    const result = await dispatch(updateProfile({ role: value }));
    if (updateProfile.fulfilled.match(result)) {
      message.success(value === 'seller' ? 'Теперь вы продавец' : 'Теперь вы покупатель');
    } else {
      message.error(result.payload || 'Не удалось сменить тип');
    }
  };

  const handleChangePassword = async (values) => {
    const result = await dispatch(
      changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    );
    if (changePassword.fulfilled.match(result)) {
      message.success('Пароль изменён');
      passwordForm.resetFields();
    } else {
      message.error(result.payload || 'Не удалось сменить пароль');
    }
  };

  const securityTab = (
    <Card className="border border-stone-200" styles={{ body: { padding: 24 } }}>
      <Form
        form={passwordForm}
        layout="vertical"
        requiredMark={false}
        onFinish={handleChangePassword}
        className="max-w-md"
      >
        <Form.Item
          name="currentPassword"
          label="Текущий пароль"
          rules={[{ required: true, message: 'Введите текущий пароль' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-stone-400" />}
            size="large"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="Новый пароль"
          rules={[
            { required: true, message: 'Введите новый пароль' },
            { min: 6, message: 'Минимум 6 символов' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-stone-400" />}
            size="large"
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Повторите новый пароль"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Повторите новый пароль' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Пароли не совпадают'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-stone-400" />}
            size="large"
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </Form.Item>
        <Form.Item className="!mb-0">
          <Button type="primary" htmlType="submit" size="large" loading={changingPassword}>
            Сменить пароль
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 mb-4 text-stone-500 hover:text-[#9850fd] transition-colors"
      >
        <ArrowLeftOutlined /> В каталог
      </Link>

      {/* Шапка профиля со статистикой */}
      <Card className="border border-stone-200 mb-6" styles={{ body: { padding: 24 } }}>
        {initialLoading ? (
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  size={64}
                  src={avatarSrc}
                  className="!bg-[#9850fd] !text-xl"
                  icon={!avatarSrc && !initials && <UserOutlined />}
                >
                  {!avatarSrc && initials}
                </Avatar>
                <div className="min-w-0">
                  <Title level={3} className="!mb-1">
                    {fullName}
                  </Title>
                  <Space size="small" wrap>
                    <Tag color={roleMeta.color} className="!mr-0">
                      {roleMeta.label}
                    </Tag>
                    <Text type="secondary" className="break-all">
                      {email}
                    </Text>
                  </Space>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                {canSwitchType && (
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-xs">
                      Тип аккаунта
                    </Text>
                    <Segmented
                      value={role}
                      onChange={handleRoleChange}
                      options={[
                        { label: 'Покупатель', value: 'buyer' },
                        { label: 'Продавец', value: 'seller' },
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>

            {!isStaff && (
              <>
                <Divider className="!my-5" />

                <Row gutter={16}>
                  <Col span={isSeller ? 12 : 8}>
                    <Statistic
                      title={isSeller ? 'Продаж' : 'Покупок'}
                      value={isSeller ? salesCount : purchasesCount}
                      prefix={<ShoppingOutlined className="text-stone-400" />}
                    />
                  </Col>
                  {/* Избранное — только у покупателя; у продавца его нет. */}
                  {!isSeller && (
                    <Col span={8}>
                      <Statistic
                        title="В избранном"
                        value={favCount}
                        prefix={<HeartOutlined className="text-stone-400" />}
                      />
                    </Col>
                  )}
                  <Col span={isSeller ? 12 : 8}>
                    <Statistic
                      title={isSeller ? 'Выручка' : 'Потрачено'}
                      value={isSeller ? revenue : spent}
                      suffix="₽"
                    />
                  </Col>
                </Row>
              </>
            )}
          </>
        )}
      </Card>

      <Title level={2} className="!mb-6 !font-light">
        Личный кабинет
      </Title>

      <Tabs
        defaultActiveKey="contacts"
        size="large"
        items={[
          {
            key: 'contacts',
            label: (
              <span>
                <IdcardOutlined /> Контактные данные
              </span>
            ),
            children: initialLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <ContactForm />
            ),
          },
          isAdmin && {
            key: 'moderators',
            label: (
              <span>
                <TeamOutlined /> Модераторы
              </span>
            ),
            children: <ModeratorsManager />,
          },
          canManage && {
            key: 'products',
            label: (
              <span>
                <ShopOutlined /> {isAdmin ? 'Управление товарами' : 'Мои товары'}
              </span>
            ),
            children: <ProductsManager />,
          },
          isAdmin && {
            key: 'stores',
            label: (
              <span>
                <ShoppingOutlined /> Магазины
              </span>
            ),
            children: <StoresManager />,
          },
          // Избранное доступно только покупателю (не персоналу и не продавцу).
          !isStaff &&
            !isSeller && {
              key: 'favorites',
              label: (
                <span>
                  <HeartOutlined /> Избранное
                </span>
              ),
              children: <FavoritesGrid />,
            },
          !isStaff && {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> {isSeller ? 'История продаж' : 'История покупок'}
              </span>
            ),
            children: isSeller ? <SalesHistory /> : <PurchaseHistory />,
          },
          {
            key: 'security',
            label: (
              <span>
                <LockOutlined /> Безопасность
              </span>
            ),
            children: securityTab,
          },
        ].filter(Boolean)}
      />
    </div>
  );
};
