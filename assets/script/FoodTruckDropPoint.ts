
import {
    _decorator,
    Component,
    BoxCollider2D,
    UITransform,
    Rect,
    Vec3,
} from 'cc';

const { ccclass, property } = _decorator;

export type FoodType = 'donut' | 'chicken' | 'pizza';

@ccclass('FoodTruckDropPoint')
export class FoodTruckDropPoint extends Component {
    @property({
        tooltip: 'Tipe makanan yang diterima: donut, chicken, pizza',
    })
    foodType: FoodType = 'donut';

    @property
    enableDebug = true;

    private collider: BoxCollider2D | null = null;
    private uiTransform: UITransform | null = null;

    start() {
        this.collider = this.getComponent(BoxCollider2D);
        this.uiTransform = this.getComponent(UITransform);

        if (!this.collider) {
            console.error(
                `[FoodTruck:${this.node.name}] BoxCollider2D tidak ditemukan pada root prefab!`
            );
        }

        if (!this.uiTransform) {
            console.error(
                `[FoodTruck:${this.node.name}] UITransform tidak ditemukan!`
            );
        }

        this.log(`Ready. Food type: ${this.foodType}`);
    }

    public getCollider(): BoxCollider2D | null {
        return this.collider?.isValid ? this.collider : null;
    }

    public getWorldBounds(): Rect | null {
        const collider = this.getCollider();
        const transform = this.node.getComponent(UITransform);

        if (!collider || !transform) {
            return null;
        }

        // Ambil batas collider berdasarkan ukuran dan offset aktual.
        const halfWidth = collider.size.width / 2;
        const halfHeight = collider.size.height / 2;

        const offsetX = collider.offset.x;
        const offsetY = collider.offset.y;

        const corners = [
            new Vec3(offsetX - halfWidth, offsetY - halfHeight, 0),
            new Vec3(offsetX + halfWidth, offsetY - halfHeight, 0),
            new Vec3(offsetX - halfWidth, offsetY + halfHeight, 0),
            new Vec3(offsetX + halfWidth, offsetY + halfHeight, 0),
        ];

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const corner of corners) {
            const world = transform.convertToWorldSpaceAR(corner);

            minX = Math.min(minX, world.x);
            minY = Math.min(minY, world.y);
            maxX = Math.max(maxX, world.x);
            maxY = Math.max(maxY, world.y);
        }

        return new Rect(minX, minY, maxX - minX, maxY - minY);
    }

    public checkAnswer(notificationType: FoodType): boolean {
        const correct = notificationType === this.foodType;

        this.log(
            correct
                ? `BENAR! ${notificationType} cocok.`
                : `SALAH! Notification: ${notificationType}, FoodTruck: ${this.foodType}.`
        );

        return correct;
    }

    public acceptNotification() {
        this.log('Notification diterima FoodTruck.');
    }

    private log(message: string) {
        if (this.enableDebug) {
            console.log(`[FoodTruck:${this.node.name}] ${message}`);
        }
    }
}
