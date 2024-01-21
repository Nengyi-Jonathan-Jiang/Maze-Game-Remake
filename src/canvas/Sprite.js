/**
 * @typedef {{
 *     img: HTMLImageElement | Promise<HTMLImageElement>,
 *     sx?: number,
 *     sy?: number,
 *     sw?: number,
 *     sh?: number
 * }} SpriteSource
 */

class Sprite {
    /** @type {number} */
    width;
    /** @type {number} */
    height;
    /** @type {SpriteSource} */
    source;
    /** @type {HTMLImageElement} */
    #img;

    #optimized = false;
    #optimizeSuccessful = false;

    /**
     * @param {number} width
     * @param {number} height
     * @param {SpriteSource} source
     */
    constructor(width, height, source) {
        this.width = width;
        this.height = height;
        this.source = source;

        if(source.img instanceof Promise) {
            this.#img = null;
            source.img.then(img => this.#img = img);
        }
        else this.#img = source.img;
    }

    /** @type {number} */
    get sw() {
        const _a = this.source.sw;
        return _a !== null && _a !== void 0 ? _a : 1;
    }

    /** @type {number} */
    get sh() {
        const _a = this.source.sh;
        return _a !== null && _a !== void 0 ? _a : 1;
    }

    /** @type {number} */
    get sx() {
        const _a = this.source.sx;
        return _a !== null && _a !== void 0 ? _a : 0;
    }

    /** @type {number} */
    get sy() {
        const _a = this.source.sy;
        return _a !== null && _a !== void 0 ? _a : 0;
    }

    /** @type {HTMLImageElement} */
    get img() {
        return this.#img;
    }


    /** @type {Map<string, HTMLImageElement>} */
    static #imageCache = new Map;
    /** @param {string} url */
    static async loadImage(url){
        const imageCache = Sprite.#imageCache;
        if (imageCache.has(url))
            return imageCache.get(url);
        const image = document.createElement('img');
        return new Promise(resolve => {
            imageCache.set(url, image);
            image.onload = _ => resolve(image);
            image.src = url;
        });
    }


    static #canvas = document.createElement('canvas');
    static #ctx = Sprite.#canvas.getContext('2d');

    optimize(){
        if(this.optimized) return;

        try {

            const {width, height} = this.img;
            const {sx, sy, sw, sh} = this;

            Sprite.#ctx.clearRect(0, 0, width * sw, height * sh);
            Sprite.#canvas.width = ~~(width * sw);
            Sprite.#canvas.height = ~~(height * sh);
            Sprite.#ctx.drawImage(this.img, width * sx, height * sy, width * sw, height * sh, 0, 0, width * sw, height * sh);

            Sprite.loadImage(Sprite.#canvas.toDataURL()).then(img => this.#img = img)

            this.#optimizeSuccessful = true;
        }
        catch (e) {
            console.warn('Unsuccessful sprite optimization.')
            console.warn(e);
        }
        finally {
            this.#optimized = true;
        }
    }

    get optimized() {
        return this.#optimized;
    }

    get wasOptimizationSuccessful() {
        return this.#optimizeSuccessful;
    }
}