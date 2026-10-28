
import {
    _decorator,
    Component,
    Node,
    Prefab,
    Sprite,
    SpriteFrame,
    instantiate,
    Vec3,
} from 'cc';

import {
    FoodTruckDropPoint,
    FoodType,
} from './FoodTruckDropPoint';

const { ccclass, property } = _decorator;

@ccclass('FoodTruckSpawner')
export class FoodTruckSpawner extends Component {
    @property(Prefab)
    foodTruckPrefab: Prefab | null = null;

    @property(SpriteFrame)
    donutSprite: SpriteFrame | null = null;

    @property(SpriteFrame)
    chickenSprite: SpriteFrame | null = null;

    @property(SpriteFrame)
    pizzaSprite: SpriteFrame | null = null;

    @property
    columns = 3;

    @property
    spacingX = 300;

    @property
    spacingY = 220;

    @property
    enableDebug = true;

    private readonly foodTypes: FoodType[] = [
        'donut',
        'chicken',
        'pizza',
    ];

    private readonly spriteFrames: (SpriteFrame | null)[] = [];

    start() {
        this.spriteFrames.push(
            this.donutSprite,
            this.chickenSprite,
            this.pizzaSprite,
        );

        this.spawnFoodTrucks();
    }

    private spawnFoodTrucks() {
        if (!this.foodTruckPrefab) {
            console.error(
                '[FoodTruckSpawner] FoodTruck Prefab belum diisi!'
            );
            return;
        }

        if (this.spriteFrames.some(frame => !frame)) {
            console.error(
                '[FoodTruckSpawner] Ada SpriteFrame belum diisi!'
            );
            return;
        }

        const safeColumns = Math.max(
            1,
            Math.floor(this.columns)
        );

        for (let i = 0; i < 3; i++) {
            const type = this.foodTypes[i];
            const frame = this.spriteFrames[i];

            if (!frame) continue;

            // Spawn prefab.
            const truck = instantiate(this.foodTruckPrefab);
            truck.name = 'FoodTruck_' + type;
            truck.setParent(this.node);

            // Set sprite asset.
            const sprite = truck.getComponent(Sprite);

            if (!sprite) {
                console.error(
                    `[FoodTruckSpawner] Sprite tidak ditemukan di ${truck.name}`
                );

                truck.destroy();
                continue;
            }

            sprite.spriteFrame = frame;

            // Set tipe jawaban.
            const dropPoint =
                truck.getComponent(FoodTruckDropPoint);

            if (!dropPoint) {
                console.error(
                    `[FoodTruckSpawner] FoodTruckDropPoint tidak ditemukan di ${truck.name}`
                );

                truck.destroy();
                continue;
            }

            dropPoint.foodType = type;

            // Hitung posisi grid.
            const col = i % safeColumns;
            const row = Math.floor(i / safeColumns);

            const totalRows = Math.ceil(3 / safeColumns);

            const x =
                (col - (Math.min(3, safeColumns) - 1) / 2)
                * this.spacingX;

            const y =
                ((totalRows - 1) / 2 - row)
                * this.spacingY;

            truck.setPosition(new Vec3(x, y, 0));

            this.log(
                `Spawned ${truck.name} at (${x}, ${y})`
            );
        }
    }

    private log(message: string) {
        if (this.enableDebug) {
            console.log(
                `[FoodTruckSpawner] ${message}`
            );
        }
    }
}
