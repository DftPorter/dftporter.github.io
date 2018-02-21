using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ControllerGrabObject : MonoBehaviour {

	private gamecontroller other; // provice access to gamecontroller script

	private SteamVR_TrackedObject trackedObj;
	// 1
	private GameObject collidingObject; 
	// 2
	private GameObject objectInHand;

	// gets controller Device ID and creates variable Controller
	private SteamVR_Controller.Device Controller
	{
		get { return SteamVR_Controller.Input((int)trackedObj.index); }
	}

	// rumble start
	void RumbleController ( float duration, float strength)
	{
		StartCoroutine (RumbleControllerRoutine (duration, strength));
	}
	IEnumerator RumbleControllerRoutine (float duration, float strength)
	{
		strength = Mathf.Clamp01 (strength);
		float startTime = Time.realtimeSinceStartup;

		while (Time.realtimeSinceStartup - startTime <= duration )
		{
			int valveStrength = Mathf.RoundToInt (Mathf.Lerp (0, 3999, strength));
			Controller.TriggerHapticPulse ((ushort)valveStrength);
			yield return null;
		}
	}
	// rumble end

	void Awake()
	{
		trackedObj = GetComponent<SteamVR_TrackedObject>();
	}

	private void SetCollidingObject(Collider col)
	{
		// 1
		if (collidingObject || !col.GetComponent<Rigidbody>())
		{
			return;
		}
		// 2
		collidingObject = col.gameObject;
	}

	// 1
	public void OnTriggerEnter(Collider other)
	{
		SetCollidingObject(other);
	}

	// 2
	public void OnTriggerStay(Collider other)
	{
		SetCollidingObject(other);
	}

	// 3
	public void OnTriggerExit(Collider other)
	{
		if (!collidingObject)
		{
			return;
		}

		collidingObject = null;
	}

	private bool cardFound;

	private void winTitle ()
	{
		GameObject.FindGameObjectWithTag ("winTitle1").GetComponent<Renderer> ().enabled = true;
		GameObject.FindGameObjectWithTag ("winTitle2").GetComponent<Renderer> ().enabled = true;
	}

	private void winAudio ()
	{
		GameObject.FindGameObjectWithTag ("timer").SetActive (false);

	}

	private void GrabObject()
	{
		// 1
		objectInHand = collidingObject;
		collidingObject = null;
		// 2
		var joint = AddFixedJoint();
		joint.connectedBody = objectInHand.GetComponent<Rigidbody>();

		// detect card picked up and display WIN title
		if (objectInHand.gameObject.CompareTag ("card"))
		{
			if (cardFound == false) {
				AudioSource audio = GetComponent<AudioSource> ();
				cardFound = true;
				audio.Play ();
				Debug.Log ("CARD FOUND");
				winTitle ();
				winAudio ();
			}
		}
	}



	// 3
	private FixedJoint AddFixedJoint()
	{
		FixedJoint fx = gameObject.AddComponent<FixedJoint>();
		fx.breakForce = 20000;
		fx.breakTorque = 20000;
		return fx;
	}

	private void ReleaseObject()
	{
		// 1
		if (GetComponent<FixedJoint>())
		{
			// 2
			GetComponent<FixedJoint>().connectedBody = null;
			Destroy(GetComponent<FixedJoint>());
			// 3
			objectInHand.GetComponent<Rigidbody>().velocity = Controller.velocity;
			objectInHand.GetComponent<Rigidbody>().angularVelocity = Controller.angularVelocity;
		}
		// 4
		objectInHand = null;
	}
		

	// Update is called once per frame
	void Update () {
		// 1
		if (Controller.GetHairTriggerDown())
		{
			if (collidingObject)
			{
				GrabObject();
				RumbleController (0.05f, 250);
			}
		}

		// 2
		if (Controller.GetHairTriggerUp())
		{
			if (objectInHand)
			{
				ReleaseObject();
			}
		}
	}
}
