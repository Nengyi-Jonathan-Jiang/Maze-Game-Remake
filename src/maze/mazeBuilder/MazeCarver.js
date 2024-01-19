/** @interface */
class MazeCarver {
    /** @abstract */
    step(){}

    /**
     * @abstract
     * @returns {boolean}
     */
    get isFinished(){}

    /**
     * @abstract
     * @returns {MazeNode}
     */
    get lastChangedCell() {}
}