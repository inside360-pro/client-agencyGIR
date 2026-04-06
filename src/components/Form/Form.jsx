import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import PropTypes from "prop-types";
import styles from "./style.module.scss";
import { updateUserDateService } from "../../services/update-service";
import useDataObjectRequestStore from "../../store/DataObjectRequestStore";
import useDataRequestStore from "../../store/DataRequestStore";
import { format, parseISO, isValid } from "date-fns";
import fetchData from "../../utils/fetchData";
import useMobile from "../../hooks/useMobile";

import { registerLocale } from "react-datepicker";
import ru from "date-fns/locale/ru";
registerLocale("ru", ru);

import { useParams } from "react-router-dom";
import {
  BtnSave,
  DeleteButton,
  ComponentDrobilka,
  ComponentPeople,
  ComponentTech,
  ModalNotification,
} from "../../components";

import useDateSingleStore from "../../store/CalendarSingleStore";

export async function checkExistingRecord({ url, forWhat, objectId, name }) {
  if (!url) return null;

  const query = (() => {
    // В Strapi фильтрация работает только по реально существующим полям.
    // Для дробилки поле uuid отсутствует, поэтому ищем по связи с объектом.
    if (forWhat === "drobilka" || forWhat === "tech") {
      if (!objectId || !name) return null;
      return `filters[objects][id][$eq]=${encodeURIComponent(
        String(objectId)
      )}&filters[Name][$eq]=${encodeURIComponent(String(name))}`;
    }

    if (forWhat === "people") {
      if (!objectId || !name) return null;
      return `filters[Objects][id][$eq]=${encodeURIComponent(
        String(objectId)
      )}&filters[Name][$eq]=${encodeURIComponent(String(name))}`;
    }

    return null;
  })();

  if (!query) return null;

  try {
    const response = await fetch(`${url}?${query}`);
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Ошибка при проверке записи:", result?.error || result);
      return null;
    }
    return result?.data?.length > 0 ? result.data[0]?.documentId : null;
  } catch (error) {
    console.error("Ошибка:", error);
    return null;
  }
}

export async function saveUserDateService(userData, url) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: { ...userData } }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message || `HTTP error! Status: ${response.status}`;
    throw new Error(message);
  }
  return { response, data };
}

/** dd.MM.yyyy → MM.yyyy для сопоставления записей за месяц */
function monthYearFromDdMmYyyy(value) {
  if (!value || typeof value !== "string") return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!mm || !yyyy || Number.isNaN(mm) || Number.isNaN(yyyy)) return null;
  const d = new Date(yyyy, mm - 1, dd || 1);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, "MM.yyyy", { locale: ru });
}

function stripRepeatableComponentMeta(item) {
  if (!item || typeof item !== "object") return item;
  const rest = { ...item };
  delete rest.id;
  delete rest.documentId;
  delete rest.__temp_key__;
  return rest;
}

function parseDdMmYyyyTime(s) {
  const p = s?.split(".");
  if (!p || p.length !== 3) return 0;
  const [d, m, y] = p.map(Number);
  return new Date(y, m - 1, d).getTime();
}

function monthDataTonnajForForm(records) {
  return (
    records
      ?.map((m) => {
        if (
          m &&
          m.MonthData !== "0" &&
          m.MonthData !== undefined &&
          m.MonthData !== null
        ) {
          const [day, month, year] = m.MonthData.split(".").map(Number);
          const dateObj = new Date(year, month - 1, day);
          const itemDate = format(dateObj, "dd.MM.yyyy", { locale: ru });
          if (itemDate) {
            return {
              ...m,
              MonthData: m.MonthData,
            };
          }
        } else {
          console.log(false);
        }
        return null;
      })
      ?.filter(Boolean) || []
  );
}

