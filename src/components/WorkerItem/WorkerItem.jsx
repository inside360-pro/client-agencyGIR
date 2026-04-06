import { useState } from "react";
import styles from "./style.module.scss";
import { AddPopupContent, TotalComponent } from "../../components";
import { CheckNoteBtn, NoteBody } from "../../components";
import { motion } from "motion/react";
import { useParams } from "react-router-dom";

const EmptyWorkerItemData = ({ handleClickNote }) => {
  return (
    <>
      <div className={`${styles.worker_item_empty} ${styles.empty}`}>
        <div className={styles.item_table}>
          <div className={styles.item_data}>
            <CheckNoteBtn handleClick={handleClickNote} />
          </div>
          <div className="border_top_gray"></div>
          <div className={styles.item_data}>
            <CheckNoteBtn handleClick={handleClickNote} />
          </div>
        </div>
      </div>
    </>
  );
};

const EmptyWorkerItem = ({
  worker,
  displayedDays,
  handleClickNote,
  handleClick,
}) => (
  <div className={`${styles.workers_item} ${styles.empty}`}>
    <div className={styles.worker_data}>
      <p>{worker.name}</p>
    </div>

    {displayedDays.map((day) => (
      <div className={styles.item_table} key={day}>
        <div className={styles.item_data}>
          <div className={styles.detail}></div>
          <div className={styles.detail}></div>
          <CheckNoteBtn handleClick={handleClickNote} />
        </div>
        <div className="border_top_gray"></div>
        <div className={styles.item_data}>
          <div className={styles.detail}></div>
          <CheckNoteBtn handleClick={handleClickNote} />
        </div>
      </div>
    ))}

    <a href="#popup" className={styles.edit} onClick={handleClick}>
      <img src="/edit.svg" alt="" />
    </a>
  </div>
);

