from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import sqlite3
import json

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://76.123.162.109:3000",   # your React dev server
    "http://76.123.162.109",        # if React hosted elsewhere
])

Database = 'otanet_devo.db'
noCover = 'https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg'

## GET  REQUESTS START ##

@app.route('/recent_manga', methods=['GET'])
@cross_origin(origin='*',headers=['Content- Type','Authorization'])
def recent_manga():
    con = sqlite3.connect(Database)
    cursor = con.cursor()

    # Get query params
    page = int(request.args.get('page', 1))       # default 1
    per_page = int(request.args.get('per_page', 10)) # default 10
    offset = (page - 1) * per_page

    # Fetch manga slice
    sql = "SELECT title, description FROM manga_metadata ORDER BY rowid DESC LIMIT ? OFFSET ?"
    cursor.execute(sql, (per_page, offset))
    rows = cursor.fetchall()

    # Convert to list of objects
    data = [{"title": row[0], "description": row[1]} for row in rows]
    con.close()
    return jsonify(data)


@app.route('/get_cover', methods=['GET'])
@cross_origin(origin='*',headers=['Content- Type','Authorization'])
def get_cover():
    return jsonify(noCover) 



### POST REQUESTS END ###

if __name__ == '__main__':
    app.run(debug=True, port=8000)
