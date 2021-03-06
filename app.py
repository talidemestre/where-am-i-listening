from packages.return_json import *

from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)


@app.route('/json', methods=["GET", "POST"])
def get():
        artist_list = request.json
        df = createDataframe(artist_list)
        return df.to_json(orient="records")
        
@app.route('/', methods=["GET"])
def index():
        return render_template("index.html")
        
@app.route('/create', methods=["GET"])
def spotify():
        return render_template("create.html")


@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('img/favicon.ico')


if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=5000)
