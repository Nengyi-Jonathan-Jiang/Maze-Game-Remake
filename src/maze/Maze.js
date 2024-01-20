class Maze {
    /** @type {MazeNode[]} */
    #nodes;
    /** @type {MazeCarver} */
    #carver;

    /** @type {MazeNode} */
    #start;
    /** @type {MazeNode} */
    #end;
    /** @type {MazeNode[]} */
    #solutionPath;

    /**
     * @param {MazeGeometry} geometry
     * @param {(cells: MazeNode[]) => MazeCarver} carver
     */
    constructor(geometry, carver) {
        this.#nodes = geometry.generate();
        this.#carver = carver(this.#nodes);

        this.#start = null;
        this.#end = null;
        this.#solutionPath = null;
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

    calculatePath() {
        if(this.#start !== null) return;
        if(!this.isFinishedCarving) return;

        /**
         * BFS for deepest node from root
         * @param {MazeNode} root
         * @returns {[MazeNode, Map<MazeNode, MazeNode>]}
         */
        function findDeepestNode(root) {
            /** @type {Map<MazeNode, MazeNode>} */
            const parent = new Map([[root, null]]);
            const q = [root];
            let node = null;
            while(q.length > 0 && q[0] !== null) {
                const curr = q.shift();
                node = curr;
                for(let child of curr.connectedNeighbors) {
                    if(!parent.has(child)) {
                        q.push(child);
                        parent.set(child, curr);
                    }
                }
            }

            return [node, parent];
        }

        let parent;
        [this.#end] = findDeepestNode(this.nodes[0]);
        [this.#start, parent] = findDeepestNode(this.#end);

        let currNode = this.#start;
        this.#solutionPath = [];
        while(currNode !== null) {
            this.#solutionPath.push(currNode)
            currNode = parent.get(currNode);
        }
    }

    /** @type {MazeNode} */
    get start() {
        return this.#start;
    }
    /** @type {MazeNode} */
    get end() {
        return this.#end;
    }
    /** @type {MazeNode[]} */
    get solutionPath() {
        return [...this.#solutionPath];
    }
}