import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Select, Button, Drawer, Badge } from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  SortAscendingOutlined,
  HeartOutlined,
  HeartFilled,
  CheckOutlined,
} from '@ant-design/icons';
import { useIsMobile } from '@/shared/lib';
import { setCategoryId, setSearch, setOnlyFavorites, setSort } from '@/entities/animal';

// Варианты сортировки каталога (логика — в home.page.jsx).
const SORT_OPTIONS = [
  { value: 'name', label: 'По имени' },
  { value: 'createdAt', label: 'Сначала новые' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'age', label: 'Сначала молодые' },
];

// Сортировка по умолчанию (совпадает с initialState в animal.slice) — при ней
// считаем, что пользователь ничего не выбирал, и не подсвечиваем кнопку.
const DEFAULT_SORT = SORT_OPTIONS[0].value;

// Список вариантов внутри мобильного Drawer: выбранный подсвечен фоном и галочкой,
// клик выбирает вариант и закрывает шторку.
const OptionList = ({ options, value, onSelect }) => (
  <div className="flex flex-col gap-1">
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`flex items-center justify-between rounded-lg px-3 py-3 text-left text-base transition-colors ${
            active ? 'bg-stone-100 font-medium text-stone-900' : 'text-stone-600'
          }`}
        >
          {option.label}
          {active && <CheckOutlined className="text-stone-900" />}
        </button>
      );
    })}
  </div>
);

export const Filter = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const { categories, categoryId, search, onlyFavorites, sort } = useSelector(
    (state) => state.animal,
  );
  const role = useSelector((state) => state.auth.role);
  // Избранное есть только у покупателей/продавцов — персоналу переключатель не показываем.
  const canFavorite = !(role === 'admin' || role === 'moderator' || role === 'courier');
  const optionsCategories = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  // Какая шторка открыта на мобильной версии: 'category' | 'sort' | null.
  const [openDrawer, setOpenDrawer] = useState(null);
  // Пока поиск в фокусе — растягиваем поле на всю строку, пряча иконки.
  const [searchFocused, setSearchFocused] = useState(false);

  // ---- Десктоп: прежняя раскладка (поиск, категория, избранное, сортировка) ----
  if (!isMobile) {
    return (
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            allowClear
            value={search}
            prefix={<SearchOutlined className="text-stone-400" />}
            placeholder="Поиск по имени"
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="sm:w-64"
            size="large"
          />
          <Select
            value={categoryId}
            placeholder="Выбери категорию"
            className="sm:w-52"
            size="large"
            onChange={(id) => dispatch(setCategoryId(id ?? null))}
            allowClear
            suffixIcon={<AppstoreOutlined />}
            options={optionsCategories}
          />
          {canFavorite && (
            <Button
              size="large"
              type={onlyFavorites ? 'primary' : 'default'}
              icon={onlyFavorites ? <HeartFilled /> : <HeartOutlined />}
              onClick={() => dispatch(setOnlyFavorites(!onlyFavorites))}
            >
              Избранное
            </Button>
          )}
        </div>
        <Select
          value={sort}
          onChange={(value) => dispatch(setSort(value))}
          className="sm:w-56"
          size="large"
          suffixIcon={<SortAscendingOutlined />}
          options={SORT_OPTIONS}
        />
      </div>
    );
  }

  // ---- Мобильная версия: поиск + иконки фильтра/избранного/сортировки в одну строку ----
  const categoryOptions = [{ value: null, label: 'Все категории' }, ...optionsCategories];

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          allowClear
          value={search}
          prefix={<SearchOutlined className="text-stone-400" />}
          placeholder="Поиск"
          onChange={(e) => dispatch(setSearch(e.target.value))}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="min-w-0 flex-1"
          size="large"
        />
        {!searchFocused && (
          <>
            <Badge dot={categoryId != null}>
              <Button
                size="large"
                type={categoryId != null ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setOpenDrawer('category')}
                aria-label="Фильтр по категории"
              />
            </Badge>
            {canFavorite && (
              <Button
                size="large"
                type={onlyFavorites ? 'primary' : 'default'}
                icon={onlyFavorites ? <HeartFilled /> : <HeartOutlined />}
                onClick={() => dispatch(setOnlyFavorites(!onlyFavorites))}
                aria-label="Только избранное"
              />
            )}
            <Badge dot={sort !== DEFAULT_SORT}>
              <Button
                size="large"
                type={sort !== DEFAULT_SORT ? 'primary' : 'default'}
                icon={<SortAscendingOutlined />}
                onClick={() => setOpenDrawer('sort')}
                aria-label="Сортировка"
              />
            </Badge>
          </>
        )}
      </div>

      <Drawer
        title="Категория"
        placement="bottom"
        height="auto"
        open={openDrawer === 'category'}
        onClose={() => setOpenDrawer(null)}
      >
        <OptionList
          options={categoryOptions}
          value={categoryId ?? null}
          onSelect={(value) => {
            dispatch(setCategoryId(value ?? null));
            setOpenDrawer(null);
          }}
        />
      </Drawer>

      <Drawer
        title="Сортировка"
        placement="bottom"
        height="auto"
        open={openDrawer === 'sort'}
        onClose={() => setOpenDrawer(null)}
      >
        <OptionList
          options={SORT_OPTIONS}
          value={sort}
          onSelect={(value) => {
            dispatch(setSort(value));
            setOpenDrawer(null);
          }}
        />
      </Drawer>
    </>
  );
};
