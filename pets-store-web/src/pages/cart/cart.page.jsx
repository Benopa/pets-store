import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  App,
  Button,
  Card,
  Checkbox,
  Divider,
  Empty,
  Input,
  Modal,
  Radio,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  BankOutlined,
  WalletOutlined,
  EnvironmentOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { CATEGORY_COLOR } from '@/entities/animal';
import { setCartQty, removeFromCart, clearCart, checkout } from '@/entities/cart';
import { confirmOrderPayment } from '@/entities/order';
import { updateProfile } from '@/entities/auth';
import { API_ORIGIN } from '@/shared/config';

const { Title, Text } = Typography;

const DELIVERY_FEE = 300;
const FREE_FROM = 500;
// Сервисный сбор — 8%, берётся только с товаров магазинов (у товаров продавцов комиссия уже в цене).
const SERVICE_FEE_RATE = 0.08;
// Онлайн-оплата (карта/СБП): имитируем обращение к банку перед оформлением.
const ONLINE_PAYMENTS = ['card', 'sbp'];
const BANK_DELAY_MS = 5000;
// Промокоды: код → доля скидки на всю стоимость заказа (товары + доставка + сбор).
const PROMO_CODES = { PROMO50: 0.5 };

const imageOf = (animal) =>
  animal.imageUrl ||
  animal.image ||
  (animal.images?.[0]?.url ? `${API_ORIGIN}${animal.images[0].url}` : null);

const QtyStepper = ({ value, max, onChange }) => {
  const atMax = max != null && value >= max;
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-stone-200">
      <button
        onClick={() => onChange(value - 1)}
        aria-label="Меньше"
        className="grid h-9 w-9 place-items-center border-0 bg-transparent text-stone-500 hover:bg-stone-50 cursor-pointer"
      >
        <MinusOutlined />
      </button>
      <span className="w-9 select-none text-center text-sm">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        aria-label="Больше"
        className="grid h-9 w-9 place-items-center border-0 bg-transparent text-stone-500 hover:bg-stone-50 cursor-pointer disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
      >
        <PlusOutlined />
      </button>
    </div>
  );
};

