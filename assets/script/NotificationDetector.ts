
import {
    _decorator,
    Component,
    Node,
    Collider2D,
    director,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('NotificationDetector')
export class NotificationDetector extends Component {
    @property
    enableDebug = true;

    private cursorCollider: Collider2D | null = null;

    start() {
        const scene = director.getScene();

        if (!scene) {
            this.log('Scene tidak ditemukan');
            return;
        }

        const cursor =
            this.findNode(scene, 'CursorHitBox') ??
            this.findNode(scene, 'CursorHitbox');

        this.cursorCollider = cursor?.getComponent(Collider2D) ?? null;

    }

    private findNode(root: Node, name: string): Node | null {
        if (root.name === name) return root;

        for (const child of root.children) {
            const result = this.findNode(child, name);
            if (result) return result;
        }

        return null;
    }

    isOver(target: Collider2D | null): boolean {
        if (!this.cursorCollider || !target) {
            return false;
        }

        if (
            !this.cursorCollider.enabled ||
            !target.enabled ||
            !this.cursorCollider.node.activeInHierarchy ||
            !target.node.activeInHierarchy
        ) {
            return false;
        }

        const a = this.cursorCollider.worldAABB;
        const b = target.worldAABB;

        const overlap =
            a.x <= b.x + b.width &&
            a.x + a.width >= b.x &&
            a.y <= b.y + b.height &&
            a.y + a.height >= b.y;

        this.log(
            `Cursor=(${a.x.toFixed(1)}, ${a.y.toFixed(1)}) | ` +
            `Target=(${b.x.toFixed(1)}, ${b.y.toFixed(1)}) | ` +
            `Overlap=${overlap}`
        );

        return overlap;
    }

    private log(message: string) {
        if (this.enableDebug) {
        }
    }
}
