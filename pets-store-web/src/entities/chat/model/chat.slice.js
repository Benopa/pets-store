import { createSlice, nanoid } from '@reduxjs/toolkit';
import { logout } from '@/entities/auth';
import { DEMO_USERS, DEMO_MODERATORS, INITIAL_CHATS } from './chat.data';
import { mineRole, roleInChat, displayName, visibleChatsFor } from './chat.helpers';

const nowTime = () =>
  new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

// id первого чата, видимого данной роли (для авто-выбора при открытии/смене роли).
const firstVisibleId = (chats, role) => visibleChatsFor(chats, DEMO_USERS[role])[0]?.id ?? null;

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: INITIAL_CHATS,
    // Демо-роль: чьими глазами смотрим на чат (переключатель ролей на странице).
    demoRole: 'buyer',
    // Выбранный (открытый) чат. Хранится в сторе, чтобы выбор переживал смену роли и создание чатов.
    selectedId: firstVisibleId(INITIAL_CHATS, 'buyer'),
  },
  reducers: {
    setDemoRole(state, action) {
      state.demoRole = action.payload;
      // Сменилась роль — открываем первый доступный ей чат.
      state.selectedId = firstVisibleId(state.chats, action.payload);
    },
    selectChat(state, action) {
      state.selectedId = action.payload;
    },
    markChatRead(state, action) {
      const chat = state.chats.find((c) => c.id === action.payload);
      if (!chat) return;
      const r = roleInChat(chat, DEMO_USERS[state.demoRole]);
      chat.read[r] = chat.messages.length;
    },
    sendMessage: {
      reducer(state, action) {
        const { chatId, text, attachments, at } = action.payload;
        const chat = state.chats.find((c) => c.id === chatId);
        if (!chat) return;
        const r = roleInChat(chat, DEMO_USERS[state.demoRole]);
        const msg = { from: r, at, text };
        if (attachments.length) msg.attachments = attachments;
        chat.messages.push(msg);
        chat.read[r] = chat.messages.length;
      },
      prepare({ chatId, text, attachments }) {
        return {
          payload: { chatId, text: text || '', attachments: attachments || [], at: nowTime() },
        };
      },
    },
    // «Написать продавцу» с карточки товара: открываем (или создаём) чат покупатель↔продавец
    // по конкретному товару и смотрим на него глазами покупателя.
    startProductChat: {
      reducer(state, action) {
        const { id, sellerId, sellerName, productName } = action.payload;
        state.demoRole = 'buyer';
        const buyer = DEMO_USERS.buyer;
        const existing = state.chats.find(
          (c) =>
            c.kind === 'buyer-seller' &&
            c.buyer?.id === buyer.id &&
            c.seller?.id === sellerId &&
            c.productName === productName,
        );
        if (existing) {
          state.selectedId = existing.id;
          return;
        }
        const chat = {
          id,
          kind: 'buyer-seller',
          productName,
          buyer: { id: buyer.id, name: displayName(buyer) },
          seller: { id: sellerId, name: sellerName || 'Продавец' },
          read: {},
          messages: [],
        };
        state.chats.unshift(chat);
        state.selectedId = chat.id;
      },
      prepare({ sellerId, sellerName, productName }) {
        return {
          payload: {
            id: 'ch' + nanoid(6),
            sellerId,
            sellerName,
            productName: productName || '',
          },
        };
      },
    },
    startSupportChat: {
      reducer(state, action) {
        const user = DEMO_USERS[state.demoRole];
        const r = mineRole(user);
        const kind = r === 'seller' ? 'seller-support' : 'buyer-support';
        const existing = state.chats.find(
          (c) =>
            c.kind === kind &&
            (r === 'seller' ? c.seller?.id === user.id : c.buyer?.id === user.id),
        );
        if (existing) {
          state.selectedId = existing.id;
          return;
        }
        const base = { id: action.payload.id, kind, moderatorId: 'm1', read: {}, messages: [] };
        if (kind === 'seller-support')
          base.seller = { id: user.id, name: user.shopName || displayName(user) };
        else base.buyer = { id: user.id, name: displayName(user) };
        state.chats.unshift(base);
        state.selectedId = base.id;
      },
      prepare() {
        return { payload: { id: 'ch' + nanoid(6) } };
      },
    },
    startStaffChat: {
      reducer(state, action) {
        const user = DEMO_USERS[state.demoRole];
        let modId;
        let modName;
        if (user.role === 'moderator') {
          modId = user.id;
          modName = displayName(user);
        } else {
          modId = action.payload.moderatorId;
          modName = DEMO_MODERATORS.find((m) => m.id === modId)?.name || 'Модератор';
        }
        if (!modId) return;
        const existing = state.chats.find(
          (c) => c.kind === 'admin-moderator' && c.moderatorId === modId,
        );
        if (existing) {
          state.selectedId = existing.id;
          return;
        }
        state.chats.unshift({
          id: action.payload.id,
          kind: 'admin-moderator',
          moderatorId: modId,
          moderator: { id: modId, name: modName },
          read: {},
          messages: [],
        });
        state.selectedId = action.payload.id;
      },
      prepare(moderatorId) {
        return { payload: { id: 'ch' + nanoid(6), moderatorId: moderatorId ?? null } };
      },
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.demoRole = 'buyer';
      state.selectedId = firstVisibleId(state.chats, 'buyer');
    });
  },
});

// Текущий «я» в демо — по выбранной роли.
export const selectChatUser = (state) => DEMO_USERS[state.chat.demoRole];

export const {
  setDemoRole,
  selectChat,
  markChatRead,
  sendMessage,
  startProductChat,
  startSupportChat,
  startStaffChat,
} = chatSlice.actions;
export default chatSlice.reducer;
