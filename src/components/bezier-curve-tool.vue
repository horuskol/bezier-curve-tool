/<template>
    <div class="flex justify-center m-4">
        <canvas ref="canvas"
                class="border"
                width="400"
                height="400"
                @mouseup="pointerUp"
                @touchend="pointerUp"
        />
    </div>
</template>

<script>
import {getPointerXY} from 'lib/pointers';

export default {
    data() {
        return {
            canvas: null,
            points: []
        };
    },

    methods: {
        addPoint(x, y) {
            this.points.push({x, y});
        },

        drawPoint(x, y) {
            this.canvas.beginPath();
            this.canvas.arc(x, y, 3, 0, Math.PI * 2, true);
            this.canvas.stroke();
        },

        pointerUp(event) {
            const {x, y} = getPointerXY(event, true);

            this.addPoint(x, y);
            this.drawPoint(x, y);
        }
    },

    mounted() {
        this.canvas = this.$refs['canvas'].getContext('2d');
    }
};
</script>
