import { useDispatch } from 'react-redux';
import { Popconfirm, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { counterparty, roleInChat, formatMessageAt, deleteConversation } from '@/entities/chat';
import { chatIcon } from '../../lib/chat-icons';

const { Text } = Typography;

export const ChatList = ({ chats, user, selectedId, onSelect }) => {
  const dispatch = useDispatch();

  return (
    <aside className="flex flex-col min-h-0 border-r border-stone-100 bg-stone-50">
      <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-stone-100">
        <Text strong>Чаты</Text>
        <Text type="secondary" className="text-xs">
          {chats.length}
        </Text>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="grid place-items-center h-full text-center p-6">
            <Text type="secondary">Чатов пока нет</Text>
          </div>
        ) : (
          chats.map((c) => {
            const info = counterparty(c, user);
            const last = c.lastMessage;
            const itemRole = roleInChat(c, user);
            const unread = c.unreadCount || 0;
            const isActive = c.id === selectedId;
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelect(c.id);
                }}
                className={`group flex gap-3 items-center px-4 py-3 cursor-pointer border-b border-stone-100 transition-colors ${
                  isActive ? 'bg-[#f1e9fe]' : 'hover:bg-stone-100'
                }`}
              >
                <div
                  className="shrink-0 w-[42px] h-[42px] rounded-full grid place-items-center text-white text-base"
                  style={{ background: info.color }}
                >
                  {chatIcon(info.icon)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-stone-800 text-[0.92rem] truncate">
                      {info.name}
                    </span>
                    <span className="text-[0.72rem] text-stone-400 shrink-0">
                      {last ? formatMessageAt(last.createdAt) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-500 text-[0.82rem] mt-0.5 truncate">
                      {last
                        ? (last.senderRole === itemRole ? 'Вы: ' : '') +
                          (last.text || '📎 Вложение')
                        : 'Нет сообщений'}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      {unread > 0 && (
                        <span className="inline-grid place-items-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#9850fd] text-white text-[0.68rem] font-semibold">
                          {unread}
                        </span>
                      )}
                      {/* «Удалить» = скрыть диалог только у себя. */}
                      <Popconfirm
                        title="Удалить чат?"
                        description="Диалог исчезнет только у вас"
                        okText="Удалить"
                        cancelText="Отмена"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          dispatch(deleteConversation(c.id));
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                      >
                        <button
                          onClick={(e) => e.stopPropagation()}
                          title="Удалить чат"
                          aria-label="Удалить чат"
                          className="opacity-0 group-hover:opacity-100 transition-opacity border-0 bg-transparent cursor-pointer text-stone-400 hover:text-red-500 p-0.5"
                        >
                          <DeleteOutlined />
                        </button>
                      </Popconfirm>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
