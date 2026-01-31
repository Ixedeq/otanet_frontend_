from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import sqlite3
import os
import re
import json
import boto3
from botocore.config import Config
import requests
from urllib.parse import urlparse, quote as urlquote
from io import BytesIO

app = Flask(__name__)
CORS(app)

DATABASE = 'otanet_devo.db'
NOCOVER = 'https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg'
# Proxy base URL used to serve covers/pages. Can be set via env var e.g. PROXY_BASE_URL=https://proxy.example.com.
# If the env var is missing, attempt to infer a real example from URLs stored in the DB.

def _infer_proxy_base_from_db(db_path=None):
    db_path = db_path or os.path.join(os.path.dirname(__file__), 'otanet_devo.db')
    try:
        con = sqlite3.connect(db_path)
        cur = con.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in cur.fetchall()]
        for t in tables:
            cur.execute(f"PRAGMA table_info('{t}')")
            cols = [c[1] for c in cur.fetchall()]
            for col in cols:
                if any(k in col.lower() for k in ('url', 'page', 'file', 'src', 'path')):
                    try:
                        cur.execute(f"SELECT {col} FROM '{t}' WHERE {col} LIKE 'http%' LIMIT 1")
                        row = cur.fetchone()
                        if row and row[0]:
                            s = str(row[0])
                            p = urlparse(s)
                            if p.scheme and p.netloc:
                                return f"{p.scheme}://{p.netloc}"
                    except Exception:
                        # ignore malformed tables/queries
                        continue
        con.close()
    except Exception:
        pass
    return None

PROXY_BASE_URL = os.environ.get('PROXY_BASE_URL') or _infer_proxy_base_from_db() or 'https://proxy.example.com'
# Directory containing per-manga sqlite DBs. Default is the api folder where this file lives.
MANGA_DB_DIR = os.environ.get('MANGA_DB_DIR', os.path.dirname(__file__))
CONFIG = Config(signature_version='s3v4')
S3CLIENT = boto3.client('s3', region_name='us-east-1', config=CONFIG)

# GET recent manga (title + description)
@app.route('/recent_manga', methods=['GET'])
def recent_manga():
    S3CLIENT.download_file('otanet-manga-devo', 'database/otanet_devo.db', 'otanet_devo.db')
    items_per_page = 10
    page = int(request.args.get('page', 1))
    offset = (page-1) * items_per_page
    con = sqlite3.connect(DATABASE)
    cursor = con.cursor()
    cursor.execute(
        "SELECT title, description, hash, cover_img FROM manga_metadata ORDER BY time DESC LIMIT ? OFFSET ?",
        (10, offset)
    )
    rows = cursor.fetchall()
    con.close()
    data = []
    for row in rows:
        cleaned_title = to_slug(row[0])
        # Use the stored cover_img value and expose it via the fetch proxy endpoint
        orig_cover = row[3] or NOCOVER
        proxied_cover = generate_proxied_image_url(orig_cover)
        data.append({"title": row[0], "description": row[1], "hash": row[2], "cover_img": proxied_cover})
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
def to_slug(title):
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9 ]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    return slug

def from_slug(slug):
    title = slug.replace("-", " ")
    return title

def generate_proxied_image_url(image_url):
    """
    Convert an image URL to a proxied URL format.
    Extracts domain, hash and filename from MangaDex URLs like https://...mangadex.network/data/{hash}/{filename}
    Returns /api/image/{domain}/{hash}/{filename} or falls back to URL encoding if extraction fails.
    """
    try:
        parsed = urlparse(image_url)
        domain = parsed.netloc
        path_parts = parsed.path.split('/')
        if len(path_parts) >= 3:
            hash_id = path_parts[-2]
            filename = path_parts[-1]
            return f"/api/image/{domain}/{hash_id}/{filename}"
    except Exception:
        pass
    # Fallback for non-standard URLs
    return f"/api/image/{urlquote(image_url, safe='')}"

@app.route("/<slug>", methods=["GET"])
def get_manga_by_slug(slug):
    con = sqlite3.connect(DATABASE)
    cursor = con.cursor()

    # Normalize slug back to search pattern
    search_title = slug.replace("-", " ")

    # Fetch all titles
    cursor.execute("SELECT title, description, tags, latest_chapter, cover_img FROM manga_metadata")
    rows = cursor.fetchall()

    result = None
    for row in rows:
        cleaned_title = to_slug(row[0])
        orig_cover = row[4] or NOCOVER
        proxied_cover = generate_proxied_image_url(orig_cover)
        db_title = row[0].lower().strip()
        db_title_normalized = "".join(c for c in db_title if c.isalnum() or c == " ").replace(" ", "-")
        if db_title_normalized == slug:
            result = {
                "title": row[0],
                "description": row[1],
                # Return proxied cover URL so clients load covers via the proxy
                "cover": proxied_cover,
                "tags": row[2],
                "chapters": row[3]
            }
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
        "SELECT title, description, cover_img FROM manga_metadata WHERE title LIKE ?",
        ('%' + query + '%',)
    )
    rows = cursor.fetchall()
    data = []
    for row in rows:
        cleaned_title = to_slug(row[0])
        orig_cover = row[2] or NOCOVER
        proxied_cover = generate_proxied_image_url(orig_cover)
        data.append({"title": row[0], "description": row[1], "cover_img": proxied_cover})
    con.close()
    return jsonify(data)

