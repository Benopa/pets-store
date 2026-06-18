import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, Space, Badge, Button, Dropdown, Avatar } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { logout } from '../animal/model/auth';

const { Header: AntHeader } = Layout;

export const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const role = useSelector((state) => state.auth.role);
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  const isStaff = role === 'moderator' || role === 'admin';

  const menu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Личный кабинет' },
      ...(isStaff ? [{ key: 'moderation', icon: <AuditOutlined />, label: 'Модерация' }] : []),
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'profile') navigate('/account');
      if (key === 'moderation') navigate('/moderation');
      if (key === 'logout') dispatch(logout());
    },
  };

  return (
    <AntHeader className="!bg-white !px-0 !h-16 !leading-none border-b border-stone-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#9850fd] text-white text-lg">
            🐾
          </span>
          <span className="text-lg font-semibold text-stone-800">Pets Store</span>
        </Link>

        {accessToken && (
          <Space size="middle">
            {!isStaff && (
              <Badge count={cartCount} size="small" color="#9850fd">
                <Button
                  shape="circle"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => navigate('/cart')}
                  aria-label="Корзина"
                />
              </Badge>
            )}
            <Dropdown menu={menu} placement="bottomRight" trigger={['click']}>
              <Avatar className="!bg-[#9850fd] cursor-pointer" icon={<UserOutlined />} />
            </Dropdown>
          </Space>
        )}
      </div>
    </AntHeader>
  );
};
