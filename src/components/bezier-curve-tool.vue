/<template>
    <div class="flex justify-center m-4">
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

            let p = -1;
            if ((p = this.detectPoint(x, y)) >= 0) {
                this.dragging = p;
            } else {
                this.dragging = this.addPoint(x, y);
                this.drawPoint(x, y);
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
        }
    },

    mounted() {
        this.canvas = this.$refs['canvas'].getContext('2d');
    }
};
</script>
