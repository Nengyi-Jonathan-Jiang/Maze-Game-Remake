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
            viewportWidth / width, 0, 
            0, -viewportHeight / height, 
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

const canvas : Canvas = new Canvas(document.getElementById('game-canvas') as HTMLCanvasElement, 16, 9);

window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());