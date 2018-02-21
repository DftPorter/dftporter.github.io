using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class reset_game : MonoBehaviour {
	
	private SteamVR_TrackedObject trackedObj;

	// gets controller Device ID and creates variable Controller
	private SteamVR_Controller.Device Controller
	{
		get { return SteamVR_Controller.Input((int)trackedObj.index); }
	}
		
	void Awake()
	{
		trackedObj = GetComponent<SteamVR_TrackedObject> ();
	}


	// Update is called once per frame
	void Update () {

		if (Controller.GetPressDown(SteamVR_Controller.ButtonMask.ApplicationMenu))
		{
			Debug.Log ("Menu button pressed");
			Initiate.Fade("start", Color.black, 1.0f);
		}
			
	}
}
