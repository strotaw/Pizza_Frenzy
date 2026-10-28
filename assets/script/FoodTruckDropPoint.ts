
import {
    _decorator,
    Component,
    Collider2D,
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

    private collider: Collider2D | null = null;

    start() {
        this.collider = this.getComponent(Collider2D);

        if (!this.collider) {
            console.error(
                `[FoodTruck:${this.node.name}] Collider2D tidak ditemukan!`
            );
            return;
        }

        this.log(`Ready. Food type: ${this.foodType}`);
    }

    public getCollider(): Collider2D | null {
        return this.collider?.isValid ? this.collider : null;
    }

    public checkAnswer(notificationType: FoodType): boolean {
        const correct = notificationType === this.foodType;

        if (correct) {
            this.log(`BENAR! ${notificationType} cocok.`);
        } else {
            this.log(
                `SALAH! Notification: ${notificationType}, ` +
                `FoodTruck: ${this.foodType}.`
            );
        }

        return correct;
    }

    public acceptNotification() {
        this.log('Notification diterima FoodTruck.');
    }

    private log(message: string) {
        if (this.enableDebug) {
            console.log(
                `[FoodTruck:${this.node.name}] ${message}`
            );
        }
    }
}
