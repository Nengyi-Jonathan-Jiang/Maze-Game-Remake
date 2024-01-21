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

    /**
     * @param {Sprite} sprite
     * @param {number} x
     * @param {number} y
     */
    drawSprite(sprite, x, y) {
        if(!sprite || !sprite.img) return;
        const { ctx } = this;
        const { width, height, img, sx, sy, sw, sh } = sprite;

        {   // Culling images that are not drawn
            const bbx = Math.min(x - width / 2, x + width / 2);
            const bby = Math.min(y - height / 2, y + height / 2);

            if(bbx >= this.viewportWidth) return;
            if(bby >= this.viewportHeight) return;
            if(bbx + Math.abs(width) <= 0) return;
            if(bby + Math.abs(height) <= 0) return;
        }

        if(sprite.optimized) {
            ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
        }
        else {
            ctx.drawImage(img, sx * img.width, sy * img.height, sw * img.width, sh * img.height, x - width / 2, y - height / 2, width, height);
            sprite.optimize();
        }
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