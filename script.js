// alert('WASD to move, E to go down a layer, Q to go up a layer. Get to the trophy.');

const TROPHY_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Finish.png')});
const PLAYER_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Player.png')});

function defaultIfNaN(x, defaultValue) {
    return isNaN(x) ? defaultValue : x;
}

// const mazeGeometry = new CubicalGridMazeGeometry(32, 18, 5);
// const mazeGeometry = new CubicalGridMazeGeometry(16, 9, 3);
// const mazeGeometry = new SquareGridMazeGeometry(16, 9);
// const mazeGeometry = new HexagonalGridMazeGeometry(10);
const mazeGeometry = new TriangleGridMazeGeometry(15);
const carver = cells => new DFSMazeCarver(cells);
let maze = new Maze(mazeGeometry, carver);

const canvas = new Canvas(
    document.getElementById('game-canvas'),
    // mazeGeometry.displayWidth,
    // mazeGeometry.displayHeight + (mazeGeometry.is3d ? .5 : 0)
    8, 8
);
window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());
let currNode = [0, 0];
let currPos = [0, 0];
let cameraPos = [0, 0];
let targetPos = null;
let trophyPos = null;
let eQueue = [];
let anim = 30;
let showSolutionPath = false;

function onFinishCarving() {
    maze.calculatePath();
    currNode = maze.start;
    currPos = maze.start.displayPos;
    trophyPos = maze.end.displayPos;
}

requestAnimationFrame(function frame() {

    // update camera pos

    {
        const dx = currPos[0] - cameraPos[0];
        const dy = currPos[1] - cameraPos[1];
        const r = Math.hypot(dx, dy);

        if(r !== 0) {

            const step_r = r * 0.05;

            cameraPos = [
                cameraPos[0] + dx * step_r / r,
                cameraPos[1] + dy * step_r / r
            ]
        }
    }

    canvas.clear();

    const offsetX = -cameraPos[0] + 3.5;
    const offsetY = -cameraPos[1] + 3.5;

    for(let node of maze.nodes) {
        let [x, y, z] = node.displayPos;
        node.sprites.forEach(sprite => {
            if(!mazeGeometry.is3d || currPos[2] === z) {
                canvas.drawSprite(sprite, x + offsetX, y + offsetY)
            }
        });
    }

    if(showSolutionPath) {
        let solutionPath =
            [currPos, ...maze.calculateSolutionFromNode(currNode).map(i => i.displayPos)];
        if(solutionPath.length > 1) {
            let end;

            canvas.ctx.strokeStyle = canvas.ctx.fillStyle = '#0f4';
            canvas.ctx.lineWidth = 0.03125;
            canvas.ctx.beginPath();
            for (let i = 1; i < solutionPath.length; i++) {
                let a = solutionPath[i - 1];
                let b = solutionPath[i];

                end = b;
                if (mazeGeometry.is3d && (a[2] !== currPos[2] || b[2] !== currPos[2]))
                    break;

                canvas.ctx.moveTo(a[0] + offsetX, a[1] + offsetY);
                canvas.ctx.lineTo(b[0] + offsetX, b[1] + offsetY);
            }
            canvas.ctx.closePath();
            canvas.ctx.stroke();
            canvas.ctx.fill();
            canvas.ctx.beginPath();
            canvas.ctx.arc(end[0] + offsetX, end[1] + offsetY, 0.1875, 0, Math.PI * 2);
            canvas.ctx.closePath();
            canvas.ctx.fill();
        }
    }

    canvas.drawSprite(PLAYER_SPRITE, currPos[0] + offsetX, currPos[1] + offsetY);

    if(currPos && trophyPos && (!mazeGeometry.is3d || currPos[2] === trophyPos[2])) {
        canvas.drawSprite(TROPHY_SPRITE, trophyPos[0] + offsetX, trophyPos[1] + offsetY);
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
            currNode = maze.nodes[0];
            cameraPos = currPos = currNode.displayPos;
        }
        anim++;
        if (anim === 60)
            anim = -1;
    } else if (!maze.isFinishedCarving) {
        maze.carveStep();

        if(maze.lastChangedCell?.displayPos)
            currPos = maze.lastChangedCell?.displayPos;

        cameraPos = currPos;

        if(maze.isFinishedCarving) {
            onFinishCarving();
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
        } else while(eQueue.length){
            if(movePlayer(eQueue.shift())) {
                break;
            }
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

    if(!currNode.isConnectedTo(currNode.allNeighbors[direction])) return false;

    while (currNode.isConnectedTo(currNode.allNeighbors[direction])) {
        currNode = currNode.allNeighbors[direction];
        // If there is a branch, exit
        if (!currNode.allNeighbors.every((_, d) =>
                d === direction
             || d === (direction ^ 1)
             || !currNode.isConnectedTo(currNode.allNeighbors[d])
        )) break;
    }

    targetPos = currNode.displayPos;
    return true;
}

window.onkeydown = ({key}) => {
    let direction = mazeGeometry.getDirectionForKey(key);
    if(direction !== null) eQueue.push(direction);
    else {
        switch(key){
            case '/':
                showSolutionPath = !showSolutionPath;
                break;
            case 'p':
                if(!maze.isFinishedCarving) {
                    console.log('skipping maze carving');
                    maze.carve();
                    onFinishCarving();
                }
                break;
        }
    }
};