function buildMergedMonthTonnajAndOstatki({
  formValues,
  dataRoot,
  formattedDates,
  amountData,
  dayDataOstatkiPORT,
  dayDataOstatkiGIR,
}) {
  const currentMonthYear = format(new Date(), "MM.yyyy", { locale: ru });
  const firstShiftDate = formattedDates.find((d) => d && d !== "0");
  const monthDataAnchor =
    firstShiftDate &&
      monthYearFromDdMmYyyy(firstShiftDate) === currentMonthYear
      ? firstShiftDate
      : format(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        "dd.MM.yyyy",
        { locale: ru }
      );

  const prevMonthDataTonnaj =
    formValues.MonthDataTonnaj ?? dataRoot?.MonthDataTonnaj ?? [];
  const monthDataTonnajMerged = [
    ...prevMonthDataTonnaj
      .filter(
        (item) =>
          monthYearFromDdMmYyyy(item?.MonthData) !== currentMonthYear
      )
      .map(stripRepeatableComponentMeta),
    {
      MonthData: monthDataAnchor,
      AmountData:
        amountData != null && amountData !== ""
          ? String(amountData)
          : "0",
    },
  ].sort((a, b) => parseDdMmYyyyTime(a.MonthData) - parseDdMmYyyyTime(b.MonthData));

  const prevDayDataOstatki =
    formValues.DayDataOstatki ?? dataRoot?.DayDataOstatki ?? [];
  const portVal =
    dayDataOstatkiPORT != null && dayDataOstatkiPORT !== ""
      ? String(dayDataOstatkiPORT)
      : "0";
  const girVal =
    dayDataOstatkiGIR != null && dayDataOstatkiGIR !== ""
      ? String(dayDataOstatkiGIR)
      : "0";
  const dayDataOstatkiMerged = [
    ...prevDayDataOstatki
      .filter(
        (item) =>
          monthYearFromDdMmYyyy(item?.DayDataOstatki) !== currentMonthYear
      )
      .map(stripRepeatableComponentMeta),
    {
      DayDataOstatki: monthDataAnchor,
      DayDataOstatkiPORT: portVal,
      DayDataOstatkiGIR: girVal,
    },
  ].sort(
    (a, b) =>
      parseDdMmYyyyTime(a.DayDataOstatki) - parseDdMmYyyyTime(b.DayDataOstatki)
  );

  return { monthDataTonnajMerged, dayDataOstatkiMerged };
}

