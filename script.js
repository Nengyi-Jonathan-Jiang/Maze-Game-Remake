// alert('WASD to move, E to go down a layer, Q to go up a layer. Get to the trophy.');

const WIN_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Finish.png')});
const PLAYER_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Player.png')});

function defaultIfNaN(x, defaultValue) {
    return isNaN(x) ? defaultValue : x;
}

// const mazeGeometry = new CubicalGridMazeGeometry(W, H, L);
// const mazeGeometry = new SquareGridMazeGeometry(16, 9);
const mazeGeometry = new HexagonalGridMazeGeometry(7);
const carver = cells => new DFSMazeCarver(cells);
let maze = new Maze(mazeGeometry, carver);

const canvas = new Canvas(document.getElementById('game-canvas'), mazeGeometry.displayWidth, mazeGeometry.displayHeight);
window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());
let currCell = maze.nodes[0];
let currPos = maze.nodes[0].displayPos;
let targetPos = null;
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
        currPos = maze.lastChangedCell?.displayPos ?? maze.nodes[0].displayPos;
    }
    else {
        if (targetPos != null && targetPos.toString() !== currPos.toString()) {
            const dx = targetPos[0] - currPos[0];
            const dy = targetPos[1] - currPos[1];

            const stepX = dx / Math.hypot(dx, dy) * 0.25;
            const stepY = dy / Math.hypot(dx, dy) * 0.25;

            currPos = [currPos[0] + stepX, currPos[1] + stepY, currPos[2]];
            if (Math.hypot(targetPos[0] - currPos[0], targetPos[1] - currPos[1]) < 0.05) {
                currPos = targetPos;
                targetPos = null;
            }
        } else if (eQueue.length) {
            movePlayer(eQueue.shift());
        }
    }
    requestAnimationFrame(frame);
});

function movePlayer(direction) {
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
}

window.onkeydown = ({key}) => {
    switch (key.toLowerCase()) {
        case 'a': eQueue.push(0); break;
        case 'd': eQueue.push(1); break;
        case 'w': eQueue.push(2); break;
        case 's': eQueue.push(3); break;
        case ' ': eQueue.push(4); break;
    }
};

