# Drobilka (дробилка) — структура в Strapi

Коллекция в API: **`/api/drobilkas`**. Компонента **DayDataOstatki** у этой модели нет (в отличие от people).

## Поля верхнего уровня

| Поле | Тип | Назначение |
|------|-----|------------|
| **Name** | Text | Наименование |
| **objects** | Relation → Object | Связь с объектом (в клиенте ключ с **строчной** `objects`) |
| **slug** | Text | Слаг (маршрут / контекст объекта) |
| **MonthDataTonnaj** | Повторяемый компонент | Помесячный тоннаж «выставили» (как у people) |
| **DayDataDetailsDrobilka** | Повторяемый компонент | Строки по сменам / датам |

## MonthDataTonnaj (как у сотрудника)

| Поле | Тип |
|------|-----|
| **AmountData** | Text |
| **MonthData** | Text (`dd.MM.yyyy` как якорь месяца) |

## DayDataDetailsDrobilka (повторяемый компонент)

Одна запись = одна смена (день или ночь).

| Поле | Тип | Примечание |
|------|-----|------------|
| **DayDataDetailsDrobilka** | Text | Дата в UI `dd.MM.yyyy` |
| **Day** | Boolean | Дневная смена |
| **Night** | Boolean | Ночная смена |
| **DayDataDetailsTonnaj** | Text | Тоннаж по строке |
| **note** | Text | Примечание |
| **statusDrobilka** | Enumeration | Значения из формы: `Repair/to`, `No Coal (OC)`, `Stock`. Состояние «В работе» в Strapi часто **не хранится** в enum — клиент при выборе «В работе» **не отправляет** поле, чтобы не получать 400 |

## Связь с клиентом

- Сабмит: `Form.jsx` (`forWhat === "drobilka"`) — `Name`, `objects`, `slug`, `MonthDataTonnaj`, `DayDataDetailsDrobilka`.
- При **PUT** ключ **objects** удаляется из тела (как у people), чтобы не ломать обновление связи.
- `populate` (поиск): например `populate[DayDataDetailsDrobilka]` и `populate[objects]`.
