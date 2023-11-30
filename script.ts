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
        const {viewportWidth, viewportHeight} = this;

        this.ctx.clearRect(-viewportWidth / 2, -viewportHeight / 2, viewportWidth, viewportHeight);

        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(-viewportWidth / 2, -viewportHeight / 2, viewportWidth, viewportHeight);
        }
    }
}

type int = number;
type Vector2Int = [int, int];
type SSet<T> = Map<string, T>

function createSSet<T>(values?: Iterable<readonly [string, T]>): SSet<T> {
    return new Map(values);
}

function createMatrix<T>(rows: int, cols: int, value?: T | ((row: number, col: number) => T)): T[][] {
    return new Array<T[]>(rows).fill(null).map(
        (_, row) => new Array<T>(cols).fill(null).map(
            (_, col) => (
                value instanceof Function ?
                    value(row, col) :
                value !== undefined ?
                    value :
                    null
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
    private _wallT: boolean;
    private _wallB: boolean;
    private _wallL: boolean;
    private _wallR: boolean;

    public constructor(r: number, c: number) {
        this.Row = r;
        this.Col = c;
        this.reset();
    }

    public reset() {
        this._wallT = this._wallB = this._wallL = this._wallR = true;
    }

    public HasTopWall(): boolean {
        return this._wallT;
    }

    public HasBottomWall(): boolean {
        return this._wallB;
    }

    public HasLeftWall(): boolean {
        return this._wallL;
    }

    public HasRightWall(): boolean {
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

class MazeData {
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
                this._grid[row][col].reset();
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

    public RemoveNeighborWall(neighbor: Neighbor, row: number, col: number): Vector2Int {
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

    public HasNeighbor(row: number, col: number, neighbor: Neighbor): boolean {
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
        switch (neighbor) {
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
    readonly type: "Door" | "Key" | "Win",
    readonly color: number
};

const MAZE_IMG = await loadImage('res/Cells.png');
const KEYS_IMG = await loadImage("res/Runes.png");
const DOOR_SPRITE = new Sprite(1, 1, {img: await loadImage('res/Obstacle.png')});
const WIN_SPRITE = new Sprite(1, 1, {img: await loadImage('res/Finish.png')});

const MAZE_KEY_TEXTURES = (() => {
    const num_keys = 9
    return [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => new Sprite(1, 1, {
        img: KEYS_IMG,
        sx: i / num_keys,
        sy: 1 / num_keys
    }))
})();
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
    public size: number;

    public static MazeCellTextures: Sprite[] = MAZE_CELL_TEXTURES;
    public static MazeKeyTextures: Sprite[] = MAZE_KEY_TEXTURES;
    public static MazeKeyTexturesDeactivated: Sprite[] = (() => {
        return [];
    })();

    private readonly _mazeData: MazeData;
    private readonly _obstacles: Obstacle[][];
    private readonly cell_sprites: Sprite[][];

    constructor(size: number) {
        this.size = size;
        this.cell_sprites = createMatrix(this.size, this.size);
        this._mazeData = new MazeData(this.size);
        this._obstacles = createMatrix(this.size, this.size);
        this.generate();
    }

    private generate(): void {
        let {visited, parent, children, start, end} = this.carveMaze();
        this.createObstacles(end, visited, start, parent, children);

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const c = this._mazeData.getCell(i, j);

                const wallsIdx = (+c.HasRightWall() << 3)
                    + (+c.HasBottomWall() << 2)
                    + (+c.HasLeftWall() << 1)
                    + (+c.HasTopWall());
                this.cell_sprites[i][j] = MazeBuilder.MazeCellTextures[wallsIdx];
            }
        }
    }

    private carveMaze() {
        const visited = createMatrix<boolean>(this.size, this.size);
        const parent = createMatrix<Vector2Int>(this.size, this.size);
        const children = createMatrix<Vector2Int[]>(this.size, this.size);

        for (let i = 0; i < this.size; i++)
            for (let j = 0; j < this.size; j++)
                children[i][j] = [];

        const stk: Vector2Int[] = [];
        const dStk: number[] = [];

        const start: Vector2Int = [randInt(this.size), randInt(this.size)];
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

            if (neighbors.length <= 1) {
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

        return {visited, parent, children, start, end};
    }

    private createObstacles(end: Vector2Int, visited: boolean[][], start: Vector2Int, parent: Vector2Int[][], children: Vector2Int[][][]) {
        const targetPosition = end;
        this._obstacles[end[0]][end[1]] = {type: "Win", color: 0}; // Target

        visited[start[0]][start[1]] = visited[end[0]][end[1]] = false;

        const hasDoor = createMatrix<boolean>(this.size, this.size);
        const used = createMatrix<boolean>(this.size, this.size, false);
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

            /*
             * The idea is, say we have fixed start and end
             *
             * then dfs starting from start and draw "before" directed edges as we search ("node A comes MUST BE
             * REACHED before node B").
             *
             * we start by randomly placing door X on any random node reachable from the end node using "before"
             * edges (use DFS). This guarantees that we never have an unnecessary door
             *
             * When we place key X, we draw a "before" edge from the door to the key ("key X MUST BE REACHED
             * before door X"). The valid key positions are thus any position that does not result in a cycle in
             * the graph. (The maze is unsolvable iff there is a cycle in the graph)
             *
             * To find these nodes, we can DFS from door X BACKWARDS through the "before" edges, and eliminate
             * any node we find. The remaining nodes are all valid.
             *
             * Now for the theory of anti-doors. Anti-door X can be traversed if door X was traversed or key X was
             * NOT traversed.
             */

            console.log(`Generating door for color ${color}`)
            //
            // let doorPos: Vector2Int;
            // try {
            //     try {
            //         const path = i == 0
            //             ? [...solutionPath]
            //             : [...keyPaths].filter(([key]: [string, Vector2Int]) => !solutionPath.has(key));
            //         doorPos = GetRandomElement(path.map(i => i[1]).filter(s => !used[s[0]][s[1]]));
            //     } catch {
            //         doorPos = GetRandomElement([...solutionPath].map(i => i[1]).filter(s => !used[s[0]][s[1]]));
            //     }
            // } catch (e) {
            //     console.error(e);
            //     break;
            // }
            //
            // used[doorPos[0]][doorPos[1]] = hasDoor[doorPos[0]][doorPos[1]] = true;
            //
            // const doorPath = MazeBuilder.GetRoute(start, doorPos, parent);
            //
            // const reachable = createSSet<Vector2Int>(doorPath);
            // const stk2: Vector2Int[] = [...doorPath.values()];
            // while (stk2.length > 0) {
            //     const pos = stk2.pop();
            //     let neighbors = this._mazeData.GetNeighbors(pos[0], pos[1], p =>
            //         !hasDoor[p[0]][p[1]] &&
            //         !reachable.has(p.toString())
            //         && children[pos[0]][pos[1]].includes(p)
            //     );
            //     for (let n of neighbors.map(d => this._mazeData.GetNeighbor(d, pos[0], pos[1]))) {
            //         reachable.set(n.toString(), n);
            //         stk2.push(n);
            //     }
            // }
            //
            // const possibleKeyPositions: Vector2Int[] = [...reachable.values()];
            //
            // let keyPos: Vector2Int;
            // try {
            //     try {
            //         keyPos = GetRandomElement(possibleKeyPositions.filter(s =>
            //             !used[s[0]][s[1]]
            //             && !keyPaths.has(s.toString())
            //             && children[s[0]][s[1]].length == 0
            //         ));
            //         console.log('a',
            //             possibleKeyPositions.filter(s =>
            //                 !used[s[0]][s[1]]
            //             ),
            //             keyPaths,
            //             possibleKeyPositions.filter(s =>
            //                     !used[s[0]][s[1]]
            //                 // && !keyPaths.has(s.toString())
            //             ),
            //             possibleKeyPositions.filter(s =>
            //                 !used[s[0]][s[1]]
            //                 && !keyPaths.has(s.toString())
            //                 && children[s[0]][s[1]].length == 0
            //             ),
            //             keyPos);
            //     } catch {
            //         keyPos = GetRandomElement(possibleKeyPositions.filter(s =>
            //             !used[s[0]][s[1]] && !keyPaths.has(s.toString())
            //         ));
            //     }
            // } catch (e) {
            //     console.error(e);
            //     used[doorPos[0]][doorPos[1]] = hasDoor[doorPos[0]][doorPos[1]] = false;
            //     continue;
            // }
            //
            // const keyPath = MazeBuilder.GetRoute(start, keyPos, parent);
            // keyPaths = new Map([...keyPaths, ...keyPath]);
            //
            // console.log(doorPos, keyPos)
            //
            // this._obstacles[doorPos[0]][doorPos[1]] = {
            //     type: "Door",
            //     color,
            // }
            // this._obstacles[keyPos[0]][keyPos[1]] = {
            //     type: "Key",
            //     color,
            // }
            // used[keyPos[0]][keyPos[1]] = true;
            //
            // color++;
        }
    }

    private static GetRoute(start: Vector2Int, target: Vector2Int, parent: Vector2Int[][]): SSet<Vector2Int> {
        const res = createSSet<Vector2Int>();
        console.log(`Routing:`)
        while (true) {
            target = parent[target[0]][target[1]];
            console.log(`Route ${start} to ${target}`)
            if (target.toString() == start.toString()) {
                break;
            }
            res.set(target.toString(), target);
        }
        console.log('Done routing')
        return res;
    }

    public CanMove(x: number, y: number, neighbor: Neighbor): boolean {
        switch (neighbor) {
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
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.cell_sprites[i][j]) {
                    canvas.drawSprite(this.cell_sprites[i][j], i, j)
                }
                if (this._obstacles[i][j]) {
                    const {color, type} = this._obstacles[i][j];
                    switch (type) {
                        case "Door":
                            canvas.drawSprite(DOOR_SPRITE, i, j)
                            break;
                        case "Win":
                            canvas.drawSprite(WIN_SPRITE, i, j);
                            break;
                    }
                }
            }
        }
    }
}


const maze = new MazeBuilder(18);

const canvas: Canvas = new Canvas(
    document.getElementById('game-canvas') as HTMLCanvasElement,
    32, 18
);

window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());

requestAnimationFrame(function frame() {
    canvas.clear();
    maze.draw(canvas);
    requestAnimationFrame(frame);
})
