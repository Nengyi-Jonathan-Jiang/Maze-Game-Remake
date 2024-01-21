
// Funny graph theory magic! So fun!
class DualMazeCarver extends MazeCarver {
    // TODO
    // Instead of carving passages (connections) between cells as in DFS
    // we can instead create walls between cells (disconnections)
    // to do so, we take the dual of the graph formed by the cells
    // we mark every node on the edge of the graph as visited
    // then we repeatedly select a random unvisited node that is adjacent to a visited node and put a wall the two cells that are divided by the edge
    // the effect of the algorithm is to grow the walls of the maze instead of growing the tunnels in the maze.
}