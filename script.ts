export {}

const loadImage = (() => {
    const imageCache = new Map<string, HTMLImageElement>;
    return async function loadImage(url: string): Promise<HTMLImageElement> {
        if (imageCache.has(url)) return imageCache.get(url);
        const image = document.createElement('img');
        return new Promise(resolve => {
            imageCache.set(url, image);
            image.onload = _ => resolve(image);
            image.src = url;
        });
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
        return this.source.sw ?? this.source.img.width
    }

    public get sh() {
        return this.source.sh ?? this.source.img.height
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

    private readonly ctx: CanvasRenderingContext2D;

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
            0, height / -viewportHeight,
            width / 2, height / 2
        )
    }

    public drawSprite(sprite: Sprite, x: number, y: number) {
        const {ctx} = this;
        const {width, height, img, sx, sy, sw, sh} = sprite;
        const topLeftX = x - width / 2;
        const topLeftY = y - height / 2;

        ctx.drawImage(
            img,
            sx * img.width, sy * img.height, sw * img.width, sh * img.height,
            topLeftX, topLeftY, width, height
        );
    }
}

const canvas: Canvas = new Canvas(document.getElementById('game-canvas') as HTMLCanvasElement, 16, 9);

window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());


const TEMP_maze_sprite = new Sprite(4, 4, {
    img: await loadImage('res/Cells.png')
})

requestAnimationFrame(function frame() {
    canvas.drawSprite(TEMP_maze_sprite, 0, 0);

    requestAnimationFrame(frame);
})

type int = number;
type Vector2Int = [int, int];
type SSet<T> = Map<string, T>

function createSSet<T>(values?:Iterable<readonly [string, T]>) : SSet<T>{
    return new Map(values);
}

function createMatrix<T>(rows: int, cols: int) : T[][] {
    return new Array<T[]>(rows).fill(null).map(() => new Array<T>(cols));
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
    private _wallT: boolean;
    private _wallB: boolean;
    private _wallL: boolean;
    private _wallR: boolean;

    public constructor(r: number, c: number) {
        this.Row = r;
        this.Col = c;
        this.Reset();
    }

    public Reset() {
        this._wallT = this._wallB = this._wallL = this._wallR = true;
    }

    public HasTopWall() : boolean {
        return this._wallT;
    }

    public HasBottomWall() : boolean {
        return this._wallB;
    }

    public HasLeftWall() : boolean {
        return this._wallL;
    }

    public HasRightWall() : boolean {
        return this._wallR;
    }

    public RemoveTopWall() {
        this._wallT = false;
    }

    public RemoveBottomWall() {
        this._wallB = false;
    }

    public RemoveLeftWall() {
        this._wallL = false;
    }

    public RemoveRightWall() {
        this._wallR = false;
    }
}



enum Neighbor { Top, Left, Bottom, Right }

public class MazeData {
    public readonly Size: number;
    private readonly _grid: MazeDataCell[][];

    public constructor(size: number) {
        this.Size = size;
        this._grid = createMatrix<MazeDataCell>(size, size);
        for (let row = 0; row < size; row++)
            for (let col = 0; col < size; col++)
                this._grid[row][col] = new MazeDataCell(row, col);

        this.Restart();
    }

    private Restart(): void {
        for (let row = 0; row < this.Size; row++)
            for (let col = 0; col < this.Size; col++)
                this._grid[row][col].Reset();
    }

    public GetNeighbors(row: number, col: number, valid: (pos: Vector2Int, neighbor: Neighbor) => boolean): Neighbor[] {
        const neighbors = [];
        if (row > 0 && valid([row - 1, col], Neighbor.Top))
            neighbors.push(Neighbor.Top);
        if (row + 1 < this.Size && valid([row + 1, col], Neighbor.Bottom))
            neighbors.push(Neighbor.Bottom);
        if (col > 0 && valid([row, col - 1], Neighbor.Left))
            neighbors.push(Neighbor.Left);
        if (col + 1 < this.Size && valid([row, col + 1], Neighbor.Right))
            neighbors.push(Neighbor.Right);
        return neighbors;
    }

    public RemoveNeighborWall(neighbor: Neighbor, row: number, col: number) : Vector2Int {
        switch (neighbor) {
            case Neighbor.Top:
                this.RemoveWallT(row, col);
                return [row - 1, col];
            case Neighbor.Bottom:
                this.RemoveWallB(row, col);
                return [row + 1, col];
            case Neighbor.Left:
                this.RemoveWallL(row, col);
                return [row, col - 1];
            case Neighbor.Right:
                this.RemoveWallR(row, col);
                return [row, col + 1];
            default:
                throw new Error("Invalid Neighbor to Remove");
        }
    }

