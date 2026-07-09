import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { App as AntApp, Button, Dropdown, Typography } from 'antd';
import { CustomerServiceOutlined, CrownOutlined, SafetyOutlined } from '@ant-design/icons';
import { selectChatMe, selectChat, fetchConversations, createConversation } from '@/entities/chat';
import { fetchModerators } from '@/entities/moderator';
import { ChatList } from './components/chat-list';
import { ChatWindow } from './components/chat-window';

const { Title } = Typography;

export const ChatPage = () => {
  const dispatch = useDispatch();
  const { message } = AntApp.useApp();
  const conversations = useSelector((s) => s.chat.conversations);
  const selectedId = useSelector((s) => s.chat.selectedId);
  const me = useSelector(selectChatMe);
  const moderators = useSelector((s) => s.moderators.items);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Админу нужен список модераторов для кнопки «Написать модератору».
  useEffect(() => {
    if (me.role === 'admin') dispatch(fetchModerators());
  }, [dispatch, me.role]);

  const active = conversations.find((c) => c.id === selectedId) || null;

  const startChat = async (dto) => {
    const res = await dispatch(createConversation(dto));
    if (res.error) message.error(res.payload || 'Не удалось открыть чат');
  };

  const modMenu = {
    items: moderators.map((m) => ({
      key: m.id,
      label: `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email,
      icon: <SafetyOutlined />,
    })),
    onClick: ({ key }) => startChat({ kind: 'admin-moderator', moderatorId: key }),
  };

  // Кнопка «начать диалог» по роли. Продавец не может первым написать покупателю —
  // ему доступна только поддержка.
  const renderCreateButton = () => {
    if (me.role === 'buyer' || me.role === 'seller') {
      const kind = me.role === 'seller' ? 'seller-support' : 'buyer-support';
      return (
        <Button icon={<CustomerServiceOutlined />} onClick={() => startChat({ kind })}>
          {me.role === 'seller' ? 'Чат с модератором' : 'Чат с поддержкой'}
        </Button>
      );
    }
    if (me.role === 'moderator') {
      return (
        <Button icon={<CrownOutlined />} onClick={() => startChat({ kind: 'admin-moderator' })}>
          Чат с администрацией
        </Button>
      );
    }
    if (me.role === 'admin') {
      return (
        <Dropdown
          menu={modMenu}
          placement="bottomRight"
          trigger={['click']}
          disabled={!moderators.length}
        >
          <Button icon={<SafetyOutlined />}>Написать модератору</Button>
        </Dropdown>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Title level={3} className="mb-0! font-light!">
          Сообщения
        </Title>
        {renderCreateButton()}
      </div>

      <div className="grid grid-cols-[300px_1fr] h-[calc(100vh-200px)] min-h-[460px] border border-stone-200 rounded-2xl overflow-hidden bg-white">
        <ChatList
          chats={conversations}
          user={me}
          selectedId={active?.id || null}
          onSelect={(id) => dispatch(selectChat(id))}
        />
        <ChatWindow key={active?.id || 'empty'} chat={active} user={me} />
      </div>
    </div>
  );
};
