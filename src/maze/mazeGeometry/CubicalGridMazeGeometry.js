

// This class is actually a lie! For gameplay purposes, not all cells can be connected to each other up/down.
// Instead, up/down connections alternate in a grid pattern to prevent consecutive tunnels
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
     * @param {boolean} tunnel
     */
    static getSprite([front, back, left, right, up, down]){
        const stairs = up ? [CubicalGridMazeGeometry.GO_UP_IMG] :
            down ? [CubicalGridMazeGeometry.GO_DOWN_IMG]:
            []

        return [...SquareGridMazeGeometry.getSprite([front, back, left, right]), ...stairs];
    }

    generate() {
        /** @type {MazeNode[][][]} */
        let result = createMatrix((i, j, k) => new MazeNode(
            [i, j, k],
            [i, j, k],
            (connectedNeighbors, node) => CubicalGridMazeGeometry.getSprite(connectedNeighbors, node)
        ), this.rows, this.cols, this.lyrs);
        for(let i = 0; i < this.rows; i++) {
            for(let j = 0; j < this.cols; j++) {
                for(let k = 0; k < this.lyrs; k++) {
                    const connectDirection = ((i & 1) ^ (j & 1) ^ (k & 1)) === 0;

                    result[i][j][k].neighbors = [
                        result[i - 1]?.[j]?.[k] || null,
                        result[i + 1]?.[j]?.[k] || null,
                        result[i]?.[j - 1]?.[k] || null,
                        result[i]?.[j + 1]?.[k] || null,

                        // Only allow connections between layers in a grid pattern
                        connectDirection && result[i]?.[j]?.[k - 1] || null,
                        !connectDirection && result[i]?.[j]?.[k + 1] || null
                    ];
                }
            }
        }

        return [].concat(...result.map(i => [].concat(...i)));
    }

    get displayWidth() {
        return this.rows;
    }

    get displayHeight() {
        return this.cols;
    }

    getDirectionForKey(key) {
        switch (key.toLowerCase()) {
            case 'a': return 0;
            case 'd': return 1;
            case 'w': return 2;
            case 's': return 3;
            case ' ': return [4, 5];
        }
        return null;
    }

    get is3d() {
        return true;
    }

    get layers() {
        return this.lyrs;
    }
}