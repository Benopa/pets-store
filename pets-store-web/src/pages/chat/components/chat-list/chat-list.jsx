import { Typography } from 'antd';
import { counterparty, roleInChat, chatUnread } from '@/entities/chat';
import { chatIcon } from '../../lib/chat-icons';

const { Text } = Typography;

export const ChatList = ({ chats, user, selectedId, onSelect }) => (
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
          const last = c.messages[c.messages.length - 1];
          const itemRole = roleInChat(c, user);
          const unread = chatUnread(c, itemRole);
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
              className={`flex gap-3 items-center px-4 py-3 cursor-pointer border-b border-stone-100 transition-colors ${
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
                    {last ? last.at : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-stone-500 text-[0.82rem] mt-0.5 truncate">
                    {last
                      ? (last.from === itemRole ? 'Вы: ' : '') + (last.text || '📎 Вложение')
                      : 'Нет сообщений'}
                  </span>
                  {unread > 0 && (
                    <span className="inline-grid place-items-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#9850fd] text-white text-[0.68rem] font-semibold shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  </aside>
);
