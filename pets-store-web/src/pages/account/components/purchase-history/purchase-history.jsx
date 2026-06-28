import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  App,
  Button,
  Divider,
  Empty,
  Input,
  List,
  Modal,
  Select,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  SearchOutlined,
  SyncOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { setCurrentAnimal } from '@/entities/animal';
import { cancelOrder, cancelOrderItem, markOrderReceived } from '@/entities/order';
import { API_ORIGIN } from '@/shared/config';

const { Text } = Typography;

// Статусы заказов: created → paid → ready → shipped → delivered (терминальный) | cancelled.
const STATUS_META = {
  created: { label: 'Создан', color: 'default', icon: <ClockCircleOutlined /> },
  paid: { label: 'Оплачен', color: 'processing', icon: <ClockCircleOutlined /> },
  ready: { label: 'Готов к отправке', color: 'warning', icon: <InboxOutlined /> },
  shipped: { label: 'В доставке', color: 'processing', icon: <CarOutlined /> },
  delivered: { label: 'Получен', color: 'success', icon: <CheckCircleOutlined /> },
  cancelled: { label: 'Отменён', color: 'error', icon: <CloseCircleOutlined /> },
};

// Статус оплаты заказа: онлайн-оплата (карта/СБП) подтверждается после «связи с банком»,
// до этого — «ждём подтверждения»; наличные — «оплата при получении».
const PAYMENT_META = {
  paid: { label: 'Оплачено', color: 'success', icon: <CheckCircleOutlined /> },
  awaiting: {
    label: 'Ждём подтверждения из банка',
    color: 'warning',
    icon: <SyncOutlined spin />,
  },
  on_delivery: { label: 'Оплата при получении', color: 'default', icon: <WalletOutlined /> },
};

// Опции фильтра по статусу: «Все» + статусы из STATUS_META (метки держим в одном месте).
const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

// Отменить заказ можно, пока он не получен и ещё не отменён.
const isCancellable = (status) => status !== 'cancelled' && status !== 'delivered';

