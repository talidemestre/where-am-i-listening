function initialize(jsonData) {
  var options = {atmosphere: true, center: [0, 0], zoom: 0};
  var earth = new WE.map('earth_div', options);

  WE.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(earth);
    var marker_array = [];
    artistList = jsonData
    for (let i = 0; i < jsonData.length; i++) {
      artistData = jsonData[i];
      coords = artistData['location_coord']
      locationIsZero = coords[0] === 0 && coords[1] === 0
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


 function makeRequest(spotJSON) {
  const url='/json';

  list_of_artist_objects = spotJSON.items;
  list_of_artist_names =[];
  for (i = 0; i < list_of_artist_objects.length ; i++) {
    list_of_artist_names.push(list_of_artist_objects[i].name)
  }

  var initialized = 0
  fetch(url, {method : 'POST', headers : {"Content-Type": "application/json"}, body: JSON.stringify(list_of_artist_names)})
        .then((response) => {
          if (response.status < 200 || response.status >= 299){ throw "Request timed out, trying again."}
          response.json().then((json) => {
            initialize(json);
          })
        }).catch(function(error) {
          console.log("Fetch failed, retrying.")
          setTimeout(makeRequest.bind(this, spotJSON),1000);
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
  console.log("Sending request")
  
  var initialized = 0;

  fetch(spotUrl, {method : 'GET', headers : {"Authorization": spotCode}})
  .then((response) => {
    response.json().then((jsonText) => {
      makeRequest(jsonText);
    })

  })
}

