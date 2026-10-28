
import {
    _decorator,
    Component,
    Prefab,
    instantiate,
    UITransform,
    Vec3,
} from 'cc';

import { HouseOrderSlot } from './HouseOrderSlot';

const { ccclass, property } = _decorator;

@ccclass('HouseNotificationSpawner')
export class HouseNotificationSpawner extends Component {

    @property(Prefab)
    notificationPrefab: Prefab | null = null;

    @property
    spawnInterval = 5;

    private timer = 0;

    update(dt: number) {
        this.timer += dt;

        if (this.timer < this.spawnInterval) {
            return;
        }

        this.timer = 0;
        this.spawnNotification();
    }

    private spawnNotification() {
        if (!this.notificationPrefab) {
            console.error('Notification Prefab belum dipasang!');
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

        // Pasang notification pada slot rumah terpilih.
        selectedSlot.assignNotification(notification);

        // Samakan posisi berdasarkan koordinat dunia.
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

            const parentTransform = parent?.getComponent(UITransform);

            if (parentTransform) {
                const localPosition =
                    parentTransform.convertToNodeSpaceAR(worldPosition);

                notification.setPosition(
                    new Vec3(
                        localPosition.x,
                        localPosition.y,
                        notification.position.z
                    )
                );
            }
        }
    }
}
