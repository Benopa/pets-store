import { useState } from 'react';
import { DatePicker, Drawer, Input } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/shared/lib';

// запрет выбора будущих дат
const disableFuture = (current) => current && current.valueOf() > Date.now();

// Панель десктопного DatePicker (навигация стрелками, переход месяц→год→десятилетие,
// футер «Сегодня») как отдельный компонент — рендерим её внутри мобильного Drawer,
// чтобы календарь выглядел и работал так же, как на полной версии, а не как крупный
// antd Calendar (у которого свой header с селектами и нет drill-down).
const BirthDatePanel = DatePicker._InternalPanelDoNotUseOrYouWillBeFired;

// Панель тянет за собой собственное поле ввода и резервирует место под «поповер».
// Прячем поле, обнуляем резерв и разворачиваем поповер в поток. Плюс растягиваем панель
// и все её drill-down виды (месяц/год/десятилетие) на всю ширину Drawer — по умолчанию
// панель фиксированной ширины (7 ячеек), а таблица дней внутри уже width:100%.
const PANEL_WRAP = [
  '[&_.ant-picker]:hidden!',
  '[&>div]:pb-0!',
  '[&_.ant-picker-dropdown]:static!',
  '[&>div]:w-full!',
  '[&_.ant-picker-dropdown]:w-full!',
  '[&_.ant-picker-panel-container]:w-full!',
  '[&_.ant-picker-panel-container]:shadow-none!',
  '[&_.ant-picker-panel]:w-full!',
  '[&_.ant-picker-date-panel]:w-full!',
  '[&_.ant-picker-month-panel]:w-full!',
  '[&_.ant-picker-year-panel]:w-full!',
  '[&_.ant-picker-decade-panel]:w-full!',
].join(' ');

// Управляемое поле даты рождения. value/onChange приходят от Form.Item
// (Ant Design клонирует единственного ребёнка и прокидывает их).
// Десктоп — обычный DatePicker; мобильный — поле открывает ту же панель в нижнем Drawer.
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

  const handleChange = (date) => {
    // Клик по дню в панели фиксирует дату и закрывает Drawer.
    onChange?.(date);
    setOpen(false);
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
        placement="bottom"
        height="auto"
        open={open}
        onClose={() => setOpen(false)}
        // Без шапки: закрытие — клик по затемнённому фону (maskClosable по умолчанию).
        closable={false}
        // Пересоздаём панель при каждом открытии — стартует с уже выбранной даты.
        destroyOnHidden
      >
        <div className={PANEL_WRAP}>
          <BirthDatePanel
            format="DD.MM.YYYY"
            value={value}
            disabledDate={disableFuture}
            onChange={handleChange}
          />
        </div>
      </Drawer>
    </>
  );
};
