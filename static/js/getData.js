
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
    const spotUrl = "https://api.spotify.com/v1/me/top/artists?limit=10"
    const spotCode = 'Bearer ' + spot_token;
    console.log("Sending request")
    
    var initialized = 0;
  
    fetch(spotUrl, {method : 'GET', headers : {"Authorization": spotCode}})
    .then((response) => {
      response.json().then((jsonText) => {
        makeRequest(jsonText);
      })
  
    })
  }
  
  