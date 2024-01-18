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
}