const WorkerDetails = ({
  id,
  worker,
  displayedDays,
  allDates,
  handleClick,
  missingDates,
  forWhat,
}) => {
  const params = useParams();
  const slug = params.slug;

  const [activeNote, setActiveNote] = useState(null);

  // Преобразуем missingDates в Set чисел для быстрого поиска
  const missingDatesSet = new Set(
    missingDates.map((item) => parseInt(item.split(".")[0], 10))
  );

  // Мемоизация рендера смены
  const renderShift = (shift, type, forWhat) => {
    if (!shift) return <p className=""></p>;

    let status;
    switch (slug) {
      case "object_6":
        status = shift?.statusTech ?? "In working|";
        break;

      case "object_5":
        status = shift?.statusDrobilka ?? "In working";
        break;

      default: {
        status = shift.SmenaDetails?.SmenaStatusWorker;
        break;
      }
    }

    const statusMap = {
      Default: null,
      null: null,
      "Not working": { text: "Не работал", className: "notWorking" },
      "Day Off": { text: "Выходной", className: "dayOf" },
      Empty: { text: "", className: "" },
      "In working": { text: "В работе", className: "inworking" },
      "In working|": { text: "В работе", className: "inworking" },
      "Repair/to": { text: "Ремонт/ТО", className: "repair" },
      "No Coal (OC)": { text: "Отсутствие угля (О/У)", className: "noCoal" },
      Stock: { text: "Запас", className: "stock" },
    };

    if (statusMap[status]) {
      return (
        <p className={statusMap[status].className}>{statusMap[status].text}</p>
      );
    }

    return (
      <>
        {/* <p>Дата: {shift.SmenaDetails?.SmenaDateDetails}</p> */}
        <p className={styles.details_static}>Тоннаж</p>
        <p className={`${styles.details_nostatic} working`}>
          {slug === "object_5"
            ? shift?.DayDataDetailsTonnaj || "Данные отсутствуют"
            : shift?.SmenaDetails?.SmenaDataTonnaj || "Данные отсутствуют"}
        </p>
        {shift?.SmenaDetails?.TC && forWhat === "Сотрудник" && (
          <>
            <p className={styles.details_static}>ТС</p>
            <p className={`${styles.details_nostatic} working`}>
              {shift?.SmenaDetails?.TC || "Данные отсутствуют"}
            </p>
          </>
        )}
      </>
    );
  };

  // Рендер одной даты
  const renderDate = (date) => {
    const isMissing = missingDatesSet.has(date);
    if (isMissing) return <EmptyWorkerItemData key={date} />;

    const handleNoteClick = (id) => {
      setActiveNote(id);
    };

    if (slug === "object_5") {
      const rows = worker?.DayDataDetailsDrobilka || [];
      const parseDay = (s) => parseInt(String(s || "").split(".")[0] || "", 10);
      const dayRow = rows.find(
        (r) => r?.Day && parseDay(r?.DayDataDetailsDrobilka) === date
      );
      const nightRow = rows.find(
        (r) => r?.Night && parseDay(r?.DayDataDetailsDrobilka) === date
      );

      return (
        <div className={styles.item_table} key={date}>
          <div className={styles.item_data}>
            <div className={styles.detail}>{renderShift(dayRow, "", forWhat)}</div>
            <CheckNoteBtn handleClick={() => handleNoteClick(dayRow?.id)} />
            <NoteBody
              id={dayRow?.id}
              active={activeNote === dayRow?.id}
              setActive={setActiveNote}
              worker={worker}
              data={dayRow}
            />
          </div>

          <div className="border_top_gray"></div>

          <div className={styles.item_data}>
            <div className={styles.detail}>
              {renderShift(nightRow, "", forWhat)}
            </div>
            <CheckNoteBtn handleClick={() => handleNoteClick(nightRow?.id)} />
            <NoteBody
              id={nightRow?.id}
              active={activeNote === nightRow?.id}
              setActive={setActiveNote}
              worker={worker}
              data={nightRow}
            />
          </div>
        </div>
      );
    }

    if (slug === "object_6") {
      const rows = worker?.DayDataTechnicaDetails || [];
      const parseDay = (s) => {
        const str = String(s || "");
        if (!str) return NaN;
        if (str.includes(".")) return parseInt(str.split(".")[0] || "", 10);
        if (str.includes("-")) return parseInt(str.split("-")[2] || "", 10);
        return NaN;
      };

      const dayRow = rows.find(
        (r) => r?.Day && parseDay(r?.DayDataTechnicaDetails) === date
      );
      const nightRow = rows.find(
        (r) => r?.Nigth && parseDay(r?.DayDataTechnicaDetails) === date
      );

      return (
        <div className={styles.item_table} key={date}>
          <div className={styles.item_data}>
            <div className={styles.detail}>{renderShift(dayRow, "", forWhat)}</div>
            <CheckNoteBtn handleClick={() => handleNoteClick(dayRow?.id)} />
            <NoteBody
              id={dayRow?.id}
              active={activeNote === dayRow?.id}
              setActive={setActiveNote}
              worker={worker}
              data={dayRow}
            />
          </div>

          <div className="border_top_gray"></div>

          <div className={styles.item_data}>
            <div className={styles.detail}>
              {renderShift(nightRow, "", forWhat)}
            </div>
            <CheckNoteBtn handleClick={() => handleNoteClick(nightRow?.id)} />
            <NoteBody
              id={nightRow?.id}
              active={activeNote === nightRow?.id}
              setActive={setActiveNote}
              worker={worker}
              data={nightRow}
            />
          </div>
        </div>
      );
    }

    const dayData = worker?.DayDataDetails?.find((d) => {
      let dayDate;
      let nightDate;
      switch (slug) {
        case "object_6":
          {
            dayDate = parseInt(d?.DayInfo?.date?.split(".")[0] || "", 10);
            nightDate = parseInt(d?.NightInfo?.date?.split(".")[0] || "", 10);
          }
          break;

        default:
          {
            dayDate = parseInt(
              d?.DayInfo?.SmenaDetails?.SmenaDateDetails?.split(".")[0] || "",
              10
            );
            nightDate = parseInt(
              d?.NightInfo?.SmenaDetails?.SmenaDateDetails?.split(".")[0] || "",
              10
            );
          }
          break;
      }

      return dayDate === date || nightDate === date;
    });

    return (
      <div className={styles.item_table} key={date}>
        {/* Дневная смена */}
        <div className={styles.item_data}>
          <div className={styles.detail}>
            {renderShift(dayData?.DayInfo, "", forWhat)}
          </div>
          <CheckNoteBtn
            handleClick={() => handleNoteClick(dayData?.DayInfo?.id)}
          />
          <NoteBody
            id={dayData?.DayInfo?.id}
            active={activeNote === dayData?.DayInfo?.id} // Проверяем соответствие ID
            setActive={setActiveNote}
            worker={worker}
            data={dayData?.DayInfo}
          />
        </div>

        <div className="border_top_gray"></div>

        {/* Ночная смена */}
        <div className={styles.item_data}>
          <div className={styles.detail}>
            {renderShift(dayData?.NightInfo, "", forWhat)}
          </div>
          <CheckNoteBtn
            handleClick={() => handleNoteClick(dayData?.NightInfo?.id)}
          />

          <NoteBody
            id={dayData?.NightInfo?.id}
            active={activeNote === dayData?.NightInfo?.id} // Проверяем соответствие ID
            setActive={setActiveNote}
            worker={worker}
            data={dayData?.NightInfo}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.workers_item} id={id}>
        <div className={styles.worker_data}>
          <div>
            <p style={{ fontWeight: "700" }}>
              {worker?.Name || "Данные отсутствуют"}
            </p>
            <p>{worker?.Job || worker?.Order}</p>
          </div>
          {/* {
            worker.MonthDataTonnaj != undefined && (
              <p>Тоннаж <br /> {worker?.MonthDataTonnaj[0]?.AmountData ? worker?.MonthDataTonnaj[0]?.AmountData : ''} тонн
              </p>)} */}
        </div>

        {displayedDays.map(renderDate)}

        <a href="#popup" className={styles.edit} onClick={handleClick}>
          <img src="/edit.svg" alt="" />
        </a>
      </div>

      <TotalComponent object={worker} allDates={allDates} />
    </>
  );
};

