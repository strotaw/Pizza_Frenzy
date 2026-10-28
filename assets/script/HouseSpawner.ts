
import {
    _decorator,
    Component,
    Prefab,
    instantiate,
    Vec3,
} from 'cc';

import { HouseOrderSlot } from './HouseOrderSlot';

const { ccclass, property } = _decorator;

@ccclass('HouseSpawner')
export class HouseSpawner extends Component {

    @property(Prefab)
    housePrefab: Prefab | null = null;

    @property
    spacingX = 500;

    @property
    spacingY = 400;

    start() {
        if (!this.housePrefab) {
            console.error('House Prefab belum dipasang!');
            return;
        }

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const house = instantiate(this.housePrefab);

                this.node.addChild(house);

                house.setPosition(new Vec3(
                    (col - 1) * this.spacingX,
                    (1 - row) * this.spacingY,
                    0
                ));

                if (!house.getComponent(HouseOrderSlot)) {
                    house.addComponent(HouseOrderSlot);
                }
            }
        }
    }
}
