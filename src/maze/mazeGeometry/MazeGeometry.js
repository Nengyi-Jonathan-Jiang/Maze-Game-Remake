
/** @interface */
class MazeGeometry {
    /**
     * @abstract
     * @returns {MazeNode[]}
     */
    generate(){}

    /**
     * @abstract
     * @returns {number}
     */
    get displayWidth() {}

    /**
     * @abstract
     * @returns {number}
     */
    get displayHeight() {}

    /**
     * @abstract
     * @param {string} key
     * @returns {number | number[] | null}
     */
    getDirectionForKey(key) {}

    get is3d() {
        return false;
    }

    get layers() {
        return 1;
    }
}