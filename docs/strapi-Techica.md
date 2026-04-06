# Techica (техника) — структура в Strapi

Коллекция в API: **`/api/techicas`**. Отдельная модель без `DayDataDetails` / `DayInfo` / `NightInfo` у people.

## Поля верхнего уровня

| Поле | Тип | Назначение |
|------|-----|------------|
| **Name** | Text | Наименование |
| **Order** | Text | Порядок / обозначение (как в форме) |
| **objects** | Relation → Object | Связь с объектом (**строчная** `objects`) |
| **DayDataTechnicaDetails** | Повторяемый компонент | Смены по датам |

Отдельного **MonthDataTonnaj** / **DayDataOstatki** в клиентской форме техники нет.

## DayDataTechnicaDetails (повторяемый компонент)

| Поле | Тип | Примечание |
|------|-----|------------|
| **DayDataTechnicaDetails** | Text / Date | Дата; при сохранении из формы клиент может отдавать **ISO** `yyyy-mm-dd`, в ответах Strapi возможны и `dd.MM.yyyy` |
| **Day** | Boolean | Дневная смена |
| **Nigth** | Boolean | Ночная смена (**опечатка в схеме Strapi** — `Nigth`, не `Night`; так же в коде клиента) |
| **statusTech** | Enumeration | `Repair/to`, `No Coal (OC)`, `Stock`, плюс значение «в работе» — в API строка с завершающим символом pipe (см. `Form.jsx`, константа `In working\|`) |
| **note** | Text | Примечание |

## Связь с клиентом

- Сабмит: `Form.jsx` (`forWhat === "tech"`) — `Name`, `Order`, `objects`, массив `DayDataTechnicaDetails`.
- При **PUT** **objects** снова может вычищаться из payload в общем обработчике обновления.
- В `Object.jsx` для техники не подключают populate вроде `DayDataDetails` у workers — у типа другая структура.
