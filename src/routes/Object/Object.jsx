import styles from "./style.module.scss";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import useDataRequestStore from "../../store/DataRequestStore";

import fetchData from "../../utils/fetchData";

import {
  AddMoreBtn,
  ComponentDate,
  ComponentSearch,
  WorkerItem,
  ObjectSelect,
} from "../../components";

import useDateStore from "../../store/CalendarStore";

import { format } from "date-fns";
import { registerLocale } from "react-datepicker";
import ru from "date-fns/locale/ru";

registerLocale("ru", ru);

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function useIsMobile(breakpoint = 480) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

const Object = () => {
  const currentDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  currentDate.setHours(0, 0, 0, 0);
  const { dates } = useDateStore();
  // const [monthsTonnaj, setMonthsTonnaj] = useState([]);

  // Генерация днеЙ
  const [days, setDays] = useState([]);
  const [daysFullDate, setDaysFullDate] = useState([]);

  const { slug } = useParams();

  // Инициализация дней
  useEffect(() => {
    if (dates.length > 0) {
      const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
      setDays(sortedDates.map((date) => date.getDate()));
      setDaysFullDate(
        sortedDates.map((date) => {
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();

          return `${day}.${month}.${year}`;
        })
      );
    } else {
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const numDays = daysInMonth(currentMonth, currentYear);
      setDays(Array.from({ length: numDays }, (_, i) => i + 1));
      setDaysFullDate(
        Array.from({ length: numDays }, (_, i) => {
          const day = String(i + 1).padStart(2, "0");
          const month = String(currentMonth).padStart(2, "0");
          return `${day}.${month}.${currentYear}`;
        })
      );
    }
  }, [dates]);

  // Пагинация
  const isMobile = useIsMobile();
  const daysPerPage = isMobile ? 2 : 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(days.length / daysPerPage);

  const displayedDays = useMemo(() => {
    const start = (currentPage - 1) * daysPerPage;
    const end = start + daysPerPage;
    return days.slice(start, end);
  }, [days, currentPage, daysPerPage]);

  const displayedDaysFullDate = useMemo(() => {
    const start = (currentPage - 1) * daysPerPage;
    const end = start + daysPerPage;
    return daysFullDate.slice(start, end);
  }, [daysFullDate, currentPage, daysPerPage]);

  useEffect(() => {
    if (dates.length === 0) {
      const currentDay = currentDate.getDate();
      const initialPage = Math.ceil(currentDay / daysPerPage);
      setCurrentPage(initialPage);
    }
  }, []);

  // Обработчики пагинации
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const [workers, setWorkers] = useState([]);
  const [popupActive, setPopupActive] = useState(false);

  let description = {};
  let path;

  switch (slug) {
    case "object_6": {
      // У техники в Strapi нет DayDataDetails/DayInfo/NightInfo → это даёт 400.
      // Берём безопасно всю связь techicas.
      path = `?filters[slug][$eq]=${slug}&populate[techicas][populate]=*`;

      description = {
        popupTitle: "Техника",
        addButtonText: "Добавить технику",
        pageTitle: "Техника",
      };

      break;
    }
    case "object_5": {
      path = `?filters[slug][$eq]=${slug}&populate[drobilkas][populate]=*`;

      description = {
        popupTitle: "Дробилка",
        addButtonText: "Добавить дробилку",
        pageTitle: "Дробилка",
      };
      break;
    }
    default: {
      path = `?filters[slug][$eq]=${slug}&populate[workers][populate][DayDataDetails][populate][DayInfo][populate][SmenaDetails]=*&populate[workers][populate][DayDataDetails][populate][NightInfo][populate][SmenaDetails]=*&populate[workers][populate][DayDataOstatki]=*&populate[workers][populate][MonthDataTonnaj]=*`;

      description = {
        popupTitle: "Сотрудник",
        addButtonText: "Добавить сотрудника",
        pageTitle: "ФИО/должность",
      };
    }
  }
  // const { data: storeDate, clearData } = useDataRequestStore();
  // const { clearData } = useDataRequestStore();
  const storeDate = useDataRequestStore.getState().data;

  // Эффект для загрузки данных
  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        if (storeDate && !Array.isArray(storeDate)) {
          setWorkers([storeDate]);
          return;
        }

        const data = await fetchData(
          `http://89.111.152.254:1337/api/objects${path}`
        );
        let workersData = [];

        if (slug === "object_6") {
          workersData = data[0].techicas;
        } else if (slug === "object_5") {
          workersData = data[0].drobilkas;

        } else {
          workersData = data[0].workers;
        }
        setWorkers(workersData);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
      }
    };

    fetchAndSetData();
  }, [dates, currentPage, slug]);

  useEffect(() => {
    if (storeDate && !Array.isArray(storeDate)) {
      setWorkers([storeDate]);
      return;
    }
  }, [storeDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dates]);

  const [months, setMonths] = useState([]);

  useEffect(() => {
    if (dates.length > 0) {
      const newMonths = dates.map((date, idx) => ({
        id: idx,
        month: format(date, "LLL", { locale: ru }),
      }));

      setMonths(newMonths);
    }
  }, [dates]);


  const addWorkers = () => {
    setWorkers([...workers, { id: workers.length + 1, name: "" }]);
    // setWorkers(prevWorkers => [...prevWorkers, { id: prevWorkers.length + 1, name: '' }]);
  };

  return (
    <section className={styles.main_section}>
      <div className="container">
        <div className={`${styles.header_wrapper} sticky-header`}>
          {isMobile && (
            <header className={styles.top}>
              <div className={styles.top_wrapper}>
                <ObjectSelect setWorkers={setWorkers} />
                <ComponentDate />
              </div>
              <ComponentSearch />
            </header>
          )}
          {!isMobile && (
            <header className={styles.top}>
              <ObjectSelect setWorkers={setWorkers} />
              <div className={styles.top_wrapper}>
                {/* <ComponentTonnaj slugObject={slug} /> */}
                <ComponentSearch />
                <ComponentDate />
              </div>
            </header>
          )}
          <div className={styles.table}>
            <div className={styles.table_header}>
              {isMobile ? (
                <ul className={`${styles.day_list} ${styles.wrapper_day}`}>
                  <li className={styles.title_table}>
                    {description.pageTitle}
                  </li>
                  {displayedDays.map((day, idx) => {
                    const currentMonth =
                      months.length > 0
                        ? months[idx].month
                        : format(new Date(), "LLL", { locale: ru });

                    return (
                      <li className={styles.item_table} key={idx}>
                        <div>
                          {day}
                          <br />
                          <span style={{ fontSize: 10 }}>{currentMonth}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className={`${styles.day_list} ${styles.wrapper_day}`}>
                  <li className={styles.title_table}>
                    {description.pageTitle}
                  </li>
                  {displayedDays.map((day, idx) => {
                    const currentMonth =
                      months.length > 0
                        ? months[idx].month
                        : format(new Date(), "LLL", { locale: ru });

                    return (
                      <li className={styles.item_table} key={idx}>
                        <div>
                          {day} {currentMonth}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Пагинация */}
              {!isMobile && (
                <div className={styles.pagination}>
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={styles.button}
                  >
                    <img
                      style={{ rotate: "-180deg" }}
                      src="/next.svg"
                      alt="previous"
                    />
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={styles.button}
                  >
                    <img src="/next.svg" alt="next" />
                  </button>
                </div>
              )}

              <ul className={`${styles.day_list} ${styles.wrapper_time}`}>
                <li className={styles.title_table}></li>
                {displayedDays.map((day, idx) => (
                  <li className={styles.item_table} key={idx}>
                    <div className={styles.time_item}>
                      <img src="/sun.svg" alt="День" />
                      <p style={{ color: "#F2B174" }}>День</p> |
                      <img src="/moon.svg" alt="Ночь" />
                      <p style={{ color: "#1F2433" }}>Ночь</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {workers?.map((worker, idx) => (
          // Для Strapi v5 корректнее использовать documentId для действий с записью.
          <WorkerItem
            key={idx}
            id={worker?.documentId ?? worker.id}
            setWorkers={setWorkers}
            workers={workers}
            worker={worker}
            daysFullDate={displayedDaysFullDate}
            displayedDays={displayedDays}
            handleClick={() => setPopupActive(worker?.documentId ?? worker.id)}
            active={popupActive === (worker?.documentId ?? worker.id)}
            setActive={setPopupActive}
            title={description.popupTitle}
            forWhat={description.popupTitle}
          />
        ))}

        <div className={styles.add_workers}>
          <AddMoreBtn
            // onHandleClick={() => setWorkers([...workers, { id: workers.length + 1, name: '' }])}
            onHandleClick={addWorkers}
            title={description.addButtonText}
          />
        </div>
        {isMobile && (
          <div className={styles.pagination_wrapper}>
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={styles.button}
            >
              <img src="/next-mobile-left.svg" alt="previous" />
            </button>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={styles.button}
            >
              <img src="/next-mobile-right.svg" alt="next" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Object;
