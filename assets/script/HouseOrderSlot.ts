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

        if (order?.isAnswered) {
            this.notification = null;
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

        // Cegah spawn kedua pada rumah sama.
        if (
            this.notification !== null ||
            this.cooldownRemaining > 0
        ) {
            notification.destroy();
            return false;
        }

        // Simpan referensi sebelum memasang node.
        this.notification = notification;

        notification.setParent(this.node);
        notification.setPosition(
            new Vec3(0, this.notificationOffsetY, 0)
        );

        return true;
    }

    completeOrder() {
        const current = this.notification;

        // Kosongkan referensi agar slot tidak terkunci.
        this.notification = null;
        this.cooldownRemaining = this.cooldownDuration;

        if (current && isValid(current)) {
            const order = current.getComponent(
                OrderNotification
            );

            if (order) {
                order.markAnswered();
            }

            current.destroy();
        }
    }
}
