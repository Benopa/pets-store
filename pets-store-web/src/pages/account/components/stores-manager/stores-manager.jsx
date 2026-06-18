import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App, Button, Empty, Form, Input, List, Modal, Skeleton, Tooltip, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ShopOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { fetchShops, createShop, updateShop, deleteShop } from '../../../../features';

const { Text } = Typography;

export const StoresManager = () => {
  const dispatch = useDispatch();
  const { message, modal } = App.useApp();
  const { items, loading, saving } = useSelector((state) => state.shops);
  const [form] = Form.useForm();

  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState({ open: false, shop: null });

  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((s) =>
        [s.name, s.address].filter(Boolean).some((f) => f.toLowerCase().includes(q)),
      )
    : items;

  const openCreate = () => {
    form.resetFields();
    setEditor({ open: true, shop: null });
  };
  const openEdit = (shop) => {
    form.setFieldsValue({ name: shop.name, address: shop.address ?? '' });
    setEditor({ open: true, shop });
  };
  const closeEditor = () => setEditor({ open: false, shop: null });

  const handleOk = async () => {
    let vals;
    try {
      vals = await form.validateFields();
    } catch {
      return; // ошибки валидации покажет antd
    }
    const payload = { name: vals.name.trim(), address: vals.address?.trim() || undefined };
    const result = editor.shop
      ? await dispatch(updateShop({ id: editor.shop.id, ...payload }))
      : await dispatch(createShop(payload));
    const thunk = editor.shop ? updateShop : createShop;
    if (thunk.fulfilled.match(result)) {
      message.success(editor.shop ? 'Магазин обновлён' : 'Магазин добавлен');
      closeEditor();
    } else {
      message.error(result.payload || 'Не удалось сохранить магазин');
    }
  };

  const confirmDelete = (shop) => {
    modal.confirm({
      title: `Удалить «${shop.name}»?`,
      content: 'Магазин будет удалён из справочника.',
      okText: 'Удалить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: async () => {
        const result = await dispatch(deleteShop(shop.id));
        if (deleteShop.fulfilled.match(result)) {
          message.success('Магазин удалён');
        } else {
          message.error(result.payload || 'Не удалось удалить магазин');
        }
      },
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Text type="secondary">Магазины · {items.length}</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Добавить магазин
        </Button>
      </div>

      <Input
        allowClear
        size="large"
        prefix={<SearchOutlined className="text-stone-400" />}
        placeholder="Поиск по названию или адресу"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="!mb-4"
      />

      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : filtered.length === 0 ? (
        <Empty
          description={q ? `Ничего не найдено по «${query}»` : 'Магазинов пока нет'}
          className="!my-12"
        >
          {!q && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Добавить первый магазин
            </Button>
          )}
        </Empty>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={filtered}
          renderItem={(shop) => (
            <List.Item
              className="!px-0"
              actions={[
                <Tooltip title="Редактировать" key="edit">
                  <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(shop)} />
                </Tooltip>,
                <Tooltip title="Удалить" key="del">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => confirmDelete(shop)}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    className="grid h-14 w-14 place-items-center rounded-xl text-lg font-medium text-white"
                    style={{ background: '#9850fd' }}
                  >
                    {shop.name.slice(0, 1).toUpperCase()}
                  </div>
                }
                title={shop.name}
                description={
                  <span className="text-stone-400">
                    <EnvironmentOutlined className="mr-1" />
                    {shop.address || 'Адрес не указан'}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        open={editor.open}
        forceRender
        onCancel={closeEditor}
        onOk={handleOk}
        confirmLoading={saving}
        okText={editor.shop ? 'Сохранить' : 'Добавить'}
        cancelText="Отмена"
        title={editor.shop ? `Редактирование «${editor.shop.name}»` : 'Новый магазин'}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="!mt-4">
          <Form.Item
            name="name"
            label="Название"
            rules={[
              { required: true, message: 'Введите название' },
              { min: 2, message: 'Минимум 2 символа' },
            ]}
          >
            <Input
              size="large"
              prefix={<ShopOutlined className="text-stone-400" />}
              placeholder="Зоомагазин «Лапки»"
            />
          </Form.Item>
          <Form.Item name="address" label="Адрес">
            <Input
              size="large"
              prefix={<EnvironmentOutlined className="text-stone-400" />}
              placeholder="Город, улица, дом"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
