
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
}