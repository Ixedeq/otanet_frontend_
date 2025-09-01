from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DATABASE = 'otanet_devo.db'
NOCOVER = 'https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg'

# GET recent manga (title + description)
@app.route('/recent_manga', methods=['GET'])
def recent_manga():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    offset = (page - 1) * per_page

    con = sqlite3.connect(DATABASE)
    cursor = con.cursor()
    cursor.execute(
        "SELECT title, description FROM manga_metadata ORDER BY rowid DESC LIMIT ? OFFSET ?",
        (per_page, offset)
    )
    rows = cursor.fetchall()
    con.close()

    data = [{"title": row[0], "description": row[1]} for row in rows]
    return jsonify(data)

# Return default cover URL
@app.route('/get_cover', methods=['GET'])
def get_cover():
    return jsonify(NOCOVER)

# GET single manga by slug (title -> slug)
import re
def to_slug(title):
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9 ]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    return slug

@app.route("/<slug>", methods=["GET"])
def get_manga_by_slug(slug):
    con = sqlite3.connect(DATABASE)
    cursor = con.cursor()

    # Normalize slug back to search pattern
    search_title = slug.replace("-", " ")

    # Fetch all titles
    cursor.execute("SELECT title, description FROM manga_metadata")
    rows = cursor.fetchall()

    result = None
    for row in rows:
        db_title = row[0].lower().strip()
        db_title_normalized = "".join(c for c in db_title if c.isalnum() or c == " ").replace(" ", "-")
        if db_title_normalized == slug:
            result = {
                "title": row[0],
                "description": row[1],
                "cover": NOCOVER  # always provide a cover
            }
            break

    con.close()

    if result:
        return jsonify(result)
    else:
        return jsonify({"error": "Manga not found", "cover": NOCOVER}), 404


# Search endpoint
@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('title', '')
    con = sqlite3.connect(DATABASE)
    cursor = con.cursor()
    cursor.execute(
        "SELECT title, description FROM manga_metadata WHERE title LIKE ?",
        ('%' + query + '%',)
    )
    rows = cursor.fetchall()
    con.close()

    data = [{"title": row[0], "description": row[1]} for row in rows]
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=8000)

