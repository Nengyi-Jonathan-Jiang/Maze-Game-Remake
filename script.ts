export {}

alert('WASD to move, E to go down a layer, Q to go up a layer. Get to the trophy.');

const loadImage = (() => {
    const imageCache = new Map<string, HTMLImageElement>;
    return async function loadImage(url: string): Promise<HTMLImageElement> {
        if (imageCache.has(url)) return imageCache.get(url);
        const image = document.createElement('img');
        return new Promise(resolve => {
            imageCache.set(url, image);
            image.onload = _ => resolve(image);
            image.src = url;
        }) as Promise<HTMLImageElement>;
    }
})();

type SpriteSource = {
    readonly sx?: number,
    readonly sy?: number,
    readonly sw?: number,
    readonly sh?: number,
    readonly img: HTMLImageElement
};

class Sprite {
    public readonly width: number;
    public readonly height: number;
    private readonly source: SpriteSource;

    constructor(width: number, height: number, source: SpriteSource) {
        this.width = width;
        this.height = height;
        this.source = source;
    }

    public get sw() {
        return this.source.sw ?? 1
    }

    public get sh() {
        return this.source.sh ?? 1
    }

    public get sx() {
        return this.source.sx ?? 0
    }

    public get sy() {
        return this.source.sy ?? 0
    }

    public get img() {
        return this.source.img
    }
}

class Canvas {
    public readonly canvasElement: HTMLCanvasElement;
    public readonly viewportWidth: number;
    public readonly viewportHeight: number;

    public readonly ctx: CanvasRenderingContext2D;

    constructor(canvasElement: HTMLCanvasElement, viewportWidth: number, viewportHeight: number) {
        this.canvasElement = canvasElement;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;

        this.ctx = canvasElement.getContext('2d') as CanvasRenderingContext2D;
    }

    public resizeToDisplaySize() {
        const {canvasElement, ctx, viewportWidth, viewportHeight} = this;

        const width = canvasElement.width = canvasElement.clientWidth;
        const height = canvasElement.height = canvasElement.clientHeight;

        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(
            width / viewportWidth, 0,
            0, height / viewportHeight,
            0, 0
        )
    }

    public drawSprite(sprite: Sprite, x: number, y: number) {
        const {ctx} = this;
        const {width, height, img, sx, sy, sw, sh} = sprite;

        ctx.drawImage(
            img,
            sx * img.width, sy * img.height, sw * img.width, sh * img.height,
            x, y, width, height
        );

        // ctx.strokeStyle = "#f00";
        // ctx.lineWidth = 0.01;
        // ctx.strokeRect(x, y, width, height);
    }

