from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json

app = Flask(__name__)
CORS(app)

Database = 'otanet_devo.db'
noCover = 'https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg'

## GET  REQUESTS START ##

@app.route('/recent_manga', methods=['GET'])
def recent_manga():
    con = sqlite3.connect(Database)
    cursor = con.cursor()
    page = str(request.args.get('page'))
    sql = f"SELECT title, description FROM manga_metadata WHERE rowid = {page}"
    cursor.execute(sql)
    rows = cursor.fetchall()
    data = [(rows[0][0],rows[0][1])]
    return jsonify(json.dumps(data))

@app.route('/get_cover', methods = ['GET'])
def get_cover():
    print(noCover)
    return jsonify(json.dumps(noCover))


### POST REQUESTS END ###

if __name__ == '__main__':
    app.run(debug=True, port=8000)
