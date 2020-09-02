/<template>
    <div class="flex justify-center m-4">
        <div class="max-w-md flex-shrink">
            <div class="flex flex-wrap justify-center">
                <h3 class="w-full flex-shrink-0 text-center">Mouse control</h3>

                <button class="block my-2 py-2 px-4 bg-white hover:bg-gray-100 disabled:bg-gray-400 text-gray-800 font-semibold border border-gray-400 rounded-l shadow"
                        type="button"
                        :disabled="mode === 'points'"
                        @click.prevent="mode = 'points'"
                >
                    Move points
                </button>

                <button class="block my-2 py-2 px-4 bg-white hover:bg-gray-100 disabled:bg-gray-400 text-gray-800 font-semibold border border-gray-400 rounded-r shadow"
                        type="button"
                        :disabled="mode === 'anchors'"
                        @click.prevent="mode = 'anchors'"
                >
                    Move anchors
                </button>
            </div>

            <div class="flex flex-wrap gap-x-10 gap-y-3 mt-8 justify-center">
                <h3 class="w-full flex-shrink-0 text-center">Grid options</h3>

                <span class="w-1/3 text-center">
                    <input id="showGrid" type="checkbox" :checked="showGrid" @change="showGrid = !showGrid"/>
                    <label for="showGrid">Show grid</label>
                </span>

                <span class="w-1/3 text-center">
                    <input id="snapToGrid" type="checkbox" :checked="snapToGrid" @change="snapToGrid = !snapToGrid"/>
                    <label for="snapToGrid">Snap to grid</label>
                </span>

                <span class="w-1/3">
                    <label for="gridX" class="block w-full text-center">Grid width</label>
                    <input id="gridX"
                           type="number"
                           class="bg-white focus:outline-none focus:shadow-outline border border-gray-500 rounded-lg py-2 px-4 block w-full appearance-none leading-normal text-right"
                           :value="gridX"
                           @change="(event) => { gridX = event.target.value }"
                    />
                </span>

                <span class="w-1/3">
                    <label for="gridY" class="block w-full text-center">Grid height</label>
                    <input id="gridY"
                           type="number"
                           class="bg-white focus:outline-none focus:shadow-outline border border-gray-500 rounded-lg py-2 px-4 block w-full appearance-none leading-normal text-right"
                           :value="gridY"
                           @change="(event) => { gridY = event.target.value }"
                    />
                </span>
            </div>
        </div>

        <canvas ref="canvas"
                class="border border-gray-900"
                :height="height"
                :width="width"
                @mousedown.left="pointerDown"
                @touchstart="pointerDown"
                @mouseup.left="pointerUp"
                @touchend="pointerUp"
                @mouseupout="pointerCancel"
                @touchendout="pointerCancel"
                @touchcancel="pointerCancel"
                @contextmenu="rightClick"
        />
    </div>
</template>

<script>
import Vue from 'vue';
import {getPointerXY} from 'lib/pointers';

