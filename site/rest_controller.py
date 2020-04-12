from return_json import *

from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)


@app.route('/json')
def get():
        sample_artists = ["paul simon", "kingo hamada", "midnight oil", "jack stauber", "gianni and kyle", "gasper nali", "rostam", "bo en", "cub sport"]
        df = createDataframe(sample_artists)
        return df.to_json(orient="records")
        
@app.route('/')
def index():
        return render_template("index.html")
        


if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=5000)