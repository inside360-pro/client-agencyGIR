import styles from './style.module.scss';


const Dashboard = () => {
    return (
        <div className={styles.page_wrapper}>
            <div className="container">
                <div>
                    <h1 className={styles.title}>Dashboard</h1>
                    <p>Это защищенный роут только для зарегистрированных пользователей</p>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;