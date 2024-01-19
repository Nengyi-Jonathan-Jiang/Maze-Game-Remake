class Canvas {
    constructor(canvasElement, viewportWidth, viewportHeight) {
        this.canvasElement = canvasElement;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.ctx = canvasElement.getContext('2d');
        this.resizeToDisplaySize();

        this.canvasElement.style.setProperty('--w-scale', viewportWidth);
        this.canvasElement.style.setProperty('--h-scale', viewportHeight);
    }
    resizeToDisplaySize() {
        const { canvasElement, ctx, viewportWidth, viewportHeight } = this;
        const width = canvasElement.width = canvasElement.clientWidth;
        const height = canvasElement.height = canvasElement.clientHeight;
        // ctx.imageSmoothingEnabled = false;
        ctx.setTransform(width / viewportWidth, 0, 0, height / viewportHeight, 0, 0);
    }
    drawSprite(sprite, x, y) {
        if(!sprite || !sprite.img) return;
        const { ctx } = this;
        const { width, height, img, sx, sy, sw, sh } = sprite;
        ctx.drawImage(img, sx * img.width, sy * img.height, sw * img.width, sh * img.height, x, y, width, height);
    }
    clear(color) {
        this.ctx.save();
        this.ctx.resetTransform();
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
        else {
            this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
        this.ctx.restore();
    }
}