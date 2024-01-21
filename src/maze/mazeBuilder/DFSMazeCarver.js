class DFSMazeCarver extends MazeCarver {
    /** @type {Set<MazeNode>} */
    #visited;

    /** @type {MazeNode[]} */
    #stack;

    /**
     * @param {MazeNode[]} cells
     */
    constructor(cells) {
        super();
        this.#stack = [randEl(cells)];
        this.#visited = new Set;
    }

    step() {
        while(!this.isFinished) {
            const p = this.#stack[this.#stack.length - 1];
            this.#visited.add(p);

            //Get neighbors
            const neighbors = p.disconnectedNeighbors.filter(i => !this.#visited.has(i));
            if(neighbors.length < 2) {
                this.#stack.pop();
            }
            if(neighbors.length === 0) {
                continue;
            }

            const neighbor = randEl(neighbors);
            p.connectTo(neighbor);

            this.#stack.push(neighbor);

            return;
        }
    }

    get isFinished() {
        return this.#stack.length === 0;
    }

    get lastChangedCell() {
        return this.#stack[this.#stack.length - 1];
    }
}