    clear(color?: string | CanvasGradient | CanvasPattern) {
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

type int = number;
type Vector3Int = [int, int, int];
type SSet<T> = Map<string, T>

function createSSet<T>(values?: Iterable<readonly [string, T]>): SSet<T> {
    return new Map(values);
}

function createMatrix<T>(rows: int, cols: int, lyrs: int, value?: T | ((row: number, col: number, lyr: number) => T)): T[][][] {
    return new Array<T[]>(rows).fill(null).map(
        (_, row) => new Array<T>(cols).fill(null).map(
            (_, col) => new Array<T>(lyrs).fill(null).map(
                (_, lyr) => (
                    value instanceof Function ?
                        value(row, col, lyr) :
                        value !== undefined ?
                            value as T :
                            null
                )
            )
        )
    );
}

function randInt(size: int) {
    return ~~(Math.random() * size);
}

function GetRandomElement<T>(l: Iterable<T>): T {
    const arr: T[] = [...l];
    return arr[randInt(arr.length)];
}


class MazeDataCell {
    public readonly Row: number;
    public readonly Col: number;
    public readonly Lyr: number;
    private _wallF: boolean;
    private _wallB: boolean;
    private _wallL: boolean;
    private _wallR: boolean;
    private _wallU: boolean;
    private _wallD: boolean;

    public constructor(r: number, c: number, l: number) {
        this.Row = r;
        this.Col = c;
        this.Lyr = l;
        this.reset();
    }

    public reset() {
        this._wallF = this._wallB = this._wallL = this._wallR = this._wallU = this._wallD = true;
    }

    public HasFrontWall(): boolean {
        return this._wallF;
    }

    public HasBackWall(): boolean {
        return this._wallB;
    }

    public HasLeftWall(): boolean {
        return this._wallL;
    }

    public HasRightWall(): boolean {
        return this._wallR;
    }

    public HasTopWall(): boolean {
        return this._wallU;
    }

    public HasBottomWall(): boolean {
        return this._wallD;
    }

    public RemoveFrontWall() {
        this._wallF = false;
    }

    public RemoveBackWall() {
        this._wallB = false;
    }

    public RemoveLeftWall() {
        this._wallL = false;
    }

    public RemoveRightWall() {
        this._wallR = false;
    }

    public RemoveTopWall() {
        this._wallU = false;
    }

    public RemoveBottomWall() {
        this._wallD = false;
    }
}


enum Neighbor { Front, Left, Back, Right, Top, Bottom };
const ALL_NEIGHBORS : Neighbor[] = [
    Neighbor.Front, Neighbor.Left, Neighbor.Back, Neighbor.Right, Neighbor.Top, Neighbor.Bottom
];
function nextInDirection(row: int, col: int, lyr: int, direction: Neighbor) : Vector3Int {
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
function opposite(direction: Neighbor) : Neighbor {
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
    public readonly Size: number;
    private readonly Layers: number;
    private readonly _grid: MazeDataCell[][][];

    public constructor(size: number, layers: number) {
        this.Size = size;
        this.Layers = layers;
        this._grid = createMatrix<MazeDataCell>(size, size, layers);
        for (let row = 0; row < size; row++)
            for (let col = 0; col < size; col++)
                for (let layer = 0; layer < size; layer++)
                    this._grid[row][col][layer] = new MazeDataCell(row, col, layer);

        this.Restart();
    }

    private Restart(): void {
        for (let a of this._grid) for (let b of a) for (let cell of b) {
            cell.reset();
        }
    }

    public GetNeighbors(row: number, col: number, lyr: number, valid: (pos: Vector3Int, neighbor: Neighbor) => boolean): Neighbor[] {
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

    public RemoveNeighborWall(neighbor: Neighbor, row: number, col: number, lyr: number): Vector3Int {
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

    public HasNeighbor(row: number, col: number, lyr: number, neighbor: Neighbor): boolean {
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

    public GetNeighbor(neighbor: Neighbor, row: number, col: number, lyr: number): Vector3Int {
        switch (neighbor) {
            case Neighbor.Front:
                return [row - 1, col, lyr];
            case Neighbor.Back:
                return [row + 1, col, lyr]
            case Neighbor.Left:
                return [row, col - 1, lyr]
            case Neighbor.Right:
                return [row, col + 1, lyr]
            case Neighbor.Top:
                return [row, col, lyr - 1]
            case Neighbor.Bottom:
                return [row, col, lyr + 1]
            default:
                throw new Error("Invalid Neighbor");
        }
    }

    public getCell(row: number, col: number, lyr: number): MazeDataCell {
        return this._grid[row][col][lyr]
    }

    public RemoveWallF(row: number, col: number, lyr: number): void {
        this._grid[row][col][lyr].RemoveFrontWall();
        this._grid[row - 1][col][lyr].RemoveBackWall();
    }

    public RemoveWallB(row: number, col: number, lyr: number): void {
        this._grid[row][col][lyr].RemoveBackWall();
        this._grid[row + 1][col][lyr].RemoveFrontWall();
    }

    public RemoveWallL(row: number, col: number, lyr: number): void {
        this._grid[row][col][lyr].RemoveLeftWall();
        this._grid[row][col - 1][lyr].RemoveRightWall();
    }

    public RemoveWallR(row: number, col: number, lyr: number): void {
        this._grid[row][col][lyr].RemoveRightWall();
        this._grid[row][col + 1][lyr].RemoveLeftWall();
    }

    public RemoveWallU(row: number, col: number, lyr: number): void {
        this._grid[row][col][lyr].RemoveTopWall();
        this._grid[row][col][lyr - 1].RemoveBottomWall();
    }

    public RemoveWallD(row: number, col: number, lyr: number): void {
        this._grid[row][col][lyr].RemoveBottomWall();
        this._grid[row][col][lyr + 1].RemoveTopWall();
    }
}

const MAZE_IMG = await loadImage('res/Cells.png');
const WIN_SPRITE = new Sprite(1, 1, {img: await loadImage('res/Finish.png')});

const PLAYER_SPRITE = new Sprite(1, 1, {img: await loadImage('res/Player.png')});

const GO_UP_IMG = await loadImage('res/Up.png');
const GO_DOWN_IMG = await loadImage('res/Down.png');

const MAZE_CELL_TEXTURES = (() => {
    const img = MAZE_IMG;

    const textures = new Array<Sprite>(16).fill(null);

    const arr = [
        [0b1111, 0b0111, 0b0101, 0b1101],
        [0b1011, 0b0011, 0b0001, 0b1001],
        [0b1010, 0b0010, 0b0000, 0b1000],
        [0b1110, 0b0110, 0b0100, 0b1100]
    ];

    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        textures[arr[i][j]] = new Sprite(1, 1, {
            img, sx: i * 0.25, sy: j * 0.25, sw: 0.25, sh: 0.25
        })
    }

    return textures;
})();

class MazeBuilder {
    public readonly size: number;
    public readonly layers: number;
    public start: Vector3Int;
    public end: Vector3Int;

    public static MazeCellTextures: Sprite[] = MAZE_CELL_TEXTURES;

    private readonly _mazeData: MazeData;
    private readonly cell_sprites: Sprite[][][];

    constructor(size: number, layers: number) {
        this.size = size;
        this.layers = layers;
        this.cell_sprites = createMatrix(this.size, this.size, this.layers);
        this._mazeData = new MazeData(this.size, this.layers);
        this.generate();
    }

    private generate(): void {
        const {start, end} = this.carveMaze();
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

    private carveMaze() {
        console.log('carving maze')

        const visited = createMatrix<boolean>(this.size, this.size, this.layers);
        const stk: Vector3Int[] = [];
        const dStk: number[] = [];

        const start: Vector3Int = [randInt(this.size), randInt(this.size), 0];
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
            const neighbors = this._mazeData.GetNeighbors(
                row, col, lyr, p => !visited[p[0]][p[1]][p[2]]
            );

            if (neighbors.length <= 1) {
                stk.pop();
                dStk.pop();
            }

            if (neighbors.length == 0) continue;

            // Don't prefer inter-layer movement

            if(neighbors.includes(Neighbor.Front) || neighbors.includes(Neighbor.Back)
            || neighbors.includes(Neighbor.Left) || neighbors.includes(Neighbor.Right)) {
                if (neighbors.includes(Neighbor.Top) && Math.random() > 0.) {
                    neighbors.splice(neighbors.indexOf(Neighbor.Top), 1);
                }
                if (neighbors.includes(Neighbor.Bottom) && Math.random() > 0.) {
                    neighbors.splice(neighbors.indexOf(Neighbor.Bottom), 1);
                }
            }

            const newPos = this._mazeData.RemoveNeighborWall(
                neighbors[randInt(neighbors.length)],
                row, col, lyr
            );

            stk.push(newPos);
            dStk.push(depth + 1);
        }

        return {start, end};
    }

    public CanMove(x: number, y: number, z: number, neighbor: Neighbor): boolean {
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

    public draw(canvas: Canvas, currLayer: int) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.cell_sprites[i][j][currLayer]) {
                    canvas.drawSprite(this.cell_sprites[i][j][currLayer], i, j)

                    const goUp = !this._mazeData.getCell(i, j, currLayer).HasTopWall();
                    const goDown = !this._mazeData.getCell(i, j, currLayer).HasBottomWall();

                    if(goDown)
                        canvas.drawSprite(new Sprite(1, 1, {img: GO_DOWN_IMG}), i, j);
                    if(goUp)
                        canvas.drawSprite(new Sprite(1, 1, {img: GO_UP_IMG}), i, j);
                }
            }
        }

        if (currLayer == this.end[2]) {
            canvas.drawSprite(WIN_SPRITE, this.end[0], this.end[1]);
        }
    }
}

function defaultIfNaN(x, defaultValue) { return isNaN(x) ? defaultValue : x }

const S = 10;
const L = 4;

let maze = new MazeBuilder(S, L);

// @ts-ignore
window.maze = maze;

const canvas: Canvas = new Canvas(
    document.getElementById('game-canvas') as HTMLCanvasElement,
    S, S
);

window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());

let currPos: Vector3Int = [...maze.start];
let targetPos: Vector3Int = null;
let eQueue: Neighbor[] = [];
let anim = 30;

requestAnimationFrame(function frame() {
    if(anim != -1) {
        canvas.clear();
        maze.draw(canvas, currPos[2]);
        canvas.drawSprite(PLAYER_SPRITE, currPos[0], currPos[1]);

        canvas.ctx.globalAlpha = 1 - Math.abs(anim / 30 - 1);
        canvas.clear('#000');
        canvas.ctx.globalAlpha = 1;

        if(anim == 30) {
            maze = new MazeBuilder(S, L);
            currPos = [...maze.start];
        }

        anim++;

        if(anim == 60) anim = -1;
    } else {
        canvas.clear();
        maze.draw(canvas, currPos[2]);
        if (targetPos != null) {
            currPos = [
                currPos[0] + Math.sign(targetPos[0] - currPos[0]) * 0.5,
                currPos[1] + Math.sign(targetPos[1] - currPos[1]) * 0.5,
                currPos[2] + Math.sign(targetPos[2] - currPos[2]),
            ];

            if (Math.hypot(
                targetPos[0] - currPos[0],
                targetPos[1] - currPos[1],
                targetPos[2] - currPos[2],
            ) < 0.05) {
                currPos = targetPos;
                targetPos = null;
            }
        } else if (eQueue.length) {
            movePlayer(eQueue.shift());
        }

        canvas.drawSprite(PLAYER_SPRITE, currPos[0], currPos[1]);

        if(currPos.toString() == maze.end.toString()) {
            anim = 0;
        }
    }
    requestAnimationFrame(frame);
});

function movePlayer(direction: Neighbor) {
    targetPos = currPos;
    while(maze.CanMove(...targetPos, direction)) {
        targetPos = nextInDirection(...targetPos, direction);

        if(!ALL_NEIGHBORS.every(d => {
            return d == direction || d == opposite(direction) || !maze.CanMove(...targetPos, d);
        })) { break }

        if(direction == Neighbor.Top || direction == Neighbor.Bottom) break;
    }
}

// @ts-ignore
window.Neighbor = Neighbor;

window.onkeydown = ({key}) => {
    switch(key.toLowerCase()) {
        case 'a': eQueue.push(Neighbor.Front); break;
        case 'd': eQueue.push(Neighbor.Back); break;
        case 'w': eQueue.push(Neighbor.Left); break;
        case 's': eQueue.push(Neighbor.Right); break;
        case 'q': eQueue.push(Neighbor.Top); break;
        case 'e': eQueue.push(Neighbor.Bottom); break;
    }
}