import { useDispatch, useSelector } from 'react-redux';
import { Input, Select, Segmented } from 'antd';
import { SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import {
  setCategoryId,
  setSearch,
  setSort,
} from '../../../../features/animal/model/animal/animal.slice';

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
      <Segmented
        value={sort}
        onChange={(value) => dispatch(setSort(value))}
        options={[
          { label: 'По имени', value: 'name' },
          { label: 'Дешевле', value: 'priceAsc' },
          { label: 'Младше', value: 'age' },
        ]}
      />
    </div>
  );
};
