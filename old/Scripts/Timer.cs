using System;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;

public class Timer : MonoBehaviour
{
    public float startTime, elapsedTime;
    public TMP_Text text;
    // Start is called before the first frame update
    void Start()
    {
        startTime = Time.time;
        //text = GetComponent<TMP_Text>();
    }

    // Update is called once per frame
    void Update()
    {
        elapsedTime = Time.time - startTime;
        int ms = Mathf.FloorToInt((elapsedTime % 1f) * 1000f);
        int timeInSeconds = PlayerData.lastTime = Mathf.FloorToInt(elapsedTime);
        int s = timeInSeconds % 60;
        int m = timeInSeconds / 60;
        text.text = (
            (m < 10 ? "0" : "") + m + ":" +
            (s < 10 ? "0" : "") + s + ":" + 
            (ms < 10 ? "00" : ms < 100 ? "0" : "") + ms
        );

        if (timeInSeconds > 300) {
            SceneManager.LoadScene("Fail");
        }
    }
}