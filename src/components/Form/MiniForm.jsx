import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import PropTypes from 'prop-types';
import styles from './style.module.scss';
import { updateDataTonnajService } from '../../services/update-object-service';
import useDataObjectRequestStore from '../../store/DataObjectRequestStore';
import { format } from 'date-fns';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import {
    BtnSave,
    ComponentTonnajMini,
    ModalNotification,
} from '../../components';


export async function checkExistingRecord(uuid, url) {
    if (!uuid) return null;

    try {
        const response = await fetch(`${url}?filters[uuid][$eq]=${encodeURIComponent(String(uuid))}`);
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            console.error('Ошибка при проверке записи:', result?.error || result);
            return null;
        }
        return result?.data?.length > 0 ? result.data[0]?.documentId : null;
    } catch (error) {
        console.error('Ошибка:', error);
        return null;
    }
}

export async function saveUserDateService(userData, url) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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

export default function MiniForm() {

    const [, setError] = useState();
    const [formValues, setFormValues] = useState({});
    const [isSending, setIsSending] = useState(false);
    const { dataObject } = useDataObjectRequestStore();
    const [modalNotification, setModalNotification] = useState(false);
    const [modalNotificationText, setModalNotificationText] = useState(false);
    const [modalNotificationVariant, setModalNotificationVariant] = useState('info');


    // let currentMonthYear = format(new Date(), 'MM.yyyy', { locale: ru });

    const { register, control, handleSubmit, formState: { errors }, reset } = useForm();

    // Правильное определение формата


    const amountDataObject = useWatch({ control, name: 'AmountDataObject' });
    const dayDataObjectOstatkiPORT = useWatch({ control, name: 'DayDataObjectOstatkiPORT' });
    const dayDataObjectOstatkiGIR = useWatch({ control, name: 'DayDataObjectOstatkiGIR' });

    const objectUUID = dataObject[0]?.uuid

    useEffect(() => {
        if (dataObject && dataObject[0]) {
            const newFormDefault = {
                Name: dataObject[0].Name || "",
                
                MonthDataObjectTonnaj: dataObject[0]?.MonthDataObjectTonnaj
                    ?.map(m => {
                        if (m && m.MonthDataObject !== '0' && m.MonthDataObject !== undefined && m.MonthData !== null) {
                            const [day, month, year] = m.MonthDataObject.split('.').map(Number);
                            const dateObj = new Date(year, month - 1, day);
                            const itemDate = format(dateObj, 'dd.MM.yyyy', { locale: ru });
                            if (itemDate) {
                                return {
                                    ...m,
                                    MonthDataObject: m.MonthDataObject
                                };
                            }
                        } else {
                            console.log(false)
                        }
                        return null;
                    })
                    ?.filter(Boolean) || [],
                 workers: dataObject[0]?.workers
            }

            reset(newFormDefault);
            setFormValues(newFormDefault);

        }
    }, [dataObject, reset]);    

    let currentMonthYear = format(new Date(), 'MM.yyyy', { locale: ru });

    const onSubmit = async () => {
        setIsSending(true);
        setError(null);
        setModalNotification(true);
        setModalNotificationText("Отправка...");
        setModalNotificationVariant('loading');
        let formData = {};
        let url = '';
        try {

            url = 'http://89.111.152.254:1337/api/objects'

            formData = {
                MonthDataObjectTonnaj: [
                    // 1. Удаляем записи ТОЛЬКО текущего месяца
                    ...(formValues.MonthDataObjectTonnaj?.filter(item => {
                        const [, month, year] = item.MonthDataObject.split('.');
                        return `${month}.${year}` !== currentMonthYear;
                    }).map((item) => {
                        const rest = { ...item };
                        delete rest.id;
                        return rest;
                    }) || []),

                    ...(amountDataObject !== "0" ? [{
                        MonthDataObject: format(new Date(), 'dd.MM.yyyy', { locale: ru }),
                        AmountDataObject: amountDataObject ?? '0',
                        DayDataObjectOstatkiPORT: dayDataObjectOstatkiPORT ?? '0',
                        DayDataObjectOstatkiGIR: dayDataObjectOstatkiGIR ?? '0',
                    }] : [])
                ]
                  // Сортировка по дате (если нужна)
                    .sort((a, b) => new Date(
                        a.MonthDataObject.split('.').reverse().join('-')
                    ) - new Date(
                        b.MonthDataObject.split('.').reverse().join('-')
                    )),
            };


            try {
                const existingRecordId = await checkExistingRecord(objectUUID, url);
                let response;

                if (existingRecordId) {
                    response = await updateDataTonnajService(

                        existingRecordId,
                        formData,
                        url
                    );
                    if (response.status === 200) {
                        setModalNotification(true); 
                        setModalNotificationText('Форма отправлена ✅ Данные обновлены');
                        setModalNotificationVariant('success');
                        reset();
                    }
                    console.log('Данные обновлены:', formData);

                } else {
                    setModalNotification(true); 
                    setModalNotificationText('Форма отправлена ✅ Создана новая сущность');
                    setModalNotificationVariant('success');
                    response = await saveUserDateService(formData, url);
                    console.log('Новая запись создана:', response, formData);
                }

            } catch (error) {
                setModalNotification(true);
                setModalNotificationText(String(error?.message || 'Ошибка запроса, попробуйте позже'));
                setModalNotificationVariant('error');
            } finally {
                setIsSending(false);
            }
        } catch (error) {
            console.log(error)
            setModalNotification(true);
            setModalNotificationText(String(error?.message || 'Ошибка запроса, попробуйте позже'));
            setModalNotificationVariant('error');
            setIsSending(false);
        }
    }
        

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.form_wrapper}>
                    <div className={styles.form_header}>
                        <h2 className={styles.form_title}>
                            {dataObject[0]?.Name ?? ''}
                        </h2>

                        <div className={styles.form_title_info}>
                            <div className={styles.btn_save_wrapper}>
                                <BtnSave isSending={isSending} />
                            </div>
                        </div>
                    </div>

                    <ComponentTonnajMini
                        data={dataObject}
                        errors={errors}
                        register={register}
                    />
                    
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
    )
}

MiniForm.propTypes = {
    title: PropTypes.string,
    forWhat: PropTypes.string,
    setActive: PropTypes.func,
    popupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};