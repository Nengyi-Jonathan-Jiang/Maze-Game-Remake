class MazeNode {
    /** @type {(MazeNode|null)[]} */
    #neighbors;
    /** @type {(connectedNeighbors: boolean[]) => Sprite[]} */
    #spriteFunction;
    /** @type {[number, number]} */
    #displayPos;
    /** @type {Set<MazeNode>} */
    #connections;
    /** @type {Set<MazeNode>} */
    #unusedNeighbors;
    /** @type {any} */
    #identifier;



    /**
     * @param identifier
     * @param {[number,number]} displayPos
     * @param {(connectedNeighbors: boolean[]) => Sprite[]} spriteFunction
     */
    constructor(identifier, displayPos, spriteFunction) {
        this.#spriteFunction = spriteFunction;
        this.#displayPos = displayPos;
        this.#neighbors = [];
        this.#connections = new Set;
        this.#unusedNeighbors = new Set;
        this.#identifier = identifier;
    }

    /** @param {MazeNode[]} neighbors */
    set neighbors(neighbors) {
        this.#neighbors = neighbors;
        this.#connections = new Set;
        this.#unusedNeighbors = new Set(neighbors);
    }

    /** @param {MazeNode} other */
    connectTo(other) {
        if(!this.#neighbors.includes(other)) {
            throw new Error("Error: connecting two incompatible cells");
        }

        other.#connections.add(this);
        this.#connections.add(other);
        this.#unusedNeighbors.delete(other);
        other.#unusedNeighbors.delete(this);
    }

    /** @param {MazeNode} other */
    isConnectedTo(other) {
        return this.#connections.has(other);
    }

    /** @type {MazeNode[]} */
    get connections() {
        return [...this.#connections];
    }

    /** @type {MazeNode[]} */
    get unusedNeighbors() {
        return [...this.#unusedNeighbors].filter(i => i !== null);
    }

    get identifier() {
        return this.#identifier;
    }

    /** @type {Sprite[]} */
    get sprite() {
        return this.#spriteFunction.apply(null, this.#neighbors.map(i => this.isConnectedTo(i)));
    }

    /** @returns {[number, number]} */
    get displayPos() {
        return [...this.#displayPos];
    }

    toString(recurse = true) {
        return recurse ? `MazeNode{id=${
            JSON.stringify(this.identifier)
        }, connectedTo=[${
            [...this.connections].map(i => i.toString(false)).join(', ')
        }], possibleConnections=[${
            [...this.#neighbors].map(i => i.toString(false)).join(', ')
        }]}` : `MazeNode{${JSON.stringify(this.identifier)}}`
    }
}