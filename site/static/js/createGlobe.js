// default to example data for testing
var sample_artists;
// default when offline
var jsonString;

function initialize() {
  var jsonData = JSON.parse(jsonString)

  var options = {atmosphere: true, center: [0, 0], zoom: 0};
  var earth = new WE.map('earth_div', options);

  WE.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(earth);
    var marker_array = [];

    for (let i = 0; i < jsonData.length; i++) {
    artistData = jsonData[i];
    console.log(artistData)
    console.log(i)
    html_popup_raw = "<b>" + artistData["artist_name"] +"</b><br>" + artistData["location_name"] + "<br>"
    if (artistData["location_coord"] != null || artistData["location_name" == "Not found"]){
      //slightly randomise location to separate artists on same coordinate
      var baseCoords = artistData['location_coord']
      var changedCoords = [baseCoords[0] + Math.random()/25, baseCoords[1] + Math.random()/25]


      marker_array[i] = WE.marker(changedCoords).addTo(earth);
      marker_array[i].bindPopup(html_popup_raw, {maxWidth: 150, closeButton: true}).openPopup();
    } else {
      marker_array[i] = null
    }
  }
  console.log(marker_array)

  var markerCustom = WE.marker([50, -9], '/img/logo-webglearth-white-100.png', 100, 24).addTo(earth);

  earth.setView([37.0, -95.7], 3);
}


 function makeRequest(list_of_artists) {
  const Http = new XMLHttpRequest();
  const url='/json';

  artist_json = JSON.stringify(list_of_artists);
  Http.open("POST", url);
  Http.setRequestHeader("Content-Type", "application/json");
  Http.send(artist_json);
  var initialized = 0

  Http.onreadystatechange = (e) => {
    console.log(Http.responseText)
    console.log(initialized)
    if (Http.responseText.length > 0 && initialized == 0){
      initialized++
      jsonString = Http.responseText
      initialize()
    }
  }

 }


function getTopArtists(){
  var parsedHash = new URLSearchParams(
    window.location.hash.substr(1) // skip the first char (#)
  );
  var spot_token = parsedHash.get('access_token');

  const spotHttp = new XMLHttpRequest();
  const spotUrl = "https://api.spotify.com/v1/me/top/artists?limit=5"
  const spotCode = 'Bearer ' + spot_token;
  console.log(spotCode)

  spotHttp.open("GET", spotUrl);
  spotHttp.setRequestHeader("Authorization", spotCode);
  console.log("Sending request")
  spotHttp.send()
  
  var initialized = 0;
  spotHttp.onreadystatechange = (e) => {
    console.log(spotHttp.response)
    if (spotHttp.response != undefined && initialized==0) {
      var jsonData = JSON.parse(spotHttp.response)["items"]
      console.log(jsonData)
      var artistList = []
      for (i = 0; i < jsonData.length; i++) {
        console.log(jsonData[i]['name'])
        artistList.push(jsonData[i]['name'])
      }
      initialized++;
      console.log(artistList)
      makeRequest(artistList);
    }    

  }
}

