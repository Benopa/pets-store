import { vi } from 'vitest';

// Запускает createAsyncThunk напрямую (без стора): payloadCreator получает (dispatch, getState).
// Возвращает промис финального экшена (fulfilled/rejected) с .meta.requestStatus и .payload.
// dispatch — заглушка (внутренние pending/fulfilled и вложенные диспатчи нам в этих тестах не важны).
export const runThunk = (thunkAction, state = { auth: {} }) =>
  thunkAction(vi.fn(), () => state, undefined);
