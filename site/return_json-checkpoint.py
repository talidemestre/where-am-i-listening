import pandas as pd
import numpy as np
import wikipedia as wiki
from bs4 import BeautifulSoup
from optional import Optional
import geocoder
import random
import wptools
import requests
from flask import Flask
from flask_restful import Resource, Api

app = Flask(__name__)
api = Api(app)

class JsonController(Resource):
    schema = {
        'GET': {
            'type': 'array',
            'properties': {
                'id':   {
                    'type': 'string'
                }
            }
        }
    }

    def get(self):
        sample_artists = ["paul simon", "kingo hamada", "midnight oil", "jack stauber", "gianni and kyle", "gasper nali", "rostam", "bo en", "cub sport"]
        df = createDataframe(sample_artists)
        return df.to_json(orient="records")
        
        
        
api.add_resource(JsonController, '/')

if __name__ == "__main__":
    app.run()
    
    
    


import os
os.environ["PROJ_LIB"] = "C:\\Users\\Tali\\Anaconda3\\Library\\share";
from matplotlib import pyplot as plt
from mpl_toolkits.basemap import Basemap


import warnings
import matplotlib.cbook
warnings.filterwarnings("ignore",category=matplotlib.cbook.mplDeprecation)

## Scraping
def getArtistOrigin(name: str):
    result = getOriginFromMusicbrainz(name)
    
    if result.is_empty():
        result = getOriginFromWikipedia(name + "Musician")
    
    if result.is_empty():
        result = getOriginFromWikidata(name)
    
    if result.is_present():
        toReturn = result.get()
    else:
        print("Still not found!", name)
        toReturn = "Not Found"
        
    return toReturn


# unfortunately this seems to alwasy return something as MusicBrain will return results even if they dont have the artist
# fortunately it does know alot of artists! Also it is much faster so for now I think the tradeoff is worth it,
def getOriginFromMusicbrainz(name: str):
    toReturn = Optional.empty()
    wiki_location = Optional.empty()
    location = ""
    sort_name = ""

    
    url = "https://musicbrainz.org/search?query="+name+"%2056&type=artist&method=indexed"
    page = requests.get(url)

    print(page)
    bs = BeautifulSoup(page.content)
    
    table = bs.find_all("table")
    
    titles = [title.text.strip() for title in table[0].find_all("th")]
    artist_data = []
    for data in table[0].find_all("td"):
        if len(artist_data) < len(titles):
            artist_data.append(data.text.strip())
        else:
            break
            
    found_category = 0
    for key, value in zip (titles, artist_data):
        if (key == "Area" or key == "Begin Area"):
            location += " " + value
            if value != "":
                found_category += 1
        if key == "Sort Name":
            sort_name = value
    
    # attempt to verify this is the right artist using sort name, if not stop the function
    name_list = name.lower().split()
    sort_name = sort_name.lower()
    try:
        for word in name_list:
            index = sort_name.index(word)
    except:
        return toReturn
    
    # if we didnt find precise city, search wikipedia with location name
    if found_category < 2:
        try:
            wiki_location = getOriginFromWikipedia(name + " " +location)
        except:
            None
    if wiki_location.is_present():
        toReturn = wiki_location
    elif location!= "":
        toReturn = Optional.of(location)    
    
    return toReturn


def getOriginFromWikipedia(name: str):
    toReturn = Optional.empty()
    artistPage = wiki.page(wiki.search(name)[0], auto_suggest=False).html()
    
    bs = BeautifulSoup(artistPage)
    
    tables = bs.find_all("table")
    
    tab = None
    for tab in tables:
        if "infobox" in tab["class"]:
            break
            
    if tab != None:
        # search for 'origin' to return
        titles = [heading.text.strip() for heading in tab.find_all("th")]
        titles.pop(0)
        data = [data.text.strip() for data in tab.find_all("td")]

        for key, value in zip(titles, data):
            if key =="Origin":
                toReturn = Optional.of(value)
                
        # edge case for some solo artists, find birthplace
        if toReturn == Optional.empty():
            for div in tab.find_all("div", {"class": "birthplace"}):
                if "birthplace" in div["class"]:
                    toReturn = Optional.of(div.text.strip())
        
        # worse case, birthplace not tagged
        if toReturn == Optional.empty():
            for key, value in zip(titles, data):
                if key =="Born":
                    try:
                        index = value.index("age")
                        value = value[index+7:]
                        toReturn = Optional.of(value)

                    except:
                        index = 0
                if key =="Died":
                    try:
                        index = value.index("age")
                        value = value[index+7:]
                        toReturn = Optional.of(value)
                    except:
                        index = 0

    return toReturn

def getOriginFromWikidata(name: str):
    toReturn = Optional.empty()
    placeOfBirth = None
    
    page = wptools.page(name)
    try:
        page.get_wikidata()
    except:
        print("Couldn't get wikidata from name.")
        
    try:
        placeOfBirth = page.data['wikidata']['place of birth (P19)']
    except:
        None
    
    try: 
        placeOfBirth = page.data['wikidata']['location of formation (P740)']
    except:
        None
        
    try:
        index = placeOfBirth.index("(")
        placeOfBirth = placeOfBirth[0: index]
    except:
        None
        
    if placeOfBirth != None:
        toReturn = Optional.of(placeOfBirth)
    
    return toReturn

def createDataframe(artist_list):
    location_name = [getArtistOrigin(artist) for artist in artist_list]
    location_coord = [getLocationByGeo(loc) for loc in location_name]
    df = pd.DataFrame({"artist_name" : artist_list, "location_name" : location_name, "location_coord": location_coord })
    return df
                     
def getLocationByGeo(name):
    try: 
        index = name.index("[")
        name = name[0:index]
    except:
        name = name
    g = geocoder.osm(name)
    return g.latlng