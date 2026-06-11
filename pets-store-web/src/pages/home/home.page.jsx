import { AnimalCard } from './components/animal-card';
import { Filter } from './components/filter/filter';
import { useSelector, useDispatch } from 'react-redux';
import { Alert, Modal } from 'antd';
import { setCurrentAnimal } from '../../features';

export const HomePage = () => {
  const { animals, loading, error, currentAnimal } = useSelector((state) => state.animal);

  const dispatch = useDispatch();

  return (
    <div>
      <h1 className="text-2xl font-light text-stone-800 mb-8">Животные</h1>
      <div className="mb-6">
        <Filter placeholder="Поиск по имени..." />
      </div>

      {error && (
        <div className="text-center py-16 text-stone-500">
          <Alert title={error} type="error" />
          <p>{error}</p>
          <p className="text-sm mt-2">Убедитесь, что API запущен на localhost:3000</p>
        </div>
      )}
      {loading && (
        <div className="flex justify-center py-16">
          <span className="text-stone-400 text-sm">Загрузка...</span>
        </div>
      )}
      {animals.length === 0 && !loading && !error && <p className="text-stone-500">Нет животных</p>}
      {animals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((animal) => (
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
        title={currentAnimal?.name}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={Boolean(currentAnimal)}
        onOk={() => dispatch(setCurrentAnimal(null))}
        onCancel={() => dispatch(setCurrentAnimal(null))}
        footer={(_, { OkBtn }) => (
          <>
            <OkBtn />
          </>
        )}
      >
        <p>имя владельца аватара: {currentAnimal?.description}</p>
        <p>возраст: {currentAnimal?.ageMonths}</p>
        <p>цена: {currentAnimal?.price}</p>
      </Modal>
      {/* Modal */}
    </div>
  );
};
