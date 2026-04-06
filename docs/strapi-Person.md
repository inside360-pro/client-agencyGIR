# Persona (сотрудник) — структура в Strapi

В API коллекция доступна как **`/api/people`**. В админке тип контента может называться *Person*, *People*, *Worker* и т.п.; в коде клиента это сущность **сотрудника (persona)**.

## Поля верхнего уровня

| Поле | Тип | Назначение |
|------|-----|------------|
| **Name** | Text | ФИО |
| **Job** | Text | Должность |
| **Objects** | Relation → Object | Привязка к объекту (в запросах клиента — массив id, ключ с заглавной **O**) |
| **Order** | Text | Опционально; в форме читается из записи, в основной сабмит people может не входить — уточняйте в схеме Strapi |
| **uuid** | Text | Идентификатор, если заведён в модели |
| **documentId** | (Strapi 5) | Служебный id документа для REST, не компонент схемы |

## MonthDataTonnaj (повторяемый компонент)

Помесячный «тоннаж выставили».

| Поле | Тип |
|------|-----|
| **AmountData** | Text |
| **MonthData** | Text (дата якоря месяца, в UI обычно `dd.MM.yyyy`) |

## DayDataOstatki (повторяемый компонент)

Остатки по месяцам (Порт / ГиР). У **drobilka** этого компонента в схеме нет.

| Поле | Тип |
|------|-----|
| **DayDataOstatki** | Text (дата-якорь записи, `dd.MM.yyyy`) |
| **DayDataOstatkiPORT** | Text |
| **DayDataOstatkiGIR** | Text |

## DayDataDetails (повторяемый компонент)

Одна строка календаря: либо дневная, либо ночная смена, либо обе в одной записи (дубликат даты — две смены в одном дне).

Структура:

- **DayInfo** (компонент, может быть `null`)
  - **Day** — Boolean
  - **SmenaDetails** (компонент)
    - **SmenaStatusWorker** — Enumeration: в API встречаются значения вроде `Default`, `Not working`, `Day Off`, `Empty` (в форме «Работал» мапится в `Default`)
    - **SmenaDataTonnaj** — Text (тоннаж по смене)
    - **Note** — Text
    - **TC** — Text
    - **SmenaDateDetails** — Text (дата смены, `dd.MM.yyyy`)
- **NightInfo** (компонент, может быть `null`)
  - **Night** — Boolean
  - **SmenaDetails** — те же поля, что у дневной смены

Минимальный смысл: в одном элементе `DayDataDetails` может быть заполнен только `DayInfo`, только `NightInfo`, или оба — если на одну календарную дату две смены.

## Связь с клиентом

- Создание/обновление: `Form.jsx` (`forWhat === "people"`) шлёт `Name`, `Job`, `Objects`, `MonthDataTonnaj`, `DayDataOstatki`, `DayDataDetails`.
- При **PUT** связь **Objects** часто удаляется из тела запроса в коде, чтобы избежать 400 от Strapi.
- Пример `populate` для вложенности смен: `DayDataDetails` → `DayInfo` / `NightInfo` → (при необходимости `SmenaDetails`), плюс `DayDataOstatki`, `MonthDataTonnaj`, `Objects`.
