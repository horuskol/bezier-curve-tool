export function getPointerXY(event, relative = false) {
    let x = 0; let y = 0;

    if (event.clientX) {
        // mousedown
        x = relative ? event.offsetX : event.clientX;
        y = relative ? event.offsetY : event.clientY;
    } else {
        // touchend
        x = relative ? event.changedTouches[0].offsetX : event.changedTouches[0].clientX;
        y = relative ? event.changedTouches[0].offsetY : event.changedTouches[0].clientY;
    }

    return {x, y};
}