    public HasNeighbor(row: number, col: number, neighbor: Neighbor) : boolean {
        switch (neighbor) {
            case Neighbor.Top:
                return !this._grid[row][col].HasTopWall();
            case Neighbor.Bottom:
                return !this._grid[row][col].HasBottomWall();
            case Neighbor.Left:
                return !this._grid[row][col].HasLeftWall();
            case Neighbor.Right:
                return !this._grid[row][col].HasRightWall();
            default:
                throw new Error("Invalid Neighbor");
        }
    }

    public GetNeighbor(neighbor: Neighbor, row: number, col: number): Vector2Int {
        switch (neighbor){
            case Neighbor.Top:
                return [row - 1, col];
            case Neighbor.Bottom:
                return [row + 1, col]
            case Neighbor.Left:
                return [row, col - 1]
            case Neighbor.Right:
                return [row, col + 1]
            default:
                throw new Error("Invalid Neighbor");
        }
    }

    public getCell(row: number, col: number): MazeDataCell {
        return this._grid[row][col]
    }

    public RemoveWallT(row: number, col: number): void {
        this._grid[row][col].RemoveTopWall();
        this._grid[row - 1][col].RemoveBottomWall();
    }

    public RemoveWallB(row: number, col: number): void {
        this._grid[row][col].RemoveBottomWall();
        this._grid[row + 1][col].RemoveTopWall();
    }

    public RemoveWallL(row: number, col: number): void {
        this._grid[row][col].RemoveLeftWall();
        this._grid[row][col - 1].RemoveRightWall();
    }

    public RemoveWallR(row: number, col: number): void {
        this._grid[row][col].RemoveRightWall();
        this._grid[row][col + 1].RemoveLeftWall();
    }
}

type Obstacle = {
    readonly type: "Door"|"Key",
    readonly color: number
};

class MazeBuilder {
    public Size: number;

    public static MazeCellTextures: Sprite[] = (() => {
        const img = loadImage('res/Cells.png');
        return [
            [], [], [], [],
            [], [], [], [],
            [], [], [], [],
            [], [], [], []
        ].map(i => new Sprite());
    })();
    public static MazeKeyTextures: Sprite[] = (() => {
        return [];
    })();
    public static MazeKeyTexturesDeactivated: Sprite[] = (() => {
        return [];
    })();

    private _mazeData: MazeData;
    private _obstacles: Obstacle[][];
    private _cells: Sprite[][];

    // Start is called before the first frame update
    private Start(): void {
        this.Build();
    }

    private Build(): void {
        this._mazeData = new MazeData(this.Size);
        this._obstacles = createMatrix(this.Size, this.Size);

        const visited = createMatrix<boolean>(this.Size, this.Size);
        const parent = createMatrix<Vector2Int>(this.Size, this.Size);
        const children = createMatrix<Vector2Int[]>(this.Size, this.Size);

        for (let i = 0; i < this.Size; i++)
            for (let j = 0; j < this.Size; j++)
                children[i][j] = [];

        const stk: Vector2Int[] = [];
        const dStk: number[] = [];

        const start: Vector2Int = [randInt(this.Size), randInt(this.Size)];
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

            const row = p[0], col = p[1];
            visited[row][col] = true;
            //Get neighbors
            const neighbors = this._mazeData.GetNeighbors(row, col, p => !visited[p[0]][p[1]]);
            if (neighbors.length < 2) {
                stk.pop();
                dStk.pop();
            }
            if (neighbors.length == 0) continue;
            const newPos = this._mazeData.RemoveNeighborWall(
                neighbors[randInt(neighbors.length)],
                row, col
            );

            stk.push(newPos);
            dStk.push(depth + 1);

            children[p[0]][p[1]].push(newPos);
            parent[newPos[0]][newPos[1]] = p;
        }

        const targetPosition = end;
        this._obstacles[end[0]][end[1]] = null; // Target

        for (let i = 0; i < this.Size; i++) {
            for (let j = 0; j < this.Size; j++) {
                const c = this._mazeData[i][j];
                const wallsIdx = (c.HasRightWall() << 3)
                               + (c.HasBottomWall() << 2)
                               + (c.HasLeftWall() << 1)
                               + (c.HasTopWall() << 0);
                this._cells[i][j] = MazeBuilder.MazeCellTextures[wallsIdx];
            }
        }

