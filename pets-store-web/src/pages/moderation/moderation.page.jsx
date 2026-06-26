import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  App,
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  AuditOutlined,
  CheckOutlined,
  CloseOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  CATEGORY_COLOR,
  MODERATION_STATUS,
  PhotoGallery,
  fetchAnimals,
  approveAnimal,
  rejectAnimal,
} from '@/entities/animal';
import { API_ORIGIN } from '@/shared/config';

const { Title, Text, Paragraph } = Typography;

const imageOf = (animal) =>
  animal.imageUrl ||
  animal.image ||
  (animal.images?.[0]?.url ? `${API_ORIGIN}${animal.images[0].url}` : null);

const ownerLabel = (owner) =>
  owner?.email || [owner?.firstName, owner?.lastName].filter(Boolean).join(' ') || owner?.id || '—';

const factsLine = (animal) =>
  [
    animal.species,
    animal.ageMonths != null && `${animal.ageMonths} мес.`,
    `продавец ${ownerLabel(animal.owner)}`,
  ]
    .filter(Boolean)
    .join(' · ');

// Есть ли у товара комиссия сайта (товары продавцов). Если есть — показываем разбивку цены.
const hasCommission = (animal) => Number(animal.commissionRate) > 0 && animal.basePrice != null;

// Подпись с разбивкой: цена продавца + комиссия сайта.
const commissionLine = (animal) =>
  `Цена продавца ${Number(animal.basePrice)} ₽ + комиссия ${Math.round(
    Number(animal.commissionRate) * 100,
  )}%`;

