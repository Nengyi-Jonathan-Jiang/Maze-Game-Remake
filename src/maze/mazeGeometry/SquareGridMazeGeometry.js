class SquareGridMazeGeometry extends MazeGeometry {
    #rows; #cols;

    constructor(rows, cols) {
        super();
        this.#rows = rows;
        this.#cols = cols;
    }

    get rows() { return this.#rows }
    get cols() { return this.#cols }

    generate() {
        /** @type {MazeNode[][]} */
        let result = createMatrix((i, j) => new MazeNode([i, j]), this.rows, this.cols);
        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                let neighbors = [];
                if(i > 0) {
                    neighbors.push(result[i - 1][j])
                }
                if(i < this.rows - 1) {
                    neighbors.push(result[i + 1][j])
                }
                if(j > 0) {
                    neighbors.push(result[i][j - 1])
                }
                if(j < this.cols - 1) {
                    neighbors.push(result[i][j + 1])
                }
                result[i][j].neighbors = neighbors;
            }
        }

        return [].concat(...result);
    }
}