import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { App as AntApp, Button, Image as AntImage, Input, Tag, Tooltip, Typography } from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  PaperClipOutlined,
  FileOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  counterparty,
  roleInChat,
  formatSize,
  markChatRead,
  sendMessage,
  TAG_COLOR,
} from '@/entities/chat';
import { chatIcon } from '../../lib/chat-icons';

const { Text } = Typography;
const MAX_SIZE = 8 * 1024 * 1024;

export const ChatWindow = ({ chat, user }) => {
  const dispatch = useDispatch();
  const { message } = AntApp.useApp();
  const [text, setText] = useState('');
  const [pending, setPending] = useState([]);
  const threadRef = useRef(null);
  const fileRef = useRef(null);

  // Чат открыт / пришло сообщение: отмечаем прочитанным и прокручиваем вниз.
  // Черновик и вложения сбрасывать вручную не нужно — компонент пере-монтируется по key={chat.id}.
  const chatId = chat?.id;
  const messageCount = chat?.messages.length;
  useEffect(() => {
    if (!chatId) return;
    dispatch(markChatRead(chatId));
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [chatId, messageCount, dispatch]);

  if (!chat) {
    return (
      <section className="flex flex-col min-h-0">
        <div className="grid place-items-center h-full text-center p-6">
          <div>
            <MessageOutlined className="text-stone-300" style={{ fontSize: 40 }} />
            <div className="mt-3">
              <Text type="secondary">Выберите чат, чтобы начать переписку</Text>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const info = counterparty(chat, user);
  const myRole = roleInChat(chat, user);

  const pickFiles = (fileList) => {
    Array.from(fileList).forEach((file) => {
      if (file.size > MAX_SIZE) {
        message.error(`«${file.name}» больше 8 МБ`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) =>
        setPending((p) => [
          ...p,
          {
            id: Math.random().toString(36).slice(2),
            type: file.type.startsWith('image/') ? 'image' : 'file',
            name: file.name,
            size: file.size,
            url: e.target.result,
          },
        ]);
      reader.readAsDataURL(file);
    });
  };

  const removePending = (id) => setPending((p) => p.filter((a) => a.id !== id));

  const send = () => {
    const t = text.trim();
    if (!t && pending.length === 0) return;
    dispatch(sendMessage({ chatId: chat.id, text: t, attachments: pending }));
    setText('');
    setPending([]);
  };

  return (
    <section className="flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-[18px] py-3 border-b border-stone-100">
        <div
          className="shrink-0 w-[38px] h-[38px] rounded-full grid place-items-center text-white text-[15px]"
          style={{ background: info.color }}
        >
          {chatIcon(info.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Text strong className="truncate">
              {info.name}
            </Text>
            <Tag color={TAG_COLOR[info.tag]} className="mr-0!">
              {info.tag}
            </Tag>
          </div>
          <Text type="secondary" className="text-xs">
            {info.sub}
          </Text>
        </div>
      </div>

      <div
        ref={threadRef}
        className="flex-1 overflow-y-auto p-[18px] flex flex-col gap-2.5 bg-[#faf9fb]"
      >
        {chat.messages.length === 0 && (
          <div className="grid place-items-center h-full text-center p-6">
            <Text type="secondary">Напишите первое сообщение</Text>
          </div>
        )}
        {chat.messages.map((m, i) => {
          const mine = m.from === myRole;
          const atts = m.attachments || [];
          return (
            <div
              key={i}
              className={`flex flex-col max-w-[76%] ${mine ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div
                className={`px-3 py-2 rounded-[14px] text-[0.9rem] leading-[1.42] whitespace-pre-wrap break-words shadow-sm ${
                  mine
                    ? 'bg-[#9850fd] text-white rounded-br-[4px]'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-bl-[4px]'
                }`}
              >
                {atts.length > 0 && (
                  <div className={`flex flex-col gap-1.5 ${m.text ? 'mb-1.5' : ''}`}>
                    {atts.map((att) =>
                      att.type === 'image' ? (
                        <AntImage
                          key={att.id}
                          src={att.url}
                          alt={att.name}
                          className="max-w-[200px] max-h-[200px] rounded-[10px] block object-cover cursor-zoom-in"
                        />
                      ) : (
                        <a
                          key={att.id}
                          href={att.url}
                          download={att.name}
                          className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm max-w-[240px] no-underline ${
                            mine
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-black/5 text-inherit hover:bg-black/10'
                          }`}
                        >
                          <FileOutlined className="text-lg shrink-0" />
                          <span className="min-w-0">
                            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                              {att.name}
                            </span>
                            <span className="opacity-70 text-[0.72rem]">
                              {formatSize(att.size)}
                            </span>
                          </span>
                          <DownloadOutlined />
                        </a>
                      ),
                    )}
                  </div>
                )}
                {m.text ? <span>{m.text}</span> : null}
              </div>
              <span className="block text-[0.68rem] mt-1 text-stone-400 px-1">{m.at}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 p-3 border-t border-stone-100 bg-white">
        {pending.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {pending.map((att) => (
              <div key={att.id} className="relative">
                {att.type === 'image' ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-14 h-14 rounded-lg object-cover block border border-stone-200"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 max-w-[200px] px-2.5 py-2 border border-stone-200 rounded-lg bg-stone-50 text-[0.8rem] text-stone-700">
                    <FileOutlined />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[130px]">
                      {att.name}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removePending(att.id)}
                  title="Убрать"
                  className="absolute -top-[7px] -right-[7px] w-[18px] h-[18px] rounded-full border-0 bg-stone-700 text-white cursor-pointer grid place-items-center text-[9px] shadow hover:bg-stone-900"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              pickFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <Tooltip title="Прикрепить файл или фото">
            <Button
              size="large"
              icon={<PaperClipOutlined />}
              onClick={() => fileRef.current?.click()}
            />
          </Tooltip>
          <Input
            placeholder="Введите сообщение…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPressEnter={send}
            size="large"
          />
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={send}
            disabled={!text.trim() && pending.length === 0}
          >
            Отправить
          </Button>
        </div>
      </div>
    </section>
  );
};
