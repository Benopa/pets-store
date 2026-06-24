import { useDispatch, useSelector } from 'react-redux';
import { Input, Select } from 'antd';
import { SearchOutlined, AppstoreOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { setCategoryId, setSearch, setSort } from '@/entities/animal';

// Варианты сортировки каталога (логика — в home.page.jsx).
const SORT_OPTIONS = [
  { value: 'name', label: 'По имени' },
  { value: 'createdAt', label: 'Сначала новые' },
  { value: 'priceAsc', label: 'Сначала дешёвые' },
  { value: 'priceDesc', label: 'Сначала дорогие' },
  { value: 'age', label: 'Сначала молодые' },
];

export const Filter = () => {
  const dispatch = useDispatch();
  const { categories, categoryId, search, sort } = useSelector((state) => state.animal);
  const optionsCategories = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

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
};