export default function WorkerItem({
  daysFullDate,
  active,
  setActive,
  title,
  id,
  workers,
  worker,
  displayedDays,
  handleClick,
  forWhat,
}) {
  const { slug } = useParams();
  // Все даты месяца
  const allDates = daysFullDate;

  const workerDates = (() => {
    if (slug === "object_5") {
      return (worker?.DayDataDetailsDrobilka || [])
        .map((r) => r?.DayDataDetailsDrobilka)
        .filter(
          (date, index, self) => date !== undefined && self.indexOf(date) === index
        );
    }

    if (slug === "object_6") {
      const normalize = (value) => {
        if (!value) return value;
        const str = String(value);
        if (str.includes(".")) return str; // dd.MM.yyyy
        if (str.includes("-")) {
          const [yyyy, mm, dd] = str.split("T")[0].split("-");
          if (yyyy && mm && dd) return `${dd}.${mm}.${yyyy}`;
        }
        return str;
      };

      return (worker?.DayDataTechnicaDetails || [])
        .map((r) => normalize(r?.DayDataTechnicaDetails))
        .filter(
          (date, index, self) => date !== undefined && self.indexOf(date) === index
        );
    }

    return (
      worker?.DayDataDetails?.reduce((acc, item) => {
        if (item?.DayInfo?.SmenaDetails?.SmenaDateDetails) {
          acc.push(item?.DayInfo?.SmenaDetails.SmenaDateDetails);
        } else {
          acc.push(item?.DayInfo?.date);
        }

        if (item?.NightInfo?.SmenaDetails?.SmenaDateDetails) {
          acc.push(item.NightInfo.SmenaDetails.SmenaDateDetails);
        } else {
          acc.push(item?.NightInfo?.date);
        }

        return acc;
      }, [])?.filter(
        (date, index, self) => date !== undefined && self.indexOf(date) === index
      ) || []
    );
  })();

  // Даты, которые есть в workerDates, но отсутствуют в allDates
  const missingDates = allDates?.filter((date) => !workerDates?.includes(date));

  const isWorkerEmpty = worker.name === "";

  return (
    <>
      {workers.length > 0 && worker && (
        <motion.div
          id={worker.uuid}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          key={worker.uuid}
          className={`${styles.workers_item_wrapper} ${
            isWorkerEmpty ? styles.workers_item_wrapper_empty : ""
          }`}
        >
          {/* --------------------------------- */}

          {isWorkerEmpty ? (
            <EmptyWorkerItem
              id={worker.uuid ? worker.uuid : worker.id}
              worker={worker}
              displayedDays={displayedDays}
              // handleClickNote={handleClickNote}
              handleClick={handleClick}
            />
          ) : (
            <WorkerDetails
              forWhat={forWhat}
              id={worker.uuid ? worker.uuid : worker.id}
              missingDates={missingDates}
              allDates={allDates}
              worker={worker}
              displayedDays={displayedDays}
              handleClick={handleClick}
            />
          )}
        </motion.div>
      )}

      <AddPopupContent
        id={id}
        recordId={worker?.documentId}
        active={active}
        setActive={setActive}
        title={title}
      />
    </>
  );
}
