using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class collisionsound_nonrandom : MonoBehaviour {

	private AudioSource ImpactSound_nonrandom;

	void Start() {
		ImpactSound_nonrandom = GetComponent<AudioSource> ();
	}
		
	void OnCollisionEnter (Collision col_nr)
	{
		AudioSource audio = GetComponent<AudioSource> ();
		if (col_nr.relativeVelocity.magnitude > 10000)
			;
		ImpactSound_nonrandom.volume = (col_nr.relativeVelocity.magnitude) * 0.05f; // attempt at speed determined volume
			audio.Play();
	}
}
