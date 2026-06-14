import { useSelector } from 'react-redux';
import { Empty, List, Skeleton, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Статусы заказов из бэкенда: created | paid | shipped | cancelled
const STATUS_META = {
  created: { label: 'Создан', color: 'default', icon: <ClockCircleOutlined /> },
  paid: { label: 'Оплачен', color: 'processing', icon: <ClockCircleOutlined /> },
  shipped: { label: 'Отправлен', color: 'success', icon: <CheckCircleOutlined /> },
  cancelled: { label: 'Отменён', color: 'error', icon: <CloseCircleOutlined /> },
};

export const PurchaseHistory = () => {
  const { items, loading } = useSelector((state) => state.orders);
  const animals = useSelector((state) => state.animal.animals);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }
  if (!items.length) {
    return <Empty description="Покупок пока нет" className="!my-16" />;
  }

  const nameOf = (itemId) => animals.find((a) => a.id === itemId)?.name;

  return (
    <List
      itemLayout="horizontal"
      dataSource={items}
      renderItem={(order) => {
        const meta = STATUS_META[order.status] ?? STATUS_META.created;
        const orderItems = order.items ?? [];
        const count = orderItems.reduce((sum, it) => sum + (it.quantity || 1), 0);
        const names = orderItems
          .map((it) => nameOf(it.itemId))
          .filter(Boolean)
          .join(', ');
        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : '';
        return (
          <List.Item
            className="!px-0"
            actions={[
              <Text strong key="total" className="text-base">
                {order.total != null ? `${Number(order.total)} ₽` : '—'}
              </Text>,
            ]}
          >
            <List.Item.Meta
              title={
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Заказ №{String(order.id).slice(0, 8)}</span>
                  <Tag color={meta.color} icon={meta.icon}>
                    {meta.label}
                  </Tag>
                </div>
              }
              description={
                <span className="text-stone-400">
                  {date} · {count} поз.{names ? ` · ${names}` : ''}
                </span>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};
