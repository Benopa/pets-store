import { Card, Tag } from 'antd';
import { useDispatch } from 'react-redux';
import { setCurrentAnimal } from '../../../../features';

const { Meta } = Card;

export const AnimalCard = ({ animal }) => {
  const dispatch = useDispatch();
  const imageUrl =
    animal.imageUrl ||
    animal.image ||
    (animal.images?.[0]?.url ? `http://localhost:3000${animal.images[0].url}` : null);

  return (
    <>
      <Card
        hoverable
        onClick={() => dispatch(setCurrentAnimal(animal))}
        className="!border !border-stone-200 rounded-lg bg-white hover:border-stone-300 transition-colors"
        cover={
          imageUrl ? (
            <div className="aspect-square overflow-hidden bg-stone-100">
              <img
                src={imageUrl}
                alt={animal.name}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square flex items-center justify-center bg-stone-100 text-stone-300 text-4xl">
              ♥
            </div>
          )
        }
      >
        <Meta
          title={animal.name}
          description={
            <div>
              <Tag variant={'outlined'}>{animal.category.name}</Tag>
              <p className="text-sm text-stone-500">{animal.species || '—'}</p>
              {animal.description ? (
                <p className="text-sm text-stone-600 mt-1">{animal.description}</p>
              ) : null}
              <p className="text-stone-800 font-medium mt-2">
                {animal.price != null ? `${Number(animal.price)} ₽` : '—'}
              </p>
            </div>
          }
        />
      </Card>
    </>
  );
};
