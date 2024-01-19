class Maze {
    /** @type {MazeNode[]} */
    #nodes;
    /** @type {MazeCarver} */
    #carver;

    /**
     * @param {MazeGeometry} geometry
     * @param {(cells: MazeNode[]) => MazeCarver} carver
     */
    constructor(geometry, carver) {
        this.#nodes = geometry.generate();
        this.#carver = carver(this.#nodes);
    }

    carve() {
        while(!this.isFinishedCarving) this.carveStep();
    }

    carveStep() {
        this.#carver.step();
    }

    /** @type {boolean} */
    get isFinishedCarving() {
        return this.#carver.isFinished;
    }

    /** @type {MazeNode[]} */
    get nodes() {
        return [...this.#nodes];
    }

    /** @type {MazeNode} */
    get lastChangedCell() {
        return this.#carver.lastChangedCell;
    }
}