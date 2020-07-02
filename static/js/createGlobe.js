let recallTimeout;

function stopAnimate() {
  console.log("CANCELLING")
  clearTimeout(recallTimeout);
}




function initialize(jsonData) {
  document.getElementById("MouseDownDiv").addEventListener("mousedown", function() {
    stopAnimate()
  
  });

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

  document.getElementById("spinner").outerHTML = ""
  earth.setView([87, 86], 1);

  //console.log(jsonData[0])

  earth.panTo(jsonData[0]['location_coord'])

}