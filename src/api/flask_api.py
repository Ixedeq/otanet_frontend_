from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import sqlite3
import json

app = Flask(__name__)
CORS(app)

DATABASE = 'otanet_devo.db'
NOCOVER = 'https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg'

## GET  REQUESTS START ##

@app.route('/recent_manga', methods=['GET'])
def recent_manga():
    con = sqlite3.connect(DATABASE)
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
def get_cover():
    return jsonify(NOCOVER) 

@app.route('/search', methods=['GET'])
def search():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    title = str(request.args.get('title'))
    sql = f"SELECT title, description FROM manga_metadata WHERE title = ${title}"
    cursor.execute(sql)
    rows = cursor.fetchasll()
    data = [{"title": row[0], "description": row[1]} for row in rows]
    conn.close()
    print(rows)
    return jsonify(data)



### POST REQUESTS END ###

if __name__ == '__main__':
    app.run(debug=True, port=8000)
