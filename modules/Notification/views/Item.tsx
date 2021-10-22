import React from 'react';

import {Notification, NotificationType, NotificationPosition} from '../types';

interface NotificationItemProps {
    notification: Notification;
    position?: NotificationPosition;
}

const getAnimationStyle = (visible: boolean): React.CSSProperties => {
    return {
        animation: visible ? `0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `0.4s forwards cubic-bezier(.06,.71,.55,1)`
    };
};

const typesClassList: {
    [key in NotificationType]: string;
} = {
    success: 'tw-bg-green-100 tw-text-green-700 tw-border-green-500',
    info: 'tw-bg-white tw-border-white',
    error: 'tw-bg-red-100 tw-text-red-700 tw-border-red-500',
    loading: 'tw-bg-white tw-border-white'
};

export const NotificationItem: React.FC<NotificationItemProps> = React.memo(
    ({ notification, position }) => {
        const animationStyle: React.CSSProperties = notification?.height ? getAnimationStyle(notification.visible) : { opacity: 0 };

        //Добавить в будущем определение иконки И связать её с промисными уведомлениями (индикатор загрузки -> успех/фейл)
        //Добавить возможность указать кнопку закрытия отдельным параметром (по умолчанию все уведолмение = кнопка закрытия
        return (
            <div
                className={typesClassList[notification.type] + (notification.visible ? ' tw-animate-enter' : 'tw-animate-leave') + ' tw-w-full tw-shadow tw-rounded-md tw-border tw-pointer-events-auto tw-flex tw-space-x-2 tw-py-5 tw-px-6 tw-font-medium tw-cursor-pointer'}
                style={{
                    ...animationStyle,
                    ...notification.style
                }}
            >
                <div>{notification.content}</div>
            </div>
        );
    }
);
