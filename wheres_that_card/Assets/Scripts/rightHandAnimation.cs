using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class rightHandAnimation : MonoBehaviour {

	// HAND STUFF
	private handanimations other;
	Animator anim;
	int GrabLarge = Animator.StringToHash("GrabLarge");
	int Idle = Animator.StringToHash("Idle");
	int Natural = Animator.StringToHash("Natural");
	// END HAND STUFF

	private SteamVR_TrackedObject trackedObj;
	private SteamVR_Controller.Device Controller
	{
		get { return SteamVR_Controller.Input((int)trackedObj.index); }
	}
		
	void Awake()
	{
		trackedObj = GetComponent<SteamVR_TrackedObject>();
	}

	void Start()
	{
		anim = GameObject.FindGameObjectWithTag("rightHand").GetComponent<Animator>();
	}

	// Update is called once per frame
	void Update () {

		if (Controller.GetHairTriggerDown ()) {
			anim.SetTrigger (GrabLarge);
			Debug.Log ("Right Trigger pulled");
		}

		if (Controller.GetHairTriggerUp ()) {
			anim.SetTrigger (Natural);
			Debug.Log ("Right Trigger released");
		}
	}
}
