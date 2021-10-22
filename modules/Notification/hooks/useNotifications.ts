import { useEffect, useMemo } from 'react';

import { dispatch, ActionType, useStore } from '../store';
import { notification } from '../';
import { DefaultNotificationOptions, Notification, NotificationPosition } from '../types';

export const useNotifications = (notificationOptions?: DefaultNotificationOptions) => {
    const {notifications, pausedAt} = useStore(notificationOptions);

    useEffect(() => {
        if (pausedAt) {
            return;
        }

        const timeoutsList = notifications.map((n) => {
            if (n.duration === Infinity) {
                return;
            }

            const durationLeft = (n.duration || 0) + n.pauseDuration - (Date.now() - n.createdAt);

            if (durationLeft < 0) {
                if (n.visible) {
                    notification.dismiss(n.id);
                }

                return;
            }

            return setTimeout(() => notification.dismiss(n.id), durationLeft);
        });

        return () => {
            timeoutsList.forEach((timeout) => timeout && clearTimeout(timeout));
        };
    }, [notifications, pausedAt]);

    const handlers = useMemo(() => ({
            remove: (notificationId: string) => {
                dispatch({
                    type: ActionType.REMOVE,
                    notificationId: notificationId,
                });
            },
            dismiss: (notificationId: string) => {
                dispatch({
                    type: ActionType.DISMISS,
                    notificationId: notificationId,
                });
            },
            pause: () => {
                dispatch({
                    type: ActionType.PAUSE,
                    time: Date.now(),
                });
            },
            unpause: () => {
                if (pausedAt) {
                    dispatch({ type: ActionType.UNPAUSE, time: Date.now() });
                }
            },
            updateHeight: (notificationId: string, height: number) =>
                dispatch({
                    type: ActionType.UPDATE,
                    notification: { id: notificationId, height },
                }),
            calculateOffset: (
                notification: Notification,
                opts?: {
                    reverseOrder?: boolean;
                    defaultPosition?: NotificationPosition;
                }
            ) => {
                const { reverseOrder = false, defaultPosition } = opts || {};

                const relevantNotifications = notifications.filter(
                    (n) => (n.position || defaultPosition) === (notification.position || defaultPosition) && n.height
                );

                const notificationIndex = relevantNotifications.findIndex((n) => n.id === notification.id);
                const notificationsBefore = relevantNotifications.filter(
                    (notification, i) => i < notificationIndex && notification.visible
                ).length;

                const offset = relevantNotifications
                    .filter((n) => n.visible)
                    .slice(...(reverseOrder ? [notificationsBefore + 1] : [0, notificationsBefore]))
                    .reduce((acc, n) => acc + (n.height || 0), 0);

                return offset;
            },
        }),
        [notifications, pausedAt]
    );

    return {notifications, handlers};
};