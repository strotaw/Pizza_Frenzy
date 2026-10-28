
import {
    _decorator,
    Component,
    Sprite,
    SpriteFrame,
} from 'cc';

const { ccclass, property } = _decorator;

export type FoodType = 'donut' | 'chicken' | 'pizza';

@ccclass('OrderNotification')
export class OrderNotification extends Component {

    @property(Sprite)
    customerIcon: Sprite | null = null;

    @property(Sprite)
    foodIcon: Sprite | null = null;

    @property([SpriteFrame])
    customerSprites: SpriteFrame[] = [];

    @property([SpriteFrame])
    foodSprites: SpriteFrame[] = [];

    @property
    customerIndex = 0;

    @property
    foodIndex = 0;

    private answered = false;

    private static usedCombinations = new Set<string>();

    get isAnswered(): boolean {
        return this.answered;
    }

    // Ambil foodType berdasarkan foodIndex.
    getFoodType(): FoodType | null {
        switch (this.foodIndex) {
            case 0:
                return 'donut';

            case 1:
                return 'chicken';

            case 2:
                return 'pizza';

            default:
                return null;
        }
    }

    start() {
        this.randomizeSprites();
    }

    randomizeSprites() {
        const customerCount = this.customerSprites.length;
        const foodCount = this.foodSprites.length;

        if (customerCount === 0 || foodCount === 0) {
            console.error(
                '[OrderNotification] CustomerSprites atau FoodSprites kosong!'
            );
            return;
        }

        const totalCombinations = customerCount * foodCount;

        if (
            OrderNotification.usedCombinations.size >=
            totalCombinations
        ) {
            OrderNotification.usedCombinations.clear();
        }

        const availableCombinations: {
            customer: number;
            food: number;
            key: string;
        }[] = [];

        for (let c = 0; c < customerCount; c++) {
            for (let f = 0; f < foodCount; f++) {
                const key = `${c}-${f}`;

                if (
                    !OrderNotification.usedCombinations.has(key)
                ) {
                    availableCombinations.push({
                        customer: c,
                        food: f,
                        key,
                    });
                }
            }
        }

        if (availableCombinations.length === 0) {
            return;
        }

        const randomIndex = Math.floor(
            Math.random() * availableCombinations.length
        );

        const selected = availableCombinations[randomIndex];

        this.customerIndex = selected.customer;
        this.foodIndex = selected.food;

        OrderNotification.usedCombinations.add(selected.key);

        if (this.customerIcon) {
            this.customerIcon.spriteFrame =
                this.customerSprites[this.customerIndex];
        }

        if (this.foodIcon) {
            this.foodIcon.spriteFrame =
                this.foodSprites[this.foodIndex];
        }

        console.log(
            `[OrderNotification:${this.node.name}] ` +
            `Customer: ${this.customerIndex}, ` +
            `Food: ${this.foodIndex}, ` +
            `FoodType: ${this.getFoodType()}`
        );
    }

    markAnswered() {
        this.answered = true;
    }

    onDestroy() {
        // Kombinasi tetap tersimpan.
    }
}
