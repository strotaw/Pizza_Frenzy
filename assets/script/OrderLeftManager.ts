
import {
    _decorator,
    Component,
    Label,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('OrderLeftManager')
export class OrderLeftManager extends Component {

    @property(Label)
    orderLeftLabel: Label | null = null;

    private totalOrders = 0;
    private completedOrders = 0;

    get orderLeft(): number {
        return Math.max(
            0,
            this.totalOrders - this.completedOrders
        );
    }

    initialize(total: number) {
        this.totalOrders = Math.max(0, Math.floor(total));
        this.completedOrders = 0;
        this.updateLabel();
    }

    completeOrder() {
        if (this.completedOrders >= this.totalOrders) {
            return;
        }

        this.completedOrders++;
        this.updateLabel();

        console.log(`Order Left: ${this.orderLeft}`);
    }

    reset() {
        this.completedOrders = 0;
        this.updateLabel();
    }

    private updateLabel() {
        if (this.orderLeftLabel) {
            this.orderLeftLabel.string =
                `Order Left: ${this.orderLeft}`;
        }
    }
}
