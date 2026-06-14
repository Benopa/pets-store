import { AnimalCard, CATEGORY_COLOR } from './components/animal-card';
import { Filter } from './components/filter/filter';
import { PhotoGallery } from './components/photo-gallery';
import { useMemo } from 'react';
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
import { ShoppingCartOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { setCurrentAnimal, addToCart, toggleFavorite } from '../../features';

const { Title, Text, Paragraph } = Typography;

export const HomePage = () => {
  const { animals, loading, error, currentAnimal, sort } = useSelector((state) => state.animal);

  const dispatch = useDispatch();
  const { message } = App.useApp();
  const favIds = useSelector((state) => state.favorites.ids);

  const sortedAnimals = useMemo(() => {
    const sorted = [...animals];
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'priceAsc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'age') sorted.sort((a, b) => a.ageMonths - b.ageMonths);
    return sorted;
  }, [animals, sort]);

  const closeModal = () => dispatch(setCurrentAnimal(null));

  const handleAddToCart = () => {
    dispatch(addToCart(currentAnimal.id));
    message.success(`«${currentAnimal.name}» добавлен в корзину`);
    closeModal();
  };

  const liked = currentAnimal ? favIds.includes(currentAnimal.id) : false;
  const handleToggleFav = () => {
    if (currentAnimal) dispatch(toggleFavorite(currentAnimal.id));
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <Title level={2} className="!mb-0 !font-light">
          Животные
        </Title>
        {!loading && <Text type="secondary">{animals.length} шт.</Text>}
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
      {animals.length === 0 && !loading && !error && (
        <Empty description="Ничего не найдено" className="!my-20" />
      )}
      {animals.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAnimals.map((animal) => (
            // onClick={dispatch c animal}
            <AnimalCard
              key={animal.id}
              animal={animal}
              // onClick={() => dispatch(setCurrentAnimal(animal))}
            />
          ))}
        </div>
      )}
      <Modal
        open={Boolean(currentAnimal)}
        onCancel={closeModal}
        width={780}
        title={null}
        footer={[
          <Button
            key="fav"
            icon={liked ? <HeartFilled style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
            onClick={handleToggleFav}
          >
            {liked ? 'В избранном' : 'В избранное'}
          </Button>,
          <Button key="close" onClick={closeModal}>
            Закрыть
          </Button>,
          <Button
            key="buy"
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={handleAddToCart}
          >
            В корзину · {currentAnimal ? Number(currentAnimal.price) : 0} ₽
          </Button>,
        ]}
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
                    label: 'Владелец аватара',
                    children: currentAnimal.description || '—',
                  },
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
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
