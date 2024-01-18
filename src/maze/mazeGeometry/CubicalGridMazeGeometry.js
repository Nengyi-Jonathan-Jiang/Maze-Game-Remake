class CubicalGridMazeGeometry extends MazeGeometry {
    #rows; #cols; #lyrs;


    static GO_UP_IMG = new Sprite(1, 1, {img: Sprite.loadImage('res/Up.png')});
    static GO_DOWN_IMG = new Sprite(1, 1, {img: Sprite.loadImage('res/Down.png')});

    constructor(rows, cols, lyrs) {
        super();
        this.#rows = rows;
        this.#cols = cols;
        this.#lyrs = lyrs;
    }

    get rows() { return this.#rows }
    get cols() { return this.#cols }
    get lyrs() { return this.#lyrs }

    /**
     * @param {boolean} front
     * @param {boolean} back
     * @param {boolean} left
     * @param {boolean} right
     * @param {boolean} top
     * @param {boolean} bottom
     */
    static getSprite([front, back, left, right, top, bottom]){
        const stairs = [
            ...(top ? [CubicalGridMazeGeometry.GO_UP_IMG] : []),
            ...(bottom ? [CubicalGridMazeGeometry.GO_DOWN_IMG] : []),
        ]

        return [...SquareGridMazeGeometry.getSprite([front, back, left, right]), ...stairs];
    }

    generate() {
        /** @type {MazeNode[][][]} */
        let result = createMatrix((i, j, k) => new MazeNode(
            [i, j, k],
            [i, j],
            connectedNeighbors => CubicalGridMazeGeometry.getSprite(connectedNeighbors)
        ), this.rows, this.cols, this.lyrs);
        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                for(let k = 0; k < this.cols; k++) {
                    let neighbors = [];
                    if (i > 0) {
                        neighbors.push(result[i - 1][j][k])
                    }
                    if (i < this.rows - 1) {
                        neighbors.push(result[i + 1][j][k])
                    }
                    if (j > 0) {
                        neighbors.push(result[i][j - 1][k])
                    }
                    if (j < this.cols - 1) {
                        neighbors.push(result[i][j + 1][k])
                    }
                    if (k > 0) {
                        neighbors.push(result[i][j][k - 1])
                    }
                    if (k < this.lyrs - 1) {
                        neighbors.push(result[i][j][k + 1])
                    }
                    result[i][j][k].neighbors = neighbors;
                }
            }
        }

        return [].concat(...result.map(i => [].concat(...i)));
    }
}