using System;
using System.Collections.Generic;
using UnityEngine;
using Random = UnityEngine.Random;

namespace Assets.Scripts {
    public class MazeData {
        public readonly int Size;
        private readonly MazeDataCell[,] _grid;

        public MazeData(int size) {
            Size = size;
            _grid = new MazeDataCell[size, size];
            for (var row = 0; row < size; row++)
                for (var col = 0; col < size; col++)
                    _grid[row, col] = new MazeDataCell(row, col);

            Restart();
        }

        private void Restart() {
            for (var row = 0; row < Size; row++)
                for (var col = 0; col < Size; col++)
                    _grid[row, col].Reset();
        }

        public enum Neighbor { Top, Left, Bottom, Right };
        public List<Neighbor> GetNeighbors(int row, int col, Func<Vector2Int, bool> valid) {
            return GetNeighbors(row, col, (s, d) => valid(s));
        }

        public List<Neighbor> GetNeighbors(int row, int col, Func<Vector2Int, Neighbor, bool> valid) {
            var neighbors = new List<Neighbor>();
            if (row > 0 && valid(new Vector2Int(row - 1, col), Neighbor.Top))
                neighbors.Add(Neighbor.Top);
            if (row + 1 < Size && valid(new Vector2Int(row + 1, col), Neighbor.Bottom))
                neighbors.Add(Neighbor.Bottom);
            if (col > 0 && valid(new Vector2Int(row, col - 1), Neighbor.Left))
                neighbors.Add(Neighbor.Left);
            if (col + 1 < Size && valid(new Vector2Int(row, col + 1), Neighbor.Right))
                neighbors.Add(Neighbor.Right);
            return neighbors;
        }

        public Vector2Int RemoveNeighborWall(Neighbor neighbor, int row, int col) {
            switch (neighbor) {
                case Neighbor.Top:
                    RemoveWallT(row, col);
                    return new Vector2Int(row - 1, col);
                case Neighbor.Bottom:
                    RemoveWallB(row, col);
                    return new Vector2Int(row + 1, col);
                case Neighbor.Left:
                    RemoveWallL(row, col);
                    return new Vector2Int(row, col - 1);
                case Neighbor.Right:
                    RemoveWallR(row, col);
                    return new Vector2Int(row, col + 1);
                default:
                    throw new Exception("Invalid Neighbor to Remove");
            }
        }

        public bool HasNeighbor(int row, int col, Neighbor neighbor) {
            return neighbor switch {
                Neighbor.Top => !_grid[row, col].HasTopWall(),
                Neighbor.Bottom => !_grid[row, col].HasBottomWall(),
                Neighbor.Left => !_grid[row, col].HasLeftWall(),
                Neighbor.Right => !_grid[row, col].HasRightWall(),
                _ => throw new Exception("Invalid Neighbor")
            };
        }

        public Vector2Int GetNeighbor(Neighbor neighbor, int row, int col)
        {
            return neighbor switch
            {
                Neighbor.Top => new Vector2Int(row - 1, col),
                Neighbor.Bottom => new Vector2Int(row + 1, col),
                Neighbor.Left => new Vector2Int(row, col - 1),
                Neighbor.Right => new Vector2Int(row, col + 1),
                _ => throw new Exception("Invalid Neighbor")
            };
        }

        public MazeDataCell this[int row, int col] => _grid[row, col];

        public void RemoveWallT(int row, int col) {
            _grid[row, col].RemoveTopWall();
            _grid[row - 1, col].RemoveBottomWall();
        }

        public void RemoveWallB(int row, int col) {
            _grid[row, col].RemoveBottomWall();
            _grid[row + 1, col].RemoveTopWall();
        }

        public void RemoveWallL(int row, int col) {
            _grid[row, col].RemoveLeftWall();
            _grid[row, col - 1].RemoveRightWall();
        }

        public void RemoveWallR(int row, int col) {
            _grid[row, col].RemoveRightWall();
            _grid[row, col + 1].RemoveLeftWall();
        }
    }
}