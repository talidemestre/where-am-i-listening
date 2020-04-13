// default to example data for testing
var sample_artists = ["panic at the disco", "vitas", "the wombats", "akon", "the chats", "hockey dad"]
var jsonString = '[{"artist_name":"paul simon","location_name":" United States Newark","location_coord":[40.735657,-74.1723667]},{"artist_name":"kingo hamada","location_name":" Japan Shinjuku","location_coord":[35.6937632,139.7036319]},{"artist_name":"midnight oil","location_name":" Australia Sydney","location_coord":[-33.8548157,151.2164539]},{"artist_name":"jack stauber","location_name":" Pittsburgh ","location_coord":[40.4416941,-79.9900861]},{"artist_name":"gianni and kyle","location_name":"Not Found","location_coord":[13.2433974,121.9863044]},{"artist_name":"gasper nali","location_name":" Malawi ","location_coord":[-13.2687204,33.9301963]},{"artist_name":"rostam","location_name":" United States Washington, D.C.","location_coord":[36.29885175,-82.3591933141]},{"artist_name":"bo en","location_name":" United Kingdom ","location_coord":[54.7023545,-3.2765753]},{"artist_name":"cub sport","location_name":" Brisbane Brisbane","location_coord":[-27.4689682,153.0234991]}]';

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
      marker_array[i] = WE.marker(artistData  ['location_coord']).addTo(earth);
      marker_array[i].bindPopup(html_popup_raw, {maxWidth: 150, closeButton: true}).openPopup();
    } else {
      marker_array[i] = null
    }
  }
  console.log(marker_array)

  var markerCustom = WE.marker([50, -9], '/img/logo-webglearth-white-100.png', 100, 24).addTo(earth);

  earth.setView([37.0, -95.7], 3);
}


 function makeRequest() {
  const Http = new XMLHttpRequest();
  const url='/json';

  artist_json = JSON.stringify(sample_artists);
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
