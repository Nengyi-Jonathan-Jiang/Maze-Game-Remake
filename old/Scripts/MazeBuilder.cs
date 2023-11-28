using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Random = UnityEngine.Random;

namespace Assets.Scripts {
    public class MazeBuilder : MonoBehaviour {
        public Color[] KeyColors = {Color.yellow, Color.red, Color.green, Color.blue};
        
        
        public int Size;
        
        public GameObject MazeKeyPrefab;
        public GameObject MazeDoorPrefab;

        public GameObject MazeCellPrefab;
        public Sprite[] MazeCellTextures;
        public Sprite[] MazeKeyTextures;
        public Sprite[] MazeKeyTexturesDeactivated;

        public PlayerControlScript player;

        private MazeData _mazeData;
        private GameObject[,] _obstacles;

        // Start is called before the first frame update
        private void Start() {
            Build();
        }

        private void Build() {
            _mazeData = new MazeData(Size);
            _obstacles = new GameObject[Size, Size];
            
            var visited = new bool[Size, Size];
            var parent = new Vector2Int[Size, Size];
            var children = new List<Vector2Int>[Size, Size];
            for (var i = 0; i < Size; ++i) for (var j = 0; j < Size; ++j) children[i, j] = new List<Vector2Int>();

            var stk = new Stack<Vector2Int>();
            var dStk = new Stack<int>();

            var start = new Vector2Int(Random.Range(0, Size), Random.Range(0, Size));
            var end = start;
            var maxDepth = 0;

            stk.Push(start);
            dStk.Push(0);
            while (stk.Count > 0) {
                var p = stk.Peek();
                var depth = dStk.Peek();

                if (depth > maxDepth) {
                    end = p;
                    maxDepth = depth;
                }

                int row = p.x, col = p.y;
                visited[row, col] = true;
                //Get neighbors
                var neighbors = _mazeData.GetNeighbors(row, col, pt => !visited[pt.x, pt.y]);
                if (neighbors.Count < 2) {
                    stk.Pop();
                    dStk.Pop();
                }
                if (neighbors.Count == 0) continue;
                var newPos = _mazeData.RemoveNeighborWall(
                    neighbors[Random.Range(0, neighbors.Count)],
                    row, col
                );

                stk.Push(newPos);
                dStk.Push(depth + 1);

                children[p.x, p.y].Add(newPos);
                parent[newPos.x, newPos.y] = p;
            }

            player.Pos = start;
            GameObject.Find("Finish").transform.position = new Vector3(end.x * 8, end.y * 8, -1);
            _obstacles[end.x, end.y] = GameObject.Find("Finish");
            
            for (var i = 0; i < Size; i++) {
                for (var j = 0; j < Size; j++) {
                    var cell = Instantiate(MazeCellPrefab);
                    cell.transform.position = new Vector3(i * 8, j * 8, 1);
                    cell.transform.parent = gameObject.transform;
                    cell.name = "Cell";
                    var c = _mazeData[i, j];
                    //var wallsIdx = (c.HasTopWall() ? 8 : 0) + (c.HasRightWall() ? 4 : 0) + (c.HasBottomWall() ? 2 : 0) + (c.HasLeftWall() ? 1 : 0);
                    var wallsIdx = (c.HasRightWall() ? 8 : 0) + (c.HasBottomWall() ? 4 : 0) + (c.HasLeftWall() ? 2 : 0) + (c.HasTopWall() ? 1 : 0);
                    cell.GetComponent<SpriteRenderer>().sprite = MazeCellTextures[wallsIdx];
                }
            }

            visited[start.x, start.y] = visited[end.x, end.y] = false;


            var hasDoor = new bool[Size, Size];
            var used = new bool[Size, Size];
            used[start.x, start.y] = used[end.x, end.y] = true;

            var solutionPath = new HashSet<Vector2Int>(new[]{start, end});
            while (end != start) {
                end = parent[end.x, end.y];
                solutionPath.Add(end);
            }
            var keyPaths = new HashSet<Vector2Int>(solutionPath);

            for (int i = 0, color = 0; i < 100 && color < MazeKeyTextures.Count(); i++) {
                Vector2Int doorPos;
                try {
                    try {
                        doorPos = GetRandomElement((i == 0 ? solutionPath : keyPaths.Except(solutionPath)).Where(s => !used[s.x, s.y]));
                    }
                    catch {
                        doorPos = GetRandomElement(solutionPath.Where(s => !used[s.x, s.y]));
                    }
                }
                catch {break;}

                used[doorPos.x, doorPos.y] = hasDoor[doorPos.x, doorPos.y] = true;

                var doorPath = GetRoute(start, doorPos, parent);

                var reachable = new HashSet<Vector2Int>(doorPath);
                var stk2 = new Stack<Vector2Int>(doorPath);
                while (stk2.Count > 0) {
                    var pos = stk2.Pop();
                    var neighbors = _mazeData.GetNeighbors(pos.x, pos.y, p =>
                        !hasDoor[p.x, p.y] && 
                        !reachable.Contains(p) 
                        && children[pos.x, pos.y].Contains(p)
                    );
                    foreach (var n in neighbors.Select(d => _mazeData.GetNeighbor(d, pos.x, pos.y))) {
                        reachable.Add(n);
                        stk2.Push(n);
                    }
                }

                var possibleKeyPositions = new List<Vector2Int>(reachable);

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
                
                var keyPath = GetRoute(start, keyPos, parent);
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
                        var r2 = Instantiate(MazeKeyPrefab);
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

        private static HashSet<Vector2Int> GetRoute(Vector2Int start, Vector2Int target, Vector2Int[,] parent) {
            var res = new HashSet<Vector2Int>();
            while (true) {
                target = parent[target.x, target.y];
                if (target == start)
                    break;
                res.Add(target);
            }
            return res;
        }

        private static T GetRandomElement<T>(IEnumerable<T> l) {
            var list = new List<T>(l);
            return list[Random.Range(0, list.Count)];
        }
        

        private void AddMazeDoorAt(int x, int y, Color color) {
            var res = Instantiate(MazeDoorPrefab);
            res.transform.position = new Vector2(x * 8, y * 8);
            res.transform.parent = gameObject.transform;
            res.name = "Door";
            res.GetComponent<SpriteRenderer>().color = color;

            _obstacles[x, y] = res;
        }

        public bool CanMove(int x, int y, MazeData.Neighbor neighbor) {
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

        public GameObject GetObstacle(int x, int y) {
            return _obstacles[x, y];
        }

        public void RemoveObstacle(int x, int y) {
            _obstacles[x, y] = null;
        }
    }


}