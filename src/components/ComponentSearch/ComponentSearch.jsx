import { useState, useEffect, useRef } from "react";
import fetchData from "../../utils/fetchData";
import useDataRequestStore from "../../store/DataRequestStore";
import { useNavigate } from "react-router-dom";

import styles from "./style.module.scss";

const domain = "http://89.111.152.254:1337";

const toTitleCaseRu = (value) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const first = word.slice(0, 1).toLocaleUpperCase("ru-RU");
      const rest = word.slice(1).toLocaleLowerCase("ru-RU");
      return `${first}${rest}`;
    })
    .join(" ");

const buildNameOrFilterQuery = (field, value) => {
  const v = value.trim();
  if (!v) return "";

  // `$containsi` в Strapi может быть регистрозависимым для кириллицы (зависит от БД/колляции),
  // поэтому делаем OR по вариантам регистра через `$contains`.
  const variants = new Set([
    v,
    v.toLocaleLowerCase("ru-RU"),
    v.toLocaleUpperCase("ru-RU"),
    toTitleCaseRu(v),
  ]);

  return Array.from(variants)
    .filter(Boolean)
    .map(
      (variant, idx) =>
        `filters[$or][${idx}][${field}][$contains]=${encodeURIComponent(
          variant
        )}`
    )
    .join("&");
};

const getRecordName = (record) => record?.Name ?? record?.attributes?.Name ?? "";

const getFirstObjectName = (record) => {
  const rel =
    record?.objects ??
    record?.Objects ??
    record?.attributes?.objects?.data ??
    record?.attributes?.Objects?.data;

  const first = Array.isArray(rel) ? rel[0] : rel;
  return first?.Name ?? first?.attributes?.Name ?? "";
};

