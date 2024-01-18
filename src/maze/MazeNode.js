class MazeNode {
    /** @type {MazeNode[]} */
    #possibleNeighbors;
    /** @type {Set<MazeNode>} */
    #connections;
    /** @type {Set<MazeNode>} */
    #unusedNeighbors;
    /** @type {any} */
    #identifier;

    constructor(identifier) {
        this.#possibleNeighbors = [];
        this.#connections = new Set;
        this.#unusedNeighbors = new Set;
        this.#identifier = identifier;
    }

    /** @param {MazeNode[]} neighbors */
    set neighbors(neighbors) {
        this.#possibleNeighbors = neighbors;
        this.#connections = new Set;
        this.#unusedNeighbors = new Set(neighbors);
    }

    /** @param {MazeNode} other */
    connectTo(other) {
        if(!this.#possibleNeighbors.includes(other)) {
            throw new Error("Error: connecting two incompatible cells");
        }

        other.#connections.add(this);
        this.#connections.add(other);
        this.#unusedNeighbors.delete(other);
        other.#unusedNeighbors.delete(this);
    }

    isConnectedTo(other) {
        return this.#connections.has(other);
    }

    get connections() {
        return [...this.#connections];
    }

    get unusedNeighbors() {
        return [...this.#unusedNeighbors];
    }

    get identifier() {
        return this.#identifier;
    }
    
    toString() {
        return `MazeNode{data=${
            JSON.stringify(this.identifier)
        }, connectedTo=[${
            [...this.connections].map(i => JSON.stringify(i.identifier)).join(', ')
        }], possibleConnections=[${
            [...this.#possibleNeighbors].map(i => JSON.stringify(i.identifier)).join(', ')
        }]}`
    }
}