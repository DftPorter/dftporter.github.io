using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class start : MonoBehaviour {

	private SteamVR_TrackedObject trackedObj;
	private SteamVR_Controller.Device Controller
	{
		get { return SteamVR_Controller.Input((int)trackedObj.index); }
	}

	// attempt to add delay to start after press
	IEnumerator startpause (){
		yield return new WaitForSeconds (3);
	}

	// Use this for initialization
	void Start () {
		SceneManager.UnloadSceneAsync ("find_the_card_gameplay_scene"); // unsure if this is needed
		}

	void Awake()
	{
		trackedObj = GetComponent<SteamVR_TrackedObject> ();
	}
		
	
	// Update is called once per frame
	void Update () {

		if (Controller.GetHairTriggerDown())
		{
			startpause(); // attempt to add delay to start after press
			Initiate.Fade("find_the_card_gameplay_scene", Color.black, 1.0f);
			// SceneManager.LoadScene ("find_the_card_gameplay_scene"); // old transition
		}
	}
}
