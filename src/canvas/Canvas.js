class Canvas {
    /** @type {HTMLCanvasElement | null}*/
    #canvasElement = null;
    /** @type {CanvasRenderingContext2D | null} */
    #ctx = null;

    /** @type */
    #viewportWidth = 16;
    #viewportHeight = 9;

    /**
     * @param {HTMLElement} canvasElement
     * @param {number} [viewportWidth]
     * @param {number} [viewportHeight]
     */
    constructor(canvasElement, viewportWidth, viewportHeight) {
        this.el = canvasElement;
        viewportWidth && (this.viewportWidth = viewportWidth);
        viewportHeight && (this.viewportHeight = viewportHeight);
    }

    /** @param {HTMLCanvasElement | null} canvasElement */
    set el(canvasElement) {
        this.#canvasElement = canvasElement;

        if(!this.#canvasElement) {
            this.#ctx = null;
            return;
        }

        this.#ctx = canvasElement.getContext('2d');
        this.#canvasElement.style.setProperty('--w-scale', `${this.viewportWidth}`);
        this.#canvasElement.style.setProperty('--h-scale', `${this.viewportHeight}`);
        this.resizeToDisplaySize();
    }

    /** @type {CanvasRenderingContext2D} */
    get ctx() {
        return this.#ctx;
    }

    /** @param {function(CanvasRenderingContext2D):any} func */
    withCtx(func) {
        this.ctx && func(this.ctx);
    }

    get viewportWidth() {
        return this.#viewportWidth;
    }

    /** @param {number} viewportWidth */
    set viewportWidth(viewportWidth) {
        this.#viewportWidth = viewportWidth;
        if(this.canvasElement) {
            this.canvasElement.style.setProperty('--w-scale', `${this.viewportWidth}`);
            this.resizeToDisplaySize();
        }
    }

    get viewportHeight() {
        return this.#viewportHeight;
    }

    /** @param {number} viewportHeight */
    set viewportHeight(viewportHeight) {
        this.#viewportHeight = viewportHeight;
        if(this.canvasElement) {
            this.canvasElement.style.setProperty('--h-scale', `${this.viewportHeight}`);
            this.resizeToDisplaySize();
        }
    }

    /** @type {HTMLCanvasElement} */
    get canvasElement() {
        return this.#canvasElement;
    }

    resizeToDisplaySize() {
        const { canvasElement, ctx, viewportWidth, viewportHeight } = this;

        if(!canvasElement) return;

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
        if(!this.canvasElement || !sprite || !sprite.img) return;
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

        if(sprite.wasOptimizationSuccessful) {
            ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
        }
        else {
            ctx.drawImage(img, sx * img.width, sy * img.height, sw * img.width, sh * img.height, x - width / 2, y - height / 2, width, height);
            sprite.optimize();
        }
    }
    clear(color) {
        if(!this.ctx) return;

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