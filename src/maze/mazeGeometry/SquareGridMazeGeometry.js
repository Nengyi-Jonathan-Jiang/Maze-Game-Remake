class SquareGridMazeGeometry extends MazeGeometry {
    /** @type {number} */
    #rows;
    /** @type {number} */
    #cols;

    /** @type {Sprite[][]} */
    static MAZE_CELL_TEXTURES = createMatrix((i, j) => {
        new Sprite(1, 1, {
            img: null, sx: i * 0.25, sy: j * 0.25, sw: 0.25, sh: 0.25
        })
    }, 4, 4);

    static {
        Sprite.loadImage('res/Cells.png').then(img => {
            this.MAZE_CELL_TEXTURES.forEach(i => i.forEach(j => j.source.img = img));
        })
    }

    constructor(rows, cols) {
        super();
        this.#rows = rows;
        this.#cols = cols;
    }

    get rows() {
        return this.#rows
    }

    get cols() {
        return this.#cols
    }

    generate() {
        /** @type {MazeNode[][]} */
        let result = createMatrix(
            (i, j) => new MazeNode([i, j], [i, j], ([front, back, left, right]) => {
                const hash = (+right << 3) + (+back << 2) + (+left << 1) + (+front);
                const magicArray = [
                    [0b1111, 0b0111, 0b0101, 0b1101],
                    [0b1011, 0b0011, 0b0001, 0b1001],
                    [0b1010, 0b0010, 0b0000, 0b1000],
                    [0b1110, 0b0110, 0b0100, 0b1100]
                ];
                for(let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        if (hash === magicArray[i][j]) {
                            return [SquareGridMazeGeometry.MAZE_CELL_TEXTURES[i][j]];
                        }
                    }
                }
                return [];
            }),
            this.rows, this.cols
        );
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let neighbors = [];
                if (i > 0) {
                    neighbors.push(result[i - 1][j])
                } else neighbors.push(null)
                if (i < this.rows - 1) {
                    neighbors.push(result[i + 1][j])
                } else neighbors.push(null)
                if (j > 0) {
                    neighbors.push(result[i][j - 1])
                } else neighbors.push(null)
                if (j < this.cols - 1) {
                    neighbors.push(result[i][j + 1])
                } else neighbors.push(null)
                result[i][j].neighbors = neighbors;
            }
        }

        return [].concat(...result);
    }
}