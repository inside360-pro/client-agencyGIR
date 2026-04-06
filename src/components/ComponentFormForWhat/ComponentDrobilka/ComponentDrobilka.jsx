import styles from './style.module.scss';
import deleteSVG from '/delete.svg';

import {
  CustomInput,
  AddMoreBtn,
  CustomRadio,
  ChooseTimeBtn,
  ComponentDateSingle,
} from '../../../components';
import useDataRequestStore from '../../../store/DataRequestStore';
import { toYyyyMmDd } from '../../../utils/toYyyyMmDd';

const STATUS_CHECKBOXES = [
  {
    value: 'In working',
    label: 'В работе',
    id: 'checkboxworking',
  },
  {
    value: 'Repair/to',
    label: 'Ремонт/ТО',
    id: 'checkboxrepairto',
  },
  {
    value: 'No Coal (OC)',
    label: 'Отсутствие угля (О/У)',
    id: 'checkboxnocoal',
  },
  {
    value: 'Stock',
    label: 'Запас',
    id: 'checkboxstock',
  },
];

const DeleteDateItem = ({ id }) => {
  const { data } = useDataRequestStore();
  const userId = data[0]?.documentId;
  const dayDataDetails = data[0]?.DayDataDetailsDrobilka || [];
  const url = `http://89.111.152.254:1337/api/drobilkas/${userId}`;

  const handleClick = async (e) => {
    e.preventDefault();

    if (!window.confirm('Вы точно хотите удалить рабочую смену?')) return;
    if (!userId) return;

    const targetId = String(id);
    const cleanedDayDataDetails = dayDataDetails
      .filter((row) => String(row?.id) !== targetId)
      .map((row) => {
        const cleaned = {
          Day: Boolean(row?.Day),
          Night: Boolean(row?.Night),
          statusDrobilka: row?.statusDrobilka,
          note: row?.note,
          DayDataDetailsTonnaj: row?.DayDataDetailsTonnaj,
          DayDataDetailsDrobilka: row?.DayDataDetailsDrobilka,
        };

        // вычищаем undefined, чтобы Strapi не ругался на ключи/значения
        Object.keys(cleaned).forEach((k) => cleaned[k] === undefined && delete cleaned[k]);
        return cleaned;
      });

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { DayDataDetailsDrobilka: cleanedDayDataDetails },
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error?.message || 'Ошибка при обновлении компонента');
      }

      alert('Рабочая смена удалена');
      window.location.reload();
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  return (
    <button
      className={styles.delete_section}
      aria-current
      onClick={handleClick}
    >
      <img src={deleteSVG} alt='deleteSVG' width={15} height={15} />
    </button>
  );
};

export default function ComponentDrobilka({
  handleClickBtn,
  items,
  register,
  errors,
  shiftType,
  popupId,
  dateSearch,
}) {
  const { data } = useDataRequestStore();
  const pickedYmd = dateSearch ? String(dateSearch).split('T')[0] : '';
  const withIdx = items.map((item, idx) => ({ item, idx }));
  const visibleRows = pickedYmd
    ? withIdx.filter(({ item }) => {
        const raw =
          item?.DayDataDetailsDrobilka ||
          item?.SmenaDetails?.SmenaDateDetails;
        return toYyyyMmDd(raw) === pickedYmd;
      })
    : withIdx;

  return (
    <>
      <div>
        <div className={styles.form_content}>
          <p className={styles.form_title_content}>Тоннаж месяц</p>
          <div className={styles.wrapper_input}>
            <div>
              <label
                htmlFor="1"
                style={{ textAlign: 'start', fontWeight: 'medium' }}
              >
                Тоннаж выставили
              </label>
              <CustomInput
                data={data}
                errors={errors}
                register={register}
                name={'AmountData'}
                id={1}
                type="number"
                placeholder="Введите тн."
              />
            </div>
          </div>
        </div>

        <div className={styles.wrapper_name}>
          <label
            htmlFor='4'
            style={{ textAlign: 'start', fontWeight: 'medium' }}
            className={styles.label_name}
          >
            Наименование
          </label>
          <CustomInput
            data={data}
            errors={errors}
            register={register}
            id={4}
            name={'Name'}
            type='text'
            placeholder='Введите наименование'
          />
        </div>

        {visibleRows.map(({ item, idx }) => {
          return (
            <div className={styles.item_row} key={item?.id ?? `drobilka-row-${idx}`}>
              <div className='flex relative' id={`repeatable-${idx}`}>
                <div className={styles.date_wrapper}>
                  <div className={styles.date_content}>
                    <p>Дата</p>
                    <ComponentDateSingle
                      idx={idx}
                      dateForRender={
                        item?.DayDataDetailsDrobilka ||
                        item?.SmenaDetails?.SmenaDateDetails
                      }
                    />
                  </div>

                  <div className={styles.smena_content}>
                    <p>Смена</p>
                    <div className={styles.smena_btns}>
                      <ChooseTimeBtn
                        idx={idx}
                        register={register}
                        shiftType={shiftType}
                        day={item?.Day}
                        night={item?.Night}
                        popupId={popupId}
                      />
                    </div>
                  </div>
                  {data?.length > 0 && item?.id ? <DeleteDateItem id={item.id} /> : ''}

                </div>
              </div>

              <div className={styles.data_container}>
                <div className={styles.data}>
                  <p>Данные</p>
                  <div className={styles.data_wrapper}>
                    {STATUS_CHECKBOXES.map((checkbox, index) => {
                      return (
                        <CustomRadio
                          data={data}
                          key={`${checkbox.id}-${index}`}
                          name={`${'statusWorker'}.${idx}`}
                          register={register}
                          type='radio'
                          value={checkbox.value}
                          label={checkbox.label}
                          checkboxId={`${checkbox.id}.${idx}`}
                          idx={idx}
                          defaultChecked={
                            ((item?.statusDrobilka ?? "In working") ||
                              item?.SmenaDetails?.SmenaStatusWorker) ===
                            checkbox.value
                          }
                        />
                      );
                    })}
                  </div>
                </div>

                <div className={styles.data}>
                  <p style={{ marginBottom: '10px' }}>Тоннаж</p>
                  <CustomInput
                    data={data}
                    item={item}
                    id={6}
                    name={'DayDataTonnaj'}
                    errors={errors}
                    register={register}
                    type='number'
                    placeholder='Введите тн. '
                    idx={idx}
                  />
                </div>
              </div>

              <div className={styles.note}>
                <p>Примечание</p>
                <CustomInput
                  data={data}
                  item={item}
                  id={8}
                  name={'note'}
                  errors={errors}
                  register={register}
                  type='text'
                  placeholder='Введите примечание'
                  idx={idx}
                />
              </div>
            </div>
          );
        })}

        <div style={{ height: '40px', marginTop: '20px' }}>
          <AddMoreBtn onHandleClick={handleClickBtn} title={'Добавить смену'} />
        </div>
      </div>
    </>
  );
}