export const ModerationPage = () => {
  const dispatch = useDispatch();
  const { message, modal } = App.useApp();
  const animals = useSelector((state) => state.animal.animals);

  // Подтягиваем свежий список при входе на страницу (весь, без лимита 20 —
  // иначе очередь модерации и общий каталог увидят лишь 20 свежих карточек).
  useEffect(() => {
    dispatch(fetchAnimals({ limit: 100 }));
  }, [dispatch]);

  const pending = useMemo(() => animals.filter((a) => a.moderationStatus === 'pending'), [animals]);
  const recent = useMemo(
    () =>
      animals
        .filter((a) => a.moderationStatus === 'rejected' || a.moderationStatus === 'approved')
        .slice(0, 5),
    [animals],
  );

  const [detail, setDetail] = useState(null);

  const approve = async (animal) => {
    const result = await dispatch(approveAnimal(animal.id));
    if (approveAnimal.fulfilled.match(result)) {
      message.success(`«${animal.name}» одобрен и опубликован`);
    } else {
      message.error(result.payload || 'Не удалось одобрить товар');
    }
  };

  const reject = (animal) => {
    let reason = '';
    modal.confirm({
      title: `Отклонить «${animal.name}»?`,
      icon: <CloseCircleOutlined style={{ color: '#cf1322' }} />,
      content: (
        <div className="mt-3">
          <Text type="secondary" className="block mb-2 text-sm">
            Укажите причину — продавец увидит её и сможет исправить товар.
          </Text>
          <Input.TextArea
            rows={3}
            maxLength={300}
            showCount
            placeholder="Например: фото не соответствует описанию, некорректная цена…"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </div>
      ),
      okText: 'Отклонить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: async () => {
        if (!reason.trim()) {
          message.error('Укажите причину отклонения');
          return Promise.reject();
        }
        const result = await dispatch(rejectAnimal({ id: animal.id, reason: reason.trim() }));
        if (rejectAnimal.fulfilled.match(result)) {
          message.warning(`«${animal.name}» отклонён`);
        } else {
          message.error(result.payload || 'Не удалось отклонить товар');
          return Promise.reject();
        }
      },
    });
  };

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 mb-4 text-stone-500 hover:text-[#9850fd] transition-colors"
      >
        <ArrowLeftOutlined /> В каталог
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <Title level={2} className="!mb-0 !font-light">
          Модерация товаров
        </Title>
        <Badge count={pending.length} color="#9850fd" showZero />
      </div>
      <Text type="secondary" className="block mb-6">
        Проверьте новые карточки, загруженные продавцами, и опубликуйте их в каталоге.
      </Text>

      {pending.length === 0 ? (
        <Card className="border border-stone-200">
          <Empty
            image={<AuditOutlined style={{ fontSize: 64, color: '#d6d3d1' }} />}
            description="Нет товаров на проверке"
            className="!my-10"
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {pending.map((animal) => (
            <Card
              key={animal.id}
              className="border border-stone-200"
              styles={{ body: { padding: 16 } }}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setDetail(animal)}
                  className="shrink-0 border-0 bg-transparent p-0 cursor-pointer"
                >
                  {imageOf(animal) ? (
                    <img
                      src={imageOf(animal)}
                      alt={animal.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-xl bg-stone-100 text-stone-300">
                      ♥
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Text strong className="block truncate text-base">
                        {animal.name}
                      </Text>
                      <Text type="secondary" className="text-xs">
                        {factsLine(animal)}
                      </Text>
                    </div>
                    <Space size="small">
                      {animal.category?.name && (
                        <Tag color={CATEGORY_COLOR[animal.category.name]} className="!mr-0">
                          {animal.category.name}
                        </Tag>
                      )}
                      <Tag color={MODERATION_STATUS.pending.color} className="!mr-0">
                        {MODERATION_STATUS.pending.label}
                      </Tag>
                    </Space>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Text strong className="text-base">
                        {animal.price != null ? `${Number(animal.price)} ₽` : '—'}
                      </Text>
                      {hasCommission(animal) && (
                        <Text type="secondary" className="block text-xs">
                          {commissionLine(animal)}
                        </Text>
                      )}
                    </div>
                    <Space>
                      <Button onClick={() => setDetail(animal)}>Подробнее</Button>
                      <Button danger icon={<CloseOutlined />} onClick={() => reject(animal)}>
                        Отклонить
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => approve(animal)}
                      >
                        Одобрить
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-10">
          <Title level={4} className="!mb-4">
            Недавно проверенные
          </Title>
          <List
            itemLayout="horizontal"
            dataSource={recent}
            renderItem={(animal) => (
              <List.Item
                className="!px-0"
                actions={[
                  <Tag
                    key="s"
                    color={MODERATION_STATUS[animal.moderationStatus]?.color}
                    className="!mr-0"
                  >
                    {MODERATION_STATUS[animal.moderationStatus]?.label}
                  </Tag>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    imageOf(animal) ? (
                      <img
                        src={imageOf(animal)}
                        alt=""
                        className="h-11 w-11 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-11 w-11 place-items-center rounded-lg bg-stone-100 text-stone-300">
                        ♥
                      </div>
                    )
                  }
                  title={animal.name}
                  description={
                    <span className="text-stone-400">
                      {animal.category?.name} ·{' '}
                      {animal.price != null ? `${Number(animal.price)} ₽` : '—'}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Просмотр карточки (только чтение) */}
      <Modal
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        width={780}
        title={null}
        footer={[
          <Button key="close" onClick={() => setDetail(null)}>
            Закрыть
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              const a = detail;
              setDetail(null);
              reject(a);
            }}
          >
            Отклонить
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              const a = detail;
              setDetail(null);
              approve(a);
            }}
          >
            Одобрить
          </Button>,
        ]}
      >
        {detail && (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="sm:w-80 sm:shrink-0">
              <PhotoGallery animal={detail} />
            </div>
            <div className="flex-1 min-w-0 sm:pt-1">
              <Title level={4} className="!mb-1">
                {detail.name}
              </Title>
              {detail.category?.name && (
                <Tag color={CATEGORY_COLOR[detail.category.name]}>{detail.category.name}</Tag>
              )}
              <Paragraph type="secondary" className="!mt-2 !mb-0">
                {detail.species || '—'}
              </Paragraph>
              <Divider className="!my-4" />
              <Descriptions
                column={1}
                size="small"
                labelStyle={{ width: 150, color: '#8c8c8c' }}
                items={[
                  { key: 'owner', label: 'Продавец', children: ownerLabel(detail.owner) },
                  { key: 'desc', label: 'Описание', children: detail.description || '—' },
                  { key: 'age', label: 'Возраст', children: `${detail.ageMonths ?? '—'} мес.` },
                  hasCommission(detail) && {
                    key: 'basePrice',
                    label: 'Цена продавца',
                    children: `${Number(detail.basePrice)} ₽`,
                  },
                  hasCommission(detail) && {
                    key: 'commission',
                    label: 'Комиссия сайта',
                    children: `${Math.round(Number(detail.commissionRate) * 100)}% (+${
                      Math.round((Number(detail.price) - Number(detail.basePrice)) * 100) / 100
                    } ₽)`,
                  },
                  {
                    key: 'price',
                    label: hasCommission(detail) ? 'Цена в каталоге' : 'Цена',
                    children: (
                      <Text strong className="text-lg">
                        {detail.price != null ? `${Number(detail.price)} ₽` : '—'}
                      </Text>
                    ),
                  },
                ].filter(Boolean)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
