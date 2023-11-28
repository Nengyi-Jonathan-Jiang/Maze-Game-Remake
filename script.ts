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

    public draw(sprite: Sprite, x: number, y: number) {
        const {ctx} = this;
        const {width, height, img, sx, sy, sw, sh} = sprite;
        const topLeftX = x - width / 2;
        const topLeftY = y - height / 2;

        ctx.drawImage(img, sx, sy, sw, sh, topLeftX, topLeftY, width, height);
    }
}

const canvas: Canvas = new Canvas(document.getElementById('game-canvas') as HTMLCanvasElement, 16, 9);

window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());


const TEMP_maze_sprite = new Sprite(4, 4, {
    img: await loadImage('res/Cells.png')
})

requestAnimationFrame(function frame() {
    canvas.draw(TEMP_maze_sprite, 0, 0);

    requestAnimationFrame(frame);
})

type int = number;
type Vector2Int = [int, int];

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
function setDifference<T>(a: Set<T>, b: Set<T>) {

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

    public GetNeighbors(row: number, col: number, valid: (row: number, col: number, neighbor: Neighbor) => boolean): Neighbor[] {
        const neighbors = [];
        if (row > 0 && valid(row - 1, col, Neighbor.Top))
            neighbors.push(Neighbor.Top);
        if (row + 1 < this.Size && valid(row + 1, col, Neighbor.Bottom))
            neighbors.push(Neighbor.Bottom);
        if (col > 0 && valid(row, col - 1, Neighbor.Left))
            neighbors.push(Neighbor.Left);
        if (col + 1 < this.Size && valid(row, col + 1, Neighbor.Right))
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


public class MazeBuilder {
    public Size: number;

    public static MazeCellTextures: Sprite[] = (() => {
        return [];
    })();
    public static MazeKeyTextures: Sprite[] = (() => {
        return [];
    })();
    public static MazeKeyTexturesDeactivated: Sprite[] = (() => {
        return [];
    })();

    private _mazeData: MazeData;
    private _obstacles: any[][];
    private _cell_sprites: Sprite[][];

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
                this._cell_sprites[i][j] = MazeBuilder.MazeCellTextures[wallsIdx];
            }
        }

        visited[start[0]][start[1]] = visited[end[0]][end[1]] = false;

        const hasDoor = createMatrix<boolean>(this.Size, this.Size);
        const used = createMatrix<boolean>(this.Size, this.Size);
        used[start[0]][start[1]] = used[end[0]][end[1]] = true;

        const solutionPath = new Map<string, Vector2Int>([
            [start.toString(), start],
            [end.toString(), end]
        ]);
        while (end != start) {
            end = parent[end[0]][end[1]];
            solutionPath.set(end.toString(), end);
        }

        const keyPaths = new Map<string, Vector2Int>(solutionPath);

        for (let i = 0, color = 0; i < 100 && color < MazeBuilder.MazeKeyTextures.length; i++) {
            let doorPos: Vector2Int;
            try {
                try {
                    doorPos = GetRandomElement(
                        (i == 0 ? solutionPath : keyPaths.Except(solutionPath)
                    ).filter(s => !used[s[0]][s[1]]));
                }
                catch {
                    doorPos = GetRandomElement(solutionPath.Where(s => !used[s.x, s.y]));
                }
            }
            catch {break;}

            used[doorPos.x, doorPos.y] = hasDoor[doorPos.x, doorPos.y] = true;

            const doorPath = GetRoute(start, doorPos, parent);

            const reachable = new HashSet<Vector2Int>(doorPath);
            const stk2 = new Stack<Vector2Int>(doorPath);
            while (stk2.Count > 0) {
                const pos = stk2.Pop();
                var neighbors = _mazeData.GetNeighbors(pos.x, pos.y, p =>
                    !hasDoor[p.x, p.y] &&
                    !reachable.Contains(p)
                    && children[pos.x, pos.y].Contains(p)
                );
                foreach (
                    let
                n;
            in neighbors.Select(d => _mazeData.GetNeighbor(d, pos.x, pos.y))) {
                    reachable.Add(n);
                    stk2.Push(n);
                }
            }

            const possibleKeyPositions = new Vector2Int[](reachable);

            Vector2Int keyPos;
            try {
                try {
                    keyPos = GetRandomElement(possibleKeyPositions.Where(s =>
                        !used[s.x, s.y] &&
                        !keyPaths.Contains(s) &&
                        children[s.x, s.y].Count == 0
                    ));
                }
                catch {
                    keyPos = GetRandomElement(possibleKeyPositions.Where(s => !used[s.x, s.y] && !keyPaths.Contains(s)));
                }
            }
            catch {
                continue;
            }

            const keyPath = GetRoute(start, keyPos, parent);
            keyPaths.UnionWith(keyPath);


            //AddMazeDoorAt(doorPos.x, doorPos.y, KeyColors[color]);
            {
                var res = Instantiate(MazeDoorPrefab);
                res.transform.position = new Vector3(doorPos.x * 8, doorPos.y * 8, 0);
                res.transform.parent = gameObject.transform;
                res.name = "Door" + color;
                //res.GetComponent<SpriteRenderer>().sprite = MazeKeyTextures[color];/
                _obstacles[doorPos.x, doorPos.y] = res;

                {
                    const r2 = Instantiate(MazeKeyPrefab);
                    r2.transform.position = new Vector3(doorPos.x * 8, doorPos.y * 8, -1);
                    r2.transform.parent = res.transform;
                    r2.name = "DoorRune";
                    r2.GetComponent<SpriteRenderer>().sprite = MazeKeyTexturesDeactivated[color];
                }
            }
            {
                var res = Instantiate(MazeKeyPrefab);
                res.transform.position = new Vector3(keyPos.x * 8, keyPos.y * 8, 0);
                res.transform.parent = gameObject.transform;
                res.name = "Key" + color;
                res.GetComponent<SpriteRenderer>().sprite = MazeKeyTextures[color];

                _obstacles[keyPos.x, keyPos.y] = res;
            }
            used[keyPos.x, keyPos.y] = true;

            color++;
        }
    }

    private static HashSet<Vector2Int> GetRoute(Vector2Int start, Vector2Int target, parent: Vector2Int[][]) {
    var res = new HashSet<Vector2Int>();
    while (true) {
    target = parent[target.x, target.y];
    if (target == start)
    break;
    res.Add(target);
}
return res;
}

private AddMazeDoorAt(x: number, y: number, Color color): void {
    var res = Instantiate(MazeDoorPrefab);
    res.transform.position = new Vector2(x * 8, y * 8);
    res.transform.parent = gameObject.transform;
    res.name = "Door";
    res.GetComponent<SpriteRenderer>().color = color;

    _obstacles[x, y] = res;
}

public bool CanMove(x: number, y: number, MazeData.Neighbor neighbor) {
    //if (pos.x < 1 || pos.y < 1 || pos.x >= Size - 1 || pos.y >= Size - 1) {
    //return false;
    //}
    return neighbor switch
        {
            MazeData.Neighbor.Top => !_mazeData[x,y].HasTopWall(),
            MazeData.Neighbor.Bottom => !_mazeData[x, y].HasBottomWall(),
            MazeData.Neighbor.Left => !_mazeData[x, y].HasLeftWall(),
            MazeData.Neighbor.Right => !_mazeData[x, y].HasRightWall(),
            _ => throw new Exception("Invalid Neighbor"),
};
}

public GameObject GetObstacle(x: number, y: number) {
    return _obstacles[x, y];
}

public RemoveObstacle(x: number, y: number): void {
    _obstacles[x, y] = null;
}
}