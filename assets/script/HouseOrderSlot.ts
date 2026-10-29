
import {
    _decorator,
    Component,
    Node,
    Vec3,
    isValid,
} from 'cc';

import { OrderNotification } from './OrderNotification';

const { ccclass, property } = _decorator;

@ccclass('HouseOrderSlot')
export class HouseOrderSlot extends Component {

    @property
    notificationOffsetY = 150;

    @property
    cooldownDuration = 3;

    notification: Node | null = null;
    cooldownRemaining = 0;

    update(dt: number) {
        if (this.cooldownRemaining > 0) {
            this.cooldownRemaining = Math.max(
                0,
                this.cooldownRemaining - dt
            );
        }

        this.validateNotification();
    }

    private validateNotification() {
        if (!this.notification) {
            return;
        }

        if (!isValid(this.notification)) {
            this.notification = null;
            return;
        }

        const order = this.notification.getComponent(
            OrderNotification
        );

        // Tetap kunci slot selama notif belum dijawab.
        if (order?.isAnswered) {
            this.notification = null;
            this.cooldownRemaining = Math.max(
                this.cooldownRemaining,
                this.cooldownDuration
            );
        }
    }

    canSpawn(): boolean {
        this.validateNotification();

        return (
            this.notification === null &&
            this.cooldownRemaining <= 0
        );
    }

    assignNotification(notification: Node): boolean {
        this.validateNotification();

        // Tolak notif baru jika slot masih sibuk.
        if (
            this.notification !== null ||
            this.cooldownRemaining > 0
        ) {
            return false;
        }

        // Kunci slot sebelum memasang notif.
        this.notification = notification;

        notification.setParent(this.node);
        notification.setPosition(
            new Vec3(0, this.notificationOffsetY, 0)
        );

        return true;
    }

    completeOrder(notification?: Node): boolean {
        const current = this.notification;

        // Pastikan yang diselesaikan notif milik slot ini.
        if (!current || (notification && current !== notification)) {
            return false;
        }

        // Lepas slot dan mulai cooldown.
        this.notification = null;
        this.cooldownRemaining = this.cooldownDuration;

        if (isValid(current)) {
            const order = current.getComponent(
                OrderNotification
            );

            if (order && !order.isAnswered) {
                order.markAnswered();
            }

            current.destroy();
        }

        return true;
    }
}
