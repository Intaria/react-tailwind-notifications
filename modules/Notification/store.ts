import {useEffect, useState} from 'react';
import {DefaultNotificationOptions, Notification, NotificationType} from './types';

const NOTIFICATIONS_LIMIT = 10;

export enum ActionType {
    ADD,
    UPDATE,
    UPSERT,
    DISMISS,
    REMOVE,
    PAUSE,
    UNPAUSE,
}

type Action = | {
    type: ActionType.ADD;
    notification: Notification;
} | {
    type: ActionType.UPSERT;
    notification: Notification;
} | {
    type: ActionType.UPDATE;
    notification: Partial<Notification>;
} | {
    type: ActionType.DISMISS;
    notificationId?: string;
} | {
    type: ActionType.REMOVE;
    notificationId?: string;
} | {
    type: ActionType.PAUSE;
    time: number;
} | {
    type: ActionType.UNPAUSE;
    time: number;
};

interface State {
    notifications: Notification[];
    pausedAt: number | undefined;
}

const notificationTimeouts = new Map<Notification['id'], ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (notificationId: string) => {
    if (notificationTimeouts.has(notificationId)) {
        return;
    }

    const timeout = setTimeout(() => {
        notificationTimeouts.delete(notificationId);
        dispatch({
            type: ActionType.REMOVE,
            notificationId: notificationId,
        });
    }, 1000);

    notificationTimeouts.set(notificationId, timeout);
};

const clearFromRemoveQueue = (notificationId: string) => {
    const timeout = notificationTimeouts.get(notificationId);

    if (timeout) {
        clearTimeout(timeout);
    }
};

export const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case ActionType.ADD:
            return {
                ...state,
                notifications: [action.notification, ...state.notifications].slice(0, NOTIFICATIONS_LIMIT),
            };

        case ActionType.UPDATE:
            if (action.notification.id) {
                clearFromRemoveQueue(action.notification.id);
            }

            return {
                ...state,
                notifications: state.notifications.map((n) =>
                    n.id === action.notification.id ? { ...n, ...action.notification } : n
                ),
            };

        case ActionType.UPSERT:
            const { notification } = action;
            return state.notifications.find((n) => n.id === notification.id)
                ? reducer(state, { type: ActionType.UPDATE, notification })
                : reducer(state, { type: ActionType.ADD, notification });

        case ActionType.DISMISS:
            const { notificationId } = action;

            // Возможно, стоит вынести логику в  dismissNotification
            if (notificationId) {
                addToRemoveQueue(notificationId);
            }
            else {
                state.notifications.forEach((notification) => {
                    addToRemoveQueue(notification.id);
                });
            }

            return {
                ...state,
                notifications: state.notifications.map((n) =>
                    n.id === notificationId || notificationId === undefined
                        ? {
                            ...n,
                            visible: false,
                        }
                        : n
                ),
            };
        case ActionType.REMOVE:
            if (action.notificationId === undefined) {
                return {
                    ...state,
                    notifications: [],
                };
            }

            return {
                ...state,
                notifications: state.notifications.filter((n) => n.id !== action.notificationId),
            };

        case ActionType.PAUSE:
            return {
                ...state,
                pausedAt: action.time,
            };

        case ActionType.UNPAUSE:
            const diff = action.time - (state.pausedAt || 0);

            return {
                ...state,
                pausedAt: undefined,
                notifications: state.notifications.map((n) => ({
                    ...n,
                    pauseDuration: n.pauseDuration + diff,
                })),
            };
    }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { notifications: [], pausedAt: undefined };

export const dispatch = (action: Action) => {
    memoryState = reducer(memoryState, action);

    listeners.forEach((listener) => {
        listener(memoryState);
    });
};

const defaultTimeouts: {
    [key in NotificationType]: number;
} = {
    success: 4000,
    info: 4000,
    error: 4000,
    loading: Infinity
};

export const useStore = (notificationOptions: DefaultNotificationOptions = {}): State => {
    const [state, setState] = useState<State>(memoryState);
    useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);

            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [state]);

    const mergedNotifications = state.notifications.map((n) => ({
        ...notificationOptions,
        ...notificationOptions[n.type],
        ...n,
        duration: n.duration || notificationOptions[n.type]?.duration || notificationOptions?.duration || defaultTimeouts[n.type]
    }));

    return {
        ...state,
        notifications: mergedNotifications,
    };
};