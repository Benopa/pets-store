import { useState } from 'react';
import { Calendar, DatePicker, Drawer, Input } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/shared/lib';

// запрет выбора будущих дат
const disableFuture = (current) => current && current.valueOf() > Date.now();

// Управляемое поле даты рождения. value/onChange приходят от Form.Item
// (Ant Design клонирует единственного ребёнка и прокидывает их).
// Десктоп — обычный DatePicker; мобильный — поле открывает календарь в нижнем Drawer.
export const BirthDateField = ({ value, onChange }) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <DatePicker
        className="w-full"
        size="large"
        format="DD.MM.YYYY"
        placeholder="дд.мм.гггг"
        suffixIcon={<CalendarOutlined className="text-stone-400" />}
        disabledDate={disableFuture}
        value={value}
        onChange={onChange}
      />
    );
  }

  const handleSelect = (date, info) => {
    // Календарь дергает onSelect и при смене месяца/года — фиксируем только клик по дню.
    if (!info || info.source === 'date') {
      onChange?.(date);
      setOpen(false);
    }
  };

  return (
    <>
      <Input
        readOnly
        size="large"
        className="cursor-pointer"
        placeholder="дд.мм.гггг"
        value={value ? value.format('DD.MM.YYYY') : ''}
        suffix={<CalendarOutlined className="text-stone-400" />}
        onClick={() => setOpen(true)}
      />
      <Drawer
        title="Дата рождения"
        placement="bottom"
        height="auto"
        open={open}
        onClose={() => setOpen(false)}
        // Пересоздаём календарь при каждом открытии — стартует с уже выбранной даты.
        destroyOnHidden
      >
        <Calendar
          fullscreen={false}
          defaultValue={value}
          disabledDate={disableFuture}
          onSelect={handleSelect}
        />
      </Drawer>
    </>
  );
};
