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
      <div className="w-full h-72 p-2 rounded-xl flex items-center justify-center bg-stone-100 text-stone-300 text-4xl">
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
                <div className="w-full h-72 p-2">
                  <Image
                    src={src}
                    alt={`${animal.name} ${i + 1}`}
                    rootClassName="w-full! h-full! block"
                    className="w-full! h-72! object-contain! cursor-zoom-in"
                  />
                </div>
              </div>
            ))}
          </Carousel>

          {photos.length > 1 && (
            <>
              <button
                onClick={() => go((active - 1 + photos.length) % photos.length)}
                className="absolute top-1/2 left-3 -translate-y-1/2 z-[2] grid place-items-center w-9 h-9 border-0 rounded-full bg-white/[0.92] text-stone-700 cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition hover:bg-white hover:scale-105"
                aria-label="Назад"
              >
                <LeftOutlined />
              </button>
              <button
                onClick={() => go((active + 1) % photos.length)}
                className="absolute top-1/2 right-3 -translate-y-1/2 z-[2] grid place-items-center w-9 h-9 border-0 rounded-full bg-white/[0.92] text-stone-700 cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition hover:bg-white hover:scale-105"
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
              className={`flex-none w-14 h-14 p-0 border-2 rounded-lg overflow-hidden bg-stone-100 cursor-pointer transition ${
                i === active ? 'opacity-100 border-[#9850fd]' : 'opacity-60 border-transparent'
              }`}
            >
              <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
