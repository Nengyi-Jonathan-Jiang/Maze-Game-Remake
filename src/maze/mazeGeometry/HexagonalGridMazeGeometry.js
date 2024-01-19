class HexagonalGridMazeGeometry extends MazeGeometry {
    /** @type {number} */
    #size;

    /** @type {Sprite[][]} */
    static MAZE_CELL_TEXTURES = createMatrix((i, j) => new Sprite(
        2 / Math.sqrt(3), 1, {
            img: Sprite.loadImage('res/hex-cells.png'), sx: i * 0.125, sy: j * 0.125, sw: 0.125, sh: 0.125
        }
    ), 8, 8);

    /**
     * @param {boolean} t
     * @param {boolean} b
     * @param {boolean} tr
     * @param {boolean} bl
     * @param {boolean} tl
     * @param {boolean} br
     */
    static getSprite([t, b, tr, bl, tl, br]){
        return [HexagonalGridMazeGeometry.MAZE_CELL_TEXTURES[+t + (+b << 1) + (+tr << 2)][+bl + (+tl << 1) + (+br << 2)]];
    }

    constructor(size) {
        super();
        this.#size = size;
    }

    get size() {
        return this.#size
    }

    // This is magic. Don't question it.
    generate() {
        /** @type {MazeNode[][]} */
        let result = createMatrix((i, j) => (
            Math.abs(i - j) < this.size
        ) ? new MazeNode(
            [i, j],
            [i * Math.sqrt(3) / 2, j + (this.size - i - 1) / 2],
            connectedNeighbors => HexagonalGridMazeGeometry.getSprite(connectedNeighbors)
        ) : null, 2 * this.size - 1, 2 * this.size - 1);
        for (let i = 0; i < 2 * this.size - 1; i++) {
            for (let j = 0; j < 2 * this.size - 1; j++) {
                if(result[i][j]) result[i][j].neighbors = [
                    result[i]?.[j - 1] ?? null,
                    result[i]?.[j + 1] ?? null,
                    result[i + 1]?.[j] ?? null,
                    result[i - 1]?.[j] ?? null,
                    result[i + 1]?.[j + 1] ?? null,
                    result[i - 1]?.[j - 1] ?? null,
                ];
            }
        }

        return [].concat(...result).filter(i => i !== null);
    }

    get displayWidth() {
        return (this.size - 1/3) * Math.sqrt(3)
    }
    get displayHeight() {
        return this.size * 2 - 1
    }
}