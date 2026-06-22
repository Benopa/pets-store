import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, Button, Dropdown, Segmented, Typography } from 'antd';
import {
  CustomerServiceOutlined,
  CrownOutlined,
  SafetyOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import {
  ROLE_OPTIONS,
  DEMO_MODERATORS,
  selectChatUser,
  visibleChatsFor,
  roleInChat,
  chatUnread,
  setDemoRole,
  selectChat,
  startSupportChat,
  startStaffChat,
} from '@/entities/chat';
import { ChatList } from './components/chat-list';
import { ChatWindow } from './components/chat-window';

const { Title, Text } = Typography;

export const ChatPage = () => {
  const dispatch = useDispatch();
  const demoRole = useSelector((s) => s.chat.demoRole);
  const chats = useSelector((s) => s.chat.chats);
  const selectedId = useSelector((s) => s.chat.selectedId);
  const user = useSelector(selectChatUser);

  const list = useMemo(() => visibleChatsFor(chats, user), [chats, user]);
  // Подстраховка: если выбранный чат не виден текущей роли — берём первый из списка.
  const active = list.find((c) => c.id === selectedId) || list[0] || null;
  const unreadTotal = list.reduce((sum, c) => sum + chatUnread(c, roleInChat(c, user)), 0);

  const modMenu = {
    items: DEMO_MODERATORS.map((m) => ({ key: m.id, label: m.name, icon: <SafetyOutlined /> })),
    onClick: ({ key }) => dispatch(startStaffChat(key)),
  };

  const renderCreateButton = () => {
    if (demoRole === 'buyer' || demoRole === 'seller') {
      return (
        <Button icon={<CustomerServiceOutlined />} onClick={() => dispatch(startSupportChat())}>
          {demoRole === 'seller' ? 'Чат с модератором' : 'Чат с поддержкой'}
        </Button>
      );
    }
    if (demoRole === 'moderator') {
      return (
        <Button icon={<CrownOutlined />} onClick={() => dispatch(startStaffChat())}>
          Чат с администрацией
        </Button>
      );
    }
    return (
      <Dropdown
        menu={modMenu}
        placement="bottomRight"
        trigger={['click']}
        disabled={!DEMO_MODERATORS.length}
      >
        <Button icon={<SafetyOutlined />}>Написать модератору</Button>
      </Dropdown>
    );
  };

  return (
    <div>
      {/* Демо-переключатель ролей: показывает чат глазами каждой из сторон */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4 px-4 py-3 bg-white border border-stone-200 rounded-xl">
        <div className="flex items-center gap-2">
          <Badge count={unreadTotal} size="small" color="#9850fd">
            <MessageOutlined style={{ fontSize: 20, color: '#78716c' }} />
          </Badge>
          <Text type="secondary" className="text-xs">
            Демо: смотреть как
          </Text>
        </div>
        <Segmented
          value={demoRole}
          onChange={(r) => dispatch(setDemoRole(r))}
          options={ROLE_OPTIONS}
        />
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Title level={3} className="mb-0! font-light!">
          Сообщения
        </Title>
        {renderCreateButton()}
      </div>

      <div className="grid grid-cols-[300px_1fr] h-[calc(100vh-260px)] min-h-[460px] border border-stone-200 rounded-2xl overflow-hidden bg-white">
        <ChatList
          chats={list}
          user={user}
          selectedId={active?.id || null}
          onSelect={(id) => dispatch(selectChat(id))}
        />
        <ChatWindow key={active?.id || 'empty'} chat={active} user={user} />
      </div>
    </div>
  );
};
