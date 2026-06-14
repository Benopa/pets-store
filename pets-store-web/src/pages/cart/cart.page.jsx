import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { App, Button, Card, Divider, Empty, Tag, Tooltip, Typography } from 'antd';
import {
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { CATEGORY_COLOR } from '../home/components/animal-card';
import { setCartQty, removeFromCart, clearCart, checkout } from '../../features';

const { Title, Text } = Typography;

const DELIVERY_FEE = 300;
const FREE_FROM = 500;

const imageOf = (animal) =>
  animal.imageUrl ||
  animal.image ||
  (animal.images?.[0]?.url ? `http://localhost:3000${animal.images[0].url}` : null);

const QtyStepper = ({ value, onChange }) => (
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
      aria-label="Больше"
      className="grid h-9 w-9 place-items-center border-0 bg-transparent text-stone-500 hover:bg-stone-50 cursor-pointer"
    >
      <PlusOutlined />
    </button>
  </div>
);

export const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const items = useSelector((state) => state.cart.items);
  const animals = useSelector((state) => state.animal.animals);

  const lines = items
    .map((i) => ({ animal: animals.find((a) => a.id === i.animalId), qty: i.quantity }))
    .filter((l) => l.animal && l.qty > 0);

  const subtotal = lines.reduce((s, l) => s + Number(l.animal.price) * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const delivery = subtotal >= FREE_FROM || subtotal === 0 ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  const handleCheckout = async () => {
    const result = await dispatch(checkout(total));
    if (checkout.fulfilled.match(result)) {
      message.success('Заказ оформлен! История покупок доступна в личном кабинете.');
      navigate('/account');
    } else {
      message.error(result.payload || 'Не удалось оформить заказ');
    }
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
          onClick={() => dispatch(clearCart())}
        >
          Очистить
        </Button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        {/* Товары */}
        <div className="flex flex-col gap-4">
          {lines.map(({ animal, qty }) => (
            <Card
              key={animal.id}
              className="border border-stone-200"
              styles={{ body: { padding: 16 } }}
            >
              <div className="flex gap-4">
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
                    <QtyStepper value={qty} onChange={(v) => dispatch(setCartQty(animal.id, v))} />
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
            <Text type="secondary">Товары ({itemCount})</Text>
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
          <Divider className="!my-4" />
          <div className="mb-5 flex items-center justify-between">
            <Text strong className="text-lg">
              Итого
            </Text>
            <Text strong className="text-2xl">
              {total.toFixed(1)} ₽
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            block
            icon={<ShoppingCartOutlined />}
            onClick={handleCheckout}
          >
            Оформить заказ
          </Button>
        </Card>
      </div>
    </div>
  );
};
