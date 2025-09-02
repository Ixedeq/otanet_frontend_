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
    items_per_page = 10
    page = int(request.args.get('page', 1))
    offset = page * items_per_page
    con = sqlite3.connect(DATABASE)
    cursor = con.cursor()
    cursor.execute(
        "SELECT title, description FROM manga_metadata ORDER BY time DESC LIMIT ? OFFSET ?",
        (10, offset)
    )
    rows = cursor.fetchall()
    con.close()
    data = [{"title": row[0], "description": row[1]} for row in rows]
    return jsonify(data)

# Return default cover URL
@app.route('/get_cover', methods=['GET'])
def get_cover():
    return jsonify(NOCOVER)

@app.route('/manga_count', methods=['GET'])
def manga_count():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    sql = "SELECT COUNT(*) FROM manga_metadata;"
    cursor.execute(sql)
    total_rows = cursor.fetchone()[0]
    conn.close()
    return jsonify(total_rows)

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
    cursor.execute("SELECT title, description, tags, latest_chapter FROM manga_metadata")
    rows = cursor.fetchall()

    result = None
    for row in rows:
        db_title = row[0].lower().strip()
        db_title_normalized = "".join(c for c in db_title if c.isalnum() or c == " ").replace(" ", "-")
        if db_title_normalized == slug:
            result = {
                "title": row[0],
                "description": row[1],
                "cover": NOCOVER,  # always provide a cover
                "tags": row[2],
                "chapters": row[3]
            }
            print()
            print(row[3])
            print()
            break

    con.close()

    if result:
        return jsonify(result)
    else:
        return jsonify({"error": "Manga not found", "cover": NOCOVER}), 404


# Search endpoint
@app.route('/search_by_title', methods=['GET'])
def search_by_title():
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

@app.route('/search_by_tags')
def search_by_tags():
    print(request.args)

    try:
        include_tags = request.args.get('include_tags').split(',')
    except:
        include_tags = ['']

    try:
        exclude_tags = request.args.get('exclude_tags').split(',')
    except:
        exclude_tags = []

    sql = f"""
            SELECT title, description, tags FROM manga_metadata
            WHERE tags like '%{include_tags[0]}%'
          """
    include_tags.pop(0)

    for tag in include_tags:
        sql = sql + f"AND tags like '%{tag}%' "
    
    for tag in exclude_tags:
        sql = sql + f"AND tags not like '%{tag}%'"

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute(sql)
    rows = cursor.fetchall()
    data = [{"title": row[0], "description": row[1], "tags": row[2]} for row in rows]
    conn.close
    return jsonify(data)


if __name__ == '__main__':
    app.run(host='0.0.0.0', threaded=True, debug=True, port=8000)
