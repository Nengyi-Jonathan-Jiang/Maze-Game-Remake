class Maze {
    /** @type {MazeNode[]} */
    #cells;
    /** @type {MazeCarver} */
    #carver;

    /**
     * @param {MazeGeometry} geometry
     * @param {(cells: MazeNode[]) => MazeCarver} carver
     */
    constructor(geometry, carver) {
        this.#cells = geometry.generate();
        this.#carver = carver(this.#cells);
    }
}