class HexagonalGridMazeGeometry extends MazeGeometry {
    /** @type {number} */
    #size;

    /** @type {Sprite[][]} */
    static MAZE_CELL_TEXTURES = createMatrix((i, j) => new Sprite(
        1.01, 2.01 / Math.sqrt(3), {
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
        /** @type {MazeNode[][]} */
        let result = createMatrix((i, j) => (
            Math.abs(i - j) < this.size
        ) ? new MazeNode(
            [i, j],
            [i + (this.size - j) / 2, (j + 1/2) * Math.sqrt(3) / 2],
            connectedNeighbors => HexagonalGridMazeGeometry.getSprite(connectedNeighbors)
        ) : null, 2 * this.size - 1, 2 * this.size - 1);
        for (let i = 0; i < 2 * this.size - 1; i++) {
            for (let j = 0; j < 2 * this.size - 1; j++) {
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
        return this.size * 2 - 1;
    }

    get displayHeight() {
        return (this.size - 1 / 3) * Math.sqrt(3)
    }


    getDirectionForKey(key) {
        switch (key.toLowerCase()) {
            case 'a':
                return 0;
            case 'd':
                return 1;
            case 'x':
                return 2;
            case 'w':
                return 3;
            case 'z':
                return 4;
            case 'e':
                return 5;
        }
        return null;
    }
}