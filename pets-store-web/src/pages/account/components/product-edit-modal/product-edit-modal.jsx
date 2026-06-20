import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App, Form, Input, InputNumber, Modal, Select, Spin, Tooltip, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, StarOutlined, LoadingOutlined } from '@ant-design/icons';
import {
  createAnimal,
  updateAnimal,
  uploadAnimalImage,
  deleteAnimalImage,
  setAnimalCover,
} from '@/entities/animal';
import { API_ORIGIN } from '@/shared/config';

// Один элемент сетки фото: обложка-бейдж + действия (обложка/удалить) по ховеру.
const PhotoTile = ({ src, isCover, onCover, onDelete, disabled }) => (
  <div className="group relative h-20 w-20 overflow-hidden rounded-lg border border-stone-200">
    <img src={src} alt="" className="h-full w-full object-cover" />
    {isCover && (
      <span className="absolute bottom-0 left-0 right-0 bg-black/55 py-0.5 text-center text-[10px] text-white">
        Обложка
      </span>
    )}
    <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      {onCover && (
        <Tooltip title="Сделать обложкой">
          <button
            type="button"
            disabled={disabled}
            onClick={onCover}
            className="grid h-6 w-6 place-items-center rounded-full border-0 bg-white/90 text-amber-500 cursor-pointer disabled:cursor-not-allowed"
          >
            <StarOutlined />
          </button>
        </Tooltip>
      )}
      <Tooltip title="Удалить фото">
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="grid h-6 w-6 place-items-center rounded-full border-0 bg-white/90 text-red-500 cursor-pointer disabled:cursor-not-allowed"
        >
          <DeleteOutlined />
        </button>
      </Tooltip>
    </div>
  </div>
);

