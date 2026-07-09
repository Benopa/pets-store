import { API_ORIGIN } from '@/shared/config';
import { chatIcon } from './chat-icons';

// Аватар собеседника: загруженное фото (info.avatar — относительный /uploads/...),
// иначе — цветной кружок с иконкой роли, как раньше.
export const ChatAvatar = ({ info, size = 42 }) => {
  const style = { width: size, height: size };
  if (info.avatar) {
    return (
      <img
        src={`${API_ORIGIN}${info.avatar}`}
        alt={info.name}
        className="shrink-0 rounded-full object-cover"
        style={style}
      />
    );
  }
  return (
    <div
      className="shrink-0 rounded-full grid place-items-center text-white"
      style={{ ...style, background: info.color, fontSize: size * 0.38 }}
    >
      {chatIcon(info.icon)}
    </div>
  );
};
