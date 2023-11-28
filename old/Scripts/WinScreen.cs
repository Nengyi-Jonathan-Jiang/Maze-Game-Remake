using UnityEngine;
using UnityEngine.SceneManagement;

namespace Assets.Scripts {
    public class WinScreen : MonoBehaviour  {
        // Update is called once per frame
        private void Update()
        {
            if (Input.GetKey(KeyCode.Space) || Input.touchCount > 0) {
                SceneManager.LoadScene("MazeScene");
            }
        }
    }
}
