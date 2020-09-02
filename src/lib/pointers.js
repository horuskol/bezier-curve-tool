export function getPointerXY(event, relative = false) {
    let x = 0; let y = 0;

    if (event.clientX) {
        // mouse
        x = relative ? event.offsetX : event.clientX;
        y = relative ? event.offsetY : event.clientY;
    } else {
        // touch
        x = relative ? event.changedTouches[0].clientX - event.target.offsetLeft : event.changedTouches[0].clientX;
        y = relative ? event.changedTouches[0].clientY - event.target.offsetTop : event.changedTouches[0].clientY;
    }

    return {x, y};
}