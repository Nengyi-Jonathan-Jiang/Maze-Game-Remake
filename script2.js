// alert('WASD to move, E to go down a layer, Q to go up a layer. Get to the trophy.');

const WIN_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Finish.png')});
const PLAYER_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Player.png')});

function defaultIfNaN(x, defaultValue) {
    return isNaN(x) ? defaultValue : x;
}

const S = 10;
const L = 4;

const mazeGeometry = new SquareGridMazeGeometry(S, S);
const carver = cells => new DFSMazeCarver(cells);
let maze = new Maze(mazeGeometry, carver);
// maze.carve();

const canvas = new Canvas(document.getElementById('game-canvas'), S, S);
window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());
let currCell = maze.nodes[0];
let currPos = maze.nodes[0].displayPos;
let targetPos = null;
let eQueue = [];
let anim = 30;

requestAnimationFrame(function frame() {
    canvas.clear();

    for(let node of maze.nodes) {
        let [x, y] = node.displayPos;
        node.sprites.forEach(sprite => {
            canvas.drawSprite(sprite, x, y)
        });
    }

    canvas.ctx.strokeStyle = '#0f4';
    canvas.ctx.lineWidth = 0.01;
    for(let node of maze.nodes) {
        for(let connection of node.connections) {
            canvas.ctx.moveTo(node.displayPos[0] + 0.5, node.displayPos[1] + 0.5);
            canvas.ctx.lineTo(connection.displayPos[0] + 0.5, connection.displayPos[1] + 0.5);
        }
    }
    canvas.ctx.stroke();
    canvas.drawSprite(PLAYER_SPRITE, currPos[0], currPos[1]);

    if (anim !== -1) {
        canvas.ctx.globalAlpha = 1 - Math.abs(anim / 30 - 1);
        canvas.clear('#000');
        canvas.ctx.globalAlpha = 1;
        if (anim === 30) {
            maze = new Maze(
                new SquareGridMazeGeometry(S, S),
                carver
            );
            // maze.carve();
            currCell = maze.nodes[0];
            currPos = currCell.displayPos;
        }
        anim++;
        if (anim === 60)
            anim = -1;
    } else {
        if (targetPos != null) {
            currPos = [
                currPos[0] + Math.sign(targetPos[0] - currPos[0]) * 0.25,
                currPos[1] + Math.sign(targetPos[1] - currPos[1]) * 0.25,
                // currPos[2] + Math.sign(targetPos[2] - currPos[2]),
            ];
            if (Math.hypot(targetPos[0] - currPos[0], targetPos[1] - currPos[1]
                // , targetPos[2] - currPos[2]
            ) < 0.05) {
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
        if (![0,1,2,3].every(d => {
            // no branch = equal or opposite or
            return d === direction || d === (direction ^ 1) ||
                // branch not exists
                !currCell.isConnectedTo(currCell.allNeighbors[d]);
        })) {
            break;
        }
    }
    console.log(currCell.connectedNeighbors);
    targetPos = currCell.displayPos;
}

window.onkeydown = ({key}) => {
    switch (key.toLowerCase()) {
        case 'a':
            eQueue.push(0);
            break;
        case 'd':
            eQueue.push(1);
            break;
        case 'w':
            eQueue.push(2);
            break;
        case 's':
            eQueue.push(3);
            break;
        // case 'q':
        //     eQueue.push(Neighbor.Top);
        //     break;
        // case 'e':
        //     eQueue.push(Neighbor.Bottom);
        //     break;
        case 'l':
            maze.carveStep();
    }
};

