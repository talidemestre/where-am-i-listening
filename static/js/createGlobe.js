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
    coords = artistData['location_coord']
    locationIsZero = coords[0] === 0 && coords[1] === 0
    console.log(coords)
    console.log(locationIsZero)
    html_popup_raw = "<b>" + artistData["artist_name"] +"</b><br>" + artistData["location_name"] + "<br>"
    if (locationIsZero != true && (artistData["location_coord"] != null  || artistData["location_name"] == "Not found")){
      //slightly randomise location to separate artists on same coordinate
      var baseCoords = artistData['location_coord']
      var changedCoords = [baseCoords[0] + Math.random()/25, baseCoords[1] + Math.random()/25]


      marker_array[i] = WE.marker(changedCoords).addTo(earth);
      marker_array[i].bindPopup(html_popup_raw, {maxWidth: 150, closeButton: true}).openPopup();
    } else {
      marker_array[i] = null
    }
  }

  var markerCustom = WE.marker([50, -9], '/img/logo-webglearth-white-100.png', 100, 24).addTo(earth);

  earth.setView([37.0, -95.7], 3);
}


 function makeRequest(list_of_artists) {
  const Http = new XMLHttpRequest();
  const url='/json';

  artist_json = JSON.stringify(list_of_artists);
  var initialized = 0
  fetch(url, {method : 'POST', headers : {"Content-Type": "application/json"}, body: artist_json})
        .then((response) => {
          response.text().then((text) => {
            console.log(text)
            jsonString = text;
            initialize();
          })

        }).catch(function(error) {
          console.log("Fetch failed, retrying.")
          setTimeout(makeRequest.bind(this, list_of_artists),1000);
        })

 }


function getTopArtists(){
  var parsedHash = new URLSearchParams(
    window.location.hash.substr(1) // skip the first char (#)
  );
  var spot_token = parsedHash.get('access_token');

  const spotHttp = new XMLHttpRequest();
  const spotUrl = "https://api.spotify.com/v1/me/top/artists?limit=50"
  const spotCode = 'Bearer ' + spot_token;
  console.log(spotCode)

  spotHttp.open("GET", spotUrl);
  spotHttp.setRequestHeader("Authorization", spotCode);
  console.log("Sending request")
  spotHttp.send()
  
  var initialized = 0;
  spotHttp.onreadystatechange = (e) => {
    if (spotHttp.response != undefined && initialized==0 && spotHttp.status == 200) {
      var jsonData = JSON.parse(spotHttp.response)["items"]
      var artistList = []
      for (i = 0; i < jsonData.length; i++) {
        artistList.push(jsonData[i]['name'])
      }
      initialized++;
      console.log(artistList)
      makeRequest(artistList);
    }

  }
}

