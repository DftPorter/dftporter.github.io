using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class phone_pickup : MonoBehaviour {


	void OnTriggerEnter (Collider other)
	{
		if (other.gameObject.CompareTag ("phone_base")) {
			AudioSource audio = GetComponent<AudioSource> ();
			audio.Stop ();
			Debug.Log ("Phone touching receiver");
		} 
	}

	void OnTriggerExit (Collider other)
	{
		if (other.gameObject.CompareTag ("phone_base")) {
			AudioSource audio = GetComponent<AudioSource> ();
			audio.Play ();
			Debug.Log ("Phone removed from receiver");
		} 
	}
}
