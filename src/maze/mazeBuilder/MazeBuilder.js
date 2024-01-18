/** @interface */
class MazeBuilder {
    /**
     * @abstract
     * @param {MazeNode[]} cells
     * @returns {MazeNode[]}
     */
    build(cells){}
}