// Модальное окно «Оформление заказа»: проверка чека и данных доставки с возможностью их изменить.
// Управляемый компонент — значения и обработчики приходят из CartPage.
const CheckoutModal = ({
  open,
  lines,
  subtotal,
  delivery,
  serviceFee,
  discount,
  total,
  itemCount,
  address,
  payment,
  comment,
  promo,
  submitting,
  onAddress,
  onPayment,
  onComment,
  onPromo,
  onClose,
  onConfirm,
}) => (
  <Modal
    open={open}
    onCancel={onClose}
    width={640}
    title="Оформление заказа"
    okText={`Подтвердить заказ · ${total.toFixed(1)} ₽`}
    cancelText="Назад"
    onOk={onConfirm}
    confirmLoading={submitting}
    okButtonProps={{ size: 'large', icon: <CheckCircleOutlined /> }}
  >
    <div className="py-1">
      {/* Чек */}
      <Text strong className="mb-2 block">
        Товары в чеке ({itemCount})
      </Text>
      <div className="flex max-h-52 flex-col gap-2 overflow-auto pr-1">
        {lines.map(({ animal, qty }) => (
          <div key={animal.id} className="flex items-center gap-3">
            {imageOf(animal) ? (
              <img
                src={imageOf(animal)}
                alt={animal.name}
                className="h-11 w-11 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-300">
                ♥
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Text className="block truncate">{animal.name}</Text>
              <Text type="secondary" className="text-xs">
                {qty} × {Number(animal.price)} ₽
              </Text>
            </div>
            <Text strong>{(Number(animal.price) * qty).toFixed(1)} ₽</Text>
          </div>
        ))}
      </div>

      <Divider className="!my-4" />

      {/* Способ оплаты */}
      <Text strong className="mb-1 block">
        Способ оплаты
      </Text>
      <Radio.Group value={payment} onChange={(e) => onPayment(e.target.value)} className="mb-4">
        <Radio.Button value="card">
          <CreditCardOutlined /> Банковская карта
        </Radio.Button>
        <Radio.Button value="sbp">
          <BankOutlined /> СБП
        </Radio.Button>
        <Radio.Button value="cash">
          <WalletOutlined /> При получении
        </Radio.Button>
      </Radio.Group>

      {/* Адрес доставки */}
      <Text strong className="mb-1 block">
        Адрес доставки{' '}
        {payment === 'cash' && (
          <Text type="secondary" className="text-xs">
            (необязательно)
          </Text>
        )}
      </Text>
      <Input
        size="large"
        prefix={<EnvironmentOutlined className="text-stone-400" />}
        placeholder="Город, улица, дом, квартира"
        value={address}
        onChange={(e) => onAddress(e.target.value)}
      />

      <Text strong className="mb-1 mt-4 block">
        Комментарий к заказу
      </Text>
      <Input.TextArea
        rows={2}
        placeholder="Например: позвонить за час до доставки"
        value={comment}
        onChange={(e) => onComment(e.target.value)}
      />

      <Text strong className="mb-1 mt-4 block">
        Промокод
      </Text>
      <Input
        size="large"
        prefix={<TagOutlined className="text-stone-400" />}
        placeholder="Например, PROMO50"
        value={promo}
        onChange={(e) => onPromo(e.target.value)}
        status={promo.trim() && discount === 0 ? 'warning' : undefined}
      />
      {discount > 0 ? (
        <Text className="mt-1 block text-xs" style={{ color: '#52c41a' }}>
          <CheckCircleOutlined className="mr-1" />
          Промокод применён — скидка 50% на заказ
        </Text>
      ) : promo.trim() ? (
        <Text type="secondary" className="mt-1 block text-xs">
          Промокод не найден
        </Text>
      ) : null}

      <Divider className="!my-4" />

      {/* Итоги */}
      <div className="mb-1 flex items-center justify-between">
        <Text type="secondary">Товары</Text>
        <Text>{subtotal.toFixed(1)} ₽</Text>
      </div>
      <div className="mb-1 flex items-center justify-between">
        <Text type="secondary">Доставка</Text>
        <Text>{delivery === 0 ? 'Бесплатно' : `${delivery} ₽`}</Text>
      </div>
      <div className="mb-1 flex items-center justify-between">
        <Text type="secondary">Сервисный сбор (8%)</Text>
        <Text>{serviceFee.toFixed(1)} ₽</Text>
      </div>
      {discount > 0 && (
        <div className="mb-1 flex items-center justify-between">
          <Text type="secondary">Скидка по промокоду</Text>
          <Text style={{ color: '#52c41a' }}>−{discount.toFixed(1)} ₽</Text>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <Text strong className="text-lg">
          Итого
        </Text>
        <Text strong className="text-xl">
          {total.toFixed(1)} ₽
        </Text>
      </div>
    </div>
  </Modal>
);

export const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const items = useSelector((state) => state.cart.items);
  const animals = useSelector((state) => state.animal.animals);
  const profileAddress = useSelector((state) => state.auth.address);
  const profilePayment = useSelector((state) => state.auth.paymentMethod);

  const lines = items
    .map((i) => ({ animal: animals.find((a) => a.id === i.animalId), qty: i.quantity }))
    .filter((l) => l.animal && l.qty > 0);

  // Выбор позиций для заказа: храним только явные отказы, отсутствие ключа = выбрано.
  const [selected, setSelected] = useState({});
  const isSelected = (id) => selected[id] !== false;
  const toggleSelect = (id) =>
    setSelected((p) => ({ ...p, [id]: p[id] === false ? undefined : false }));

  const allSelected = lines.length > 0 && lines.every((l) => isSelected(l.animal.id));
  const toggleAll = () => {
    if (allSelected) {
      const next = {};
      lines.forEach(({ animal }) => {
        next[animal.id] = false;
      });
      setSelected(next);
    } else {
      setSelected({});
    }
  };

  const selectedLines = lines.filter((l) => isSelected(l.animal.id));
  const selectedIds = selectedLines.map((l) => l.animal.id);
  const subtotal = selectedLines.reduce((s, l) => s + Number(l.animal.price) * l.qty, 0);
  const itemCount = selectedLines.reduce((s, l) => s + l.qty, 0);
  const delivery = subtotal >= FREE_FROM || subtotal === 0 ? 0 : DELIVERY_FEE;
  // Сервисный сбор 8% берётся только с товаров магазинов (у товаров продавцов комиссия уже в цене),
  // округляем вниз до целых рублей.
  const shopSubtotal = selectedLines
    .filter((l) => l.animal.shop)
    .reduce((s, l) => s + Number(l.animal.price) * l.qty, 0);
  const serviceFee = Math.floor(shopSubtotal * SERVICE_FEE_RATE);
  const grossTotal = subtotal + delivery + serviceFee;

  // Удаляются только выбранные, если выбрана часть корзины — иначе чистим всё.
  const removingSelected = selectedIds.length > 0 && selectedIds.length < lines.length;

  // Данные доставки для модалки оформления.
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('card');
  const [comment, setComment] = useState('');
  const [promo, setPromo] = useState('');

  // Промокод: скидка на всю стоимость заказа. Итог к оплате — за вычетом скидки.
  const discountRate = PROMO_CODES[promo.trim().toUpperCase()] ?? 0;
  const discount = Math.round(grossTotal * discountRate * 100) / 100;
  const total = grossTotal - discount;

  const openCheckout = () => {
    setAddress(profileAddress || '');
    setPayment(profilePayment || 'card');
    setComment('');
    setPromo('');
    setCheckoutOpen(true);
  };

  const confirmClear = () => {
    if (removingSelected) {
      modal.confirm({
        title: 'Удалить выбранные товары?',
        content: `${selectedIds.length} товар(ов) будут удалены, остальные останутся в корзине.`,
        okText: 'Удалить выбранные',
        okButtonProps: { danger: true },
        cancelText: 'Отмена',
        onOk: () => selectedIds.forEach((id) => dispatch(removeFromCart(id))),
      });
    } else {
      modal.confirm({
        title: 'Очистить корзину?',
        content: 'Все товары будут удалены из корзины.',
        okText: 'Очистить',
        okButtonProps: { danger: true },
        cancelText: 'Отмена',
        onOk: () => dispatch(clearCart()),
      });
    }
  };

  const submitCheckout = async () => {
    if (payment !== 'cash' && !address.trim()) {
      message.error('Укажите адрес доставки');
      return;
    }
    setSubmitting(true);
    // Создаём заказ. Онлайн-оплата (карта/СБП) создаётся в статусе «ждём подтверждения из банка».
    const result = await dispatch(
      checkout({
        selectedIds,
        total,
        comment: comment.trim(),
        address: address.trim(),
        paymentMethod: payment,
      }),
    );
    if (!checkout.fulfilled.match(result)) {
      setSubmitting(false);
      message.error(result.payload || 'Не удалось оформить заказ');
      return;
    }
    // При оплате картой или через СБП имитируем связь с банком: 5 секунд «обработки»,
    // затем подтверждаем оплату заказа (статус становится «Оплачено»).
    if (ONLINE_PAYMENTS.includes(payment)) {
      const hide = message.loading('Связь с банком…', 0);
      await new Promise((resolve) => setTimeout(resolve, BANK_DELAY_MS));
      hide();
      await dispatch(confirmOrderPayment(result.payload.id));
    }
    setSubmitting(false);
    setCheckoutOpen(false);
    // Запоминаем данные доставки в профиле для следующего заказа.
    if (address.trim()) {
      dispatch(updateProfile({ address: address.trim(), paymentMethod: payment }));
    }
    modal.success({
      title: 'Заказ оформлен!',
      content: `${itemCount} товар(ов) на сумму ${total.toFixed(1)} ₽. История покупок доступна в личном кабинете.`,
      okText: 'К покупкам',
      onOk: () => navigate('/'),
    });
  };

  if (lines.length === 0) {
    return (
      <div>
        <Title level={2} className="!mb-6 !font-light">
          Корзина
        </Title>
        <Card className="border border-stone-200">
          <Empty
            image={<InboxOutlined style={{ fontSize: 64, color: '#d6d3d1' }} />}
            description="Ваша корзина пуста"
            className="!my-10"
          >
            <Button
              type="primary"
              size="large"
              icon={<AppstoreOutlined />}
              onClick={() => navigate('/')}
            >
              Перейти в каталог
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Title level={2} className="!mb-0 !font-light">
          Корзина
        </Title>
        <Button
          type="text"
          icon={<DeleteOutlined />}
          className="!text-stone-500"
          onClick={confirmClear}
        >
          {removingSelected ? 'Удалить выбранные' : 'Очистить'}
        </Button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        {/* Товары */}
        <div className="flex flex-col gap-4">
          <Checkbox checked={allSelected} onChange={toggleAll} className="!ml-1">
            Выбрать все
          </Checkbox>

          {lines.map(({ animal, qty }) => (
            <Card
              key={animal.id}
              className="border border-stone-200"
              styles={{ body: { padding: 16 } }}
            >
              <div className="flex gap-4">
                <Checkbox
                  checked={isSelected(animal.id)}
                  onChange={() => toggleSelect(animal.id)}
                  className="!mt-1 shrink-0"
                />
                {imageOf(animal) ? (
                  <img
                    src={imageOf(animal)}
                    alt={animal.name}
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-stone-100 text-2xl text-stone-300">
                    ♥
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Text strong className="block truncate text-base">
                        {animal.name}
                      </Text>
                      <Text type="secondary" className="text-xs">
                        {animal.species || '—'}
                      </Text>
                    </div>
                    <Tag color={CATEGORY_COLOR[animal.category?.name]} className="!mr-0 shrink-0">
                      {animal.category?.name}
                    </Tag>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <QtyStepper
                      value={qty}
                      max={animal.stock}
                      onChange={(v) =>
                        dispatch(
                          setCartQty(
                            animal.id,
                            animal.stock != null ? Math.min(v, animal.stock) : v,
                          ),
                        )
                      }
                    />
                    <div className="flex items-center gap-3">
                      <Text strong className="text-base">
                        {(Number(animal.price) * qty).toFixed(1)} ₽
                      </Text>
                      <Tooltip title="Удалить">
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => dispatch(removeFromCart(animal.id))}
                        />
                      </Tooltip>
                    </div>
                  </div>
                  {animal.stock != null && qty >= animal.stock && (
                    <Text type="warning" className="mt-1 block text-xs">
                      {animal.stock === 0
                        ? 'Товар закончился'
                        : `Больше нет в наличии: осталось ${animal.stock} шт.`}
                    </Text>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <Link
            to="/"
            className="inline-flex items-center gap-2 self-start text-stone-500 transition-colors hover:text-stone-700"
          >
            <ArrowLeftOutlined /> Продолжить покупки
          </Link>
        </div>

        {/* Итог заказа */}
        <Card
          className="border border-stone-200 lg:sticky lg:top-20"
          styles={{ body: { padding: 24 } }}
        >
          <Title level={4} className="!mb-4">
            Итог заказа
          </Title>
          <div className="mb-2 flex items-center justify-between">
            <Text type="secondary">Выбрано ({itemCount})</Text>
            <Text>{subtotal.toFixed(1)} ₽</Text>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <Text type="secondary">Доставка</Text>
            <Text>{delivery === 0 ? 'Бесплатно' : `${delivery} ₽`}</Text>
          </div>
          {delivery > 0 && (
            <Text type="secondary" className="mb-2 block text-xs">
              Бесплатная доставка от {FREE_FROM} ₽
            </Text>
          )}
          <div className="mb-2 flex items-center justify-between">
            <Text type="secondary">Сервисный сбор (8%)</Text>
            <Text>{serviceFee.toFixed(1)} ₽</Text>
          </div>
          <Divider className="!my-4" />
          <div className="mb-5 flex items-center justify-between">
            <Text strong className="text-lg">
              Итого
            </Text>
            <Text strong className="text-2xl">
              {grossTotal.toFixed(1)} ₽
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            block
            icon={<ShoppingCartOutlined />}
            disabled={selectedLines.length === 0}
            onClick={openCheckout}
          >
            Оформить заказ
          </Button>
          {selectedLines.length === 0 && (
            <Text type="secondary" className="mt-2 block text-center text-xs">
              Выберите товары для оформления
            </Text>
          )}
        </Card>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        lines={selectedLines}
        subtotal={subtotal}
        delivery={delivery}
        serviceFee={serviceFee}
        discount={discount}
        total={total}
        itemCount={itemCount}
        address={address}
        payment={payment}
        comment={comment}
        promo={promo}
        submitting={submitting}
        onAddress={setAddress}
        onPayment={setPayment}
        onComment={setComment}
        onPromo={setPromo}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={submitCheckout}
      />
    </div>
  );
};
