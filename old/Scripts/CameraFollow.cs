using UnityEngine;

namespace Assets.Scripts  {
    public class CameraFollow : MonoBehaviour {
        public GameObject Target;
        public float CameraFollowSpeed;
    
        // Update is called once per frame
        private void Update() {
            Vector2 delta = Target.transform.position - transform.position;
            if (delta.magnitude < 0.001f) {
                transform.position += (Vector3) delta;
            }
            else {
                Vector2 movement = delta * (1 - Mathf.Exp(-Time.deltaTime * CameraFollowSpeed));
                transform.position += (Vector3) movement;
            }
        }
    }
}
