class Maze {
    /** @type {MazeNode[]} */
    #nodes;
    /** @type {MazeCarver} */
    #carver;

    /** @type {MazeNode} */
    #start;
    /** @type {MazeNode} */
    #end;
    /** @type {Map<MazeNode, MazeNode>} */
    #parent;

    /**
     * @param {MazeGeometry} geometry
     * @param {(cells: MazeNode[]) => MazeCarver} carver
     */
    constructor(geometry, carver) {
        this.#nodes = geometry.generate();
        this.#carver = carver(this.#nodes);

        this.#start = null;
        this.#end = null;
        this.#parent = null;
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

        this.#parent = parent;
    }

    /**
     * @param {MazeNode} currNode
     * @returns {MazeNode[]}
     */
    calculateSolutionFromNode(currNode){
        if(!this.#parent) return [];

        const solutionPath = [];
        while(currNode !== null) {
            solutionPath.push(currNode)
            currNode = this.#parent.get(currNode);
        }
        return solutionPath;
    }

    /** @type {MazeNode} */
    get start() {
        return this.#start;
    }
    /** @type {MazeNode} */
    get end() {
        return this.#end;
    }
}