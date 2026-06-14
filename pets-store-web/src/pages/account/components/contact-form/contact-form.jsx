import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  App,
  Avatar,
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  Radio,
  Typography,
  Upload,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  CreditCardOutlined,
  BankOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { updateProfile, uploadAvatar } from '../../../../features';

const { Text } = Typography;

export const ContactForm = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const {
    email,
    firstName,
    lastName,
    birthDate,
    address,
    paymentMethod,
    avatar,
    saving,
    uploadingAvatar,
    role,
  } = useSelector((state) => state.auth);

  const isSeller = role === 'seller';
  const avatarSrc = avatar ? `http://localhost:3000${avatar}` : null;
  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((s) => s[0]?.toUpperCase())
      .join('') || null;

  useEffect(() => {
    form.setFieldsValue({
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      birthDate: birthDate ? dayjs(birthDate) : null,
      address: address ?? '',
      paymentMethod: paymentMethod ?? 'card',
    });
  }, [form, firstName, lastName, birthDate, address, paymentMethod]);

  const handleSave = async (values) => {
    const result = await dispatch(
      updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : undefined,
        address: values.address ?? '',
        paymentMethod: values.paymentMethod,
      }),
    );
    if (updateProfile.fulfilled.match(result)) {
      message.success('Контактные данные сохранены');
    } else {
      message.error(result.payload || 'Не удалось сохранить');
    }
  };

  const beforeAvatarUpload = (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('Можно загрузить только изображение');
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > 4) {
      message.error('Файл должен быть меньше 4 МБ');
      return Upload.LIST_IGNORE;
    }
    const formData = new FormData();
    formData.append('file', file);
    dispatch(uploadAvatar(formData)).then((result) => {
      if (uploadAvatar.fulfilled.match(result)) {
        message.success('Фото обновлено');
      } else {
        message.error(result.payload || 'Не удалось загрузить фото');
      }
    });
    return false; // загрузку обрабатываем вручную
  };

  return (
    <Card className="border border-stone-200" styles={{ body: { padding: 24 } }}>
      {/* Фото профиля */}
      <div className="flex items-center gap-5 mb-6">
        <Avatar
          size={80}
          src={avatarSrc}
          className="!bg-[#9850fd] !text-2xl shrink-0"
          icon={!avatarSrc && !initials && <UserOutlined />}
        >
          {!avatarSrc && initials}
        </Avatar>
        <div className="flex flex-col gap-2">
          <Text type="secondary" className="text-sm">
            Фото профиля
          </Text>
          <Upload showUploadList={false} accept="image/*" beforeUpload={beforeAvatarUpload}>
            <Button icon={<CameraOutlined />} loading={uploadingAvatar}>
              Изменить фото
            </Button>
          </Upload>
          <Text type="secondary" className="text-xs">
            JPG или PNG, до 4 МБ
          </Text>
        </div>
      </div>

      <Divider className="!my-4" />

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSave}
        className="max-w-xl"
      >
        <div className="flex gap-4">
          <Form.Item
            name="firstName"
            label="Имя"
            className="flex-1"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input prefix={<UserOutlined className="text-stone-400" />} size="large" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Фамилия"
            className="flex-1"
            rules={[{ required: true, message: 'Введите фамилию' }]}
          >
            <Input size="large" />
          </Form.Item>
        </div>

        <Form.Item
          name="birthDate"
          label="Дата рождения"
          rules={[{ required: true, message: 'Укажите дату рождения' }]}
        >
          <DatePicker
            className="w-full"
            size="large"
            format="DD.MM.YYYY"
            placeholder="дд.мм.гггг"
            suffixIcon={<CalendarOutlined className="text-stone-400" />}
            disabledDate={(current) => current && current.valueOf() > Date.now()}
          />
        </Form.Item>

        <Form.Item label="Email">
          <Input
            value={email ?? ''}
            disabled
            prefix={<MailOutlined className="text-stone-400" />}
            size="large"
          />
        </Form.Item>

        <Form.Item name="address" label={isSeller ? 'Адрес магазина' : 'Адрес доставки'}>
          <Input
            prefix={<EnvironmentOutlined className="text-stone-400" />}
            size="large"
            placeholder="Город, улица, дом"
          />
        </Form.Item>

        <Divider className="!my-4" />

        <Form.Item name="paymentMethod" label="Способ оплаты">
          <Radio.Group>
            <Radio.Button value="card">
              <CreditCardOutlined /> Банковская карта
            </Radio.Button>
            <Radio.Button value="sbp">
              <BankOutlined /> СБП
            </Radio.Button>
            <Radio.Button value="cash">
              <WalletOutlined /> {isSeller ? 'Наличными' : 'При получении'}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item className="!mb-0 !mt-2">
          <Button type="primary" htmlType="submit" size="large" loading={saving}>
            Сохранить изменения
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
