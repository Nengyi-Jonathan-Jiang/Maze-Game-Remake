using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public static class PlayerData
{
    public static int lastTime;

    public static float averageTime {
        get {
            return PlayerPrefs.GetFloat("AverageTime", -1);
        }
        set {
            PlayerPrefs.SetFloat("AverageTime", value);
        }
    }

    private static int plays {
        get {
            return PlayerPrefs.GetInt("Plays", 0);
        }
        set {
            PlayerPrefs.SetInt("Plays", value);
        }
    }

    public static void addScore(int time) {
        averageTime = (averageTime * plays + time) / (plays + 1);
        plays++;
    }

    public static void reset() {
        plays = 0;
        averageTime = -1;
    }
}
