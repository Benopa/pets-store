import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, Space, Badge, Button, Dropdown, Avatar } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  AuditOutlined,
  BellOutlined,
  MessageOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { logout } from '@/entities/auth';
import {
  selectUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/entities/notification';
import { selectChatUser, visibleChatsFor, roleInChat, chatUnread } from '@/entities/chat';

const { Header: AntHeader } = Layout;

export const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const role = useSelector((state) => state.auth.role);
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const notifications = useSelector((state) => state.notifications.items);
  const unreadCount = useSelector(selectUnreadCount);
  const chats = useSelector((state) => state.chat.chats);
  const chatUser = useSelector(selectChatUser);
  const chatUnreadTotal = visibleChatsFor(chats, chatUser).reduce(
    (sum, c) => sum + chatUnread(c, roleInChat(c, chatUser)),
    0,
  );

  const isStaff = role === 'moderator' || role === 'admin';
  const isCourier = role === 'courier';
  // Корзину показываем только тем, кто покупает (покупатель/продавец).
  const canShop = role === 'buyer' || role === 'seller';

  // Лента уведомлений в выпадающем меню «колокольчика».
  const notifMenu = {
    items: [
      ...(unreadCount
        ? [
            { key: 'read-all', label: <span className="text-[#9850fd]">Прочитать все</span> },
            { type: 'divider' },
          ]
        : []),
      ...(notifications.length
        ? notifications.map((n) => ({
            key: n.id,
            label: (
              <div className={`max-w-xs whitespace-normal py-1 ${n.isRead ? 'opacity-50' : ''}`}>
                <div className="font-medium text-stone-800">{n.title}</div>
                {n.body && <div className="text-xs text-stone-500">{n.body}</div>}
              </div>
            ),
          }))
        : [
            {
              key: 'empty',
              disabled: true,
              label: <span className="text-stone-400">Нет уведомлений</span>,
            },
          ]),
    ],
    onClick: ({ key }) => {
      if (key === 'read-all') {
        dispatch(markAllNotificationsRead());
        return;
      }
      const notification = notifications.find((n) => n.id === key);
      if (!notification) return;
      if (!notification.isRead) dispatch(markNotificationRead(notification.id));
      // Товарные уведомления ведут в личный кабинет, где продавец управляет карточками.
      if (notification.animalId) navigate('/account');
    },
  };

  const menu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Личный кабинет' },
      ...(isStaff ? [{ key: 'moderation', icon: <AuditOutlined />, label: 'Модерация' }] : []),
      ...(isCourier ? [{ key: 'delivery', icon: <CarOutlined />, label: 'Доставка' }] : []),
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'profile') navigate('/account');
      if (key === 'moderation') navigate('/moderation');
      if (key === 'delivery') navigate('/delivery');
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
            <Badge count={chatUnreadTotal} size="small" color="#9850fd">
              <Button
                shape="circle"
                icon={<MessageOutlined />}
                onClick={() => navigate('/chat')}
                aria-label="Сообщения"
              />
            </Badge>
            <Dropdown menu={notifMenu} placement="bottomRight" trigger={['click']}>
              <Badge count={unreadCount} size="small" color="#9850fd">
                <Button shape="circle" icon={<BellOutlined />} aria-label="Уведомления" />
              </Badge>
            </Dropdown>
            {canShop && (
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
