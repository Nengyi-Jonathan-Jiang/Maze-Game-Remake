/**
 * @typedef {{
 *     img: HTMLImageElement,
 *     sx?: number,
 *     sy?: number,
 *     sw?: number,
 *     sh?: number
 * }} SpriteSoruce
 */

class Sprite {
    /** @type {number} */
    width;
    /** @type {number} */
    height;
    /** @type {SpriteSoruce} */
    source;

    /**
     * @param {number} width
     * @param {number} height
     * @param {SpriteSoruce} source
     */
    constructor(width, height, source) {
        this.width = width;
        this.height = height;
        this.source = source;
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
        return this.source.img;
    }


    /** @type {Map<string, HTMLImageElement>} */
    #imageCache = new Map;
    /** @param {string} url */
    static async loadImage(url){
        if (this.#imageCache.has(url))
            return this.#imageCache.get(url);
        const image = document.createElement('img');
        return new Promise(resolve => {
            this.#imageCache.set(url, image);
            image.onload = _ => resolve(image);
            image.src = url;
        });
    }
}