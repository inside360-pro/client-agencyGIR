import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ru from "date-fns/locale/ru";
import { registerLocale } from "react-datepicker";
import { useEffect, useState } from "react";
import useDateSingleStore from "../../store/CalendarSingleStore";

registerLocale("ru", ru);

export default function ComponentDate({ dateForRender = "", idx = "" }) {
  const { date, addDate } = useDateSingleStore();
  const [selectedDates, setSelectedDates] = useState(null);

  useEffect(() => {
    let initialDate = new Date();

    if (dateForRender instanceof Date) {
      initialDate = new Date(dateForRender);
    } else if (typeof dateForRender === "string") {
      const [day, month, year] = dateForRender.split(".").map(Number);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        initialDate = new Date(year, month - 1, day);
      }
    }

    if (initialDate && !isNaN(initialDate.getTime())) {
      setSelectedDates(initialDate);
      addDate(idx, initialDate);
    }
  }, [dateForRender, idx, addDate]);

  const handleDateChange = (date) => {
    setSelectedDates(date);
    addDate(idx, date);
  };

  const handleClearDate = () => {
    setSelectedDates(null);
    addDate(idx, null);
  };

  return (
    <div className="date-wrapper">
      <DatePicker
        // showIcon
        toggleCalendarOnIconClick
        selected={selectedDates}
        onChange={handleDateChange}
        onClear={handleClearDate}
        dateFormat="dd.MM.yyyy"
        locale="ru"
        shouldCloseOnSelect={false}
        withPortal
        isClearable={true}
        // TODO: удалить
        open={true}
      />
    </div>
  );
}
