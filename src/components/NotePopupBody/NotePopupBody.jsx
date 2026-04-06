import styles from './style.module.scss';

export default function NoteBody({ id, active, setActive, worker, data }) {
    const job = worker?.Job;
    const order = worker?.Order;
    const name = worker?.Name;

    const createdAt = data?.createdAt;
    const documentId = data?.documentId;

    const normalizeDateForUi = (value) => {
        if (!value) return value;
        if (value instanceof Date) return value.toLocaleDateString('ru-RU');
        const str = String(value);
        if (str.includes('.')) return str;
        if (str.includes('-')) {
            const [yyyy, mm, dd] = str.split('T')[0].split('-');
            if (yyyy && mm && dd) return `${dd}.${mm}.${yyyy}`;
        }
        return str;
    }

    const dateWorkered =
      data?.SmenaDetails?.SmenaDateDetails ||
      data?.DayDataDetailsDrobilka ||
      normalizeDateForUi(data?.DayDataTechnicaDetails) ||
      data?.date;

    const note = data?.SmenaDetails?.Note || data?.note;

    const smenaDataTonnaj = data?.SmenaDetails?.SmenaDataTonnaj || data?.DayDataDetailsTonnaj;
    const smenaStatusWorker =
      data?.SmenaDetails?.SmenaStatusWorker ||
      data?.statusTech ||
      data?.statusDrobilka ||
      'In working';

    let smenaRussian = ''

    switch (smenaStatusWorker) {
        case 'Default':
            smenaRussian = 'Работал'
            break;

        case 'Not working':
            smenaRussian = "Не работал"
            break;

        case 'Day Off':
            smenaRussian = "Выходной"
            break;

        case 'Repair/to':
            smenaRussian = "В ремонте"
            break;

        case 'No Coal (OC)':
            smenaRussian = "Отсутствие угля"
            break;

        case 'Stock':
            smenaRussian = "Запас"
            break;

        case 'In working':
            smenaRussian = "В работе"
            break;

        case 'In working|':
            smenaRussian = "В работе"
            break;

        case 'Empty':
            smenaRussian = "Пусто"
            break;
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
            setActive(false);
        }
    }

    return (

        <div
            id={id}
            className={`${styles.popup} ${active ? styles.popupActive : styles.popupNone}`}
            onClick={() => setActive(false)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <div className={`${styles.popup__body} ${styles.popup__body__note}`} id={id}>

                <div
                    className={styles.popup__content}
                    onClick={e => e.stopPropagation()}
                >

                    <button
                        className={styles.popup__close}
                        onClick={() => { setActive(false) }}
                    >
                        <svg width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="18.4463" width="21.8033" height="0.726776" rx="0.363388" transform="rotate(-45 3 18.4463)" fill="#2a3a57" />
                            <rect x="4.21094" y="3" width="21.8033" height="0.726776" rx="0.363388" transform="rotate(45 4.21094 3)" fill="#2a3a57" />
                        </svg>
                    </button>
                    <div>
                        <h3 className={styles.name_worker_name}>{name}</h3>
                        <p className={styles.name_worker_job}>{job || order}</p>
                        <p className={styles.name_worker_date}>{dateWorkered}</p>

                        <p className={styles.name_worker_status}>{smenaRussian}</p>

                        <div className={styles.name_worker_note}>
                            <p className={styles.note_title}>Примечание</p>
                            <div className={styles.name_worker_note_back}>
                                <p className=''>{note}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}