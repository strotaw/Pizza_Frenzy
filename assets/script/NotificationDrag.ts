
import {
    _decorator,
    Component,
    Node,
    input,
    Input,
    EventMouse,
    EventTouch,
    UITransform,
    Collider2D,
    Vec3,
    director,
} from 'cc';

import { FoodTruckDropPoint } from './FoodTruckDropPoint';
import { OrderNotification } from './OrderNotification';

const { ccclass, property } = _decorator;

@ccclass('NotificationDrag')
export class NotificationDrag extends Component {
    @property
    enableDebug = true;

    private originalParent: Node | null = null;
    private originalPosition = new Vec3();
    private canvas: Node | null = null;
    private collider: Collider2D | null = null;
    private orderNotification: OrderNotification | null = null;

    private dragging = false;
    private dragType: 'mouse' | 'touch' | null = null;
    private dragOffset = new Vec3();

    private static activeDrag: NotificationDrag | null = null;

    start() {
        const scene = director.getScene();

        if (!scene) {
            this.log('Scene tidak ditemukan');
            return;
        }

        this.originalParent = this.node.parent;
        this.node.getPosition(this.originalPosition);

        this.collider = this.node.getComponent(Collider2D);
        this.orderNotification =
            this.node.getComponent(OrderNotification);

        this.canvas = this.findNode(scene, 'Canvas');

        if (!this.collider) {
            console.error(
                `[NotificationDrag:${this.node.name}] Collider2D tidak ditemukan!`
            );
        }

        if (!this.orderNotification) {
            console.error(
                `[NotificationDrag:${this.node.name}] OrderNotification tidak ditemukan!`
            );
        }

        if (!this.node.getComponent(UITransform)) {
            console.error(
                `[NotificationDrag:${this.node.name}] UITransform tidak ditemukan!`
            );
        }

        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        this.log(
            `Notification ready: ${
                this.orderNotification?.getFoodType() ?? 'UNKNOWN'
            }`
        );
    }

    onDestroy() {
        if (NotificationDrag.activeDrag === this) {
            NotificationDrag.activeDrag = null;
        }

        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private findNode(root: Node, name: string): Node | null {
        if (root.name === name) {
            return root;
        }

        for (const child of root.children) {
            const result = this.findNode(child, name);

            if (result) {
                return result;
            }
        }

        return null;
    }

    private isPointerOverObject(x: number, y: number): boolean {
        const transform = this.node.getComponent(UITransform);

        if (!transform) {
            return false;
        }

        const local = transform.convertToNodeSpaceAR(
            new Vec3(x, y, 0)
        );

        const size = transform.contentSize;
        const anchor = transform.anchorPoint;

        return (
            local.x >= -size.width * anchor.x &&
            local.x <= size.width * (1 - anchor.x) &&
            local.y >= -size.height * anchor.y &&
            local.y <= size.height * (1 - anchor.y)
        );
    }

    private onMouseDown(event: EventMouse) {
        if (event.getButton() !== 0) return;
        if (NotificationDrag.activeDrag) return;

        const p = event.getUILocation();

        if (!this.isPointerOverObject(p.x, p.y)) return;

        this.beginDrag('mouse', p.x, p.y);
    }

    private onTouchStart(event: EventTouch) {
        if (NotificationDrag.activeDrag) return;

        const p = event.getUILocation();

        if (!this.isPointerOverObject(p.x, p.y)) return;

        this.beginDrag('touch', p.x, p.y);
    }

    private beginDrag(
        type: 'mouse' | 'touch',
        x: number,
        y: number
    ) {
        if (!this.collider?.isValid) {
            this.log('DRAG FAILED: Collider2D missing');
            return;
        }

        if (!this.orderNotification?.isValid) {
            this.log('DRAG FAILED: OrderNotification missing');
            return;
        }

        if (!this.canvas?.isValid) {
            const scene = director.getScene();

            this.canvas = scene
                ? this.findNode(scene, 'Canvas')
                : null;
        }

        if (!this.canvas) {
            this.log('DRAG FAILED: Canvas missing');
            return;
        }

        const transform = this.canvas.getComponent(UITransform);

        if (!transform) {
            this.log('DRAG FAILED: Canvas UITransform missing');
            return;
        }

        const pointer = transform.convertToNodeSpaceAR(
            new Vec3(x, y, 0)
        );

        NotificationDrag.activeDrag = this;
        this.dragging = true;
        this.dragType = type;

        // Pertahankan posisi dunia saat parent berubah.
        this.node.setParent(this.canvas, true);

        this.dragOffset.set(
            this.node.position.x - pointer.x,
            this.node.position.y - pointer.y,
            0
        );

        this.moveTo(x, y);

        this.log(`DRAG BEGIN: ${type}`);
    }

    private onMouseMove(event: EventMouse) {
        if (!this.dragging || this.dragType !== 'mouse') return;
        if (NotificationDrag.activeDrag !== this) return;

        const p = event.getUILocation();

        this.moveTo(p.x, p.y);
    }

    private onTouchMove(event: EventTouch) {
        if (!this.dragging || this.dragType !== 'touch') return;
        if (NotificationDrag.activeDrag !== this) return;

        const p = event.getUILocation();

        this.moveTo(p.x, p.y);
    }

    private moveTo(x: number, y: number) {
        if (!this.canvas) return;

        const transform = this.canvas.getComponent(UITransform);

        if (!transform) return;

        const pointer = transform.convertToNodeSpaceAR(
            new Vec3(x, y, 0)
        );

        this.node.setPosition(
            pointer.x + this.dragOffset.x,
            pointer.y + this.dragOffset.y,
            this.originalPosition.z
        );
    }

    private onMouseUp(event: EventMouse) {
        if (event.getButton() !== 0) return;
        if (this.dragType !== 'mouse') return;

        this.finishDrag();
    }

    private onTouchEnd(_event: EventTouch) {
        if (this.dragType !== 'touch') return;

        this.finishDrag();
    }

    private finishDrag() {
        if (!this.dragging) return;

        this.dragging = false;
        this.dragType = null;
        NotificationDrag.activeDrag = null;

        const scene = director.getScene();

        if (!scene) {
            this.log('DROP FAILED: Scene missing');
            this.resetPosition();
            return;
        }

        // Ambil tipe makanan dari OrderNotification.
        const notificationType =
            this.orderNotification?.getFoodType();

        if (!notificationType) {
            this.log('DROP FAILED: FoodType tidak valid');
            this.resetPosition();
            return;
        }

        const notificationCollider = this.collider;

        if (!notificationCollider?.isValid) {
            this.log('DROP FAILED: Notification Collider2D invalid');
            this.resetPosition();
            return;
        }

        const notificationBounds = notificationCollider.worldAABB;

        const trucks =
            scene.getComponentsInChildren(FoodTruckDropPoint);

        for (const truck of trucks) {
            const truckCollider = truck.getCollider();

            if (!truckCollider?.isValid) continue;

            const truckBounds = truckCollider.worldAABB;

            // Cek overlap collider notification dengan FoodTruck.
            if (!notificationBounds.intersects(truckBounds)) {
                continue;
            }

            // Cek tipe makanan dari OrderNotification.
            const correct = truck.checkAnswer(notificationType);

            if (correct) {
                truck.acceptNotification(this.node);
                
                return;
            }

            

            this.resetPosition();
            return;
        }


        this.resetPosition();
    }

    private resetPosition() {
        if (this.originalParent?.isValid) {
            this.node.setParent(this.originalParent, true);
            this.node.setPosition(this.originalPosition);
        }

    }

    private log(message: string) {
        if (this.enableDebug) {
        }
    }
}
