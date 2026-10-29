
import {
    _decorator,
    Component,
    Node,
    input,
    Input,
    EventMouse,
    EventTouch,
    UITransform,
    BoxCollider2D,
    Rect,
    Vec3,
    director,
} from 'cc';

import { FoodTruckDropPoint } from './FoodTruckDropPoint';
import { OrderNotification } from './OrderNotification';
import { HouseOrderSlot } from './HouseOrderSlot';
import { ScoreManager } from './ScoreManager';
import { OrderLeftManager } from './OrderLeftManager';

const { ccclass, property } = _decorator;

@ccclass('NotificationDrag')
export class NotificationDrag extends Component {
    @property
    enableDebug = true;

    private originalParent: Node | null = null;
    private originalPosition = new Vec3();
    private canvas: Node | null = null;

    private collider: BoxCollider2D | null = null;
    private orderNotification: OrderNotification | null = null;

    private dragging = false;
    private dragType: 'mouse' | 'touch' | null = null;
    private dragOffset = new Vec3();

    private scoreManager: ScoreManager | null = null;
    private orderLeftManager: OrderLeftManager | null = null;

    private static activeDrag: NotificationDrag | null = null;

    start() {
        this.originalParent = this.node.parent;
        this.node.getPosition(this.originalPosition);

        this.collider = this.node.getComponent(BoxCollider2D);
        this.orderNotification =
            this.node.getComponent(OrderNotification);

        const scene = director.getScene();
        this.canvas = scene ? this.findNode(scene, 'Canvas') : null;

        this.scoreManager = scene
            ? scene.getComponentInChildren(ScoreManager)
            : null;

        this.orderLeftManager = scene
            ? scene.getComponentInChildren(OrderLeftManager)
            : null;
      
        if (!this.scoreManager) {
          console.error('[NotificationDrag] ScoreManager tidak ditemukan!');
        }

        if (!this.collider) {
            console.error(
                `[NotificationDrag:${this.node.name}] BoxCollider2D tidak ditemukan pada root prefab!`
            );
        }

        if (!this.node.getComponent(UITransform)) {
            console.error(
                `[NotificationDrag:${this.node.name}] UITransform tidak ditemukan!`
            );
        }

        if (!this.orderNotification) {
            console.error(
                `[NotificationDrag:${this.node.name}] OrderNotification tidak ditemukan!`
            );
        }

        if (!this.canvas) {
            console.error('[NotificationDrag] Canvas tidak ditemukan!');
      }



        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        this.log(
            `Ready. FoodType: ${
                this.orderNotification?.getFoodType() ?? 'UNKNOWN'
            }`
        );

        this.log(
            `BoxCollider2D: ${!!this.collider}, UITransform: ${
                !!this.node.getComponent(UITransform)
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
            this.log('DRAG FAILED: BoxCollider2D missing');
            return;
        }

        if (!this.orderNotification?.isValid) {
            this.log('DRAG FAILED: OrderNotification missing');
            return;
        }

        if (!this.canvas?.isValid) {
            const scene = director.getScene();
            this.canvas = scene ? this.findNode(scene, 'Canvas') : null;
        }

        if (!this.canvas) {
            this.log('DRAG FAILED: Canvas missing');
            return;
        }

        const canvasTransform = this.canvas.getComponent(UITransform);

        if (!canvasTransform) {
            this.log('DRAG FAILED: Canvas UITransform missing');
            return;
        }

        const pointer = canvasTransform.convertToNodeSpaceAR(
            new Vec3(x, y, 0)
        );

        NotificationDrag.activeDrag = this;
        this.dragging = true;
        this.dragType = type;

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

    private getColliderWorldBounds(
        collider: BoxCollider2D
    ): Rect | null {
        const node = collider.node;
        const transform = node.getComponent(UITransform);

        if (!transform || !collider.isValid) {
            return null;
        }

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

    // Cari slot asal meskipun Notification sedang berada di Canvas.
    private findSourceSlot(): HouseOrderSlot | null {
        let current = this.originalParent;

        while (current) {
            const slot = current.getComponent(HouseOrderSlot);

            if (slot) {
                return slot;
            }

            current = current.parent;
        }

        return null;
    }

    // Selesaikan pesanan dan biarkan slot mengatur cooldown.
    private completeSourceOrder(): boolean {
        const slot = this.findSourceSlot();

        if (!slot) {
            this.log('SOURCE SLOT NOT FOUND');
            return false;
        }

        const completed = slot.completeOrder(this.node);

        if (!completed) {
            this.log('SOURCE SLOT: Notification reference mismatch');
            return false;
        }

        this.log(`SOURCE ORDER COMPLETED: ${slot.node.name}`);
        return true;
    }

    private finishDrag() {
        if (!this.dragging) return;

        this.dragging = false;
        this.dragType = null;
        NotificationDrag.activeDrag = null;

        const scene = director.getScene();

        if (!scene || !this.collider?.isValid) {
            this.log('DROP FAILED: Scene or collider missing');
            this.resetPosition();
            return;
        }

        const notificationType = this.orderNotification?.getFoodType();

        if (!notificationType) {
            this.log('DROP FAILED: FoodType invalid');
            this.resetPosition();
            return;
        }

        const notificationBounds =
            this.getColliderWorldBounds(this.collider);

        if (!notificationBounds) {
            this.log('DROP FAILED: Cannot calculate Notification bounds');
            this.resetPosition();
            return;
        }

        this.log(
            `NOTIFICATION BOUNDS: x=${notificationBounds.x.toFixed(1)}, ` +
            `y=${notificationBounds.y.toFixed(1)}, ` +
            `w=${notificationBounds.width.toFixed(1)}, ` +
            `h=${notificationBounds.height.toFixed(1)}`
        );

        const trucks = scene.getComponentsInChildren(FoodTruckDropPoint);

        this.log(`FoodTruck found: ${trucks.length}`);

        for (const truck of trucks) {
            const truckCollider = truck.getCollider();

            if (!truckCollider) {
                this.log(`${truck.node.name}: BoxCollider2D missing`);
                continue;
            }

            const truckBounds = truck.getWorldBounds();

            if (!truckBounds) {
                this.log(`${truck.node.name}: Cannot calculate bounds`);
                continue;
            }

            const overlaps = notificationBounds.intersects(truckBounds);

            this.log(
                `${truck.node.name} bounds: ` +
                `x=${truckBounds.x.toFixed(1)}, ` +
                `y=${truckBounds.y.toFixed(1)}, ` +
                `w=${truckBounds.width.toFixed(1)}, ` +
                `h=${truckBounds.height.toFixed(1)}`
            );

            this.log(`COLLISION ${truck.node.name}: ${overlaps}`);

            if (!overlaps) continue;

            const correct = truck.checkAnswer(notificationType);

            if (correct) {
                console.log('benar');
                this.scoreManager?.addCorrectScore();
                truck.acceptNotification();
            } else {
                console.log('salah');
                this.scoreManager?.addWrongScore();
            }

            // Setelah checkAnswer() dan proses benar/salah:
            this.orderLeftManager?.completeOrder();
            
            // Benar maupun salah: selesaikan pesanan dari slot asal.
            // completeOrder() akan menghancurkan Notification.
            if (!this.completeSourceOrder()) {
                this.node.destroy();
            }

            return;
        }

        // Tidak menyentuh FoodTruck: notif tetap menunggu jawaban.
        this.log('DROP FAILED: No FoodTruck overlap');
        this.resetPosition();
    }

    private resetPosition() {
        if (!this.originalParent?.isValid || !this.node.isValid) {
            return;
        }

        this.node.setParent(this.originalParent, true);
        this.node.setPosition(this.originalPosition);

        this.log('Notification returned to original position');
    }

    private log(message: string) {
        if (this.enableDebug) {
            console.log(`[NotificationDrag:${this.node.name}] ${message}`);
        }
    }
}
