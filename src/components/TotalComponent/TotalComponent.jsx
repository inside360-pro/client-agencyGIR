import styles from "./style.module.scss";
import { ru } from "date-fns/locale";
import { format } from "date-fns";
import { useParams } from "react-router-dom";

/**
 * allDates - сюда уже приходят отфильтрованные дни
 * object - это worker
 * toLocaleString() - форматирование вывода тонн (12 000)
 */

function TotalComponent({ object, allDates }) {
  const { slug } = useParams();

  const normalizeDateForCompare = (value) => {
    if (!value) return value;
    const str = String(value);
    if (str.includes(".")) return str; // dd.MM.yyyy
    if (str.includes("-")) {
      const [yyyy, mm, dd] = str.split("T")[0].split("-");
      if (yyyy && mm && dd) return `${dd}.${mm}.${yyyy}`;
    }
    return str;
  };

  // количество дневных смен, когда он работал (уточнить у заказчика)
  const totalAmountDaySmena = object?.DayDataDetails?.filter((item) => {
    const smena = item?.DayInfo?.SmenaDetails;
    const date = smena?.SmenaDateDetails;
    const smenaStatus = smena?.SmenaStatusWorker;

    return (
      smena &&
      allDates.includes(date) &&
      smenaStatus !== "Not working" &&
      smenaStatus !== "Day Off"
    );
  }).length;

  // количество дневных смен, для техники
  const totalAmountDaySmenaTech = (object?.DayDataTechnicaDetails || []).filter(
    (row) => {
      const date = normalizeDateForCompare(row?.DayDataTechnicaDetails);
      const status = row?.statusTech;
      return (
        row?.Day &&
        date &&
        allDates.includes(date) &&
        status === "In working|"
      );
    }
  ).length;

  // количество ночных смен, когда он работал (уточнить у заказчика)
  const totalAmountNightSmena = object?.DayDataDetails?.filter((item) => {
    const smena = item?.NightInfo?.SmenaDetails;
    const date = smena?.SmenaDateDetails;
    const smenaStatus = smena?.SmenaStatusWorker;

    return (
      smena &&
      allDates.includes(date) &&
      smenaStatus !== "Not working" &&
      smenaStatus !== "Day Off"
    );
  }).length;

  // количество ночных смен, для техники
  const totalAmountNightSmenaTech = (
    object?.DayDataTechnicaDetails || []
  ).filter((row) => {
    const date = normalizeDateForCompare(row?.DayDataTechnicaDetails);
    const status = row?.statusTech;
    return (
      row?.Nigth &&
      date &&
      allDates.includes(date) &&
      status === "In working|"
    );
  }).length;

  let totalSumTonnaj = 0;
  object?.DayDataDetails?.forEach((item) => {
    // Дневная смена
    const daySmena = item?.DayInfo?.SmenaDetails;
    const dayDate = daySmena?.SmenaDateDetails;

    if (daySmena && allDates.includes(dayDate)) {
      const tonnaj = parseFloat(daySmena.SmenaDataTonnaj);
      totalSumTonnaj += isNaN(tonnaj) ? 0 : tonnaj;
    }

    // Ночная смена
    const nightSmena = item?.NightInfo?.SmenaDetails;
    const nightDate = nightSmena?.SmenaDateDetails;

    if (nightSmena && allDates.includes(nightDate)) {
      const tonnaj = parseFloat(nightSmena.SmenaDataTonnaj);
      totalSumTonnaj += isNaN(tonnaj) ? 0 : tonnaj;
    }
  });

  // Дробилки: тоннаж в DayDataDetailsDrobilka / DayDataDetailsTonnaj (не DayDataDetails)
  (object?.DayDataDetailsDrobilka || []).forEach((row) => {
    const date = normalizeDateForCompare(row?.DayDataDetailsDrobilka);
    if (!date || !allDates.includes(date)) return;
    const tonnaj = parseFloat(row?.DayDataDetailsTonnaj);
    totalSumTonnaj += isNaN(tonnaj) ? 0 : tonnaj;
  });

  let totalSumTonnajPlan = 0;
  let totalSumOstatokGir = 0;
  let totalSumOstatokPort = 0;

  // число плановое, сколько ему надо было выработать (на каждый месяц оно свое)
  if (
    Array.isArray(object?.MonthDataTonnaj) &&
    object.MonthDataTonnaj[0]?.AmountData
  ) {
    totalSumTonnajPlan = object.MonthDataTonnaj[0].AmountData;
  }

  // сумма тон осталась выработать в ГИР на конец месяца??? сумма выставии - тон смены
  if (
    Array.isArray(object?.DayDataOstatki) &&
    object.DayDataOstatki[0]?.DayDataOstatkiGIR
  ) {
    totalSumOstatokGir = object.DayDataOstatki[0].DayDataOstatkiGIR;
  }

  // сумма тон осталась выработать в ПОРТ на конец месяца??? сумма выставии - тон смены
  if (
    Array.isArray(object?.DayDataOstatki) &&
    object.DayDataOstatki[0]?.DayDataOstatkiPORT
  ) {
    totalSumOstatokPort = object.DayDataOstatki[0].DayDataOstatkiPORT;
  }

  let arr = [];
  switch (slug) {
    case "object_6": {
      arr = [
        { label: "Дневные смены", value: totalAmountDaySmenaTech },
        { label: "Ночные смены", value: totalAmountNightSmenaTech },
        {
          label: "Всего смен",
          value: totalAmountDaySmenaTech + totalAmountNightSmenaTech,
        },
      ];

      break;
    }
    case "object_5": {
      arr = [
        { label: "Общий тоннаж", value: totalSumTonnaj },
        { label: "Выставили", value: totalSumTonnajPlan },
        // { label: 'Ост. Порт', value: totalSumOstatokGir },
        // { label: 'Ост. ГиР', value: totalSumOstatokPort },
      ];
      break;
    }
    default: {
      arr = [
        { label: "Дневные смены", value: totalAmountDaySmena },
        { label: "Ночные смены", value: totalAmountNightSmena },
        {
          label: "Всего смен",
          value: totalAmountDaySmena + totalAmountNightSmena,
        },
        { label: "Общий тоннаж", value: totalSumTonnaj },
        // { label: 'Выставили', value: totalSumTonnajPlan },
        // { label: 'Ост. Порт', value: totalSumOstatokGir },
        // { label: 'Ост. ГиР', value: totalSumOstatokPort },
      ];
    }
  }

  return (
    <div className={styles.sum}>
      <div className={styles.sum_wrapper}>
        <p className={styles.sum_text}>Всего</p>
        <p className={styles.sum_month}>
          {format(new Date(), "LLLL", { locale: ru })}
        </p>
      </div>

      {arr.map((item, index) => (
        <div className={styles.sum_detail} key={item.label}>
          <p>{item.label}</p>
          <p>{Number(item.value || 0).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export default TotalComponent;