@app.route('/get_chapters', methods=['GET'])
def get_chapters():
    hash = request.args.get('hash')
    if not hash:
        return jsonify([])

    db_path = os.path.join(MANGA_DB_DIR, f"{hash}.db")
    if not os.path.exists(db_path):
        # Fallback: try to infer chapters from the main database (e.g. tables named by hash)
        try:
            main_con = sqlite3.connect(DATABASE)
            main_cur = main_con.cursor()
            # Find the hash for this title
            print(hash)
            main_cur.execute("SELECT hash FROM manga_metadata WHERE hash = ?",(hash,))
            row = main_cur.fetchone()
            print(row)
            if row and row[0]:
                table = row[0]
                # Try possible table name variants (hash uses dashes, tables use underscores)
                table_candidates = [table, table.replace('-', '_')]
                table_name = None
                for tc in table_candidates:
                    main_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (tc,))
                    if main_cur.fetchone():
                        table_name = tc
                        break

                if table_name:
                    # Get columns and look for a chapter/number column
                    main_cur.execute(f"PRAGMA table_info('{table_name}')")
                    cols = [c[1] for c in main_cur.fetchall()]
                    chapter_col = next((c for c in cols if 'chapter' in c.lower() or 'num' in c.lower()), None)
                    title_col = next((c for c in cols if 'title' in c.lower() or 'name' in c.lower()), None)
                    if chapter_col:
                        main_cur.execute(f"SELECT DISTINCT {chapter_col} FROM '{table_name}'")
                        rows = [r[0] for r in main_cur.fetchall()]
                        objs = []
                        for r in rows:
                            raw = str(r)
                            normalized = raw.replace('_', '.')
                            # try to coerce to numeric when possible
                            try:
                                num_val = float(normalized)
                            except Exception:
                                num_val = normalized

                            chapter_word = normalized
                            chapter_word = f"Chapter {normalized}"

                            item = {'title': chapter_word, 'number': num_val}
                            if item not in objs:
                                print(item)
                                objs.append(item)

                        try:
                            objs = sorted(objs, key=lambda obj: float(obj['number']))
                        except Exception:
                            pass

                        print(objs)
                        main_con.close()
                        return jsonify(objs)
            main_con.close()
        except Exception:
            pass
        return jsonify([])

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Try common chapter table names first
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]
    chapter_tables = [t for t in tables if 'chapter' in t.lower() or t.lower() == 'chapters']
    if not chapter_tables:
        conn.close()
        return jsonify([])

    table = chapter_tables[0]
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [c[1] for c in cursor.fetchall()]

    # Heuristics for the title and number columns
    title_col = next((c for c in cols if 'title' in c.lower() or 'name' in c.lower()), cols[0])
    number_col = next((c for c in cols if 'num' in c.lower() or 'number' in c.lower() or 'chapter' in c.lower()), cols[1] if len(cols) > 1 else cols[0])

    try:
        cursor.execute(f"SELECT {title_col}, {number_col} FROM {table}")
        rows = cursor.fetchall()
    except Exception:
        conn.close()
        return jsonify([])

    objs = []
    for row in rows:
        chapter_word = str(row[0]).capitalize() if row[0] else f"Chapter {row[1]}"
        item = {'title': chapter_word, 'number': row[1]}
        if item not in objs:
            objs.append(item)

    try:
        sorted_objs = sorted(objs, key=lambda obj: float(obj['number']))
    except Exception:
        sorted_objs = objs

    conn.close()
    return jsonify(sorted_objs)

@app.route('/get_pages', methods=['GET'])
def get_pages():
    hash = request.args.get('hash')
    hash_copy = hash
    hash_copy = hash_copy.replace('-', '_')
    chapter = request.args.get('chapter')
    chapter = chapter.replace("chapter_", '')
    chapter = chapter.replace("-", '_')
    title = request.args.get('title')

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    sql = f"SELECT page_number, page_url FROM [{hash_copy}] WHERE chapter_num = '{chapter}'"
    print(sql)
    cursor.execute(sql)
    rows = cursor.fetchall()
    print(rows)

    pages = []
    for page in rows:
        src = page[1]
        proxied = generate_proxied_image_url(src)
        pages.append({'key': page[0], 'src': proxied})

    conn.close()
    return jsonify(pages)


@app.route('/api/image/<domain>/<hash_id>/<filename>', methods=['GET'])
def proxy_fetch(domain, hash_id, filename):
    """
    Proxy image requests from MangaDex to bypass CORS restrictions
    """
    try:
        image_url = f"https://{domain}/data/{hash_id}/{filename}"
        
        # Fetch the image from MangaDex with appropriate headers
        response = requests.get(
            image_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout=10
        )
        response.raise_for_status()
        
        # Return the image with proper headers
        return send_file(
            BytesIO(response.content),
            mimetype=response.headers.get('content-type', 'image/jpeg'),
            as_attachment=False
        )
    
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch image: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500



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




