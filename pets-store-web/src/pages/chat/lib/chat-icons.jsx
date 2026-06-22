import {
  UserOutlined,
  ShopOutlined,
  CrownOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';

// Ключ иконки из counterparty() → элемент antd.
const ICONS = {
  user: <UserOutlined />,
  shop: <ShopOutlined />,
  crown: <CrownOutlined />,
  safety: <SafetyOutlined />,
  support: <CustomerServiceOutlined />,
};

export const chatIcon = (key) => ICONS[key] || <UserOutlined />;
