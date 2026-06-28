import { App, Button, Card, Tag, Tooltip, Typography } from 'antd';
import {
  HeartFilled,
  HeartOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '@/entities/cart';
import { toggleFavorite } from '@/entities/favorites';
import { startProductChat } from '@/entities/chat';
import { API_ORIGIN } from '@/shared/config';
import { setCurrentAnimal } from '../model/animal.slice';

const { Text } = Typography;

// Category → tag color
export const CATEGORY_COLOR = {
  '3Racha': 'purple',
  VocalRacha: 'magenta',
  DancerRacha: 'geekblue',
  Dogs: 'orange',
};

// Комиссия сайта на товары продавцов (синхронизировано с бэкендом). Продавец указывает свою
// (базовую) цену, к ней добавляется эта доля — покупатель видит цену уже с комиссией.
export const COMMISSION_RATE = 0.05;

// Цена с учётом комиссии: базовая + комиссия (округление вниз до целых рублей). Синхронизировано с бэкендом.
export const priceWithCommission = (basePrice, rate = COMMISSION_RATE) =>
  basePrice == null ? null : Number(basePrice) + Math.floor(Number(basePrice) * Number(rate));

// Статус модерации → подпись + цвет тега
export const MODERATION_STATUS = {
  approved: { label: 'Одобрен', color: 'success' },
  pending: { label: 'На проверке', color: 'warning' },
  rejected: { label: 'Отклонён', color: 'error' },
};

// Имя продавца для карточки/чата: ФИО → email → «Продавец».
export const sellerNameOf = (animal) =>
  [animal?.owner?.firstName, animal?.owner?.lastName].filter(Boolean).join(' ') ||
  animal?.owner?.email ||
  'Продавец';

export const AnimalCard = ({ animal, readOnly = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const liked = useSelector((state) => state.favorites.ids.includes(animal.id));
  const userId = useSelector((state) => state.auth.userId);
  const cartQty = useSelector(
    (state) => state.cart.items.find((i) => i.animalId === animal.id)?.quantity ?? 0,
  );
  // Остаток на складе: при 0 — «Нет в наличии», покупка недоступна.
  const stock = animal.stock;
  const outOfStock = stock === 0;
  // Свой товар продавцу/админу писать некому — кнопку «Написать продавцу» не показываем.
  const canMessageSeller = !readOnly && animal.owner?.id && animal.owner.id !== userId;
  // Свой товар продавец не покупает — кнопку «В корзину» на нём скрываем (карточку видно).
  const isOwnProduct = Boolean(animal.owner?.id && animal.owner.id === userId);

  const imageUrl =
    animal.imageUrl ||
    animal.image ||
    (animal.images?.[0]?.url ? `${API_ORIGIN}${animal.images[0].url}` : null);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    if (stock != null && cartQty >= stock) {
      message.warning(`Больше нет в наличии: осталось ${stock} шт.`);
      return;
    }
    dispatch(addToCart(animal.id));
    message.success(`«${animal.name}» добавлен в корзину`);
  };

  const handleToggleLike = (e) => {
    e.stopPropagation();
    dispatch(toggleFavorite(animal.id));
  };

  const handleWriteSeller = (e) => {
    e.stopPropagation();
    dispatch(
      startProductChat({
        sellerId: animal.owner.id,
        sellerName: sellerNameOf(animal),
        productName: animal.name,
      }),
    );
    navigate('/chat');
  };

  return (
    <Card
      hoverable
      onClick={() => dispatch(setCurrentAnimal(animal))}
      className="overflow-hidden border border-stone-200 transition-shadow hover:shadow-md"
      styles={{ body: { padding: 16 } }}
      cover={
        <div className="relative aspect-square bg-stone-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={animal.name}
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover cursor-pointer"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-stone-300 text-4xl">
              ♥
            </div>
          )}
          {!readOnly && (
            <Tooltip title={liked ? 'Убрать из избранного' : 'В избранное'}>
              <button
                onClick={handleToggleLike}
                className="absolute top-2 right-2 grid place-items-center w-8 h-8 rounded-full bg-white/90 border-0 cursor-pointer shadow-sm backdrop-blur"
              >
                {liked ? (
                  <HeartFilled style={{ color: '#eb2f96' }} />
                ) : (
                  <HeartOutlined style={{ color: '#8c8c8c' }} />
                )}
              </button>
            </Tooltip>
          )}
        </div>
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Text strong className="block truncate text-base">
            {animal.name}
          </Text>
          <Text type="secondary" className="text-xs">
            {animal.species || '—'}
          </Text>
        </div>
        <Tag color={CATEGORY_COLOR[animal.category.name]} className="!mr-0 shrink-0">
          {animal.category.name}
        </Tag>
      </div>

      {animal.description && (
        <Text type="secondary" className="block mt-2 text-sm truncate">
          {animal.description}
        </Text>
      )}

      {stock != null && (
        <Text type={outOfStock ? 'danger' : 'secondary'} className="block mt-2 text-xs">
          {outOfStock ? 'Нет в наличии' : `Осталось ${stock} шт.`}
        </Text>
      )}

      <div className="flex items-center justify-between gap-2 mt-3">
        <Text strong className="text-lg">
          {animal.price != null ? `${Number(animal.price)} ₽` : '—'}
        </Text>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {canMessageSeller && (
              <Tooltip title="Написать продавцу">
                <Button icon={<MessageOutlined />} onClick={handleWriteSeller} />
              </Tooltip>
            )}
            {isOwnProduct ? (
              <Tag color="gold" className="!mr-0">
                Ваш товар
              </Tag>
            ) : (
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                {outOfStock ? 'Нет в наличии' : 'В корзину'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