export default {
    data() {
        return {
            buffer: null,
            canvas: null,
            dragging: -1,
            anchor: -1,
            modifying: -1,
            mode: 'points',
            points: [],

            pointSize: 5,

            gridX: 40,
            gridY: 40,
            showGrid: true,
            snapToGrid: true,

            height: 400,
            width: 400
        };
    },

    computed: {
        currentPoint() {
            if (this.modifying >= 0) {
                return this.points[this.modifying];
            }

            return {};
        }
    },

    watch: {
        showGrid(value) {
            this.refresh();
        },

        gridX(value) {
            this.refresh();
        },

        gridY(value) {
            this.refresh();
        }
    },

    methods: {
        addPoint(x, y) {
            const {x: snapX, y: snapY} = this.snapXY(x, y);
            const i = this.points.length;
            Vue.set(this.points, i, {
                x: snapX,
                y: snapY,
                anchors: [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 }
                ]
            });
            return i;
        },

        snapXY(x, y) {
            if (this.snapToGrid) {
                if (x % this.gridX < this.gridX / 2) {
                    x = x - (x % this.gridX);
                } else {
                    x = x + this.gridX - (x % this.gridX);
                }

                if (y % this.gridY < this.gridY / 2) {
                    y = y - (y % this.gridY);
                } else {
                    y = y + this.gridY - (y % this.gridY);
                }
            }

            return {x, y};
        },

        moveAnchor(p, a, x, y) {
            const {x: snapX, y: snapY} = this.snapXY(x, y);

            this.points[p].anchors[a].x = this.points[p].x - snapX;
            this.points[p].anchors[a].y = this.points[p].y - snapY;
        },

        movePoint(p, x, y) {
            const {x: snapX, y: snapY} = this.snapXY(x, y);

            this.points[p].x = snapX;
            this.points[p].y = snapY;
        },

        detectAnchor(x, y) {
            return this.points.reduce((found, point, p) => {
                if (found.p === -1) {
                    if (
                        point.x - point.anchors[0].x - this.pointSize <= x
                        && point.x - point.anchors[0].x + this.pointSize >= x
                        && point.y - point.anchors[0].y - this.pointSize <= y
                        && point.y - point.anchors[0].y + this.pointSize >= y
                    ) {
                        return {p, a: 0};
                    }

                    if (
                        point.x - point.anchors[1].x - this.pointSize <= x
                        && point.x - point.anchors[1].x + this.pointSize >= x
                        && point.y - point.anchors[1].y - this.pointSize <= y
                        && point.y - point.anchors[1].y + this.pointSize >= y
                    ) {
                        return {p, a: 1};
                    }
                }

                return found;
            }, {p: -1, a: -1});
        },

        detectPoint(x, y) {
            return this.points.findIndex(({x: px, y: py}) => {
                return px - this.pointSize <= x
                    && px + this.pointSize >= x
                    && py - this.pointSize <= y
                    && py + this.pointSize >= y;
            });
        },

        async drawGrid() {
            if (this.showGrid) {
                const x = Number.parseInt(this.gridX);
                const y = Number.parseInt(this.gridY);

                this.buffer.canvas.height = y;
                this.buffer.canvas.width = x;

                this.buffer.fillStyle = 'white';
                this.buffer.fillRect(0, 0, x, y);

                this.buffer.strokeStyle = '#808080';
                this.buffer.moveTo(0, 3);
                this.buffer.lineTo(0, 0);
                this.buffer.lineTo(3, 0);
                this.buffer.moveTo(0, y - 2);
                this.buffer.lineTo(0, y);
                this.buffer.moveTo(x - 2, 0);
                this.buffer.lineTo(x, 0);
                this.buffer.stroke();

                const image = new Image;

                return new Promise((resolve, reject) => {
                    image.onload = () => {
                        this.canvas.fillStyle = this.canvas.createPattern(image, 'repeat');
                        this.canvas.fillRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height);

                        resolve();
                    }
                    image.onerror = reject;
                    image.src = this.buffer.canvas.toDataURL();
                });
            }
        },

        drawPath() {
            if (this.points.length > 0) {
                this.canvas.strokeStyle = 'black';
                this.canvas.beginPath();
                this.canvas.moveTo(this.points[0].x, this.points[0].y);
                this.points.forEach((point, p, points) => {
                    if (p > 0) {
                        this.canvas.bezierCurveTo(
                            points[p - 1].x - points[p - 1].anchors[1].x,
                            points[p - 1].y - points[p - 1].anchors[1].y,

                            points[p].x - points[p].anchors[0].x,
                            points[p].y - points[p].anchors[0].y,

                            points[p].x,
                            points[p].y
                        )
                    }
                });
                this.canvas.stroke();
            }
        },

        drawPoint(p) {
            this.canvas.strokeStyle = '#808080';

            this.canvas.strokeRect(this.points[p].x - this.points[p].anchors[0].x - this.pointSize, this.points[p].y - this.points[p].anchors[0].y - this.pointSize, 2 * this.pointSize, 2 * this.pointSize);

            this.canvas.beginPath();
            this.canvas.moveTo(this.points[p].x, this.points[p].y);
            this.canvas.lineTo(this.points[p].x - this.points[p].anchors[0].x, this.points[p].y - this.points[p].anchors[0].y);
            this.canvas.stroke();

            this.canvas.strokeRect(this.points[p].x - this.points[p].anchors[1].x - this.pointSize, this.points[p].y - this.points[p].anchors[1].y - this.pointSize, 2 * this.pointSize, 2 * this.pointSize);

            this.canvas.beginPath();
            this.canvas.moveTo(this.points[p].x, this.points[p].y);
            this.canvas.lineTo(this.points[p].x - this.points[p].anchors[1].x, this.points[p].y - this.points[p].anchors[1].y);
            this.canvas.stroke();

            if (this.modifying === p) {
                this.canvas.strokeStyle = 'red';
            }
            this.canvas.beginPath();
            this.canvas.arc(this.points[p].x, this.points[p].y, this.pointSize, 0, Math.PI * 2, true);
            this.canvas.stroke();
        },

        pointerCancel(event) {
            this.dragging = -1;
        },

        pointerDown(event) {
            const {x, y} = getPointerXY(event, true);

            if (this.mode === 'points') {
                let p = this.detectPoint(x, y);

                if (p >= 0) {
                    this.dragging = p;
                    this.modifying = p;
                    this.anchor = -1;

                    return;
                }

                this.dragging = this.addPoint(x, y);
                this.modifying = this.dragging;
                this.drawPoint(this.modifying, x, y);

                return;
            }

            let {p, a} = this.detectAnchor(x, y);

            if (p >= 0) {
                this.dragging = p;
                this.modifying = p;
                this.anchor = a;
            }
        },

        pointerUp(event) {
            const {x, y} = getPointerXY(event, true);

            if (this.mode === 'points' && this.dragging >= 0) {
                this.movePoint(this.dragging, x, y);
                this.refresh();

                this.dragging = -1;
            }

            if (this.mode === 'anchors' && this.dragging >= 0) {
                this.moveAnchor(this.dragging, this.anchor, x, y);
                this.refresh();

                this.dragging = -1;
            }
        },

        rightClick(event) {
            const {x, y} = getPointerXY(event, true);

            if (this.mode === 'points') {
                let p = this.detectPoint(x, y);
                if (p >= 0) {
                    event.preventDefault();
                    this.points.splice(p, 1);
                    this.dragging = -1;
                    this.modifying = -1;
                    this.anchor = -1;

                    this.refresh();

                    return;
                }
            }

            let {p, a} = this.detectAnchor(x, y);
            if (p >= 0) {
                event.preventDefault();
                this.points[p].anchors[a].x = 0;
                this.points[p].anchors[a].y = 0;

                this.refresh();

                return;
            }
        },

        async refresh() {
            this.canvas.fillStyle = 'white';
            this.canvas.fillRect(0, 0, this.width, this.height);

            await this.drawGrid();

            this.points.forEach(({x, y}, p) => {
                this.drawPoint(p, x, y);
            });

            this.drawPath();
        }
    },

    mounted() {
        this.buffer = document.createElement('canvas').getContext('2d');
        this.canvas = this.$refs['canvas'].getContext('2d');

        this.refresh();
    }
};
</script>
