// alert('WASD to move, E to go down a layer, Q to go up a layer. Get to the trophy.');

const TROPHY_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Finish.png')});
const PLAYER_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Player.png')});

function defaultIfNaN(x, defaultValue) {
    return isNaN(x) ? defaultValue : x;
}

// const mazeGeometry = new CubicalGridMazeGeometry(9, 9, 3);
// const mazeGeometry = new SquareGridMazeGeometry(16, 9);
const mazeGeometry = new HexagonalGridMazeGeometry(10);
const carver = cells => new DFSMazeCarver(cells);
let maze = new Maze(mazeGeometry, carver);

const canvas = new Canvas(document.getElementById('game-canvas'), mazeGeometry.displayWidth, mazeGeometry.displayHeight);
window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());
let currCell = [0, 0];
let currPos = [0, 0];
let targetPos = null;
let trophyPos = null;
let eQueue = [];
let anim = 30;

requestAnimationFrame(function frame() {
    canvas.clear();

    for(let node of maze.nodes) {
        let [x, y, z] = node.displayPos;
        node.sprites.forEach(sprite => {
            if(z === undefined || currPos[2] === z) {
                canvas.drawSprite(sprite, x, y)
            }
        });
    }

    canvas.drawSprite(PLAYER_SPRITE, currPos[0], currPos[1]);
    if(currPos && trophyPos && (currPos[2] === undefined || currPos[2] === trophyPos[2])) {
        canvas.drawSprite(TROPHY_SPRITE, trophyPos[0], trophyPos[1]);
    }

    if(currPos[2] !== null && currPos[2] !== undefined) {
        canvas.ctx.textAlign = "center";
        canvas.ctx.textBaseline = "middle";
        canvas.ctx.font = '.4px monospace';
        canvas.ctx.fillStyle = '#442610';
        canvas.ctx.fillText(`Depth = ${currPos[2]}`, mazeGeometry.displayWidth / 2, mazeGeometry.displayHeight - 0.5)
    }

    if (anim !== -1) {
        canvas.ctx.globalAlpha = 1 - Math.abs(anim / 30 - 1);
        canvas.clear('#000');
        canvas.ctx.globalAlpha = 1;
        if (anim === 30) {
            maze = new Maze(
                mazeGeometry,
                carver
            );
            // maze.carve();
            currCell = maze.nodes[0];
            currPos = currCell.displayPos;
        }
        anim++;
        if (anim === 60)
            anim = -1;
    } else if (!maze.isFinishedCarving) {
        maze.carveStep();

        if(maze.lastChangedCell?.displayPos) currPos = maze.lastChangedCell?.displayPos

        if(maze.isFinishedCarving) {
            maze.calculatePath();
            currCell = maze.start;
            currPos = maze.start.displayPos;
            trophyPos = maze.end.displayPos;
        }
    }
    else {
        if (targetPos != null) {
            if(targetPos[0] !== currPos[0] || targetPos[1] !== currPos[1]) {
                const dx = targetPos[0] - currPos[0];
                const dy = targetPos[1] - currPos[1];

                const stepX = dx / Math.hypot(dx, dy) * 0.25;
                const stepY = dy / Math.hypot(dx, dy) * 0.25;

                currPos = [currPos[0] + stepX, currPos[1] + stepY, currPos[2] ?? undefined];
            }

            currPos[2] = targetPos[2];

            if (Math.hypot(targetPos[0] - currPos[0], targetPos[1] - currPos[1]) < 0.05) {
                currPos = targetPos;
                targetPos = null;
            }
        } else while(eQueue.length && !movePlayer(eQueue.shift())){

        }

        if(currPos.toString() === trophyPos.toString()) {
            trophyPos = null;
            anim = 0;
        }
    }
    requestAnimationFrame(frame);
});

function movePlayer(direction) {
    if(Array.isArray(direction)) {
        for(let d of direction) {
            if(movePlayer(d)) return true;
        }
        return;
    }

    if(!currCell.isConnectedTo(currCell.allNeighbors[direction])) return false;

    while (currCell.isConnectedTo(currCell.allNeighbors[direction])) {
        currCell = currCell.allNeighbors[direction];
        // If there is a branch, exit
        if (!currCell.allNeighbors.every((_, d) =>
                d === direction
             || d === (direction ^ 1)
             || !currCell.isConnectedTo(currCell.allNeighbors[d])
        )) {
            break;
        }
    }

    targetPos = currCell.displayPos;
    return true;
}

window.onkeydown = ({key}) => {
    let direction = mazeGeometry.getDirectionForKey(key);
    if(direction !== null) eQueue.push(direction);
};

