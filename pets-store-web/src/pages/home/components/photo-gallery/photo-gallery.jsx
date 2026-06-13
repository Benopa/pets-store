import { useState, useEffect, useRef } from 'react';
import { Image, Carousel } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

export const PhotoGallery = ({ animal }) => {
  const carouselRef = useRef(null);
  const [active, setActive] = useState(0);

  const photos = (animal.images ?? []).map((img) => `http://localhost:3000${img.url}`);

  // reset to first photo whenever a new animal is shown
  useEffect(() => {
    setActive(0);
    carouselRef.current?.goTo(0, true);
  }, [animal.id]);

  const go = (i) => {
    carouselRef.current?.goTo(i);
    setActive(i);
  };

  if (photos.length === 0) {
    return (
      <div className="gallery-stage rounded-xl flex items-center justify-center bg-stone-100 text-stone-300 text-4xl">
        ♥
      </div>
    );
  }

  return (
    <div>
      <Image.PreviewGroup
        preview={{
          current: active,
          onChange: (i) => go(i),
        }}
      >
        <div className="relative rounded-xl overflow-hidden bg-stone-100">
          <Carousel ref={carouselRef} dots={false} afterChange={setActive} adaptiveHeight={false}>
            {photos.map((src, i) => (
              <div key={i}>
                <div className="gallery-stage">
                  <Image
                    src={src}
                    alt={`${animal.name} ${i + 1}`}
                    rootClassName="gallery-img-root"
                    className="gallery-img"
                  />
                </div>
              </div>
            ))}
          </Carousel>

          {photos.length > 1 && (
            <>
              <button
                onClick={() => go((active - 1 + photos.length) % photos.length)}
                className="gallery-nav left-3"
                aria-label="Назад"
              >
                <LeftOutlined />
              </button>
              <button
                onClick={() => go((active + 1) % photos.length)}
                className="gallery-nav right-3"
                aria-label="Вперёд"
              >
                <RightOutlined />
              </button>
              <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
                {active + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      </Image.PreviewGroup>

      {photos.length > 1 && (
        <div className="flex gap-2 mt-3">
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`thumb ${i === active ? 'thumb-active' : ''}`}
            >
              <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
