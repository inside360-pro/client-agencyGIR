import styles from './style.module.scss';
import { format } from 'date-fns';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);


export default function CustomInput({
  data = [],
  placeholder = 'Введите текст...',
  type = 'text',
  id = '',
  register = () => { },
  errors = {},
  name = 'input',
  hidden = false,
  item = {},
  idx
}) {

  /**
   * TODO: по хорошему это вынести в store чтобы оттуда дергать, но мне лень - я тюлень
   */ 

  let currentDate = format(new Date(), 'MM.yyyy', { locale: ru });

  const workerData = data[0] || {};
  const smenaDetails = item?.SmenaDetails || {};

  let { MonthDataTonnaj = [] } = workerData || {};

  if (workerData !== undefined) { 
    MonthDataTonnaj = workerData.MonthDataTonnaj
      ?.map(i => {
        try {
          if (!i.MonthData) return null;
          const [day, month, year] = i.MonthData.split('.').map(Number);
          const dateObj = new Date(year, month - 1, day);
          if (isNaN(dateObj.getTime())) return null;
          const itemDate = format(dateObj, 'MM.yyyy', { locale: ru });
          if (itemDate === currentDate) {
            return {
              ...i,
              AmountData: i.AmountData,
              MonthDataTonnaj: day + itemDate 
            };
          }
          return null;
        } catch (error) {
          console.error('Error processing date:', error);
          return null;
        }
      })
      ?.filter(Boolean) || [];
  }

  const {
    Name = '',
    Job = '',
    DayDataOstatki = []
  } = workerData;

  const {
    Note: note = '',
    Order: order = '',
    SmenaDataTonnaj: smenaDataTonnaj = '',
    SmenaDateDetails: smenaDateDetails = '',
    TC: tc = ''
  } = smenaDetails;


  // Получение значений с проверкой вложенных свойств
  const getValue = () => {
    switch (name) {
      case 'AmountData':
        if (MonthDataTonnaj !== undefined) {
          return MonthDataTonnaj[0]?.AmountData
        };

        break;
      case 'Name':
        return Name;

      case 'Job':
        return Job;

      case 'DayDataOstatkiGIR':
        return DayDataOstatki[0]?.DayDataOstatkiGIR || '';

      case 'DayDataOstatkiPORT':
        return DayDataOstatki[0]?.DayDataOstatkiPORT || '';

      case 'smenaDateDetails':
        return smenaDateDetails;

      case 'TC':
        return tc;

      case 'DayDataTonnaj':
        return item?.DayDataDetailsTonnaj ?? smenaDataTonnaj;

      case 'note':
        return item?.note ?? note;
      
      case 'order':
        return order;

      default:
        return '';
    }
  };

  const value = getValue();
  
  return (
    <div className={styles.input_container}>
      <input
        id={id}
        className={styles.custom_input}
        type={type}
        hidden={hidden}
        placeholder={value ? String(value) : placeholder}
        defaultValue={value ? value : ''}
        {...(
          typeof idx !== 'undefined' 
            ? register(`${name}.${idx}`, {
              })
            : register(name)
        )}
      />


      {errors[name] && (
        <span className={styles.error}>
          {errors[name].message}
        </span>
      )}
    </div>
  );
}