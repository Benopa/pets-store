import { useState } from 'react';
import { App, Button, Card, Tag, Tooltip, Typography } from 'antd';
import { HeartFilled, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { setCurrentAnimal, addToCart } from '../../../../features';

const { Text } = Typography;

// Category → tag color
export const CATEGORY_COLOR = {
  '3Racha': 'purple',
  VocalRacha: 'magenta',
  DancerRacha: 'geekblue',
  Dogs: 'orange',
};

export const AnimalCard = ({ animal }) => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [liked, setLiked] = useState(false);

  const imageUrl =
    animal.imageUrl ||
    animal.image ||
    (animal.images?.[0]?.url ? `http://localhost:3000${animal.images[0].url}` : null);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addToCart());
    message.success(`«${animal.name}» добавлен в корзину`);
  };

  const handleToggleLike = (e) => {
    e.stopPropagation();
    setLiked((value) => !value);
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

      <div className="flex items-center justify-between mt-3">
        <Text strong className="text-lg">
          {animal.price != null ? `${Number(animal.price)} ₽` : '—'}
        </Text>
        <Button type="primary" icon={<ShoppingCartOutlined />} onClick={handleAddToCart}>
          В корзину
        </Button>
      </div>
    </Card>
  );
};
