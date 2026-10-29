
import {
    _decorator,
    Component,
    Prefab,
    instantiate,
    UITransform,
    Vec3,
    director,
} from 'cc';

import { HouseOrderSlot } from './HouseOrderSlot';
import { OrderLeftManager } from './OrderLeftManager';

const { ccclass, property } = _decorator;

@ccclass('HouseNotificationSpawner')
export class HouseNotificationSpawner extends Component {

    @property(Prefab)
    notificationPrefab: Prefab | null = null;

    @property
    spawnInterval = 5;

    @property
    totalOrders = 19;

    private timer = 0;
    private spawnedOrders = 0;
    private orderLeftManager: OrderLeftManager | null = null;

    start() {
        const scene = director.getScene();

        this.orderLeftManager = scene
            ? scene.getComponentInChildren(OrderLeftManager)
            : null;

        if (!this.orderLeftManager) {
            console.error(
                '[HouseNotificationSpawner] OrderLeftManager tidak ditemukan!'
            );
            return;
        }

        this.totalOrders = Math.max(
            0,
            Math.floor(this.totalOrders)
        );

        this.orderLeftManager.initialize(this.totalOrders);
    }

    update(dt: number) {
        // Semua order sudah dibuat.
        if (this.spawnedOrders >= this.totalOrders) {
            return;
        }

        this.timer += dt;

        if (this.timer < this.spawnInterval) {
            return;
        }

        this.timer = 0;
        this.spawnNotification();
    }

    private spawnNotification() {
        if (this.spawnedOrders >= this.totalOrders) {
            return;
        }

        if (!this.notificationPrefab) {
            console.error(
                'Notification Prefab belum dipasang!'
            );
            return;
        }

        const slots = this.node.getComponentsInChildren(
            HouseOrderSlot
        );

        const availableSlots = slots.filter(
            slot => slot.canSpawn()
        );

        if (availableSlots.length === 0) {
            return;
        }

        const index = Math.floor(
            Math.random() * availableSlots.length
        );

        const selectedSlot = availableSlots[index];

        const notification = instantiate(
            this.notificationPrefab
        );

        const assigned = selectedSlot.assignNotification(
            notification
        );

        if (!assigned) {
            notification.destroy();
            return;
        }

        // Hitung hanya notification yang berhasil dipasang.
        this.spawnedOrders++;

        const slotTransform = selectedSlot.node.getComponent(
            UITransform
        );

        const notificationTransform = notification.getComponent(
            UITransform
        );

        if (slotTransform && notificationTransform) {
            const worldPosition =
                slotTransform.convertToWorldSpaceAR(Vec3.ZERO);

            const parent = notification.parent;
            const parentTransform =
                parent?.getComponent(UITransform);

            if (parentTransform) {
                const localPosition =
                    parentTransform.convertToNodeSpaceAR(
                        worldPosition
                    );

                notification.setPosition(
                    new Vec3(
                        localPosition.x,
                        localPosition.y,
                        notification.position.z
                    )
                );
            }
        }

        console.log(
            `Orders spawned: ${this.spawnedOrders}/${this.totalOrders}`
        );
    }
}
