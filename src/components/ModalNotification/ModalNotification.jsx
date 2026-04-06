import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './style.module.scss';
import { motion } from 'framer-motion';

export default function ModalNotification({
    active = false,
    text,
    durationMs = 3000,
    variant = 'info',
    onClose,
}) {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef(null);
    const closeTimeoutRef = useRef(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

        if (!active) {
            setProgress(0);
            return;
        }

        setProgress(0);

        // durationMs <= 0: режим "отправка" — бесконечный прогресс до 90%
        if (Number(durationMs) <= 0) {
            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    const next = Math.min(90, prev + 3);
                    if (next >= 90 && intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    return next;
                });
            }, 50);

            return () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            };
        }

        const stepMs = 30;
        const step = 100 / Math.max(1, Math.round(Number(durationMs) / stepMs));

        intervalRef.current = setInterval(() => {
            setProgress((prev) => {
                const next = Math.min(100, prev + step);
                return next;
            });
        }, stepMs);

        closeTimeoutRef.current = setTimeout(() => {
            onCloseRef.current?.();
        }, Number(durationMs) + 250);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, [active, durationMs]);

    return (
        <motion.div
            className={`${styles.modalNotificationWrapper} ${active ? styles.active : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: active ? 1 : 0,
                x: active ? 0 : 1000
            }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.modalContent}>
                {text}
                <div
                    className={styles.progressBar}
                    style={{
                        width: `${progress}%`,
                        background:
                            variant === 'error'
                                ? '#E5484D'
                                : variant === 'success'
                                    ? '#2DA44E'
                                    : '#0070f3',
                    }}
                />
            </div>
        </motion.div>
    );
}

ModalNotification.propTypes = {
    active: PropTypes.bool,
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    durationMs: PropTypes.number,
    variant: PropTypes.oneOf(['info', 'loading', 'success', 'error']),
    onClose: PropTypes.func,
};