export default function Form({ title, forWhat, setActive, popupId }) {
  const { data } = useDataRequestStore();
  const { dates } = useDateSingleStore();
  const { slug } = useParams();
  const isMobile = useMobile();

  const [, setError] = useState();
  const [isSending, setIsSending] = useState(false);
  const [shiftType, setShiftType] = useState([]);
  const [items, setItems] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [modalNotification, setModalNotification] = useState(false);
  const [modalNotificationText, setModalNotificationText] = useState(false);
  const [modalNotificationVariant, setModalNotificationVariant] =
    useState("info");
  const [dateSearch, setDateSearch] = useState("");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  // Правильное определение формата
  const formatOptions = {
    locale: "ru-RU",
    options: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  };

  const [datesFromData, setDatesFromData] = useState([]);

  const normalizeDateForUi = (value) => {
    if (!value || typeof value !== "string") return value;
    if (value.includes(".")) return value; // dd.MM.yyyy
    if (value.includes("-")) {
      const dt = parseISO(value);
      return isValid(dt) ? format(dt, "dd.MM.yyyy") : value;
    }
    return value;
  };

  const formattedDates = items.map((_, idx) => {
    const fromStore = dates?.[idx];
    if (fromStore instanceof Date && !isNaN(fromStore)) {
      return fromStore.toLocaleDateString(
        formatOptions.locale,
        formatOptions.options
      );
    }

    const fromData = datesFromData?.[idx];
    if (typeof fromData === "string" && fromData && fromData !== "0") {
      return fromData;
    }

    const fromForm = formValues?.smenaDateDetails?.[idx];
    if (typeof fromForm === "string" && fromForm && fromForm !== "0") {
      return fromForm;
    }

    return undefined;
  });

  const { dataObject, setDataObjectRequest } = useDataObjectRequestStore();

  const name = useWatch({ control, name: "Name" });
  const order = useWatch({ control, name: "Order" });
  const job = useWatch({ control, name: "Job" });
  const amountData = useWatch({ control, name: "AmountData" });
  const dayDataOstatkiPORT = useWatch({ control, name: "DayDataOstatkiPORT" });
  const dayDataOstatkiGIR = useWatch({ control, name: "DayDataOstatkiGIR" });
  const dayDataTonnaj = useWatch({ control, name: "DayDataTonnaj" }) ?? [];
  const TC = useWatch({ control, name: "TC" }) ?? [];
  const note = useWatch({ control, name: "note" }) ?? [];
  const shiftTypeArray = useWatch({ control, name: "shiftType" });
  const statusValues = useWatch({ control, name: "statusWorker" }) ?? [];

  const normalizeWorkerStatus = (value) => {
    // Strapi enum (people/drobilka): Default, Not working, Day Off, Empty
    if (!value || value === "0") return "Default";
    if (value === "Worked") return "Default";
    if (value === "Default") return "Default";
    if (value === "Not working") return "Not working";
    if (value === "Day Off") return "Day Off";
    if (value === "Empty") return "Empty";
    return "Default";
  };

  const handleClick = (e) => {
    e.preventDefault();
    setItems([...items, items.length + 1]);
  };

  const dublicateDates = formattedDates.reduce((acc, d) => {
    if (!d) return acc;
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        const data = await fetchData(
          `http://89.111.152.254:1337/api/objects?filters[slug][$eq]=${slug}&populate=*`
        );
        setDataObjectRequest(data);
      } catch (error) {
        console.error("Ошибка при получении данных:", error);
      }
    };

    fetchAndSetData();
  }, []);

  useEffect(() => {
    if (!shiftTypeArray) return;

    let newShiftType = [];

    shiftTypeArray.forEach((i, idx) => {
      if (i === "day") {
        setValue(`btnNight.${idx}`, false);
        newShiftType.push("day");
      } else if (i === "night") {
        setValue(`btnDay.${idx}`, false);
        newShiftType.push("night");
      } else {
        newShiftType.push("day");
      }
    });

    setShiftType(newShiftType);
  }, [shiftTypeArray, setValue]);

  useEffect(() => {
    if (data && data.length > 0) {
      if (forWhat === "drobilka") {
        setItems(data[0]?.DayDataDetailsDrobilka || []);
        return;
      }
      if (forWhat === "tech") {
        setItems(data[0]?.DayDataTechnicaDetails || []);
        return;
      }

      let itemsArray = [];
      (data[0]?.DayDataDetails || []).forEach((day) => {
        if (day.DayInfo) itemsArray.push(day.DayInfo);
        if (day.NightInfo) itemsArray.push(day.NightInfo);
      });
      setItems(itemsArray);
    }
  }, [data, forWhat]);

  useEffect(() => {
    if (forWhat === "drobilka") {
      const dates =
        data?.[0]?.DayDataDetailsDrobilka
          ?.map((d) => d?.DayDataDetailsDrobilka)
          ?.filter(Boolean) || [];
      setDatesFromData(dates);
      return;
    }
    if (forWhat === "tech") {
      const dates =
        data?.[0]?.DayDataTechnicaDetails
          ?.map((d) => normalizeDateForUi(d?.DayDataTechnicaDetails))
          ?.filter(Boolean) || [];
      setDatesFromData(dates);
      return;
    }

    const dates =
      data[0]?.DayDataDetails?.flatMap((d) => {
        const dates = [];
        if (d?.DayInfo?.SmenaDetails?.SmenaDateDetails)
          dates.push(d.DayInfo.SmenaDetails.SmenaDateDetails);
        if (d?.NightInfo?.SmenaDetails?.SmenaDateDetails)
          dates.push(d.NightInfo.SmenaDetails.SmenaDateDetails);
        if (d?.DayInfo?.date) dates.push(d.DayInfo.date);
        if (d?.NightInfo?.date) dates.push(d.NightInfo.date);
        return dates;
      }) || [];

    setDatesFromData(dates);
  }, [data, forWhat]);

  useEffect(() => {
    if (data && data[0]) {
      const newFormDefault = (() => {
        if (forWhat === "drobilka") {
          const rows = data[0]?.DayDataDetailsDrobilka || [];
          const nowMonthYear = format(new Date(), "MM.yyyy", { locale: ru });
          const monthTonnajRow = (data[0]?.MonthDataTonnaj || []).find(
            (m) =>
              m?.MonthData &&
              monthYearFromDdMmYyyy(m.MonthData) === nowMonthYear
          );

          return {
            Name: data[0].Name || "",
            AmountData:
              monthTonnajRow?.AmountData != null &&
                monthTonnajRow?.AmountData !== ""
                ? String(monthTonnajRow.AmountData)
                : "",
            MonthDataTonnaj: monthDataTonnajForForm(data[0]?.MonthDataTonnaj),
            shiftType: [],
            // В Strapi statusDrobilka может быть null (например "В работе" не хранится в enum).
            // Для формы трактуем null как "In working".
            statusWorker: rows.map((r) => r?.statusDrobilka ?? "In working"),
            smenaDateDetails: rows.map((r) => r?.DayDataDetailsDrobilka || "0"),
            shiftTypeArray: rows.map((r) => (r?.Day ? "day" : "night")),
            dayDataTonnaj: rows.map((r) => r?.DayDataDetailsTonnaj || "0"),
            note: rows.map((r) => r?.note || ""),
          };
        }
        if (forWhat === "tech") {
          const rows = data[0]?.DayDataTechnicaDetails || [];
          return {
            Name: data[0].Name || "",
            Order: data[0]?.Order || "",
            shiftType: [],
            statusWorker: rows.map((r) => r?.statusTech ?? "In working|"),
            smenaDateDetails: rows.map((r) =>
              normalizeDateForUi(r?.DayDataTechnicaDetails) || "0"
            ),
            shiftTypeArray: rows.map((r) => (r?.Day ? "day" : "night")),
            note: rows.map((r) => r?.note || ""),
          };
        }

        const nowMonthYear = format(new Date(), "MM.yyyy", { locale: ru });
        const monthTonnajRow = (data[0]?.MonthDataTonnaj || []).find(
          (m) =>
            m?.MonthData &&
            monthYearFromDdMmYyyy(m.MonthData) === nowMonthYear
        );
        const ostatkiRow =
          (data[0]?.DayDataOstatki || []).find(
            (o) =>
              o?.DayDataOstatki &&
              monthYearFromDdMmYyyy(o.DayDataOstatki) === nowMonthYear
          ) || data[0]?.DayDataOstatki?.[0];

        return {
          Name: data[0].Name || "",
          Job: data[0].Job || "",
          Order: data[0]?.Order || "",

          AmountData:
            monthTonnajRow?.AmountData != null &&
              monthTonnajRow?.AmountData !== ""
              ? String(monthTonnajRow.AmountData)
              : "",
          DayDataOstatkiPORT:
            ostatkiRow?.DayDataOstatkiPORT != null
              ? String(ostatkiRow.DayDataOstatkiPORT)
              : "",
          DayDataOstatkiGIR:
            ostatkiRow?.DayDataOstatkiGIR != null
              ? String(ostatkiRow.DayDataOstatkiGIR)
              : "",
          DayDataOstatki: data[0]?.DayDataOstatki || [],

          MonthDataTonnaj: monthDataTonnajForForm(data[0]?.MonthDataTonnaj),

          statusWorker:
            data[0]?.DayDataDetails?.flatMap((i) => {
              const result = [];
              if (i?.DayInfo) {
                const raw =
                  i.DayInfo?.SmenaDetails?.SmenaStatusWorker ||
                  i.DayInfo?.statusTech ||
                  "";
                result.push(raw === "Default" ? "Worked" : raw);
              }
              if (i?.NightInfo) {
                const raw =
                  i.NightInfo?.SmenaDetails?.SmenaStatusWorker ||
                  i.NightInfo?.statusTech ||
                  "";
                result.push(raw === "Default" ? "Worked" : raw);
              }
              return result;
            }) || [],

          smenaDateDetails:
            data[0]?.DayDataDetails?.flatMap((i) => {
              const result = [];
              if (i?.DayInfo) {
                result.push(i.DayInfo?.SmenaDetails?.SmenaDateDetails || "0");
              }
              if (i?.NightInfo) {
                result.push(i.NightInfo?.SmenaDetails?.SmenaDateDetails || "0");
              }
              return result;
            }) || [],

          shiftType:
            data[0]?.DayDataDetails?.flatMap((i) => {
              const res = [];
              if (i?.DayInfo) res.push("day");
              if (i?.NightInfo) res.push("night");
              return res;
            }) || [],

          dayDataTonnaj:
            data[0]?.DayDataDetails?.flatMap((i) => {
              const result = [];
              if (i?.DayInfo) {
                result.push(i.DayInfo?.SmenaDetails?.SmenaDataTonnaj || "0");
              }
              if (i?.NightInfo) {
                result.push(i.NightInfo?.SmenaDetails?.SmenaDataTonnaj || "0");
              }
              return result;
            }) || [],

          TC:
            data[0]?.DayDataDetails?.flatMap((i) => {
              const result = [];
              if (i?.DayInfo) result.push(i.DayInfo?.SmenaDetails?.TC);
              if (i?.NightInfo) result.push(i.NightInfo?.SmenaDetails?.TC);
              return result;
            }) || [],

          note:
            data[0]?.DayDataDetails?.map(
              (i) =>
                i?.DayInfo?.SmenaDetails?.Note ||
                i?.NightInfo?.SmenaDetails?.Note ||
                i?.DayInfo?.note ||
                i?.NightInfo?.note
            ) || [],
        };
      })();

      reset(newFormDefault);
      setFormValues(newFormDefault);
      // console.log("Инициализация формы:", newFormDefault.MonthDataTonnaj);
    }
  }, [data, forWhat, reset]);

  const onSubmit = async () => {
    setIsSending(true);
    setError(null);
    setModalNotification(true);
    setModalNotificationText("Отправка...");
    setModalNotificationVariant("loading");
    let formData = {};
    let url = "";
    try {
      switch (forWhat) {
        case "people": {
          url = "http://89.111.152.254:1337/api/people";
          const { monthDataTonnajMerged, dayDataOstatkiMerged } =
            buildMergedMonthTonnajAndOstatki({
              formValues,
              dataRoot: data?.[0],
              formattedDates,
              amountData,
              dayDataOstatkiPORT,
              dayDataOstatkiGIR,
            });

          formData = {
            Name: name || "",
            Job: job || "",
            Objects: dataObject?.[0]?.id ? [dataObject[0].id] : [],
            MonthDataTonnaj: monthDataTonnajMerged,
            DayDataOstatki: dayDataOstatkiMerged,
          };

          formData.DayDataDetails = items.reduce((acc, item, idx) => {
            const currentDate = formattedDates[idx];
            const isDuplicate = (dublicateDates[currentDate] || 0) >= 1;
            const status = normalizeWorkerStatus(statusValues?.[idx]);

            if (!currentDate) {
              throw new Error(`MISSING_DATE:${idx}`);
            }

            const commonDetails = {
              Note: note?.[idx] || formValues?.note[idx],
              SmenaDataTonnaj:
                dayDataTonnaj?.[idx] || formValues?.dayDataTonnaj[idx] || "0",
              SmenaDateDetails: currentDate,
              SmenaStatusWorker: status,
              TC: TC?.[idx] || formValues?.TC[idx] || "0",
            };

            const existingEntry = acc.find((e) => {
              return (
                e.DayInfo?.SmenaDetails?.SmenaDateDetails === currentDate ||
                e.NightInfo?.SmenaDetails?.SmenaDateDetails === currentDate
              );
            });

            if (isDuplicate && existingEntry) {
              const shiftType =
                shiftTypeArray[idx] || formValues?.shiftType?.[idx];

              if (shiftType === "day") {
                existingEntry.DayInfo = {
                  ...existingEntry.DayInfo,
                  Day: true,
                  SmenaDetails: {
                    ...existingEntry.DayInfo?.SmenaDetails,
                    ...commonDetails,
                  },
                };
              } else if (shiftType === "night") {
                existingEntry.NightInfo = {
                  ...existingEntry.NightInfo,
                  Night: true,
                  SmenaDetails: {
                    ...existingEntry.NightInfo?.SmenaDetails,
                    ...commonDetails,
                  },
                };
              }
            } else {
              const shiftType = shiftTypeArray[idx] || "day";
              acc.push({
                ...(shiftType === "day"
                  ? { DayInfo: { Day: true, SmenaDetails: commonDetails } }
                  : {
                    NightInfo: { Night: true, SmenaDetails: commonDetails },
                  }),
              });
            }
            return acc;
          }, []);

          break;
        }

        case "tech":
          url = "http://89.111.152.254:1337/api/techicas";
          formData = {
            Name: name || "",
            Order: order || data[0]?.Order,
            objects: dataObject?.[0]?.id ? [dataObject[0].id] : [],
          };

          formData.DayDataTechnicaDetails = items.reduce((acc, _item, idx) => {
            const currentDate = formattedDates[idx];
            if (!currentDate) throw new Error(`MISSING_DATE:${idx}`);

            const shift =
              shiftTypeArray?.[idx] ||
              (_item?.Nigth ? "night" : _item?.Day ? "day" : "day");
            const status =
              statusValues?.[idx] ??
              formValues?.statusWorker?.[idx] ??
              "In working|";

            const allowed = new Set([
              "In working|",
              "Repair/to",
              "No Coal (OC)",
              "Stock",
            ]);

            const statusTech = allowed.has(status) ? status : "In working|";

            const toISO = (value) => {
              if (!value) return value;
              if (typeof value === "string" && value.includes("-")) return value; // yyyy-mm-dd
              if (typeof value === "string" && value.includes(".")) {
                const [dd, mm, yyyy] = value.split(".");
                if (dd && mm && yyyy) return `${yyyy}-${mm}-${dd}`;
              }
              return value;
            };

            acc.push({
              DayDataTechnicaDetails: toISO(currentDate),
              Day: shift === "day",
              Nigth: shift === "night",
              statusTech,
              note: note?.[idx] || formValues?.note?.[idx] || "",
            });
            return acc;
          }, []);

          break;

        case "drobilka": {
          url = "http://89.111.152.254:1337/api/drobilkas";

          const { monthDataTonnajMerged } = buildMergedMonthTonnajAndOstatki({
            formValues,
            dataRoot: data?.[0],
            formattedDates,
            amountData,
            dayDataOstatkiPORT,
            dayDataOstatkiGIR,
          });

          formData = {
            Name: name || "",
            objects: dataObject?.[0]?.id ? [dataObject[0].id] : [],
            slug: slug || "",
            MonthDataTonnaj: monthDataTonnajMerged,
          };

          formData.DayDataDetailsDrobilka = items.reduce((acc, _item, idx) => {
            const currentDate = formattedDates[idx];
            if (!currentDate) throw new Error(`MISSING_DATE:${idx}`);

            const shift = shiftTypeArray?.[idx] || "day";
            const rawStatus = statusValues?.[idx] ?? formValues?.statusWorker?.[idx];
            if (!rawStatus) throw new Error(`MISSING_STATUS:${idx}`);

            const allowed = new Set(["Repair/to", "No Coal (OC)", "Stock"]);
            const statusDrobilka =
              allowed.has(rawStatus) ? rawStatus : undefined;

            const row = {
              DayDataDetailsDrobilka: currentDate,
              DayDataDetailsTonnaj:
                dayDataTonnaj?.[idx] || formValues?.dayDataTonnaj?.[idx] || "0",
              note: note?.[idx] || formValues?.note?.[idx] || "",
              Day: shift === "day",
              Night: shift === "night",
            };

            // Strapi enum для statusDrobilka не принимает "In working".
            // Если выбран "В работе" (In working) — не отправляем поле, чтобы не ловить 400.
            if (statusDrobilka) row.statusDrobilka = statusDrobilka;

            acc.push(row);

            return acc;
          }, []);

          break;
        }
      }

      try {
        // Если форма открыта на существующей записи (пришли данные из GET /:documentId),
        // обновляем именно её, даже если Name меняли (иначе будет создаваться новая запись).
        const currentRecordId = data?.[0]?.documentId;
        const existingRecordId =
          currentRecordId ||
          (await checkExistingRecord({
            url,
            forWhat,
            objectId: dataObject?.[0]?.id,
            name,
          }));
        let response;

        if (existingRecordId) {
          const dataForUpdate = { ...formData };
          // Связь с объектом при обновлении не трогаем: на Strapi она часто валит 400,
          // если формат relation не совпадает с ожиданиями. Обновляем только данные смен.
          delete dataForUpdate.objects;
          delete dataForUpdate.Objects;

          response = await updateUserDateService(
            existingRecordId,
            dataForUpdate,
            url
          );
          if (response.status === 200) {
            setModalNotification(true);
            setModalNotificationText("Форма отправлена! Данные обновлены");
            setModalNotificationVariant("success");
            reset();
          } else {
            console.error("Ошибка обновления:", response);
            setModalNotification(true);
            setModalNotificationText(
              response?.data?.error?.message || "Ошибка обновления данных"
            );
            setModalNotificationVariant("error");
            return;
          }
          console.log("Данные обновлены:", formData);
        } else {
          response = await saveUserDateService(formData, url);
          setModalNotification(true);
          setModalNotificationText("Форма отправлена! Создана новая сущность");
          setModalNotificationVariant("success");
          console.log("Новая запись создана:", response, formData);
        }
      } catch (error) {
        console.error("Ошибка запроса:", error);
        setModalNotification(true);
        setModalNotificationText(
          String(error?.message || "Ошибка запроса, попробуйте позже")
        );
        setModalNotificationVariant("error");
      } finally {
        setIsSending(false);
      }
    } catch (error) {
      console.log(error);
      setModalNotification(true);
      const message = String(error?.message || "");
      if (message.startsWith("MISSING_DATE:")) {
        const idx = Number(message.split(":")[1]);
        setModalNotificationText(
          `Форма не будет отправлена ❌ Заполните дату (смена ${idx + 1})`
        );
        setModalNotificationVariant("error");
      } else if (message.startsWith("MISSING_STATUS:")) {
        const idx = Number(message.split(":")[1]);
        setModalNotificationText(
          `Форма не будет отправлена ❌ Выберите статус (смена ${idx + 1})`
        );
        setModalNotificationVariant("error");
      } else {
        setModalNotificationText(
          "Форма не будет отправлена ❌ Нужно заполнить статус"
        );
        setModalNotificationVariant("error");
      }

      // Валидационные ошибки до запроса тоже должны завершать "отправку",
      // иначе durationMs остаётся 0 и уведомление не автозакрывается.
      setIsSending(false);
    }
  };

  const handleDateSearch = (e) => {
    const date = e.target.value;
    setDateSearch(date);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.form_wrapper}>
          <div className={styles.form_header}>
            <div>
              <h2 className={styles.form_title}>{title}</h2>
            </div>

            <div className={styles.date_search_wrapper}>
              {items.length > 2 && (
                <input className={styles.date_input}
                  type="date"
                  name="date-search"
                  onChange={handleDateSearch}
                />
              )}
            </div>

            {!isMobile && (
              <div className={styles.form_title_info}>
                <div className={styles.btn_save_wrapper}>
                  <BtnSave isSending={isSending} />
                  <DeleteButton setActive={setActive} />
                </div>
              </div>
            )}
          </div>

          {forWhat === "people" && (
            <ComponentPeople
              handleClickBtn={handleClick}
              items={items}
              register={register}
              errors={errors}
              shiftType={shiftType}
              setItems={setItems}
              popupId={popupId}
              dateSearch={dateSearch}
            />
          )}

          {forWhat === "tech" && (
            <ComponentTech
              handleClickBtn={handleClick}
              items={items}
              register={register}
              errors={errors}
              shiftType={shiftType}
              setItems={setItems}
              popupId={popupId}
              dateSearch={dateSearch}
            />
          )}

          {forWhat === "drobilka" && (
            <ComponentDrobilka
              handleClickBtn={handleClick}
              items={items}
              register={register}
              errors={errors}
              shiftType={shiftType}
              setItems={setItems}
              popupId={popupId}
              dateSearch={dateSearch}
            />
          )}

          {isMobile && (
            <div className={styles.btn_save_wrapper}>
              <BtnSave isSending={isSending} />
            </div>
          )}
        </div>
      </form>

      <ModalNotification
        active={modalNotification}
        text={modalNotificationText}
        variant={modalNotificationVariant}
        durationMs={isSending ? 0 : 3000}
        onClose={() => setModalNotification(false)}
      />
    </>
  );
}

Form.propTypes = {
  title: PropTypes.string,
  forWhat: PropTypes.string,
  setActive: PropTypes.func,
  popupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
