import styles from './style.module.scss';

export default function CustomRadio({
    defaultChecked = false,
    hidden = false,
    checkboxId,
    register,
    label,
    value,
    name,
    data,
    idx,
}) {



    // const getCurrentStatus = () => {
    //     const dayDetail = data[0]?.DayDataDetails?.[idx] || data[0]?.DayDataDetails;
        
    //     return dayDetail?.DayInfo?.SmenaDetails?.SmenaStatusWorker
    //         || dayDetail?.NightInfo?.SmenaDetails?.SmenaStatusWorker
    //         || dayDetail?.NightInfo?.statusTech
    //         || dayDetail?.DayInfo?.statusTech;
    // };

    //  // Определяем checked состояние
    // const isChecked = getCurrentStatus() === value;
    
    return (
        <div className={styles.item}>
              <input 
                name={name}
                type={'radio'} 
                id={checkboxId}
                value={value}
                hidden={hidden}
                defaultChecked={defaultChecked}
                {...(
                    typeof idx !== 'undefined' 
                        ? register(name, {
                            validate: v => v?.toString().trim() !== '' || 'Поле не может быть пустым'
                          })
                        : register(name)
                )}
            />
            <label 
                htmlFor={checkboxId}
                hidden={hidden}
            >
                {label}
            </label>
        </div>
    );
}