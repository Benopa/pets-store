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
  Typography,
} from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  SearchOutlined,
  SyncOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { setCurrentAnimal } from '@/entities/animal';
import { cancelSale, markReady, markShipped } from '@/entities/order';
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

// Опции фильтра по статусу: «Все» + статусы из STATUS_META (метки держим в одном месте).
const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

// Статус оплаты заказа: онлайн-оплата (карта/СБП) подтверждается после «связи с банком»,
// до этого — «ждём подтверждения»; наличные — «оплата при получении».
const PAYMENT_META = {
  paid: { label: 'Оплачено', color: 'success', icon: <CheckCircleOutlined /> },
  awaiting: { label: 'Ждём подтверждения из банка', color: 'warning', icon: <SyncOutlined spin /> },
  on_delivery: { label: 'Оплата при получении', color: 'default', icon: <WalletOutlined /> },
};

const buyerNameOf = (buyer) =>
  [buyer?.firstName, buyer?.lastName].filter(Boolean).join(' ') || buyer?.email || 'Покупатель';

const lineSum = (it) => Number(it.price || 0) * (it.quantity || 1);

// Причины отмены заказа продавцом. «Другое» — свободный текст в отдельном поле.
const CANCEL_REASONS = [
  'Закончился товар',
  'Проблема с транспортировкой',
  'Долгое ожидание оплаты',
  'Другое',
];

// Двухшаговая отправка: сначала продавец отмечает заказ «готов к отправке» (created/paid),
// и только для готового заказа (ready) появляется «Передать в доставку».
const isReadyable = (status) => status === 'created' || status === 'paid';
const canShip = (status) => status === 'ready';
// Отменить заказ продавец может, пока он не передан в доставку (до shipped).
const isCancellableSale = (status) =>
  status === 'created' || status === 'paid' || status === 'ready';

// История проданных продавцом товаров (его карточки, которые уже купили).
// Данные приходят с /api/orders/sales: позиции уже обогащены названием и ценой.
export const SalesHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { sales, salesLoading } = useSelector((state) => state.orders);
  const animals = useSelector((state) => state.animal.animals);
  // Храним id выбранной продажи, сам объект берём из стора — чтобы модалка обновлялась
  // после отмены (статус/причина приходят в стор и подхватываются здесь).
  const [detailId, setDetailId] = useState(null);
  // Поиск по номеру (первые 8 символов) или полному id заказа + текущая страница.
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // Сортировка по сумме заказа: 'date' (как пришло, новые сверху) | 'priceAsc' | 'priceDesc'.
  const [sort, setSort] = useState('date');
  // Фильтр по статусу заказа: 'all' | created | paid | shipped | delivered | cancelled.
  const [status, setStatus] = useState('all');
  // Отмена заказа: id отменяемой продажи + выбранная причина и текст для «Другое» + загрузка.
  const [cancelId, setCancelId] = useState(null);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [otherReason, setOtherReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [readying, setReadying] = useState(false);
  const [shipping, setShipping] = useState(false);

  const detail = sales.find((s) => s.id === detailId) || null;

  const handleReady = async () => {
    setReadying(true);
    const result = await dispatch(markReady(detailId));
    setReadying(false);
    if (markReady.fulfilled.match(result)) {
      message.success('Заказ отмечен готовым к отправке');
    } else {
      message.error(result.payload || 'Не удалось отметить готовым');
    }
  };

  const handleShip = async () => {
    setShipping(true);
    const result = await dispatch(markShipped(detailId));
    setShipping(false);
    if (markShipped.fulfilled.match(result)) {
      message.success('Заказ передан в доставку');
    } else {
      message.error(result.payload || 'Не удалось передать в доставку');
    }
  };

  const handleCancelSale = async () => {
    const finalReason = reason === 'Другое' ? otherReason.trim() : reason;
    if (reason === 'Другое' && !finalReason) {
      message.error('Опишите причину отмены');
      return;
    }
    setCancelling(true);
    const result = await dispatch(cancelSale({ orderId: cancelId, reason: finalReason }));
    setCancelling(false);
    if (cancelSale.fulfilled.match(result)) {
      message.success('Заказ отменён, покупатель уведомлён');
      setCancelId(null);
      setReason(CANCEL_REASONS[0]);
      setOtherReason('');
    } else {
      message.error(result.payload || 'Не удалось отменить заказ');
    }
  };

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
    setDetailId(null);
    navigate('/');
  };

  const detailMeta = detail ? (STATUS_META[detail.status] ?? STATUS_META.created) : null;
  const paymentMeta = detail
    ? (PAYMENT_META[detail.paymentStatus] ?? PAYMENT_META.on_delivery)
    : null;
  const anyCardAvailable = (detail?.items ?? []).some((it) => animalOf(it.itemId));

  // Фильтр по статусу + поиску. Короткий номер заказа — префикс полного id,
  // поэтому одного includes по id хватает и на номер, и на полный id.
  const q = search.trim().toLowerCase();
  const filtered = sales.filter((s) => {
    if (status !== 'all' && s.status !== status) return false;
    if (q && !String(s.id).toLowerCase().includes(q)) return false;
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
                <Button
                  key="more"
                  type="link"
                  className="!px-0"
                  onClick={() => setDetailId(sale.id)}
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
        onCancel={() => setDetailId(null)}
        footer={
          detail
            ? [
                isReadyable(detail.status) && (
                  <Button
                    key="ready"
                    type="primary"
                    icon={<InboxOutlined />}
                    loading={readying}
                    onClick={handleReady}
                  >
                    Готов к отправке
                  </Button>
                ),
                canShip(detail.status) && (
                  <Button
                    key="ship"
                    type="primary"
                    icon={<CarOutlined />}
                    loading={shipping}
                    onClick={handleShip}
                  >
                    Передать в доставку
                  </Button>
                ),
                isCancellableSale(detail.status) && (
                  <Button key="cancel" danger onClick={() => setCancelId(detail.id)}>
                    Отменить заказ
                  </Button>
                ),
                <Button key="close" onClick={() => setDetailId(null)}>
                  Закрыть
                </Button>,
              ]
            : null
        }
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

      <Modal
        open={Boolean(cancelId)}
        title="Отмена заказа"
        okText="Отменить заказ"
        okButtonProps={{ danger: true }}
        cancelText="Назад"
        confirmLoading={cancelling}
        onCancel={() => setCancelId(null)}
        onOk={handleCancelSale}
      >
        <Text type="secondary" className="block">
          Выберите причину отмены — покупатель получит уведомление.
        </Text>
        <Select
          className="!mt-3 w-full"
          size="large"
          value={reason}
          onChange={setReason}
          options={CANCEL_REASONS.map((r) => ({ value: r, label: r }))}
        />
        {reason === 'Другое' && (
          <Input.TextArea
            className="!mt-3"
            rows={2}
            maxLength={300}
            placeholder="Опишите причину отмены"
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
          />
        )}
      </Modal>
    </>
  );
};
