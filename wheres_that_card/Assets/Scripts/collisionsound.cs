using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class collisionsound : MonoBehaviour {

	public AudioClip[] randomImpactSound;

	private AudioSource ImpactSound;

	void Start() {
		ImpactSound = GetComponent<AudioSource> ();
	}

	void OnCollisionEnter (Collision col)
	{
		AudioSource audio = GetComponent<AudioSource> ();
		if (col.relativeVelocity.magnitude > 10000)
			ImpactSound.volume = (col.relativeVelocity.magnitude) * 0.05f; // attempt at speed determined volume
			ImpactSound.PlayOneShot(randomImpactSound[Random.Range(0, 3)]); // set size to 3 in script inspector, then set each sound in the list
	}
}
