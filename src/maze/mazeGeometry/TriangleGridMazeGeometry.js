class TriangleGridMazeGeometry extends MazeGeometry {
    /** @type {number} */
    #size;

    // TODO: change

    /** @type {Sprite[][]} */
    static MAZE_CELL_TEXTURES = createMatrix((i, j) => new Sprite(
        1, 2 / Math.sqrt(3), {
            img: Sprite.loadImage('res/hex-cells.png'), sx: i * 0.125, sy: j * 0.125, sw: 0.125, sh: 0.125
        }
    ), 8, 8);

    /**
     * @param {boolean} l
     * @param {boolean} r
     * @param {boolean} tr
     * @param {boolean} bl
     * @param {boolean} tl
     * @param {boolean} br
     */
    static getSprite([l, r, tr, bl, tl, br]) {
        return [HexagonalGridMazeGeometry.MAZE_CELL_TEXTURES
            [+br + (+tr << 1) + (+bl << 2)]
            [+l + (+r << 1) + (+tl << 2)]
        ];
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
        const S = this.size * 2 - 1;

        /** @type {MazeNode[][]} */
        let result = createMatrix((i, j) => (
                   2 - (i + S - 1) % 3 !== j % 3
                && 2 * i - j < S + 1
                && 2 * (i + j) > S - 2
                && 2 * j - i < S + 1
        ) ? new MazeNode(
            [i, j],
            [i + (this.size - j) / 2, j * Math.sqrt(3) / 2 + 1/2],
            connectedNeighbors => HexagonalGridMazeGeometry.getSprite(connectedNeighbors)
        ) : null, S, S);
        for (let i = 0; i < S; i++) {
            for (let j = 0; j < S; j++) {
                if (result[i][j]) result[i][j].neighbors = [
                    result[i - 1]?.[j] ?? null,
                    result[i + 1]?.[j] ?? null,
                    result[i + 1]?.[j + 1] ?? null,
                    result[i - 1]?.[j - 1] ?? null,
                    result[i]?.[j + 1] ?? null,
                    result[i]?.[j - 1] ?? null,
                ];
            }
        }

        return [].concat(...result).filter(i => i !== null);
    }

    get displayWidth() {
        return (this.size * 3 + 1) / 2;
    }

    get displayHeight() {
        return (this.size * 3 + 1) / Math.sqrt(3);
    }

    getDirectionForKey(key) {
        switch (key.toLowerCase()) {
            case 'w':
                return [3, 5];
            case 'a':
                return 0;
            case 's':
                return [2, 4];
            case 'd':
                return 1;
        }
        return null;
    }
}