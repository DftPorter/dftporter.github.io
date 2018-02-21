using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class gamecontroller : MonoBehaviour {

	public GameObject card;
	public Transform[] spawnPoints;

	void SpawnCard() {
		int spawnPointIndex = Random.Range (0, spawnPoints.Length);
		Instantiate (card, spawnPoints [spawnPointIndex].position, spawnPoints [spawnPointIndex].rotation);
	}


	// Use this for initialization
	void Start () {
		SpawnCard ();
	}

	// Update is called once per frame
	void Update () {
		if (Input.GetKeyDown(KeyCode.Escape))
		{
			Initiate.Fade("start", Color.black, 1.0f);
			Debug.Log ("Esc button pressed");
		}
	}
}