const ComponentSearch = () => {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataList, setData] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const { setDataRequest } = useDataRequestStore();
  const debounceTimeout = useRef(null);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleClick = (person) => {
    setDataRequest(person);
    const name = getFirstObjectName(person);
    switch (name) {
      case "Техника":
        navigate(`/object/object_6`);
        break;
      case "Дробильные установки":
        navigate(`/object/object_5`);
        break;

      case 'ООО "Морской Порт "Суходол"':
        navigate(`/object/object_4`);
        break;

      case 'АО "Порт Вера"':
        navigate(`/object/object_3`);
        break;

      case 'АО "Находкинский морской торговый порт" (ГУТ-2)':
        navigate(`/object/object_2`);
        break;

      case 'АО "Находкинский морской торговый порт" (УТ-1)':
        navigate(`/object/object_1`);

        break;
    }
    setInputValue("");
  };

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (inputValue.trim() === "") {
      setData([]);
      return;
    }

    setLoading(true);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const nameOrFilter = buildNameOrFilterQuery("Name", inputValue);

        const peoplePopulate =
          "populate[DayDataDetails][populate][DayInfo][populate]=*&populate[DayDataDetails][populate][NightInfo][populate]=*&populate[Objects][populate]=*";

        const peopleUrl = `${domain}/api/people?${[
          nameOrFilter,
          peoplePopulate,
        ]
          .filter(Boolean)
          .join("&")}`;

        // У техники/дробилок другие поля смен, чем у персон.
        const techicaPopulate =
          "populate[DayDataTechnicaDetails][populate]=*&populate[objects][populate]=*";
        const drobilkaPopulate =
          "populate[DayDataDetailsDrobilka][populate]=*&populate[objects][populate]=*";

        const techicaUrl = `${domain}/api/techicas?${[
          nameOrFilter,
          techicaPopulate,
        ]
          .filter(Boolean)
          .join("&")}`;
        const drobilkaUrl = `${domain}/api/drobilkas?${[
          nameOrFilter,
          drobilkaPopulate,
        ]
          .filter(Boolean)
          .join("&")}`;

        const results = await Promise.allSettled([
          fetchData(peopleUrl),
          fetchData(techicaUrl),
          fetchData(drobilkaUrl),
        ]);

        const [peopleResult, techicaResult, drobilkaResult] = results;

        if (peopleResult.status === "rejected") {
          console.error("Ошибка поиска people:", peopleResult.reason);
        }
        if (techicaResult.status === "rejected") {
          console.error("Ошибка поиска techicas:", techicaResult.reason);
        }
        if (drobilkaResult.status === "rejected") {
          console.error("Ошибка поиска drobilkas:", drobilkaResult.reason);
        }

        const peopleData =
          peopleResult.status === "fulfilled" ? peopleResult.value : [];
        const techicaData =
          techicaResult.status === "fulfilled" ? techicaResult.value : [];
        const drobilkaData =
          drobilkaResult.status === "fulfilled" ? drobilkaResult.value : [];

        const combinedResults = [
          ...peopleData,
          ...techicaData,
          ...drobilkaData,
        ];

        setData(combinedResults);
        setLoading(false);
      } catch (error) {
        console.error("Ошибка загрузки Объектов:", error);
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(debounceTimeout.current);
  }, [inputValue]);

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 1000)} // задержка, чтобы кликнуть по элементу
        className={styles.search}
        placeholder="Поиск"
      />
      <div className={styles.search_button}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20.1425 18.73L16.8995 15.487C17.8884 14.1978 18.4234 12.6179 18.4214 10.993C18.4214 9.00803 17.6485 7.14253 16.245 5.73903C15.5566 5.04685 14.7378 4.49808 13.836 4.12448C12.9341 3.75089 11.9671 3.55988 10.991 3.56253C9.00645 3.56253 7.14095 4.33553 5.73695 5.73903C2.84045 8.63603 2.84045 13.35 5.73695 16.247C6.42527 16.9392 7.24406 17.488 8.14592 17.8616C9.04777 18.2352 10.0148 18.4262 10.991 18.4235C12.638 18.4235 14.1985 17.884 15.4855 16.901L18.7285 20.1445C18.9235 20.3395 19.1795 20.4375 19.4354 20.4375C19.6915 20.4375 19.9475 20.3395 20.1425 20.1445C20.2354 20.0517 20.309 19.9414 20.3593 19.8201C20.4096 19.6987 20.4355 19.5686 20.4355 19.4373C20.4355 19.3059 20.4096 19.1759 20.3593 19.0545C20.309 18.9331 20.2354 18.8229 20.1425 18.73ZM7.15145 14.833C5.03395 12.7155 5.03445 9.27053 7.15145 7.15303C7.65463 6.64732 8.2531 6.24641 8.91223 5.97349C9.57135 5.70057 10.2781 5.56106 10.9915 5.56303C11.7048 5.56107 12.4114 5.70058 13.0704 5.97351C13.7295 6.24643 14.3279 6.64733 14.831 7.15303C15.3368 7.65613 15.7378 8.25458 16.0108 8.91371C16.2838 9.57285 16.4234 10.2796 16.4214 10.993C16.4214 12.4435 15.8565 13.807 14.831 14.833C13.8055 15.859 12.442 16.423 10.991 16.423C9.54095 16.423 8.17695 15.858 7.15095 14.833H7.15145Z"
            fill="#BAC4D8"
          />
        </svg>
      </div>
      {isFocused && (
        <ul className={styles.list}>
          {inputValue.trim() === "" && <li>Начните печатать</li>}
          {loading && <img src="/download.png" className={styles.image} />}
          {!loading && dataList.length === 0 && inputValue.trim() !== "" && (
            <li>Ничего не найдено</li>
          )}

          {!loading &&
            dataList.map((person, index) => (
              <li
                key={person?.documentId ?? person?.id ?? index}
                className={styles.item}
              >
                <p onClick={() => handleClick(person)}>{getRecordName(person)}</p>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default ComponentSearch;
