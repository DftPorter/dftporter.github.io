using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI; //Very Important!!! :/

public class myTimer : MonoBehaviour
{
   
    public float myCoolTimer = 120;
    private Text timerText;
    private System.TimeSpan timeRemaining;
    private System.String timeMinutes;
    private System.String timeSeconds;
    private AudioSource audio01;
    private AudioSource audio02;
	private AudioSource audio03;
	private AudioSource audio04;
    private bool audio01Played;
    private bool audio02Played;
	private bool audio03Played;
	private bool audio04Played;
 //   public GameObject bombObj;

	private void failTitle ()
	{
		GameObject.FindGameObjectWithTag ("failTitle1").GetComponent<Renderer> ().enabled = true;
		GameObject.FindGameObjectWithTag ("failTitle2").GetComponent<Renderer> ().enabled = true;
	}

	private void destroyCard()
	{
		GameObject.FindGameObjectWithTag ("card").SetActive (false);
		Debug.Log ("Card destroyed");
	}

    // Use this for initialization
    void Start()
    {
       timerText = GetComponent<Text>();

        AudioSource[] audios = GetComponents<AudioSource>();
        audio01 = audios[0];
        audio02 = audios[1];
		audio03 = audios[2];
		audio04 = audios[3];

    }

    // Update is called once per frame
    void Update()
    {
        if (myCoolTimer > 1)
        {
            myCoolTimer -= Time.deltaTime;
        }
        

        timeRemaining = System.TimeSpan.FromSeconds(myCoolTimer);

        timeMinutes = timeRemaining.Minutes.ToString();
        timeSeconds = timeRemaining.Seconds.ToString();

        if (timeMinutes.Length == 1)
        {
            timeMinutes = "0" + timeMinutes;
        }

        if (timeSeconds.Length == 1)
        {
            timeSeconds = "0" + timeSeconds;
        }

        //3D text object
        TextMesh textObject = GameObject.Find("Timer").GetComponent<TextMesh>();
        textObject.text = timeMinutes + ":" + timeSeconds;

        //UI Canvas text object
        //timerText.text = myCoolTimer.ToString("f0");
        //print(myCoolTimer);

        if (myCoolTimer < 40 && audio02.isPlaying != true && audio02Played != true)
        {
            audio02.Play();
            audio02Played = true;
        }
		if (myCoolTimer < 15 && audio03.isPlaying != true && audio03Played != true)
		{
			audio03.Play();
			audio03Played = true;
		} 
		if (myCoolTimer < 1 && audio04.isPlaying != true && audio04Played != true)
        {
			failTitle ();
			destroyCard ();
			audio04.Play();
			audio04Played = true;
			//bombObj.SetActive(true);
            //bombObj = GameObject.Find("ExplosionMobile");
            //GameObject.Find("ExplosionMobile").SetActive(true);
        }
    }

}
