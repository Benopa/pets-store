import { Filter } from './components/filter/filter';
import {
  AnimalCard,
  CATEGORY_COLOR,
  PhotoGallery,
  sellerNameOf,
  setCurrentAnimal,
} from '@/entities/animal';
import { addToCart } from '@/entities/cart';
import { toggleFavorite } from '@/entities/favorites';
import { startProductChat } from '@/entities/chat';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Alert,
  App,
  Card,
  Empty,
  Modal,
  Button,
  Skeleton,
  Tag,
  Typography,
  Divider,
  Descriptions,
} from 'antd';
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export const HomePage = () => {
  const { animals, loading, error, currentAnimal, sort } = useSelector((state) => state.animal);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const favIds = useSelector((state) => state.favorites.ids);
  const role = useSelector((state) => state.auth.role);
  const userId = useSelector((state) => state.auth.userId);
  const cartItems = useSelector((state) => state.cart.items);
  // Персонал (админ/модератор/доставщик) не покупает — каталог в режиме просмотра
  // (без «В корзину»/избранного).
  const readOnly = role === 'admin' || role === 'moderator' || role === 'courier';

  // В каталоге показываем только одобренные товары (старым карточкам статус не задан → считаем одобренными).
  const visibleAnimals = useMemo(
    () => animals.filter((a) => (a.moderationStatus ?? 'approved') === 'approved'),
    [animals],
  );

  const sortedAnimals = useMemo(() => {
    const sorted = [...visibleAnimals];
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'priceAsc') sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sort === 'priceDesc')
      sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sort === 'age') sorted.sort((a, b) => (a.ageMonths ?? 0) - (b.ageMonths ?? 0));
    if (sort === 'createdAt')
      sorted.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
    return sorted;
  }, [visibleAnimals, sort]);

  const closeModal = () => dispatch(setCurrentAnimal(null));

  const handleAddToCart = () => {
    const stock = currentAnimal.stock;
    const inCart = cartItems.find((i) => i.animalId === currentAnimal.id)?.quantity ?? 0;
    if (stock === 0) return;
    if (stock != null && inCart >= stock) {
      message.warning(`Больше нет в наличии: осталось ${stock} шт.`);
      return;
    }
    dispatch(addToCart(currentAnimal.id));
    message.success(`«${currentAnimal.name}» добавлен в корзину`);
    closeModal();
  };

  const liked = currentAnimal ? favIds.includes(currentAnimal.id) : false;
  const handleToggleFav = () => {
    if (currentAnimal) dispatch(toggleFavorite(currentAnimal.id));
  };

  // Чужой товар можно обсудить с продавцом; свой — нет.
  const canMessageSeller =
    !readOnly && currentAnimal?.owner?.id && currentAnimal.owner.id !== userId;
  // Свой товар продавец не покупает — кнопку «В корзину» в просмотре не показываем.
  const isOwnProduct = Boolean(currentAnimal?.owner?.id && currentAnimal.owner.id === userId);
  const handleWriteSeller = () => {
    dispatch(
      startProductChat({
        sellerId: currentAnimal.owner.id,
        sellerName: sellerNameOf(currentAnimal),
        productName: currentAnimal.name,
      }),
    );
    closeModal();
    navigate('/chat');
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <Title level={2} className="!mb-0 !font-light">
          Животные
        </Title>
        {!loading && <Text type="secondary">{visibleAnimals.length} шт.</Text>}
      </div>
      <div className="mb-8">
        <Filter />
      </div>

      {error && (
        <div className="text-center py-16 text-stone-500">
          <Alert title={error} type="error" />
          <p>{error}</p>
          <p className="text-sm mt-2">Убедитесь, что API запущен на localhost:3000</p>
        </div>
      )}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="border border-stone-200"
              cover={<div className="aspect-square bg-stone-100" />}
            >
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      )}
      {visibleAnimals.length === 0 && !loading && !error && (
        <Empty description="Ничего не найдено" className="!my-20" />
      )}
      {visibleAnimals.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAnimals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} readOnly={readOnly} />
          ))}
        </div>
      )}
      <Modal
        open={Boolean(currentAnimal)}
        onCancel={closeModal}
        width={780}
        title={null}
        footer={
          readOnly
            ? [
                <Button key="close" onClick={closeModal}>
                  Закрыть
                </Button>,
              ]
            : [
                <Button
                  key="fav"
                  icon={liked ? <HeartFilled style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
                  onClick={handleToggleFav}
                >
                  {liked ? 'В избранном' : 'В избранное'}
                </Button>,
                canMessageSeller && (
                  <Button key="chat" icon={<MessageOutlined />} onClick={handleWriteSeller}>
                    Написать продавцу
                  </Button>
                ),
                <Button key="close" onClick={closeModal}>
                  Закрыть
                </Button>,
                !isOwnProduct && (
                  <Button
                    key="buy"
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={handleAddToCart}
                    disabled={currentAnimal?.stock === 0}
                  >
                    {currentAnimal?.stock === 0
                      ? 'Нет в наличии'
                      : `В корзину · ${currentAnimal ? Number(currentAnimal.price) : 0} ₽`}
                  </Button>
                ),
              ]
        }
      >
        {currentAnimal && (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="sm:w-80 sm:shrink-0">
              <PhotoGallery animal={currentAnimal} />
            </div>
            <div className="flex-1 min-w-0 sm:pt-1">
              <Title level={4} className="!mb-1">
                {currentAnimal.name}
              </Title>
              <Tag color={CATEGORY_COLOR[currentAnimal.category?.name]}>
                {currentAnimal.category?.name}
              </Tag>
              <Paragraph type="secondary" className="!mt-2 !mb-0">
                {currentAnimal.species || '—'}
              </Paragraph>
              <Divider className="!my-4" />
              <Descriptions
                column={1}
                size="small"
                labelStyle={{ width: 150, color: '#8c8c8c' }}
                items={[
                  {
                    key: 'owner',
                    label: 'Владелец',
                    children: sellerNameOf(currentAnimal),
                  },
                  ...(currentAnimal.description
                    ? [
                        {
                          key: 'description',
                          label: 'Описание',
                          children: currentAnimal.description,
                        },
                      ]
                    : []),
                  {
                    key: 'age',
                    label: 'Возраст',
                    children: `${currentAnimal.ageMonths} мес.`,
                  },
                  {
                    key: 'price',
                    label: 'Цена',
                    children: (
                      <Text strong className="text-lg">
                        {Number(currentAnimal.price)} ₽
                      </Text>
                    ),
                  },
                  ...(currentAnimal.stock != null
                    ? [
                        {
                          key: 'stock',
                          label: 'В наличии',
                          children:
                            currentAnimal.stock === 0 ? (
                              <Text type="danger">Нет в наличии</Text>
                            ) : (
                              `${currentAnimal.stock} шт.`
                            ),
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
