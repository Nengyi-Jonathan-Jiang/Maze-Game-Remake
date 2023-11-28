using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Assets.Scripts {
    public class PlayerControlScript : MonoBehaviour {
        private int x, y;
        public float movementSpeed;

        SwipeDetector swipeDetector = new SwipeDetector();
        
        Action onFinishAnimate = null;

        public Vector2Int Pos {
            set {
                x = value.x;
                y = value.y;
                transform.position = new Vector3(x, y, -3) * 8;
                GetComponent<TrailRenderer>().Clear();
            }
        }

        public Dictionary<string, GameObject> Keys;

        public GameObject MarkerPrefab;
        public MazeBuilder maze;

        // Start is called before the first frame update
        private void Start() {
            Keys = new Dictionary<string, GameObject>();
        }

        // Update is called once per frame
        private void Update() {

            //var movement = new Vector2();
            /*
            if (Input.GetKey(KeyCode.W))
                movement += new Vector2(0, 1);
            if (Input.GetKey(KeyCode.A))
                movement += new Vector2(-1, 0);
            if (Input.GetKey(KeyCode.S))
                movement += new Vector2(0, -1);
            if (Input.GetKey(KeyCode.D))
                movement += new Vector2(1, 0);
            */

            var swipe = swipeDetector.check();
            if ((new Vector3(x, y, 0) * 8 - transform.position).magnitude > 1) { }
            else {
                if (swipe != Vector2.zero) {
                    var angle = Mathf.Atan2(swipe.y, swipe.x);
                    var a = Mathf.RoundToInt(2 * angle / Mathf.PI);
                    switch (a) {
                        case -2:
                        case 2:
                            GetComponent<SpriteRenderer>().flipX = true;
                            Move(-1, 0, MazeData.Neighbor.Top);
                            break;
                        case -1:
                            GetComponent<SpriteRenderer>().flipY = true;
                            Move(0, -1, MazeData.Neighbor.Left);
                            break;
                        case 0:
                            GetComponent<SpriteRenderer>().flipX = false;
                            Move(1, 0, MazeData.Neighbor.Bottom);
                            break;
                        case 1:
                            GetComponent<SpriteRenderer>().flipY = false;
                            Move(0, 1, MazeData.Neighbor.Right);
                            break;
                    }
                }
                else{
                    if (Input.GetKeyDown(KeyCode.W)) {
                        GetComponent<SpriteRenderer>().flipY = false;
                        Move(0, 1, MazeData.Neighbor.Right);
                    }
                    else if (Input.GetKeyDown(KeyCode.A)) {
                        GetComponent<SpriteRenderer>().flipX = true;
                        Move(-1, 0, MazeData.Neighbor.Top);
                    }
                    else if (Input.GetKeyDown(KeyCode.S)) {
                        GetComponent<SpriteRenderer>().flipY = true;
                        Move(0, -1, MazeData.Neighbor.Left);
                    }
                    else if (Input.GetKeyDown(KeyCode.D)) {
                        GetComponent<SpriteRenderer>().flipX = false;
                        Move(1, 0, MazeData.Neighbor.Bottom);
                    }
                }
            }


            //_rb.AddForce(movement * Time.deltaTime * 1000 * MovementSpeed);
            Vector3 delta = new Vector3(x, y, 0) * 8 - transform.position;
            Vector3 direction = delta.normalized;
            Vector3 movement = direction * Mathf.Min(movementSpeed * Time.deltaTime, delta.magnitude);
            
            if ((movement - delta).magnitude <= 1 && onFinishAnimate != null) {
                onFinishAnimate();
                onFinishAnimate = null;
            }
            
            transform.position += movement;
            
        }

        private void Move(int dx, int dy, MazeData.Neighbor n) {
            Debug.Log("Moving " + dx + " " + dy + " from " + x + " " + y);
            while (
                    maze.CanMove(x, y, n)
            ) {
                x += dx;
                y += dy;

                Debug.Log("X: " + x + ", y: " + y);

                GameObject obstacle = maze.GetObstacle(x, y);
                if (obstacle == null) {
                    if (
                        maze.CanMove(x, y, (MazeData.Neighbor) (((int) n + 1) & 3)) ||
                        maze.CanMove(x, y, (MazeData.Neighbor) (((int) n + 3) & 3))
                    ) {
                        return;
                    }
                    continue;
                }
                switch (obstacle.name.ToCharArray()[0]) {
                    case 'K':
                        onFinishAnimate = () => {
                            obstacle.transform.parent = Camera.main.transform;
                            obstacle.transform.localScale = Vector3.one * 3;
                            Keys.Add(obstacle.name.Substring(obstacle.name.Length - 1), obstacle);

                            RePositionKeys();

                            var marker = Instantiate(MarkerPrefab);
                            marker.transform.parent = obstacle.transform;
                            marker.transform.localPosition = Vector2.zero;
                            marker.GetComponent<SpriteRenderer>().color = new Color(1, 1, 1, .1f);
                        };

                        maze.RemoveObstacle(x, y);
                        break;
                    case 'D':
                        string color = obstacle.name.Substring(obstacle.name.Length - 1);
                        if (Keys.ContainsKey(color)) {
                            onFinishAnimate = () => {
                                Destroy(obstacle);
                                Destroy(Keys[color]);
                                Keys.Remove(color);
                                RePositionKeys();
                            };
                            maze.RemoveObstacle(x, y);
                        }
                        else {
                            x -= dx;
                            y -= dy;
                        }
                        break;
                    case 'F':
                        onFinishAnimate = () => {
                            SceneManager.LoadScene("WinScene");
                        };
                        break;
                }

                return;
            }
        }

        private void RePositionKeys() {
            int i = 0;
            foreach (string s in Keys.Keys) {
                GameObject key = Keys[s];

                key.transform.localPosition = new Vector3(-58 + 4 * (++i), 29, 5);

            }
        }
    }
}