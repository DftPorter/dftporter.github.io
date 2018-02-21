using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// Applies an explosion force to all nearby rigidbodies
public class myExplosion : MonoBehaviour
{
    public GameObject explosionPrefab;
    

    void Start()
    {
       // Debug.Log("OK");
        //explosionPrefab.SetActive(true);
    }

    void Update()
    {
        
        //if (GameObject.Find("timerText").GetComponent<myTimer>().myCoolTimer < 15)
        //{
        //    explosionPrefab.SetActive(true);
        //}
        
    }

    void onTriggerEnter(Collider col)
    {
        Debug.Log("work");
        if (col.gameObject.CompareTag("Bomb"))
        {
            // Make the other game object (the pick up) inactive, to make it disappear
            //other.gameObject.SetActive (false);
            col.gameObject.SetActive(true);

        }
        
    }
}

