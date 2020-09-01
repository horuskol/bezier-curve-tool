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

            <span v-if="currentPoint.x">x: {{ currentPoint.x }}</span>
            <span v-if="currentPoint.y">x: {{ currentPoint.y }}</span>
        </div>

        <canvas ref="canvas"
                class="border border-gray-900"
                :height="height"
                :width="width"
                @mousedown="pointerDown"
                @touchstart="pointerDown"
                @mouseup="pointerUp"
                @touchend="pointerUp"
                @mouseupout="pointerCancel"
                @touchendout="pointerCancel"
                @touchcancel="pointerCancel"
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
            modifying: -1,
            mode: 'points',
            points: [],

            gridX: 20,
            gridY: 20,
            showGrid: false,
            snapToGrid: false,

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
            Vue.set(this.points, i, {x: snapX, y: snapY});
            return i;
        },

        snapXY(x, y) {
            if (this.snapToGrid) {
                if (x % this.gridX < this.gridX / 2) {
                    x = x - x % this.gridX;
                } else {
                    x = x + this.gridX - x % this.gridX;
                }

                if (y % this.gridY < this.gridY / 2) {
                    y = y - y % this.gridY;
                } else {
                    y = y + this.gridY - y % this.gridY;
                }
            }

            return {x, y};
        },

        movePoint(p, x, y) {
            const {x: snapX, y: snapY} = this.snapXY(x, y);
            Vue.set(this.points, p, {x: snapX, y: snapY});
        },

        detectPoint(x, y) {
            return this.points.findIndex(({x: px, y: py}) => {
                return px - 3 <= x
                    && px + 3 >= x
                    && py - 3 <= y
                    && py + 3 >= y;
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
                this.points.forEach(({x, y}) => {
                    this.canvas.lineTo(x, y);
                });
                this.canvas.stroke();
            }
        },

        drawPoint(p, x, y) {
            this.canvas.strokeStyle = 'black';
            if (this.modifying === p) {
                this.canvas.strokeStyle = 'red';
            }
            this.canvas.beginPath();
            this.canvas.arc(x, y, 3, 0, Math.PI * 2, true);
            this.canvas.stroke();
        },

        pointerCancel(event) {
            this.dragging = -1;
        },

        pointerDown(event) {
            const {x, y} = getPointerXY(event, true);

            if (this.mode === 'points') {
                let p = -1;
                if ((p = this.detectPoint(x, y)) >= 0) {
                    this.dragging = p;
                    this.modifying = p;
                } else {
                    this.dragging = this.addPoint(x, y);
                    this.modifying = this.dragging;
                    this.drawPoint(this.modifying, x, y);
                }
            }
        },

        pointerUp(event) {
            if (this.dragging >= 0) {
                const {x, y} = getPointerXY(event, true);

                this.movePoint(this.dragging, x, y);
                this.refresh();

                this.dragging = -1;
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
    }
};
</script>
