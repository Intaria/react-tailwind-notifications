import * as React from 'react';

import {useNotifications} from '../hooks/useNotifications';
import {NotificationItem} from './Item';
import {NotificationPosition, DefaultNotificationOptions} from '../types';
import {createRectRef} from '../utils';

const getPositionStyle = (position: NotificationPosition, offset: number): React.CSSProperties => {
    const top = position.includes('top');

    return {
        transform: `translateY(${offset * (top ? 1 : -1)}px)`,
        transition: `all 230ms cubic-bezier(.21,1.02,.73,1)`
    };
};

interface NotificationContainerProps {
    position?: NotificationPosition;
    notificationOptions?: DefaultNotificationOptions;
    reverseOrder?: boolean;
    containerClassName?: string;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
    reverseOrder,
    position = 'bottom-right',
    notificationOptions,
    containerClassName,
}) => {
    const { notifications, handlers } = useNotifications(notificationOptions);

    return (
        <div className={containerClassName} onMouseEnter={handlers.pause} onMouseLeave={handlers.unpause}>
            {notifications.map((n) => {
                const notificationPosition = n.position || position;
                const offset = handlers.calculateOffset(n, {
                    reverseOrder,
                    defaultPosition: position,
                });
                const positionStyle = getPositionStyle(notificationPosition, offset);

                const ref = n.height
                    ? undefined
                    : createRectRef((rect) => {
                        handlers.updateHeight(n.id, rect.height);
                    });


                //Переделать в будущем див-контейнер с кликером на пробрасываемый параметр в NotificationItem
                return (
                    <div
                        ref={ref}
                        className={(n.visible ? '' : '') + ' tw-absolute tw-inset-x-0 tw-bottom-0 tw-flex tw-py-2 tw-px-4'}
                        key={n.id}
                        style={positionStyle}
                    >
                        <div onClick={() => handlers.dismiss(n.id)} className="tw-w-full">
                            <NotificationItem notification={n} position={notificationPosition} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};