        visited[start[0]][start[1]] = visited[end[0]][end[1]] = false;

        const hasDoor = createMatrix<boolean>(this.Size, this.Size);
        const used = createMatrix<boolean>(this.Size, this.Size);
        used[start[0]][start[1]] = used[end[0]][end[1]] = true;

        const solutionPath = createSSet<Vector2Int>([
            [start.toString(), start],
            [end.toString(), end]
        ]);
        while (end != start) {
            end = parent[end[0]][end[1]];
            solutionPath.set(end.toString(), end);
        }

        let keyPaths = createSSet<Vector2Int>(solutionPath);

        for (let i = 0, color = 0; i < 100 && color < MazeBuilder.MazeKeyTextures.length; i++) {
            let doorPos: Vector2Int;
            try {
                try {
                    const path = i == 0 ? [...solutionPath] : [...keyPaths].filter(([key]: [string, Vector2Int]) => !solutionPath.has(key));
                    doorPos = GetRandomElement(path.map(i => i[1]).filter(s => !used[s[0]][s[1]]));
                }
                catch {
                    doorPos = GetRandomElement([...solutionPath].map(i => i[1]).filter(s => !used[s[0], s[1]]));
                }
            }
            catch { break }

            used[doorPos[0]][doorPos[1]] = hasDoor[doorPos[0]][doorPos[1]] = true;

            const doorPath = MazeBuilder.GetRoute(start, doorPos, parent);

            const reachable = createSSet<Vector2Int>(doorPath);
            const stk2: Vector2Int[] = [...doorPath.values()];
            while (stk2.length > 0) {
                const pos = stk2.pop();
                let neighbors = this._mazeData.GetNeighbors(pos[0], pos[1], p =>
                    !hasDoor[p[0]][p[1]] &&
                    !reachable.has(p.toString())
                    && children[pos[0]][pos[1]].includes(p)
                );
                for (let n of neighbors.map(d => this._mazeData.GetNeighbor(d, pos[0], pos[1]))) {
                    reachable.set(n.toString(), n);
                    stk2.push(n);
                }
            }

            const possibleKeyPositions: Vector2Int[] = [...reachable.values()];

            let keyPos: Vector2Int;
            try {
                try {
                    keyPos = GetRandomElement(possibleKeyPositions.filter(s =>
                        !used[s[0]][s[1]] &&
                        !keyPaths.has(s.toString()) &&
                        children[s[0]][s[1]].length == 0
                    ));
                }
                catch {
                    keyPos = GetRandomElement(possibleKeyPositions.filter(s =>
                        !used[s[0]][s[1]] && !keyPaths.has(s.toString())
                    ));
                }
            }
            catch {
                continue;
            }

            const keyPath = MazeBuilder.GetRoute(start, keyPos, parent);
            keyPaths = new Map([...keyPaths, ...keyPath]);

            this._obstacles[doorPos[0]][doorPos[1]] = {
                type: "Door",
                color,
            }
            this._obstacles[keyPos[0]][keyPos[1]] = {
                type: "Key",
                color,
            }
            used[keyPos[0]][keyPos[1]] = true;

            color++;
        }
    }

    private static GetRoute(start: Vector2Int, target: Vector2Int, parent: Vector2Int[][]): SSet<Vector2Int> {
        const res = createSSet<Vector2Int>();
        while (true) {
            target = parent[target[0]][target[1]];
            if (target == start)
            break;
            res.set(target.toString(), target);
        }
        return res;
    }

    public CanMove(x: number, y: number, neighbor: Neighbor): boolean {
        switch(neighbor) {
            case Neighbor.Top:
                return !this._mazeData[x][y].HasTopWall();
            case Neighbor.Bottom:
                return !this._mazeData[x][y].HasBottomWall();
            case Neighbor.Left:
                return !this._mazeData[x][y].HasLeftWall();
            case Neighbor.Right:
                return !this._mazeData[x][y].HasRightWall();
        }
    }

    public GetObstacle(x: number, y: number) {
        return this._obstacles[x][y];
    }

    public RemoveObstacle(x: number, y: number): void {
        this._obstacles[x][y] = null;
    }






    public draw(canvas: Canvas) {
        for(let i = 0; i < this.Size; i++) {
            for(let j = 0; j < this.Size; j++) {

            }
        }
    }
}