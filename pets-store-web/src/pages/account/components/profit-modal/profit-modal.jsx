import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DatePicker,
  Empty,
  Modal,
  Select,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ShopOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchCommissionDetails } from '@/entities/order';

const { Text } = Typography;
const { RangePicker } = DatePicker;

// Спец-значение фильтра «Без магазина / без продавца» (для зачислений без привязки).
const NONE = '__none__';

const fmtMoney = (n) =>
  Number(n ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const sellerLabel = (seller) =>
  seller ? seller.name || seller.email || seller.id : 'Без продавца';

// Собираем уникальные опции (магазины/продавцы) из зачислений + опцию «Без …», если есть null.
const buildOptions = (rows, pick, noneLabel) => {
  const map = new Map();
  let hasNone = false;
  for (const row of rows) {
    const entity = pick(row);
    if (!entity) {
      hasNone = true;
      continue;
    }
    if (!map.has(entity.value)) {
      map.set(entity.value, entity.label);
    }
  }
  const options = [...map].map(([value, label]) => ({ value, label }));
  options.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  if (hasNone) {
    options.push({ value: NONE, label: noneLabel });
  }
  return options;
};

const ProfitModalInner = ({ onClose }) => {
  const dispatch = useDispatch();
  const rows = useSelector((state) => state.orders.commissionDetails);
  const loading = useSelector((state) => state.orders.commissionDetailsLoading);

  const [range, setRange] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [sellerId, setSellerId] = useState(null);

  // Подтягиваем свежую детализацию при каждом открытии раздела.
  useEffect(() => {
    dispatch(fetchCommissionDetails());
  }, [dispatch]);

  const shopOptions = useMemo(
    () =>
      buildOptions(
        rows,
        (r) => (r.shop ? { value: r.shop.id, label: r.shop.name } : null),
        'Без магазина',
      ),
    [rows],
  );
  const sellerOptions = useMemo(
    () =>
      buildOptions(
        rows,
        (r) => (r.seller ? { value: r.seller.id, label: sellerLabel(r.seller) } : null),
        'Без продавца',
      ),
    [rows],
  );

  // Применяем фильтры: период (включительно по дням), магазин, продавец.
  const filtered = useMemo(() => {
    const from = range?.[0] ? range[0].startOf('day').valueOf() : null;
    const to = range?.[1] ? range[1].endOf('day').valueOf() : null;
    return rows.filter((r) => {
      const t = dayjs(r.date).valueOf();
      if (from != null && t < from) return false;
      if (to != null && t > to) return false;
      if (shopId) {
        if (shopId === NONE ? r.shop != null : r.shop?.id !== shopId) return false;
      }
      if (sellerId) {
        if (sellerId === NONE ? r.seller != null : r.seller?.id !== sellerId) return false;
      }
      return true;
    });
  }, [rows, range, shopId, sellerId]);

  const total = useMemo(
    () => Math.round(filtered.reduce((sum, r) => sum + Number(r.amount ?? 0), 0) * 100) / 100,
    [filtered],
  );

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (d) => dayjs(d).format('DD.MM.YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type) =>
        type === 'service' ? (
          <Tag color="green">Сервисный сбор</Tag>
        ) : (
          <Tag color="blue">Комиссия</Tag>
        ),
      filters: [
        { text: 'Комиссия', value: 'commission' },
        { text: 'Сервисный сбор', value: 'service' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Товар',
      dataIndex: 'animalName',
      key: 'animalName',
      render: (name, r) => (
        <span>
          {name}
          {r.quantity > 1 && <Text type="secondary"> · ×{r.quantity}</Text>}
        </span>
      ),
    },
    {
      title: 'Магазин',
      dataIndex: 'shop',
      key: 'shop',
      render: (shop) =>
        shop ? <Tag color="purple">{shop.name}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Продавец',
      dataIndex: 'seller',
      key: 'seller',
      render: (seller) => (seller ? sellerLabel(seller) : <Text type="secondary">—</Text>),
    },
    {
      title: 'Зачислено',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 130,
      render: (amount) => <span className="font-medium">{fmtMoney(amount)} ₽</span>,
      sorter: (a, b) => Number(a.amount) - Number(b.amount),
    },
  ];

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      width={900}
      title={
        <span>
          <ShopOutlined className="mr-2 text-[#9850fd]" />
          Прибыль · зачисления магазину
        </span>
      }
    >
      <div className="mt-2">
        <Text type="secondary">
          Сюда поступает выручка сайта: комиссия с товаров продавцов и сервисный сбор с товаров
          магазинов. Отслеживайте, сколько средств зачислено, и фильтруйте по периоду, магазину или
          продавцу.
        </Text>

        {/* Фильтры */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Text className="text-xs text-stone-500">
              <CalendarOutlined className="mr-1" />
              Период
            </Text>
            <RangePicker
              value={range}
              onChange={setRange}
              format="DD.MM.YYYY"
              allowClear
              placeholder={['С', 'По']}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Text className="text-xs text-stone-500">
              <ShopOutlined className="mr-1" />
              Магазин
            </Text>
            <Select
              value={shopId}
              onChange={setShopId}
              options={shopOptions}
              allowClear
              placeholder="Все магазины"
              style={{ minWidth: 200 }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Text className="text-xs text-stone-500">
              <UserOutlined className="mr-1" />
              Продавец
            </Text>
            <Select
              value={sellerId}
              onChange={setSellerId}
              options={sellerOptions}
              allowClear
              placeholder="Все продавцы"
              style={{ minWidth: 200 }}
            />
          </div>
        </div>

        {/* Итог по текущему фильтру */}
        <div className="mt-5 mb-4 rounded-xl border border-stone-200 bg-stone-50 px-5 py-4">
          <Statistic
            title="Поступило средств (по фильтру)"
            value={total}
            precision={total % 1 === 0 ? 0 : 2}
            suffix="₽"
            valueStyle={{ color: '#9850fd' }}
          />
          <Text type="secondary" className="text-xs">
            Зачислений: {filtered.length}
          </Text>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : filtered.length === 0 ? (
          <Empty description="Нет зачислений по выбранному фильтру" className="!my-8" />
        ) : (
          <Table
            size="small"
            rowKey={(r) => `${r.orderId}-${r.animalId}`}
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
          />
        )}
      </div>
    </Modal>
  );
};

export const ProfitModal = ({ open, onClose }) =>
  open ? <ProfitModalInner onClose={onClose} /> : null;
