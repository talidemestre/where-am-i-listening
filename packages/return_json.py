import pandas as pd
import numpy as np
import wikipedia as wiki
from bs4 import BeautifulSoup
from optional import Optional
import geocoder
import random
import wptools
import requests
import os
from matplotlib import pyplot as plt
import warnings
import matplotlib.cbook
import redis
import json
import urllib
warnings.filterwarnings("ignore",category=matplotlib.cbook.mplDeprecation)

def getArtistOrigin(name: str):
    # heroku or local
    try:
        redis_conn = redis.from_url(os.environ.get("REDIS_URL"))
    except:
        redis_conn = redis.Redis()
    
    coord_key = name + " Coordinate"

    try:
        origin = redis_conn.get(name).decode('utf-8')
        coord_list = json.loads(redis_conn.get(coord_key).decode('utf-8'))
        print("Retrieved", name, "from Redis!")
    except:
        print("Scraping for", name)
        originOptional = getArtistOriginFromScraping(name)
        if originOptional.is_present(): 
            origin = originOptional.get()

            coord_list = getLocationByGeo(origin)
            coord_string = json.dumps(coord_list)

            redis_conn.set(name, origin)
            redis_conn.set(coord_key, coord_string)
        else:
            origin = "Not Found"
            coord_list = [0, 0]
    return (origin, coord_list)



## Scraping
def getArtistOriginFromScraping(name: str):
    result = Optional.empty()

    if result.is_empty():
        result = getOriginFromWikipedia(name + " Musician")

    if result.is_empty():
        result = getOriginFromWikipedia(name + " Band")
    
    if result.is_empty():
        result = getOriginFromMusicbrainz(name)
    
    if result.is_empty():
        result = getOriginFromWikidata(name)

    return result


# unfortunately this seems to alwasy return something as MusicBrain will return results even if they dont have the artist
# fortunately it does know alot of artists! Also it is much faster so for now I think the tradeoff is worth it,
def getOriginFromMusicbrainz(name: str):
    toReturn = Optional.empty()
    wiki_location = Optional.empty()
    location = ""
    sort_name = ""

    
    url = "https://musicbrainz.org/search?query="+urllib.parse.quote_plus(name)+"&type=artist&method=indexed"
    page = requests.get(url)

    print(page)
    bs = BeautifulSoup(page.content, features="lxml")
    
    table = bs.find_all("table")

    try:
        titles = [title.text.strip() for title in table[0].find_all("th")]
    except:
        return toReturn
        
    artist_data = []
    for data in table[0].find_all("td"):
        if len(artist_data) < len(titles):
            artist_data.append(data.text.strip())
        else:
            break
            
    found_category = 0
    for key, value in zip (titles, artist_data):
        if (key == "Area" or key == "Begin Area"):
            if value != "":
                found_category += 1
        if key == "Area":
            location += value
        if key == "Begin Area":
            if value != "":
                location = value + ", " + location
        if key == "Sort Name":
            sort_name = value
    
    # attempt to verify this is the right artist using sort name, if not stop the function
    name_list = name.lower().split()
    sort_name = sort_name.lower()
    dont_match_score = 0
    for word in name_list:
        try:
            try:
                index = sort_name.index(word)
            except:
                # removes a potential 's from the end of the name
                index = sort_name.index(word[0:len(word)-2])
        except:
            dont_match_score += 1
    dont_match_index = dont_match_score / len(name_list)
    print("Dissimilarity rating is", dont_match_index)
    if dont_match_index > 0.4:
        return toReturn

    # if we didnt find precise city, search wikipedia with location name
    if found_category < 2:
        try:
            wiki_location = getOriginFromWikipedia(name + " " +location + " Musician")
            print(wiki_location)
        except:
            None
    if wiki_location.is_present():
        toReturn = wiki_location
    elif location!= "":
        toReturn = Optional.of(location)    
    
    return toReturn


def getOriginFromWikipedia(name: str):
    toReturn = Optional.empty()
    
    try:
        searches = wiki.search(name)
        while len(searches) == 0:
            if len(name) <= 2:
                return Optional.empty()
            name = ' '.join(name.split(' ')[:-1])
            print(name)
            searches = wiki.search(name)
        
        artistPage = wiki.page(searches[0], auto_suggest=False).html()
    except:
        return Optional.empty()
    bs = BeautifulSoup(artistPage, features="lxml")
    
    tables = bs.find_all("table")
    tab = None
    for tab in tables:
        if "infobox" in tab["class"]:
            break
            
    if tab != None:
        node_list = [node for node in tab.find_all('tr')]
        zipped_key_value = []
        for node in node_list:
            try:
                entry = (node.find_all('th')[0].text.strip(), node.find_all('td')[0].text.strip())
                zipped_key_value.append(entry)
            except:
                None

        # search for 'origin' to return
        for key, value in zipped_key_value:
            if key =="Origin":
                toReturn = Optional.of(value)
                
        # edge case for some solo artists, find birthplace
        if toReturn == Optional.empty():
            for div in tab.find_all("div", {"class": "birthplace"}):
                if "birthplace" in div["class"]:
                    toReturn = Optional.of(div.text.strip())
        
        # worse case, birthplace not tagged
        if toReturn == Optional.empty():
            for key, value in zipped_key_value:
                if key == "Born":
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
    location = [getArtistOrigin(artist) for artist in artist_list]
    unzipped_location = list(zip(*location))
    df = pd.DataFrame({"artist_name" : artist_list, "location_name" : unzipped_location[0], "location_coord": unzipped_location[1] })
    return df
                     
def getLocationByGeo(name):
    try: 
        index = name.index("[")
        name = name[0:index]
    except:
        name = name
    g = geocoder.osm(name)
    latlng = g.latlng
    print(latlng)
    # if lat long not found, try smaller and smaller search terms
    if latlng == None:
        try:
            index = name.rfind(", ")
            newName = name[0:index]
            if len(newName) <=2:
                return [0,0]
            print(newName)
            latlng =  getLocationByGeo(newName)
        except:
            None
    return latlng

    
    