export const PurchaseHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { items, loading } = useSelector((state) => state.orders);
  const animals = useSelector((state) => state.animal.animals);
  // Храним id, а сам заказ берём из стора — чтобы модалка обновлялась после отмены/получения.
  const [detailId, setDetailId] = useState(null);
  // Поиск по номеру (первые 8 символов) или полному id заказа + текущая страница.
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // Сортировка по сумме заказа: 'date' (как пришло, новые сверху) | 'priceAsc' | 'priceDesc'.
  const [sort, setSort] = useState('date');
  // Фильтр по статусу заказа: 'all' | created | paid | shipped | delivered | cancelled.
  const [status, setStatus] = useState('all');
  const detail = items.find((o) => o.id === detailId) || null;

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }
  if (!items.length) {
    return <Empty description="Покупок пока нет" className="!my-16" />;
  }

  // Название/фото/цену позиции восстанавливаем из каталога по itemId
  // (в заказе хранятся только id и количество).
  const animalOf = (itemId) => animals.find((a) => a.id === itemId);
  const nameOf = (itemId) => animalOf(itemId)?.name;
  const imageOf = (itemId) => {
    const a = animalOf(itemId);
    if (!a) return null;
    return a.imageUrl || a.image || (a.images?.[0]?.url ? `${API_ORIGIN}${a.images[0].url}` : null);
  };
  const priceOf = (itemId) => {
    const p = animalOf(itemId)?.price;
    return p != null ? Number(p) : null;
  };

  // Открыть карточку товара в каталоге, чтобы заказать снова.
  const openCard = (animal) => {
    dispatch(setCurrentAnimal(animal));
    setDetailId(null);
    navigate('/');
  };

  const handleCancelOrder = () => {
    modal.confirm({
      title: 'Отменить весь заказ?',
      content: 'Все позиции заказа будут отменены.',
      okText: 'Отменить заказ',
      okButtonProps: { danger: true },
      cancelText: 'Назад',
      onOk: async () => {
        const result = await dispatch(cancelOrder(detail.id));
        if (cancelOrder.fulfilled.match(result)) {
          message.success('Заказ отменён');
        } else {
          message.error(result.payload || 'Не удалось отменить заказ');
        }
      },
    });
  };

  const handleCancelItem = (it) => {
    const name = nameOf(it.itemId) || 'товар';
    modal.confirm({
      title: `Отменить «${name}»?`,
      content: 'Позиция будет удалена из заказа, сумма пересчитается.',
      okText: 'Отменить товар',
      okButtonProps: { danger: true },
      cancelText: 'Назад',
      onOk: async () => {
        const result = await dispatch(cancelOrderItem({ orderId: detail.id, itemId: it.itemId }));
        if (cancelOrderItem.fulfilled.match(result)) {
          message.success('Позиция отменена');
        } else {
          message.error(result.payload || 'Не удалось отменить позицию');
        }
      },
    });
  };

  const handleReceived = () => {
    modal.confirm({
      title: 'Подтвердить получение заказа?',
      content: 'После подтверждения отменить заказ будет нельзя.',
      okText: 'Подтвердить',
      cancelText: 'Назад',
      onOk: async () => {
        const result = await dispatch(markOrderReceived(detail.id));
        if (markOrderReceived.fulfilled.match(result)) {
          message.success('Получение подтверждено');
        } else {
          message.error(result.payload || 'Не удалось подтвердить получение');
        }
      },
    });
  };

  const detailMeta = detail ? (STATUS_META[detail.status] ?? STATUS_META.created) : null;
  const paymentMeta = detail
    ? (PAYMENT_META[detail.paymentStatus] ?? PAYMENT_META.on_delivery)
    : null;
  const detailNote = detail?.items?.find((it) => it.note)?.note;
  const anyCardAvailable = (detail?.items ?? []).some((it) => animalOf(it.itemId));
  const detailCancellable = detail ? isCancellable(detail.status) : false;

  // Фильтр по статусу + поиску. Короткий номер заказа — префикс полного id,
  // поэтому одного includes по id хватает и на номер, и на полный id.
  const q = search.trim().toLowerCase();
  const filtered = items.filter((o) => {
    if (status !== 'all' && o.status !== status) return false;
    if (q && !String(o.id).toLowerCase().includes(q)) return false;
    return true;
  });

  // Сортировка по сумме заказа (total). 'date' оставляет порядок с бэкенда (новые сверху).
  const sorted = [...filtered];
  if (sort === 'priceAsc') sorted.sort((a, b) => (Number(a.total) || 0) - (Number(b.total) || 0));
  if (sort === 'priceDesc') sorted.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          allowClear
          size="large"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          prefix={<SearchOutlined className="text-stone-400" />}
          placeholder="Поиск по номеру или ID заказа"
          className="sm:max-w-sm"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={status}
            size="large"
            className="sm:w-44"
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
          <Select
            value={sort}
            size="large"
            className="sm:w-52"
            onChange={(value) => {
              setSort(value);
              setPage(1);
            }}
            options={[
              { value: 'date', label: 'Сначала новые' },
              { value: 'priceAsc', label: 'Сначала дешевле' },
              { value: 'priceDesc', label: 'Сначала дороже' },
            ]}
          />
        </div>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={sorted}
        locale={{
          emptyText: <Empty description="Заказы не найдены" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        }}
        pagination={{
          current: page,
          pageSize: 20,
          align: 'center',
          hideOnSinglePage: true,
          showSizeChanger: false,
          onChange: setPage,
        }}
        renderItem={(order) => {
          const meta = STATUS_META[order.status] ?? STATUS_META.created;
          const orderItems = order.items ?? [];
          const count = orderItems.reduce((sum, it) => sum + (it.quantity || 1), 0);
          const names =
            orderItems
              .map((it) => {
                const name = nameOf(it.itemId);
                if (!name) return null;
                return it.quantity > 1 ? `${name} ×${it.quantity}` : name;
              })
              .filter(Boolean)
              .join(', ') || `Заказ №${String(order.id).slice(0, 8)}`;
          const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU') : '';
          return (
            <List.Item
              className="!px-0"
              actions={[
                <Text strong key="total" className="text-base">
                  {order.total != null ? `${Number(order.total)} ₽` : '—'}
                </Text>,
                <Button
                  key="more"
                  type="link"
                  className="!px-0"
                  onClick={() => setDetailId(order.id)}
                >
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
                    {date} · {count} поз. · Заказ №{String(order.id).slice(0, 8)}
                  </span>
                }
              />
            </List.Item>
          );
        }}
      />

      <Modal
        open={Boolean(detail)}
        onCancel={() => setDetailId(null)}
        title={detail ? `Заказ №${String(detail.id).slice(0, 8)}` : ''}
        width={560}
        footer={
          detail
            ? [
                detail.status === 'shipped' && (
                  <Button key="received" type="primary" onClick={handleReceived}>
                    Подтвердить получение
                  </Button>
                ),
                detailCancellable && (
                  <Button key="cancel" danger onClick={handleCancelOrder}>
                    Отменить заказ
                  </Button>
                ),
                <Button key="close" onClick={() => setDetailId(null)}>
                  Закрыть
                </Button>,
              ]
            : null
        }
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
                  Статус
                </Text>
                <Tag color={detailMeta.color} icon={detailMeta.icon} className="!mr-0 w-fit">
                  {detailMeta.label}
                </Tag>
              </div>
              <div className="flex flex-col">
                <Text type="secondary" className="text-xs">
                  Оплата
                </Text>
                <Tag color={paymentMeta.color} icon={paymentMeta.icon} className="!mr-0 w-fit">
                  {paymentMeta.label}
                </Tag>
              </div>
              {detail.status === 'cancelled' && detail.cancelReason && (
                <div className="flex flex-col">
                  <Text type="secondary" className="text-xs">
                    Причина отмены
                  </Text>
                  <Text>{detail.cancelReason}</Text>
                </div>
              )}
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
              Что куплено{anyCardAvailable ? ' · нажмите на товар, чтобы открыть карточку' : ''}
            </Text>
            <div className="mt-2 flex flex-col gap-1">
              {(detail.items ?? []).map((it) => {
                const animal = animalOf(it.itemId);
                const img = imageOf(it.itemId);
                const name = nameOf(it.itemId) || `Товар ${String(it.itemId).slice(0, 8)}`;
                const price = priceOf(it.itemId);
                const clickable = Boolean(animal);
                const canCancelItem = detailCancellable && (detail.items?.length ?? 0) > 1;
                const info = (
                  <>
                    {img ? (
                      <img
                        src={img}
                        alt={name}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-300">
                        ♥
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Text className="block truncate">{name}</Text>
                      <Text type="secondary" className="text-xs">
                        {price != null
                          ? `${it.quantity || 1} × ${price} ₽`
                          : `${it.quantity || 1} шт.`}
                      </Text>
                    </div>
                  </>
                );
                return (
                  <div key={it.itemId} className="flex items-center gap-2 -mx-1">
                    {clickable ? (
                      <button
                        type="button"
                        onClick={() => openCard(animal)}
                        title="Открыть карточку товара"
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border-0 bg-transparent px-1 py-1.5 text-left cursor-pointer hover:bg-stone-50"
                      >
                        {info}
                      </button>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-3 px-1 py-1.5">
                        {info}
                      </div>
                    )}
                    {price != null && (
                      <Text strong className="shrink-0">
                        {price * (it.quantity || 1)} ₽
                      </Text>
                    )}
                    {canCancelItem && (
                      <Tooltip title="Отменить товар">
                        <Button
                          danger
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => handleCancelItem(it)}
                        />
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </div>

            {detailNote && (
              <>
                <Divider className="!my-3" />
                <Text type="secondary" className="text-xs">
                  Комментарий к заказу
                </Text>
                <Text className="block">{detailNote}</Text>
              </>
            )}

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
