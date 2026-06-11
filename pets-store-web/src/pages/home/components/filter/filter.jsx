import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCategoryId, setSearch } from '../../../../features/animal/model/animal/animal.slice';
import { useSelector } from 'react-redux';

import { Input, Select } from 'antd';

const { Search } = Input;

export const Filter = () => {
  const dispatch = useDispatch();
  // const { categoryId } = useSelector((state) => state.animal);
  const categories = useSelector((state) => state.animal.categories);
  const optionsCategories = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectCategory = (id) => {
    dispatch(setCategoryId(id));
  };

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e) => {
      const el = containerRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setIsOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [isOpen]);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <Search
        placeholder="input search text"
        allowClear
        onSearch={(value) => dispatch(setSearch(value))}
        onChange={(e) => dispatch(setSearch(e.target.value))}
        className="w-full"
      />

      <Select
        defaultValue="Выбери категорию"
        className="w-[200px]"
        onChange={selectCategory}
        allowClear
        options={optionsCategories}
      />
    </div>
  );
};
