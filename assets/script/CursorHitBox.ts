
import {
    _decorator,
    Component,
    input,
    Input,
    EventMouse,
    Camera,
    Vec3,
    director,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CursorHitbox')
export class CursorHitbox extends Component {
    @property(Camera)
    targetCamera: Camera | null = null;

    @property
    enableDebug = true;

    @property
    debugInterval = 0.2;

    private lastDebugTime = 0;

    start() {
        if (!this.targetCamera) {
            const scene = director.getScene();
            const cameras = scene?.getComponentsInChildren(Camera) ?? [];

            this.targetCamera =
                cameras.find(camera => camera.enabled) ?? null;
        }

        console.log('[CursorHitbox] START');
        console.log('[CursorHitbox] Node:', this.node.name);
        console.log('[CursorHitbox] Camera:', this.targetCamera?.node.name ?? 'NOT FOUND');

        if (!this.targetCamera) {
            console.error('[CursorHitbox] Camera tidak ditemukan!');
        }

        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    private onMouseMove(event: EventMouse) {
        const screen = event.getLocation();
        const ui = event.getUILocation();

        if (!this.targetCamera) return;

        const world = this.targetCamera.screenToWorld(
            new Vec3(screen.x, screen.y, 0)
        );

        this.node.setWorldPosition(world);

        const now = Date.now() / 1000;

        if (now - this.lastDebugTime >= this.debugInterval) {
            this.lastDebugTime = now;

            const position = this.node.worldPosition;
        }
    }
}
