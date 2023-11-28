using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SwipeDetector{
    private Vector2 fingerDown;
    private Vector2 fingerUp;
    private bool touchStarted;
    
    // Update is called once per frame
    public Vector2 check() {
        foreach (Touch touch in Input.touches) {
            if (touch.phase == TouchPhase.Began) {
                fingerUp = touch.position;
                fingerDown = touch.position;
                touchStarted = true;
            }

            if (touch.phase == TouchPhase.Moved) {
                if ((touch.position - fingerUp).magnitude > 20f && touchStarted) {
                    fingerDown = touch.position;
                    touchStarted = false;
                    return fingerDown - fingerUp;
                }
            }
            
            //Detects swipe after finger is released
            if (touch.phase == TouchPhase.Ended && touchStarted) {
                fingerDown = touch.position;
                touchStarted = false;
                return fingerDown - fingerUp;
            }
        }
        return Vector2.zero;
    }
}