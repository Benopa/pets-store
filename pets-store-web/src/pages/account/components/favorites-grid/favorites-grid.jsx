import { useSelector } from 'react-redux';
import { Empty } from 'antd';
import { AnimalCard } from '../../../home/components/animal-card';

// Избранные товары из каталога (фильтруем по id из favorites-стора).
export const FavoritesGrid = () => {
  const ids = useSelector((state) => state.favorites.ids);
  const animals = useSelector((state) => state.animal.animals);
  const items = animals.filter((a) => ids.includes(a.id));

  if (items.length === 0) {
    return <Empty description="Пока нет понравившихся товаров" className="!my-16" />;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((animal) => (
        <AnimalCard key={animal.id} animal={animal} />
      ))}
    </div>
  );
};
