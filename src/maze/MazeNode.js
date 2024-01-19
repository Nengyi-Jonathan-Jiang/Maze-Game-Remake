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
        if(other === null || !this.#neighbors.includes(other) || !other.#neighbors.includes(this)) {
            throw new Error("Error: connecting two incompatible cells");
        }

        other.#connections.add(this);
        this.#connections.add(other);
    }

    /** @param {MazeNode} other */
    isConnectedTo(other) {
        return this.#connections.has(other);
    }

    get allNeighbors() {
        return this.#neighbors;
    }

    /** @type {MazeNode[]} */
    get connections() {
        return [...this.#connections];
    }

    /** @type {MazeNode[]} */
    get unusedNeighbors() {
        return this.allNeighbors.filter(i => i !== null && !this.isConnectedTo(i));
    }

    get identifier() {
        return this.#identifier;
    }

    /** @type {Sprite[]} */
    get sprites() {
        return this.#spriteFunction(this.connectedNeighbors, this);
    }

    /** @type {boolean[]} */
    get connectedNeighbors() {
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
            [...this.connections].map(i => i?.toString(false) || null).join(', ')
        }], possibleConnections=[${
            [...this.#neighbors].map(i => i?.toString(false) || null).join(', ')
        }]}` : `MazeNode{${JSON.stringify(this.identifier)}}`
    }
}