// Монтируется только когда открыто → начальное состояние берётся из props через
// инициализаторы useState (без эффектов).
const ProductEditModalInner = ({ animal, onClose }) => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const categories = useSelector((state) => state.animal.categories);
  const [form] = Form.useForm();
  const isEdit = Boolean(animal);

  // EDIT: серверные фото (с id) — операции сразу уходят на бэкенд.
  const [existing, setExisting] = useState(() => (animal?.images ?? []).slice());
  // CREATE: локальные файлы + их превью; заливаются при сохранении.
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialValues = {
    name: animal?.name ?? '',
    categoryId: animal?.category?.id,
    species: animal?.species ?? '',
    description: animal?.description ?? '',
    ageMonths: animal?.ageMonths ?? null,
    price: animal?.price != null ? Number(animal.price) : null,
  };

  const isImage = (file) => {
    if (file.type.startsWith('image/')) return true;
    message.error('Можно добавлять только изображения');
    return false;
  };

  // ----- CREATE: локальные операции -----
  const addLocal = (file) => {
    if (!isImage(file)) return false;
    setFiles((p) => [...p, file]);
    setPreviews((p) => [...p, URL.createObjectURL(file)]);
    return false; // не загружать автоматически
  };
  const removeLocal = (i) => {
    URL.revokeObjectURL(previews[i]);
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };
  const coverLocal = (i) => {
    setFiles((p) => [p[i], ...p.filter((_, idx) => idx !== i)]);
    setPreviews((p) => [p[i], ...p.filter((_, idx) => idx !== i)]);
  };

  // ----- EDIT: серверные операции (сразу персистятся) -----
  const runPhotoOp = async (thunk, errText) => {
    setPhotoBusy(true);
    const res = await dispatch(thunk);
    setPhotoBusy(false);
    if (res.meta.requestStatus === 'fulfilled') {
      setExisting((res.payload.images ?? []).slice());
      return true;
    }
    message.error(res.payload || errText);
    return false;
  };
  const addServer = (file) => {
    if (!isImage(file)) return false;
    runPhotoOp(uploadAnimalImage({ animalId: animal.id, file }), 'Не удалось загрузить фото');
    return false;
  };
  const removeServer = (imageId) =>
    runPhotoOp(deleteAnimalImage({ animalId: animal.id, imageId }), 'Не удалось удалить фото');
  const coverServer = (imageId) =>
    runPhotoOp(setAnimalCover({ animalId: animal.id, imageId }), 'Не удалось сменить обложку');

  const handleOk = async () => {
    let vals;
    try {
      vals = await form.validateFields();
    } catch {
      return; // ошибки валидации покажет antd
    }
    const data = {
      name: vals.name.trim(),
      categoryId: vals.categoryId,
      species: vals.species?.trim() || undefined,
      description: vals.description?.trim() || undefined,
      ageMonths: vals.ageMonths ?? undefined,
      price: vals.price ?? undefined,
    };
    setSaving(true);
    // В edit-режиме фото уже сохранены на сервере, передаём только поля.
    const result = isEdit
      ? await dispatch(updateAnimal({ id: animal.id, data }))
      : await dispatch(createAnimal({ data, files }));
    setSaving(false);
    if ((isEdit ? updateAnimal : createAnimal).fulfilled.match(result)) {
      previews.forEach((u) => URL.revokeObjectURL(u));
      message.success(isEdit ? 'Карточка обновлена' : 'Товар добавлен');
      onClose();
    } else {
      message.error(result.payload || 'Не удалось сохранить товар');
    }
  };

  const tiles = isEdit
    ? existing.map((img, i) => ({
        key: img.id,
        src: `${API_ORIGIN}${img.url}`,
        isCover: i === 0,
        onCover: i === 0 ? null : () => coverServer(img.id),
        onDelete: () => removeServer(img.id),
      }))
    : previews.map((src, i) => ({
        key: `n${i}`,
        src,
        isCover: i === 0,
        onCover: i === 0 ? null : () => coverLocal(i),
        onDelete: () => removeLocal(i),
      }));

  return (
    <Modal
      open
      onCancel={onClose}
      onOk={handleOk}
      width={620}
      confirmLoading={saving}
      okText={isEdit ? 'Сохранить' : 'Добавить товар'}
      cancelText="Отмена"
      title={isEdit ? `Редактирование «${animal.name}»` : 'Новый товар'}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={initialValues}
        className="!mt-4"
      >
        <Form.Item
          label="Фотографии"
          help={
            isEdit
              ? 'Наведите на фото, чтобы сделать обложкой или удалить'
              : 'Первое фото станет обложкой — наведите, чтобы выбрать другое'
          }
        >
          <div className="flex flex-wrap gap-3">
            {tiles.map((t) => (
              <PhotoTile
                key={t.key}
                src={t.src}
                isCover={t.isCover}
                onCover={t.onCover}
                onDelete={t.onDelete}
                disabled={photoBusy}
              />
            ))}
            <Upload
              showUploadList={false}
              accept="image/*"
              multiple={!isEdit}
              disabled={photoBusy}
              beforeUpload={isEdit ? addServer : addLocal}
            >
              <button
                type="button"
                disabled={photoBusy}
                className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-stone-300 bg-transparent text-stone-400 hover:border-[#9850fd] hover:text-[#9850fd] disabled:cursor-not-allowed"
              >
                {photoBusy ? (
                  <Spin indicator={<LoadingOutlined spin />} size="small" />
                ) : (
                  <PlusOutlined />
                )}
              </button>
            </Upload>
          </div>
        </Form.Item>

        <div className="flex gap-4">
          <Form.Item
            name="name"
            label="Имя питомца"
            className="flex-1"
            rules={[
              { required: true, message: 'Введите имя' },
              { min: 2, message: 'Минимум 2 символа' },
            ]}
          >
            <Input size="large" placeholder="Например, Tom" />
          </Form.Item>
          <Form.Item
            name="categoryId"
            label="Категория"
            className="flex-1"
            rules={[{ required: true, message: 'Выберите категорию' }]}
          >
            <Select
              size="large"
              placeholder="Категория"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
        </div>

        <Form.Item name="species" label="Порода / вид">
          <Input size="large" placeholder="cat, dog, labrador…" />
        </Form.Item>

        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={2} placeholder="Короткое описание питомца" />
        </Form.Item>

        <div className="flex gap-4">
          <Form.Item name="ageMonths" label="Возраст (мес.)" className="flex-1">
            <InputNumber size="large" min={0} max={600} className="w-full!" />
          </Form.Item>
          <Form.Item
            name="price"
            label="Цена (₽)"
            className="flex-1"
            rules={[{ required: true, message: 'Укажите цену' }]}
          >
            <InputNumber size="large" min={0} step={0.5} className="w-full!" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export const ProductEditModal = ({ open, animal, onClose }) =>
  open ? <ProductEditModalInner animal={animal} onClose={onClose} /> : null;
