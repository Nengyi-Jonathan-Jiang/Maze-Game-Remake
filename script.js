alert('WASD to move, E to go down a layer, Q to go up a layer. Get to the trophy.');
const loadImage = (() => {
    const imageCache = new Map;
    return async function loadImage(url) {
        if (imageCache.has(url))
            return imageCache.get(url);
        const image = document.createElement('img');
        return new Promise(resolve => {
            imageCache.set(url, image);
            image.onload = _ => resolve(image);
            image.src = url;
        });
    };
})();
class Sprite {
    constructor(width, height, source) {
        this.width = width;
        this.height = height;
        this.source = source;
    }
    get sw() {
        var _a;
        return (_a = this.source.sw) !== null && _a !== void 0 ? _a : 1;
    }
    get sh() {
        var _a;
        return (_a = this.source.sh) !== null && _a !== void 0 ? _a : 1;
    }
    get sx() {
        var _a;
        return (_a = this.source.sx) !== null && _a !== void 0 ? _a : 0;
    }
    get sy() {
        var _a;
        return (_a = this.source.sy) !== null && _a !== void 0 ? _a : 0;
    }
    get img() {
        return this.source.img;
    }
}
class Canvas {
    constructor(canvasElement, viewportWidth, viewportHeight) {
        this.canvasElement = canvasElement;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.ctx = canvasElement.getContext('2d');
    }
    resizeToDisplaySize() {
        const { canvasElement, ctx, viewportWidth, viewportHeight } = this;
        const width = canvasElement.width = canvasElement.clientWidth;
        const height = canvasElement.height = canvasElement.clientHeight;
        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(width / viewportWidth, 0, 0, height / viewportHeight, 0, 0);
    }
    drawSprite(sprite, x, y) {
        const { ctx } = this;
        const { width, height, img, sx, sy, sw, sh } = sprite;
        ctx.drawImage(img, sx * img.width, sy * img.height, sw * img.width, sh * img.height, x, y, width, height);
        // ctx.strokeStyle = "#f00";
        // ctx.lineWidth = 0.01;
        // ctx.strokeRect(x, y, width, height);
    }
    clear(color) {
        this.ctx.save();
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
        else {
            this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
        this.ctx.restore();
    }
}
function createSSet(values) {
    return new Map(values);
}
function createMatrix(rows, cols, lyrs, value) {
    return new Array(rows).fill(null).map((_, row) => new Array(cols).fill(null).map((_, col) => new Array(lyrs).fill(null).map((_, lyr) => (value instanceof Function ?
        value(row, col, lyr) :
        value !== undefined ?
            value :
            null))));
}
function randInt(size) {
    return ~~(Math.random() * size);
}
function GetRandomElement(l) {
    const arr = [...l];
    return arr[randInt(arr.length)];
}
class MazeDataCell {
    constructor(r, c, l) {
        this.Row = r;
        this.Col = c;
        this.Lyr = l;
        this.reset();
    }
    reset() {
        this._wallF = this._wallB = this._wallL = this._wallR = this._wallU = this._wallD = true;
    }
    HasFrontWall() {
        return this._wallF;
    }
    HasBackWall() {
        return this._wallB;
    }
    HasLeftWall() {
        return this._wallL;
    }
    HasRightWall() {
        return this._wallR;
    }
    HasTopWall() {
        return this._wallU;
    }
    HasBottomWall() {
        return this._wallD;
    }
    RemoveFrontWall() {
        this._wallF = false;
    }
    RemoveBackWall() {
        this._wallB = false;
    }
    RemoveLeftWall() {
        this._wallL = false;
    }
    RemoveRightWall() {
        this._wallR = false;
    }
    RemoveTopWall() {
        this._wallU = false;
    }
    RemoveBottomWall() {
        this._wallD = false;
    }
}
var Neighbor;
(function (Neighbor) {
    Neighbor[Neighbor["Front"] = 0] = "Front";
    Neighbor[Neighbor["Left"] = 1] = "Left";
    Neighbor[Neighbor["Back"] = 2] = "Back";
    Neighbor[Neighbor["Right"] = 3] = "Right";
    Neighbor[Neighbor["Top"] = 4] = "Top";
    Neighbor[Neighbor["Bottom"] = 5] = "Bottom";
})(Neighbor || (Neighbor = {}));
;
const ALL_NEIGHBORS = [
    Neighbor.Front, Neighbor.Left, Neighbor.Back, Neighbor.Right, Neighbor.Top, Neighbor.Bottom
];
function nextInDirection(row, col, lyr, direction) {
    switch (direction) {
        case Neighbor.Front:
            return [row - 1, col, lyr];
        case Neighbor.Back:
            return [row + 1, col, lyr];
        case Neighbor.Left:
            return [row, col - 1, lyr];
        case Neighbor.Right:
            return [row, col + 1, lyr];
        case Neighbor.Top:
            return [row, col, lyr - 1];
        case Neighbor.Bottom:
            return [row, col, lyr + 1];
        default:
            throw new Error("Invalid direction");
    }
}
function opposite(direction) {
    switch (direction) {
        case Neighbor.Front: return Neighbor.Back;
        case Neighbor.Back: return Neighbor.Front;
        case Neighbor.Left: return Neighbor.Right;
        case Neighbor.Right: return Neighbor.Left;
        case Neighbor.Top: return Neighbor.Bottom;
        case Neighbor.Bottom: return Neighbor.Top;
        default:
            throw new Error("Invalid direction");
    }
}
class MazeData {
    constructor(size, layers) {
        this.Size = size;
        this.Layers = layers;
        this._grid = createMatrix(size, size, layers);
        for (let row = 0; row < size; row++)
            for (let col = 0; col < size; col++)
                for (let layer = 0; layer < size; layer++)
                    this._grid[row][col][layer] = new MazeDataCell(row, col, layer);
        this.Restart();
    }
    Restart() {
        for (let a of this._grid)
            for (let b of a)
                for (let cell of b) {
                    cell.reset();
                }
    }
    GetNeighbors(row, col, lyr, valid) {
        const neighbors = [];
        if (row > 0 && valid([row - 1, col, lyr], Neighbor.Front))
            neighbors.push(Neighbor.Front);
        if (row + 1 < this.Size && valid([row + 1, col, lyr], Neighbor.Back))
            neighbors.push(Neighbor.Back);
        if (col > 0 && valid([row, col - 1, lyr], Neighbor.Left))
            neighbors.push(Neighbor.Left);
        if (col + 1 < this.Size && valid([row, col + 1, lyr], Neighbor.Right))
            neighbors.push(Neighbor.Right);
        if (lyr > 0 && valid([row, col, lyr - 1], Neighbor.Top))
            neighbors.push(Neighbor.Top);
        if (lyr + 1 < this.Layers && valid([row, col, lyr + 1], Neighbor.Bottom))
            neighbors.push(Neighbor.Bottom);
        return neighbors;
    }
    RemoveNeighborWall(neighbor, row, col, lyr) {
        switch (neighbor) {
            case Neighbor.Front:
                this.RemoveWallF(row, col, lyr);
                return [row - 1, col, lyr];
            case Neighbor.Back:
                this.RemoveWallB(row, col, lyr);
                return [row + 1, col, lyr];
            case Neighbor.Left:
                this.RemoveWallL(row, col, lyr);
                return [row, col - 1, lyr];
            case Neighbor.Right:
                this.RemoveWallR(row, col, lyr);
                return [row, col + 1, lyr];
            case Neighbor.Top:
                this.RemoveWallU(row, col, lyr);
                return [row, col, lyr - 1];
            case Neighbor.Bottom:
                this.RemoveWallD(row, col, lyr);
                return [row, col, lyr + 1];
            default:
                throw new Error("Invalid Neighbor to Remove");
        }
    }
    HasNeighbor(row, col, lyr, neighbor) {
        switch (neighbor) {
            case Neighbor.Front:
                return !this._grid[row][col][lyr].HasFrontWall();
            case Neighbor.Back:
                return !this._grid[row][col][lyr].HasBackWall();
            case Neighbor.Left:
                return !this._grid[row][col][lyr].HasLeftWall();
            case Neighbor.Right:
                return !this._grid[row][col][lyr].HasRightWall();
            case Neighbor.Top:
                return !this._grid[row][col][lyr].HasTopWall();
            case Neighbor.Bottom:
                return !this._grid[row][col][lyr].HasBottomWall();
            default:
                throw new Error("Invalid Neighbor");
        }
    }
    GetNeighbor(neighbor, row, col, lyr) {
        switch (neighbor) {
            case Neighbor.Front:
                return [row - 1, col, lyr];
            case Neighbor.Back:
                return [row + 1, col, lyr];
            case Neighbor.Left:
                return [row, col - 1, lyr];
            case Neighbor.Right:
                return [row, col + 1, lyr];
            case Neighbor.Top:
                return [row, col, lyr - 1];
            case Neighbor.Bottom:
                return [row, col, lyr + 1];
            default:
                throw new Error("Invalid Neighbor");
        }
    }
    getCell(row, col, lyr) {
        return this._grid[row][col][lyr];
    }
    RemoveWallF(row, col, lyr) {
        this._grid[row][col][lyr].RemoveFrontWall();
        this._grid[row - 1][col][lyr].RemoveBackWall();
    }
    RemoveWallB(row, col, lyr) {
        this._grid[row][col][lyr].RemoveBackWall();
        this._grid[row + 1][col][lyr].RemoveFrontWall();
    }
    RemoveWallL(row, col, lyr) {
        this._grid[row][col][lyr].RemoveLeftWall();
        this._grid[row][col - 1][lyr].RemoveRightWall();
    }
    RemoveWallR(row, col, lyr) {
        this._grid[row][col][lyr].RemoveRightWall();
        this._grid[row][col + 1][lyr].RemoveLeftWall();
    }
    RemoveWallU(row, col, lyr) {
        this._grid[row][col][lyr].RemoveTopWall();
        this._grid[row][col][lyr - 1].RemoveBottomWall();
    }
    RemoveWallD(row, col, lyr) {
        this._grid[row][col][lyr].RemoveBottomWall();
        this._grid[row][col][lyr + 1].RemoveTopWall();
    }
}
const MAZE_IMG = await loadImage('res/Cells.png');
const WIN_SPRITE = new Sprite(1, 1, { img: await loadImage('res/Finish.png') });
const PLAYER_SPRITE = new Sprite(1, 1, { img: await loadImage('res/Player.png') });
const GO_UP_IMG = await loadImage('res/Up.png');
const GO_DOWN_IMG = await loadImage('res/Down.png');
const MAZE_CELL_TEXTURES = (() => {
    const img = MAZE_IMG;
    const textures = new Array(16).fill(null);
    const arr = [
        [0b1111, 0b0111, 0b0101, 0b1101],
        [0b1011, 0b0011, 0b0001, 0b1001],
        [0b1010, 0b0010, 0b0000, 0b1000],
        [0b1110, 0b0110, 0b0100, 0b1100]
    ];
    for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++) {
            textures[arr[i][j]] = new Sprite(1, 1, {
                img, sx: i * 0.25, sy: j * 0.25, sw: 0.25, sh: 0.25
            });
        }
    return textures;
})();
class MazeBuilder {
    constructor(size, layers) {
        this.size = size;
        this.layers = layers;
        this.cell_sprites = createMatrix(this.size, this.size, this.layers);
        this._mazeData = new MazeData(this.size, this.layers);
        this.generate();
    }
    generate() {
        const { start, end } = this.carveMaze();
        this.start = start;
        this.end = end;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                for (let k = 0; k < this.layers; k++) {
                    const c = this._mazeData.getCell(i, j, k);
                    const wallsIdx = (+c.HasRightWall() << 3)
                        + (+c.HasBackWall() << 2)
                        + (+c.HasLeftWall() << 1)
                        + (+c.HasFrontWall());
                    this.cell_sprites[i][j][k] = MazeBuilder.MazeCellTextures[wallsIdx];
                }
            }
        }
    }
    carveMaze() {
        console.log('carving maze');
        // TODO: implement loop-erased maze generation algorithm?
        const visited = createMatrix(this.size, this.size, this.layers);
        const unvisited = new Set;
        visited.forEach((s, i) => s.forEach((t, j) => t.forEach((_, k) => unvisited.add([i, j, k].toString()))));
        const stk = [];
        const dStk = [];
        const start = [randInt(this.size), randInt(this.size), 0];
        let end = start;
        let maxDepth = 0;
        stk.push(start);
        dStk.push(0);
        while (stk.length > 0) {
            const p = stk[stk.length - 1];
            const depth = dStk[dStk.length - 1];
            if (depth > maxDepth) {
                end = p;
                maxDepth = depth;
            }
            const row = p[0], col = p[1], lyr = p[2];
            visited[row][col][lyr] = true;
            //Get neighbors
            const neighbors = this._mazeData.GetNeighbors(row, col, lyr, p => !visited[p[0]][p[1]][p[2]]);
            if (neighbors.length <= 1) {
                stk.pop();
                dStk.pop();
            }
            if (neighbors.length === 0)
                continue;
            // Don't prefer inter-layer movement
            if (neighbors.includes(Neighbor.Front) || neighbors.includes(Neighbor.Back)
                || neighbors.includes(Neighbor.Left) || neighbors.includes(Neighbor.Right)) {
                if (neighbors.includes(Neighbor.Top) && Math.random() > 0.3) {
                    neighbors.splice(neighbors.indexOf(Neighbor.Top), 1);
                }
                if (neighbors.includes(Neighbor.Bottom) && Math.random() > 0.3) {
                    neighbors.splice(neighbors.indexOf(Neighbor.Bottom), 1);
                }
            }
            const newPos = this._mazeData.RemoveNeighborWall(neighbors[randInt(neighbors.length)], row, col, lyr);
            stk.push(newPos);
            dStk.push(depth + 1);
        }
        return { start, end };
    }
    CanMove(x, y, z, neighbor) {
        let cell = this._mazeData.getCell(x, y, z);
        switch (neighbor) {
            case Neighbor.Front:
                return !cell.HasFrontWall();
            case Neighbor.Back:
                return !cell.HasBackWall();
            case Neighbor.Left:
                return !cell.HasLeftWall();
            case Neighbor.Right:
                return !cell.HasRightWall();
            case Neighbor.Top:
                return !cell.HasTopWall();
            case Neighbor.Bottom:
                return !cell.HasBottomWall();
        }
    }
    draw(canvas, currLayer) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.cell_sprites[i][j][currLayer]) {
                    canvas.drawSprite(this.cell_sprites[i][j][currLayer], i, j);
                    const goUp = !this._mazeData.getCell(i, j, currLayer).HasTopWall();
                    const goDown = !this._mazeData.getCell(i, j, currLayer).HasBottomWall();
                    if (goDown)
                        canvas.drawSprite(new Sprite(1, 1, { img: GO_DOWN_IMG }), i, j);
                    if (goUp)
                        canvas.drawSprite(new Sprite(1, 1, { img: GO_UP_IMG }), i, j);
                }
            }
        }
        if (currLayer === this.end[2]) {
            canvas.drawSprite(WIN_SPRITE, this.end[0], this.end[1]);
        }
    }
}
MazeBuilder.MazeCellTextures = MAZE_CELL_TEXTURES;
function defaultIfNaN(x, defaultValue) { return isNaN(x) ? defaultValue : x; }
const S = 10;
const L = 4;
let maze = new MazeBuilder(S, L);
// @ts-ignore
window.maze = maze;
const canvas = new Canvas(document.getElementById('game-canvas'), S, S);
window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());
let currPos = [...maze.start];
let targetPos = null;
let eQueue = [];
let anim = 30;
requestAnimationFrame(function frame() {
    if (anim !== -1) {
        canvas.clear();
        maze.draw(canvas, currPos[2]);
        canvas.drawSprite(PLAYER_SPRITE, currPos[0], currPos[1]);
        canvas.ctx.globalAlpha = 1 - Math.abs(anim / 30 - 1);
        canvas.clear('#000');
        canvas.ctx.globalAlpha = 1;
        if (anim === 30) {
            maze = new MazeBuilder(S, L);
            currPos = [...maze.start];
        }
        anim++;
        if (anim === 60)
            anim = -1;
    }
    else {
        canvas.clear();
        maze.draw(canvas, currPos[2]);
        if (targetPos != null) {
            currPos = [
                currPos[0] + Math.sign(targetPos[0] - currPos[0]) * 0.5,
                currPos[1] + Math.sign(targetPos[1] - currPos[1]) * 0.5,
                currPos[2] + Math.sign(targetPos[2] - currPos[2]),
            ];
            if (Math.hypot(targetPos[0] - currPos[0], targetPos[1] - currPos[1], targetPos[2] - currPos[2]) < 0.05) {
                currPos = targetPos;
                targetPos = null;
            }
        }
        else if (eQueue.length) {
            movePlayer(eQueue.shift());
        }
        canvas.drawSprite(PLAYER_SPRITE, currPos[0], currPos[1]);
        if (currPos.toString() === maze.end.toString()) {
            anim = 0;
        }
    }
    requestAnimationFrame(frame);
});
function movePlayer(direction) {
    targetPos = currPos;
    while (maze.CanMove(...targetPos, direction)) {
        targetPos = nextInDirection(...targetPos, direction);
        if (!ALL_NEIGHBORS.every(d => {
            return d === direction || d === opposite(direction) || !maze.CanMove(...targetPos, d);
        })) {
            break;
        }
        if (direction === Neighbor.Top || direction === Neighbor.Bottom)
            break;
    }
}
// @ts-ignore
window.Neighbor = Neighbor;
window.onkeydown = ({ key }) => {
    switch (key.toLowerCase()) {
        case 'a':
            eQueue.push(Neighbor.Front);
            break;
        case 'd':
            eQueue.push(Neighbor.Back);
            break;
        case 'w':
            eQueue.push(Neighbor.Left);
            break;
        case 's':
            eQueue.push(Neighbor.Right);
            break;
        case 'q':
            eQueue.push(Neighbor.Top);
            break;
        case 'e':
            eQueue.push(Neighbor.Bottom);
            break;
    }
};
export {};
