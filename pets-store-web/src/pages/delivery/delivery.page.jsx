import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { App, Badge, Button, Card, Divider, Empty, Select, Skeleton, Tag, Typography } from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { fetchDeliveries, markDelivered } from '@/entities/order';

const { Title, Text } = Typography;

// Логистические статусы заказа, которые видит доставщик.
const STATUS_META = {
  ready: { label: 'Готов к отправке', color: 'warning', icon: <InboxOutlined /> },
  shipped: { label: 'В доставке', color: 'processing', icon: <CarOutlined /> },
  delivered: { label: 'Получен', color: 'success', icon: <CheckCircleOutlined /> },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

const PAYMENT_LABEL = {
  paid: 'Оплачено',
  awaiting: 'Ждём оплату',
  on_delivery: 'Оплата при получении',
};

const buyerNameOf = (buyer) =>
  [buyer?.firstName, buyer?.lastName].filter(Boolean).join(' ') || buyer?.email || 'Покупатель';

export const DeliveryPage = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const { deliveries, deliveriesLoading } = useSelector((state) => state.orders);
  const [status, setStatus] = useState('all');
  const [busyId, setBusyId] = useState(null);

  // Заказы доставки тянем под JWT — ждём, пока появится токен авторизации.
  useEffect(() => {
    if (accessToken) dispatch(fetchDeliveries());
  }, [dispatch, accessToken]);

  const handleDelivered = async (id) => {
    setBusyId(id);
    const result = await dispatch(markDelivered(id));
    setBusyId(null);
    if (markDelivered.fulfilled.match(result)) {
      message.success('Заказ отмечен переданным покупателю');
    } else {
      message.error(result.payload || 'Не удалось отметить заказ');
    }
  };

  const filtered = status === 'all' ? deliveries : deliveries.filter((d) => d.status === status);
  // В доставке — заказы, которые курьер сейчас везёт и может закрыть кнопкой.
  const inDeliveryCount = deliveries.filter((d) => d.status === 'shipped').length;

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 mb-4 text-stone-500 hover:text-[#9850fd] transition-colors"
      >
        <ArrowLeftOutlined /> В каталог
      </Link>

      <div className="mb-2 flex items-center gap-3">
        <Title level={2} className="!mb-0 !font-light">
          Доставка
        </Title>
        <Badge count={inDeliveryCount} color="#9850fd" showZero />
      </div>
      <Text type="secondary" className="mb-6 block">
        Заказы, готовые к отправке и в пути. Доставьте заказ по адресу и отметьте «Передан
        покупателю».
      </Text>

      <div className="mb-4 flex justify-end">
        <Select
          value={status}
          size="large"
          className="sm:w-52"
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
      </div>

      {deliveriesLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : filtered.length === 0 ? (
        <Card className="border border-stone-200">
          <Empty
            image={<CarOutlined style={{ fontSize: 64, color: '#d6d3d1' }} />}
            description="Заказов для доставки нет"
            className="!my-10"
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((order) => {
            const meta = STATUS_META[order.status] ?? STATUS_META.ready;
            const itemsLine =
              (order.items ?? [])
                .map((it) => (it.quantity > 1 ? `${it.name} ×${it.quantity}` : it.name))
                .filter(Boolean)
                .join(', ') || 'Товар';
            const date = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('ru-RU')
              : '';
            return (
              <Card
                key={order.id}
                className="border border-stone-200"
                styles={{ body: { padding: 20 } }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Text strong className="text-base">
                        Заказ №{String(order.id).slice(0, 8)}
                      </Text>
                      <Tag color={meta.color} icon={meta.icon} className="!mr-0">
                        {meta.label}
                      </Tag>
                    </div>
                    <Text type="secondary" className="mt-1 block text-xs">
                      {date} · {buyerNameOf(order.buyer)} ·{' '}
                      {PAYMENT_LABEL[order.paymentStatus] ?? 'Оплата при получении'}
                    </Text>
                  </div>
                  <Text strong className="text-base">
                    {order.total != null ? `${Number(order.total)} ₽` : '—'}
                  </Text>
                </div>

                {/* Адрес — главное для доставщика. */}
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-stone-50 px-4 py-3">
                  <EnvironmentOutlined className="mt-0.5 text-[#9850fd]" />
                  <div className="min-w-0">
                    <Text type="secondary" className="block text-xs">
                      Адрес доставки
                    </Text>
                    <Text strong>{order.address || 'Адрес не указан'}</Text>
                  </div>
                </div>

                <Divider className="!my-3" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Text type="secondary" className="block text-xs">
                      <UserOutlined className="mr-1" />
                      {buyerNameOf(order.buyer)}
                    </Text>
                    <Text className="block truncate">{itemsLine}</Text>
                  </div>
                  {order.status === 'shipped' && (
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={busyId === order.id}
                      onClick={() => handleDelivered(order.id)}
                    >
                      Передан покупателю
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Text type="secondary" className="text-xs">
                      <WalletOutlined className="mr-1" />
                      Ожидает передачи в доставку продавцом
                    </Text>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
