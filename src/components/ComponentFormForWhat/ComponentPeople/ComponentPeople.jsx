import styles from './style.module.scss';
import deleteSVG from '/delete.svg';
import useMobile from '../../../hooks/useMobile';
import { Fragment } from 'react';

import {
  CustomInput,
  AddMoreBtn,
  CustomRadio,
  ChooseTimeBtn,
  ComponentDateSingle,
} from '../../../components';
import useDataRequestStore from '../../../store/DataRequestStore';

import { STATUS_CHECKBOXES } from '../../../data.json';
import { toYyyyMmDd } from '../../../utils/toYyyyMmDd';

const DeleteDateItem = ({ id }) => {
  const { data } = useDataRequestStore();
  const userId = data[0]?.documentId;
  const dayDataDetails = data[0]?.DayDataDetails;
  const url = `http://89.111.152.254:1337/api/people/${userId}`;

  const handleClick = async (e) => {
    e.preventDefault();

    if (!window.confirm('Вы точно хотите удалить рабочую смену?')) return;

    // Создаем копию исходных данных
    const updatedDayDataDetails = [...dayDataDetails];

    // Находим и удаляем элемент с соответствующим id
    for (let i = 0; i < updatedDayDataDetails.length; i++) {
      const day = updatedDayDataDetails[i];
      // Проверяем DayInfo
      if (day.DayInfo && day.DayInfo.id === id) {
        // Если удаляем DayInfo, оставляем структуру с null
        updatedDayDataDetails[i] = {
          ...day,
          DayInfo: null,
          NightInfo: day.NightInfo || null,
        };
        break;
      }

      // Проверяем NightInfo
      if (day.NightInfo && day.NightInfo.id === id) {
        // Если удаляем NightInfo, оставляем структуру с null
        updatedDayDataDetails[i] = {
          ...day,
          DayInfo: day.DayInfo || null,
          NightInfo: null,
        };
        break;
      }
    }

    // Фильтруем полностью пустые записи (где и DayInfo и NightInfo null)
    const cleanedDayDataDetails = updatedDayDataDetails
      .filter((day) => day.DayInfo !== null || day.NightInfo !== null)
      .map((day) => ({
        DayInfo: day.DayInfo
          ? {
            Day: day.DayInfo.Day,
            SmenaDetails: {
              SmenaStatusWorker: day.DayInfo.SmenaDetails?.SmenaStatusWorker,
              SmenaDataTonnaj: day.DayInfo.SmenaDetails?.SmenaDataTonnaj,
              Note: day.DayInfo.SmenaDetails?.Note,
              TC: day.DayInfo.SmenaDetails?.TC,
              SmenaDateDetails: day.DayInfo.SmenaDetails?.SmenaDateDetails,
            },
          }
          : null,
        NightInfo: day.NightInfo
          ? {
            Night: day.NightInfo.Night,
            SmenaDetails: {
              SmenaStatusWorker:
                day.NightInfo.SmenaDetails?.SmenaStatusWorker,
              SmenaDataTonnaj: day.NightInfo.SmenaDetails?.SmenaDataTonnaj,
              Note: day.NightInfo.SmenaDetails?.Note,
              TC: day.NightInfo.SmenaDetails?.TC,
              SmenaDateDetails: day.NightInfo.SmenaDetails?.SmenaDateDetails,
            },
          }
          : null,
      }));

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { DayDataDetails: cleanedDayDataDetails },
        }),
      });

      if (!response.ok) throw new Error('Ошибка при обновлении компонента');

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

export default function ComponentPeople({
  handleClickBtn,
  items,
  register,
  errors,
  shiftType,
  popupId,
  dateSearch,
}) {
  const { data } = useDataRequestStore();
  const isMobile = useMobile();

  const pickedYmd = dateSearch ? String(dateSearch).split('T')[0] : '';
  const withIdx = items.map((item, idx) => ({ item, idx }));
  const visibleRows = pickedYmd
    ? withIdx.filter(({ item }) => {
      const key = toYyyyMmDd(item?.SmenaDetails?.SmenaDateDetails);
      return key === pickedYmd;
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

            <div>
              <label
                htmlFor="2"
                style={{ textAlign: 'start', fontWeight: 'medium' }}
              >
                Ост. Порт
              </label>
              <CustomInput
                data={data}
                errors={errors}
                register={register}
                name={'DayDataOstatkiPORT'}
                id={2}
                type="number"
                placeholder="Введите тн."
              />
            </div>

            <div>
              <label
                htmlFor="3"
                style={{ textAlign: 'start', fontWeight: 'medium' }}
              >
                Ост. ГиР
              </label>
              <CustomInput
                data={data}
                errors={errors}
                register={register}
                id={3}
                name={'DayDataOstatkiGIR'}
                type="number"
                placeholder="Введите тн."
              />
            </div>
          </div>
        </div>

        <div className={styles.wrapper_name}>
          <div>
            <label
              htmlFor='4'
              style={{ textAlign: 'start', fontWeight: 'medium' }}
              className={styles.label_name}
            >
              ФИО
            </label>
            <CustomInput
              data={data}
              errors={errors}
              register={register}
              id={4}
              name={'Name'}
              type='text'
              placeholder='Введите ФИО'
            />
          </div>

          <div>
            <label
              htmlFor='5'
              style={{ textAlign: 'start', fontWeight: 'medium' }}
              className={styles.label_name}
            >
              Должность
            </label>
            <CustomInput
              data={data}
              errors={errors}
              register={register}
              id={5}
              name={'Job'}
              type='text'
              placeholder='Введите должность'
            />
          </div>
        </div>

        {visibleRows.map(({ item, idx }) => {
          return (
            <Fragment key={item?.id ?? idx}>
              <div className='flex relative' id={`repeatable-${idx}`}>
                <div className={styles.date_wrapper}>
                  <div className={styles.date_content}>
                    <p>Дата</p>
                    <ComponentDateSingle
                      idx={idx}
                      dateForRender={item?.SmenaDetails?.SmenaDateDetails}
                    />
                  </div>

                  <div className={styles.smena_content}>
                    <p>Смена</p>
                    <div className={styles.smena_btns}>
                      <ChooseTimeBtn
                        idx={idx}
                        register={register}
                        shiftType={shiftType}
                        day={item.Day}
                        night={item.Night}
                        popupId={popupId}
                      />
                    </div>
                  </div>
                  {data ? <DeleteDateItem id={item.id} /> : ''}
                </div>
              </div>

              <div className={styles.data_container}>
                <div className={styles.data}>
                  <p>Данные</p>
                  <div className={styles.data_wrapper}>
                    {STATUS_CHECKBOXES.map((checkbox, index) => (
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
                          ((item?.SmenaDetails?.SmenaStatusWorker || "Default") ===
                            "Default"
                            ? "Worked"
                            : item?.SmenaDetails?.SmenaStatusWorker) ===
                          checkbox.value
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.data_wrapper_custom}>
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

                  <div className={styles.data}>
                    <p style={{ marginBottom: '10px' }}>ТС</p>
                    <CustomInput
                      data={data}
                      item={item}
                      id={7}
                      name={'TC'}
                      errors={errors}
                      register={register}
                      type='text'
                      placeholder='Введите ТС '
                      idx={idx}
                    />
                  </div>
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
            </Fragment>
          );
        })}

        <div style={{ height: '40px', marginTop: '20px' }}>
          <AddMoreBtn onHandleClick={handleClickBtn} title={'Добавить смену'} />
        </div>
      </div>
    </>
  );
}
