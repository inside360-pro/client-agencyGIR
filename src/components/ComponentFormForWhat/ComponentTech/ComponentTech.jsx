import styles from './style.module.scss';
import deleteSVG from '/delete.svg';

import useDataRequestStore from '../../../store/DataRequestStore';
import { toYyyyMmDd } from '../../../utils/toYyyyMmDd';
import {
  CustomInput,
  AddMoreBtn,
  CustomRadio,
  ChooseTimeBtn,
  ComponentDateSingle,
} from '../../../components';

const STATUS_CHECKBOXES = [
  {
    value: 'In working|',
    label: 'В работе',
    id: 'checkboxinworking',
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
  const dayDataDetails = data[0]?.DayDataTechnicaDetails || [];

  const url = `http://89.111.152.254:1337/api/techicas/${userId}`;

  const handleClick = async (e) => {
    e.preventDefault();

    if (!window.confirm('Вы точно хотите удалить рабочую смену?')) return;

    if (!userId) return;
    const targetId = String(id);
    const cleanedDayDataDetails = dayDataDetails
      .filter((row) => String(row?.id) !== targetId)
      .map((row) => {
        const cleaned = {
          DayDataTechnicaDetails: row?.DayDataTechnicaDetails,
          Day: Boolean(row?.Day),
          Nigth: Boolean(row?.Nigth),
          statusTech: row?.statusTech,
          note: row?.note,
        };
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
          data: { DayDataTechnicaDetails: cleanedDayDataDetails },
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

export default function ComponentTech({
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
          item?.DayDataTechnicaDetails || item?.date;
        return toYyyyMmDd(raw) === pickedYmd;
      })
    : withIdx;

  const normalizeDateForUi = (value) => {
    if (!value) return value;
    if (value instanceof Date) return value;
    const str = String(value);
    if (str.includes(".")) return str;
    if (str.includes("-")) {
      // yyyy-mm-dd or yyyy-mm-ddTHH:mm:ss...
      const [yyyy, mm, dd] = str.split("T")[0].split("-");
      if (yyyy && mm && dd) return `${dd}.${mm}.${yyyy}`;
    }
    return str;
  };

  return (
    <>
      <div className={styles.item_row}>
        <div className={styles.wrapper_name}>
          <div>
            <label
              htmlFor='4'
              style={{ textAlign: 'start', fontWeight: 'medium' }}
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

          <div>
            <label
              htmlFor='5'
              style={{ textAlign: 'start', fontWeight: 'medium' }}
            >
              Порядковый №
            </label>
            <CustomInput
              data={data}
              errors={errors}
              register={register}
              id={5}
              name={'Order'}
              type='text'
              placeholder='Введите номер'
            />
          </div>
        </div>

        {visibleRows.map(({ item, idx }) => {
          return (
            <div key={item?.id ?? `tech-row-${idx}`}>
              <div className='flex relative' id={`repeatable-${idx}`}>
                <div className={styles.date_wrapper}>
                  <div className={styles.date_content}>
                    <p>Дата</p>
                    <ComponentDateSingle
                      idx={idx}
                      dateForRender={
                        normalizeDateForUi(item?.DayDataTechnicaDetails) ||
                        item?.date
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
                        day={item?.Day ?? item?.day}
                        night={item?.Nigth ?? item?.night}
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
                          (item?.statusTech ?? 'In working|') === checkbox.value
                        }
                      />
                    ))}
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
