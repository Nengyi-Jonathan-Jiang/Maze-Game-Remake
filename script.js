maze.canvas = document.getElementById('game-canvas');

document.querySelectorAll('input,button').forEach(i => i.onkeydown = e => e.preventDefault());

document.getElementById('maze-size').oninput = ({target:{value}}) => {
    document.getElementById('maze-size-display').innerText = value;
}
document.getElementById('view-radius').oninput = ({target:{value}}) => {
    maze.viewRadius = value;
    document.getElementById('view-radius-display').innerText = `${~~+value}`
}

document.getElementById('show-solution').onclick = ({target:{checked}}) => {
    maze.showSolution = checked;
}
document.getElementById('show-generation').onclick = ({target:{checked}}) => {
    maze.skipGeneration = !checked;
}


document.getElementById('regenerate').onclick = _ => {
    const size = +document.getElementById('maze-size').value;

    const geometry = [
        new SquareGridMazeGeometry(size, size),
        new TriangleGridMazeGeometry(size),
        new HexagonalGridMazeGeometry(size),
        new CubicalGridMazeGeometry(size, size, 3),
    ][[...document.querySelectorAll('input[name="maze-geometry"]')].findIndex(i => i.checked)]

    maze.geometry = geometry;
}