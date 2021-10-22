import { CSSProperties } from 'react';
export type NotificationType = 'info' | 'error' | 'success' | 'loading';
export type NotificationPosition = | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type Renderable = JSX.Element | string | null;

export interface Notification {
    type: NotificationType;
    id: string;
    content: Renderable;
    duration?: number;
    pauseDuration: number;
    position?: NotificationPosition;
    ariaProps: {
        role: 'status' | 'alert';
        'aria-live': 'assertive' | 'off' | 'polite';
    };
    style?: CSSProperties;
    className?: string;
    createdAt: number;
    visible: boolean;
    height?: number;
}

export type NotificationOptions = Partial<
    Pick<Notification, | 'id' | 'duration' | 'ariaProps' | 'className' | 'position'>
>;

export type DefaultNotificationOptions = NotificationOptions & {
    [key in NotificationType]?: NotificationOptions;
};