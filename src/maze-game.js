const maze = (() => {
    const TROPHY_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Finish.png')});
    const PLAYER_SPRITE = new Sprite(1, 1, {img: Sprite.loadImage('res/Player.png')});
    const VIGNETTE_SPRITE = new Sprite(8, 8, {img: Sprite.loadImage('res/vignette.png')});

    function defaultIfNaN(x, defaultValue) {
        return isNaN(x) ? defaultValue : x;
    }

    let canvas = new Canvas(null, 8, 8);

    let mazeGeometry = new SquareGridMazeGeometry(10, 10);

    /** @type {function(MazeNode[]):MazeCarver} */
    let mazeCarverSupplier = cells => new DFSMazeCarver(cells);
    let maze = new Maze(mazeGeometry, mazeCarverSupplier);

    let currNode = [0, 0];
    let currPos = [0, 0];
    let cameraPos = [0, 0];
    let targetPos = null;
    let trophyPos = null;
    let eQueue = [];
    let anim = 30;
    let showSolutionPath = false;
    let skipGeneration = false;
    let viewRadius = 4;

    function onFinishCarving() {
        maze.calculatePath();
        currNode = maze.start;
        cameraPos = currPos = maze.start.displayPos;
        trophyPos = maze.end.displayPos;
    }

    function updateCameraPosition() {
        const dx = currPos[0] - cameraPos[0];
        const dy = currPos[1] - cameraPos[1];
        const r = Math.hypot(dx, dy);

        if (r !== 0) {
            const step_r = r * 0.05;

            cameraPos = [
                cameraPos[0] + dx * step_r / r,
                cameraPos[1] + dy * step_r / r
            ]
        }
    }

    function reset() {
        anim = 0;
        trophyPos = null;
    }

    requestAnimationFrame(function frame() {
        updateCameraPosition();

        let offsetX;
        let offsetY;
        if (!maze.isFinishedCarving) {
            let canvasSize = Math.max(maze.geometry.displayHeight, maze.geometry.displayWidth) * Math.sqrt(2) + 3;
            canvas.viewportWidth = canvas.viewportHeight = canvasSize;

            offsetX = (canvasSize - maze.geometry.displayWidth) / 2;
            offsetY = (canvasSize - maze.geometry.displayHeight) / 2;
        }
        else {
            offsetX = -cameraPos[0] + canvas.viewportWidth / 2;
            offsetY = -cameraPos[1] + canvas.viewportHeight / 2;
            canvas.viewportWidth =  viewRadius * 2;
            canvas.viewportHeight = viewRadius * 2;
        }
        VIGNETTE_SPRITE.width = canvas.viewportWidth;
        VIGNETTE_SPRITE.height = canvas.viewportHeight;


        canvas.clear("#88BDE3");

        for (let node of maze.nodes) {
            let [x, y, z] = node.displayPos;
            node.sprites.forEach(sprite => {
                if (!mazeGeometry.is3d || currPos[2] === z) {
                    canvas.drawSprite(sprite, x + offsetX, y + offsetY)
                }
            });
        }

        if (showSolutionPath) {
            let solutionPath = [currPos, ...maze.calculateSolutionFromNode(currNode).map(i => i.displayPos)];
            if (solutionPath.length > 1) {
                let end;

                canvas.withCtx(ctx => {
                    ctx.strokeStyle = ctx.fillStyle = '#f04';
                    ctx.lineWidth = 0.03125;
                    ctx.beginPath();
                    for (let i = 1; i < solutionPath.length; i++) {
                        let a = solutionPath[i - 1];
                        let b = solutionPath[i];

                        end = b;
                        if (mazeGeometry.is3d && (a[2] !== currPos[2] || b[2] !== currPos[2]))
                            break;

                        ctx.moveTo(a[0] + offsetX, a[1] + offsetY);
                        ctx.lineTo(b[0] + offsetX, b[1] + offsetY);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(end[0] + offsetX, end[1] + offsetY, 0.1875, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.fill();
                })
            }
        }

        canvas.drawSprite(PLAYER_SPRITE, currPos[0] + offsetX, currPos[1] + offsetY);

        if (currPos && trophyPos && (!mazeGeometry.is3d || currPos[2] === trophyPos[2])) {
            canvas.drawSprite(TROPHY_SPRITE, trophyPos[0] + offsetX, trophyPos[1] + offsetY);
        }

        if (anim !== -1) {
            canvas.withCtx(ctx => {
                ctx.globalAlpha = 1 - Math.abs(anim / 30 - 1);
                canvas.clear("#88BDE3");
                ctx.globalAlpha = 1;
            });

            if (anim === 30) {
                maze = new Maze(mazeGeometry, mazeCarverSupplier);
                currNode = maze.nodes[0];
                cameraPos = currPos = currNode.displayPos;

                if(skipGeneration) {
                    maze.carve();
                    onFinishCarving();
                }
            }
            anim++;
            if (anim === 60) anim = -1;
        } else if (!maze.isFinishedCarving) {
            if(skipGeneration) {
                maze.carve();
                onFinishCarving();
            }
            else {

                maze.carveStep();

                if (maze.lastChangedCell?.displayPos)
                    currPos = maze.lastChangedCell?.displayPos;

                cameraPos = currPos;

                if (maze.isFinishedCarving) {
                    onFinishCarving();
                }
            }
        } else {
            if (targetPos != null) {
                if (targetPos[0] !== currPos[0] || targetPos[1] !== currPos[1]) {
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
            } else while (eQueue.length) {
                if (movePlayer(eQueue.shift())) {
                    break;
                }
            }

            if (currPos.toString() === trophyPos.toString()) {
                reset();
            }
        }

        canvas.withCtx(ctx => {
            ctx.globalCompositeOperation = 'lighten';
            canvas.drawSprite(VIGNETTE_SPRITE, canvas.viewportWidth / 2, canvas.viewportHeight / 2);
            ctx.globalCompositeOperation = 'source-over';
        })

        requestAnimationFrame(frame);
    });

    function movePlayer(direction) {
        if (Array.isArray(direction)) {
            for (let d of direction) {
                if (movePlayer(d)) return true;
            }
            return;
        }

        if (!currNode.isConnectedTo(currNode.allNeighbors[direction])) return false;

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

    window.onresize = (f => (f(), f))(() => canvas.resizeToDisplaySize());
    window.onkeydown = ({key}) => {
        let direction = mazeGeometry.getDirectionForKey(key);
        if (direction !== null) eQueue.push(direction);
        else {
            switch (key) {
                case '/':
                    showSolutionPath = !showSolutionPath;
                    break;
            }
        }
    };

    return {
        /** @param {function(MazeNode[]):MazeCarver} carverSupplier*/
        set carver(carverSupplier) {
            mazeCarverSupplier = carverSupplier;
            reset();
        },

        /** @param {MazeGeometry} geometry */
        set geometry(geometry) {
            mazeGeometry = geometry;
            reset();
        },

        /** @param {number} radius */
        set viewRadius(radius) {
            viewRadius = radius;
        },

        /** @type {number} */
        get viewRadius() {
            return viewRadius;
        },

        /** @param {HTMLCanvasElement} canvasEl */
        set canvas(canvasEl) {
            canvas.el = canvasEl;
        },

        set showSolution(showSolution) {
            showSolutionPath = showSolution;
        },

        set skipGeneration(skip){
            skipGeneration = skip;
        }
    }
})()