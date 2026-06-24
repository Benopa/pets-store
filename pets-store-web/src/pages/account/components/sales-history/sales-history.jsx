import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Divider, Empty, List, Modal, Skeleton, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { setCurrentAnimal } from '@/entities/animal';
import { API_ORIGIN } from '@/shared/config';

const { Text } = Typography;

// Статусы заказов: created → paid → shipped → delivered (терминальный) | cancelled.
const STATUS_META = {
  created: { label: 'Создан', color: 'default', icon: <ClockCircleOutlined /> },
  paid: { label: 'Оплачен', color: 'processing', icon: <ClockCircleOutlined /> },
  shipped: { label: 'Отправлен', color: 'processing', icon: <ClockCircleOutlined /> },
  delivered: { label: 'Получен', color: 'success', icon: <CheckCircleOutlined /> },
  cancelled: { label: 'Отменён', color: 'error', icon: <CloseCircleOutlined /> },
};

const buyerNameOf = (buyer) =>
  [buyer?.firstName, buyer?.lastName].filter(Boolean).join(' ') || buyer?.email || 'Покупатель';

const lineSum = (it) => Number(it.price || 0) * (it.quantity || 1);

// История проданных продавцом товаров (его карточки, которые уже купили).
// Данные приходят с /api/orders/sales: позиции уже обогащены названием и ценой.
export const SalesHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sales, salesLoading } = useSelector((state) => state.orders);
  const animals = useSelector((state) => state.animal.animals);
  // Выбранная продажа для подробного просмотра (модальное окно).
  const [detail, setDetail] = useState(null);

  if (salesLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }
  if (!sales.length) {
    return <Empty description="Продаж пока нет" className="!my-16" />;
  }

  // Фото/объект товара берём из каталога по itemId (в продажах хранится только id/название/цена).
  const animalOf = (itemId) => animals.find((x) => x.id === itemId);
  const imageOf = (itemId) => {
    const a = animalOf(itemId);
    if (!a) return null;
    return a.imageUrl || a.image || (a.images?.[0]?.url ? `${API_ORIGIN}${a.images[0].url}` : null);
  };

  // Открыть карточку товара в каталоге.
  const openCard = (animal) => {
    dispatch(setCurrentAnimal(animal));
    setDetail(null);
    navigate('/');
  };

  const detailMeta = detail ? (STATUS_META[detail.status] ?? STATUS_META.created) : null;
  const anyCardAvailable = (detail?.items ?? []).some((it) => animalOf(it.itemId));

  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={sales}
        renderItem={(sale) => {
          const meta = STATUS_META[sale.status] ?? STATUS_META.created;
          const items = sale.items ?? [];
          const count = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
          const names =
            items
              .map((it) => (it.quantity > 1 ? `${it.name} ×${it.quantity}` : it.name))
              .filter(Boolean)
              .join(', ') || 'Товар';
          const date = sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('ru-RU') : '';
          return (
            <List.Item
              className="!px-0"
              actions={[
                <Text strong key="total" className="text-base">
                  {sale.total != null ? `${Number(sale.total)} ₽` : '—'}
                </Text>,
                <Button key="more" type="link" className="!px-0" onClick={() => setDetail(sale)}>
                  Подробнее
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="truncate max-w-[22rem]">{names}</span>
                    <Tag color={meta.color} icon={meta.icon} className="!mr-0">
                      {meta.label}
                    </Tag>
                  </div>
                }
                description={
                  <span className="text-stone-400">
                    {date} · {count} поз. · Покупатель: {buyerNameOf(sale.buyer)} · Заказ №
                    {String(sale.id).slice(0, 8)}
                  </span>
                }
              />
            </List.Item>
          );
        }}
      />

      <Modal
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        footer={[
          <Button key="close" onClick={() => setDetail(null)}>
            Закрыть
          </Button>,
        ]}
        title={detail ? `Заказ №${String(detail.id).slice(0, 8)}` : ''}
        width={560}
      >
        {detail && (
          <div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-4">
              <div className="flex flex-col">
                <Text type="secondary" className="text-xs">
                  Когда куплено
                </Text>
                <Text>{new Date(detail.createdAt).toLocaleString('ru-RU')}</Text>
              </div>
              <div className="flex flex-col">
                <Text type="secondary" className="text-xs">
                  Покупатель
                </Text>
                <Text>
                  <UserOutlined className="mr-1 text-stone-400" />
                  {buyerNameOf(detail.buyer)}
                </Text>
              </div>
              <div className="flex flex-col">
                <Text type="secondary" className="text-xs">
                  Статус
                </Text>
                <Tag color={detailMeta.color} icon={detailMeta.icon} className="!mr-0 w-fit">
                  {detailMeta.label}
                </Tag>
              </div>
              <div className="flex flex-col min-w-[12rem] flex-1">
                <Text type="secondary" className="text-xs">
                  Адрес доставки
                </Text>
                <Text>
                  <EnvironmentOutlined className="mr-1 text-stone-400" />
                  {detail.address || 'Не указан'}
                </Text>
              </div>
            </div>

            <Divider className="!my-3" />

            <Text type="secondary" className="text-xs">
              Что продано{anyCardAvailable ? ' · нажмите на товар, чтобы открыть карточку' : ''}
            </Text>
            <div className="mt-2 flex flex-col gap-1">
              {(detail.items ?? []).map((it) => {
                const animal = animalOf(it.itemId);
                const img = imageOf(it.itemId);
                const clickable = Boolean(animal);
                const rowClass = `flex w-full items-center gap-3 -mx-1 rounded-lg px-1 py-1.5 text-left ${
                  clickable ? 'cursor-pointer hover:bg-stone-50' : ''
                }`;
                const content = (
                  <>
                    {img ? (
                      <img
                        src={img}
                        alt={it.name}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-300">
                        ♥
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Text className="block truncate">{it.name}</Text>
                      <Text type="secondary" className="text-xs">
                        {it.quantity || 1} × {Number(it.price || 0)} ₽
                      </Text>
                    </div>
                    <Text strong>{lineSum(it)} ₽</Text>
                  </>
                );
                return clickable ? (
                  <button
                    key={it.itemId}
                    type="button"
                    onClick={() => openCard(animal)}
                    title="Открыть карточку товара"
                    className={`${rowClass} border-0 bg-transparent`}
                  >
                    {content}
                  </button>
                ) : (
                  <div key={it.itemId} className={rowClass}>
                    {content}
                  </div>
                );
              })}
            </div>

            <Divider className="!my-3" />

            <div className="flex items-center justify-between">
              <Text strong className="text-base">
                Итого
              </Text>
              <Text strong className="text-lg">
                {detail.total != null ? `${Number(detail.total)} ₽` : '—'}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
