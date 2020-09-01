/<template>
    <div class="flex justify-center m-4">
        <div class="flex-shrink">
            <div class="flex flex-wrap">
                <h3 class="w-full flex-shrink-0">Mouse control</h3>

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
        </div>

        <canvas ref="canvas"
                class="border"
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
import {getPointerXY} from 'lib/pointers';

export default {
    data() {
        return {
            canvas: null,
            dragging: -1,
            mode: 'points',
            points: [],

            height: 400,
            width: 400
        };
    },

    methods: {
        addPoint(x, y) {
            return this.points.push({x, y}) - 1;
        },

        movePoint(p, x, y) {
            this.points[p] = {x, y};
        },

        detectPoint(x, y) {
            return this.points.findIndex(({x: px, y: py}) => {
                return px - 3 <= x
                    && px + 3 >= x
                    && py - 3 <= y
                    && py + 3 >= y;
            });
        },

        drawPath() {
            this.canvas.beginPath();
            this.canvas.moveTo(this.points[0].x, this.points[0].y);
            this.points.forEach(({x, y}) => {
                this.canvas.lineTo(x, y);
            });
            this.canvas.stroke();
        },

        drawPoint(x, y) {
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
                } else {
                    this.dragging = this.addPoint(x, y);
                    this.drawPoint(x, y);
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

        refresh() {
            this.canvas.fillStyle = 'white';
            this.canvas.fillRect(0, 0, this.width, this.height);

            this.points.forEach(({x, y}) => {
                 this.drawPoint(x, y);
            });
            this.drawPath();
        }
    },

    mounted() {
        this.canvas = this.$refs['canvas'].getContext('2d');
    }
};
</script>
