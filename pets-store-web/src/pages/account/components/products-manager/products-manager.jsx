import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App, Button, Empty, Input, List, Tag, Tooltip, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { CATEGORY_COLOR, MODERATION_STATUS, deleteAnimal, resubmitAnimal } from '@/entities/animal';
import { API_ORIGIN } from '@/shared/config';
import { ProductEditModal } from '../product-edit-modal';

const { Text } = Typography;

const imageOf = (animal) =>
  animal.imageUrl ||
  animal.image ||
  (animal.images?.[0]?.url ? `${API_ORIGIN}${animal.images[0].url}` : null);

const ownerLabel = (owner) =>
  owner?.email || [owner?.firstName, owner?.lastName].filter(Boolean).join(' ') || owner?.id;

export const ProductsManager = () => {
  const dispatch = useDispatch();
  const { message, modal } = App.useApp();

  const animals = useSelector((state) => state.animal.animals);
  const { role, userId } = useSelector((state) => state.auth);
  const isAdmin = role === 'admin';

  // Админ управляет всем каталогом, продавец — только своими карточками.
  const owned = isAdmin ? animals : animals.filter((a) => a.owner?.id === userId);

  // Поиск: по названию, категории, виду и (для админа) владельцу/магазину.
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const mine = q
    ? owned.filter((a) =>
        [a.name, a.category?.name, a.species, ownerLabel(a.owner)]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(q)),
      )
    : owned;

  const [editor, setEditor] = useState({ open: false, animal: null });
  const openCreate = () => setEditor({ open: true, animal: null });
  const openEdit = (animal) => setEditor({ open: true, animal });
  const closeEditor = () => setEditor({ open: false, animal: null });

  const confirmDelete = (animal) => {
    modal.confirm({
      title: `Удалить «${animal.name}»?`,
      content: 'Карточка товара будет удалена без возможности восстановления.',
      okText: 'Удалить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: async () => {
        const result = await dispatch(deleteAnimal(animal.id));
        if (deleteAnimal.fulfilled.match(result)) {
          message.success('Товар удалён');
        } else {
          message.error(result.payload || 'Не удалось удалить товар');
        }
      },
    });
  };

  const handleResubmit = async (animal) => {
    const result = await dispatch(resubmitAnimal(animal.id));
    if (resubmitAnimal.fulfilled.match(result)) {
      message.success(`«${animal.name}» отправлен на повторную проверку`);
    } else {
      message.error(result.payload || 'Не удалось отправить на проверку');
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Text type="secondary">
          {isAdmin ? `Все товары каталога · ${mine.length}` : `Ваши товары · ${mine.length}`}
        </Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Добавить товар
        </Button>
      </div>

      <Input
        allowClear
        size="large"
        prefix={<SearchOutlined className="text-stone-400" />}
        placeholder={
          isAdmin ? 'Поиск по названию, категории или магазину' : 'Поиск по названию или категории'
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="!mb-4"
      />

      {mine.length === 0 ? (
        q ? (
          <Empty description={`Ничего не найдено по «${query}»`} className="!my-12" />
        ) : (
          <Empty description="Товаров пока нет" className="!my-12">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Добавить первый товар
            </Button>
          </Empty>
        )
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={mine}
          renderItem={(animal) => (
            <List.Item
              className="!px-0"
              actions={[
                animal.moderationStatus === 'rejected' ? (
                  <Tooltip title="Отправить на повторную проверку" key="resub">
                    <Button
                      type="text"
                      icon={<ReloadOutlined />}
                      style={{ color: '#9850fd' }}
                      onClick={() => handleResubmit(animal)}
                    />
                  </Tooltip>
                ) : null,
                <Tooltip title="Редактировать" key="edit">
                  <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(animal)} />
                </Tooltip>,
                <Tooltip title="Удалить" key="del">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => confirmDelete(animal)}
                  />
                </Tooltip>,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  imageOf(animal) ? (
                    <img
                      src={imageOf(animal)}
                      alt={animal.name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-xl bg-stone-100 text-stone-300">
                      ♥
                    </div>
                  )
                }
                title={
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{animal.name}</span>
                    {animal.category?.name && (
                      <Tag color={CATEGORY_COLOR[animal.category.name]} className="!mr-0">
                        {animal.category.name}
                      </Tag>
                    )}
                    {MODERATION_STATUS[animal.moderationStatus] && (
                      <Tag
                        color={MODERATION_STATUS[animal.moderationStatus].color}
                        className="!mr-0"
                      >
                        {MODERATION_STATUS[animal.moderationStatus].label}
                      </Tag>
                    )}
                    {isAdmin && animal.owner && animal.owner.id !== userId && (
                      <Tag className="!mr-0">{ownerLabel(animal.owner)}</Tag>
                    )}
                  </div>
                }
                description={
                  <div>
                    <span className="text-stone-400">
                      {[
                        animal.species,
                        animal.ageMonths != null && `${animal.ageMonths} мес.`,
                        animal.price != null && `${Number(animal.price)} ₽`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    {animal.moderationStatus === 'rejected' && animal.rejectReason && (
                      <div
                        className="mt-2 flex items-start gap-2 rounded-lg px-3 py-2"
                        style={{ background: '#fff1f0', border: '1px solid #ffccc7' }}
                      >
                        <ExclamationCircleOutlined style={{ color: '#cf1322', marginTop: 3 }} />
                        <div className="min-w-0">
                          <Text className="block text-xs font-medium" style={{ color: '#cf1322' }}>
                            Причина отклонения
                          </Text>
                          <Text className="text-sm" style={{ color: '#820014' }}>
                            {animal.rejectReason}
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      <ProductEditModal open={editor.open} animal={editor.animal} onClose={closeEditor} />
    </div>
  );
};
