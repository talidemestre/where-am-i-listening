function initialize(jsonData) {
  document.getElementById("body").addEventListener("mousedown", function() {
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
  earth.setView([0, 0], 1);


  var before = null;
  finalCoords = jsonData[0]['location_coord']
  i = 0
  requestAnimationFrame(function animate(now) {
      var c = earth.getPosition();
      var elapsed = before? now - before: 0;
      i += 1
      if (i <= 400){
        earth.setCenter([c[0] + finalCoords[0] * (1/100) *( Math.exp(-i/100)), c[1] + finalCoords[1]*((1/100)* Math.exp(-i/100) )]);
        earth.setZoom(earth.getZoom() + 1/32 * Math.exp(-i/85))
        requestAnimationFrame(animate);        
        console.log(i);
      }

  });

}