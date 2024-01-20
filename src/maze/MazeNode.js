class MazeNode {
    /** @type {(MazeNode|null)[]} */
    #neighbors;
    /** @type {(connectedNeighbors: boolean[], node: MazeNode) => Sprite[]} */
    #spriteFunction;
    /** @type {[number, number]} */
    #displayPos;
    /** @type {Set<MazeNode>} */
    #connections;
    /** @type {any} */
    #identifier;


    /**
     * @param identifier
     * @param {[number,number]} displayPos
     * @param {(connectedNeighbors: boolean[], node: MazeNode) => Sprite[]} spriteFunction
     */
    constructor(identifier, displayPos, spriteFunction) {
        this.#spriteFunction = spriteFunction;
        this.#displayPos = displayPos;
        this.#neighbors = [];
        this.#connections = new Set;
        this.#identifier = identifier;
    }

    /** @param {MazeNode[]} neighbors */
    set neighbors(neighbors) {
        this.#neighbors = neighbors;
        this.#connections = new Set;
    }

    /** @param {MazeNode} other */
    connectTo(other) {
        if(!other || !this.#neighbors.includes(other) || !other.#neighbors.includes(this)) {
            throw new Error("Error: connecting two incompatible cells");
        }

        other.#connections.add(this);
        this.#connections.add(other);
    }

    /** @param {MazeNode} other */
    disconnectFrom(other){
        if(!other || !this.#neighbors.includes(other) || !other.#neighbors.includes(this)) {
            throw new Error("Error: disconnecting two incompatible cells");
        }

        other.#connections.delete(this);
        this.#connections.delete(other);
    }

    /** @param {MazeNode} other */
    isConnectedTo(other) {
        return this.#connections.has(other);
    }

    get allNeighbors() {
        return this.#neighbors;
    }

    /** @type {MazeNode[]} */
    get connectedNeighbors() {
        return [...this.#connections].filter(i => !!i);
    }

    /** @type {MazeNode[]} */
    get disconnectedNeighbors() {
        return this.allNeighbors.filter(i => !!i && !this.isConnectedTo(i));
    }

    get identifier() {
        return this.#identifier;
    }

    /** @type {Sprite[]} */
    get sprites() {
        return this.#spriteFunction(this.isEachNeighborConnected, this);
    }

    /** @type {boolean[]} */
    get isEachNeighborConnected() {
        return this.allNeighbors.map(i => this.isConnectedTo(i));
    }

    /** @returns {[number, number]} */
    get displayPos() {
        return [...this.#displayPos];
    }

    toString(recurse = true) {
        return recurse ? `MazeNode{id=${
            JSON.stringify(this.identifier)
        }, connectedTo=[${
            [...this.connectedNeighbors].map(i => i?.toString(false) || null).join(', ')
        }], possibleConnections=[${
            [...this.#neighbors].map(i => i?.toString(false) || null).join(', ')
        }]}` : `MazeNode{${JSON.stringify(this.identifier)}}`
    }
}