import {Renderable, Notification, NotificationOptions, NotificationType, DefaultNotificationOptions} from './types';
import {generateId} from './utils';
import {dispatch, ActionType} from './store';

type Content = Renderable;

type NotificationHandler = (content: Content, options?: NotificationOptions) => string;

const createNotification = (
    content: Content,
    type: NotificationType = 'info',
    opts?: NotificationOptions
): Notification => ({
    createdAt: Date.now(),
    visible: true,
    type,
    ariaProps: {
        role: 'status',
        'aria-live': 'polite'
    },
    content,
    pauseDuration: 0,
    ...opts,
    id: opts?.id || generateId()
});

const createHandler = (type?: NotificationType): NotificationHandler => (content, options) => {
    const notification = createNotification(content, type, options);

    dispatch({ type: ActionType.UPSERT, notification });

    return notification.id;
};

const notification = (content: Content, opts?: NotificationOptions) => createHandler('info')(content, opts);

notification.info = createHandler('info');
notification.error = createHandler('error');
notification.success = createHandler('success');
notification.loading = createHandler('loading');

notification.dismiss = (notificationId?: string) => {
    dispatch({
        type: ActionType.DISMISS,
        notificationId,
    });
};

notification.remove = (notificationId?: string) =>
    dispatch({ type: ActionType.REMOVE, notificationId });

notification.promise = <N>(
    promise: Promise<N>,
    promise_contents: {
        info: Renderable,
        loading: Renderable;
        success: Renderable;
        error: Renderable;
    },
    promise_options?: DefaultNotificationOptions
) => {
    const id = notification.loading(promise_contents.loading, { ...promise_options, ...promise_options?.loading });

    promise
        .then((p) => {
            notification.success(promise_contents.success, {
                id,
                ...promise_options,
                ...promise_options?.success
            });
            return p;
        })
        .catch((e) => {
            notification.error(promise_contents.error, {
                id,
                ...promise_options,
                ...promise_options?.error
            });
        });

    return promise;
};

export {notification};