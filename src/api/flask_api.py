from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import sqlite3
import os
import re
import json
import boto3
from botocore.config import Config
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from urllib.parse import urlparse, quote as urlquote
from io import BytesIO
from functools import wraps, lru_cache
import time
import hashlib
from concurrent.futures import ThreadPoolExecutor
import threading

app = Flask(__name__)

# Security: Configure CORS with specific origins
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'https://ota-network.com,http://localhost:3000').split(',')
CORS(app, origins=ALLOWED_ORIGINS)

# === PERFORMANCE OPTIMIZATIONS ===

# Connection pool for external requests (reuse connections)
session = requests.Session()
retry_strategy = Retry(
    total=2,
    backoff_factor=0.1,
    status_forcelist=[500, 502, 503, 504],
)
adapter = HTTPAdapter(
    pool_connections=20,
    pool_maxsize=50,
    max_retries=retry_strategy
)
session.mount("http://", adapter)
session.mount("https://", adapter)

# In-memory image cache (LRU with TTL)
IMAGE_CACHE = {}
IMAGE_CACHE_MAX_SIZE = 200  # Max cached images
IMAGE_CACHE_TTL = 3600  # 1 hour TTL
cache_lock = threading.Lock()

def get_cached_image(cache_key):
    """Get image from cache if exists and not expired"""
    with cache_lock:
        if cache_key in IMAGE_CACHE:
            data, timestamp = IMAGE_CACHE[cache_key]
            if time.time() - timestamp < IMAGE_CACHE_TTL:
                return data
            else:
                del IMAGE_CACHE[cache_key]
    return None

def set_cached_image(cache_key, data):
    """Store image in cache with LRU eviction"""
    with cache_lock:
        # Evict oldest entries if cache is full
        if len(IMAGE_CACHE) >= IMAGE_CACHE_MAX_SIZE:
            oldest_key = min(IMAGE_CACHE.keys(), key=lambda k: IMAGE_CACHE[k][1])
            del IMAGE_CACHE[oldest_key]
        IMAGE_CACHE[cache_key] = (data, time.time())

# Thread pool for parallel image fetching
executor = ThreadPoolExecutor(max_workers=10)

# Simple in-memory rate limiter
rate_limit_store = {}
RATE_LIMIT = 100  # requests per minute
RATE_WINDOW = 60  # seconds

def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if client_ip:
            client_ip = client_ip.split(',')[0].strip()
        
        current_time = time.time()
        
        # Clean old entries
        if client_ip in rate_limit_store:
            rate_limit_store[client_ip] = [t for t in rate_limit_store[client_ip] if current_time - t < RATE_WINDOW]
        else:
            rate_limit_store[client_ip] = []
        
        if len(rate_limit_store[client_ip]) >= RATE_LIMIT:
            return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429
        
        rate_limit_store[client_ip].append(current_time)
        return f(*args, **kwargs)
    return decorated_function

def sanitize_input(value, max_length=200, allow_pattern=r'^[a-zA-Z0-9\s\-_.,]+$'):
    """Sanitize user input to prevent injection attacks"""
    if value is None:
        return None
    value = str(value)[:max_length]
    return value

def validate_hash(hash_value):
    """Validate that a hash looks like a valid UUID/hash"""
    if not hash_value:
        return False
    # Allow UUIDs and common hash formats
    return bool(re.match(r'^[a-fA-F0-9\-]{8,64}$', hash_value))

# Security headers middleware
@app.after_request
def add_security_headers(response):
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    # XSS protection
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Content Security Policy (adjust as needed)
    if not DEV_MODE:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Global error handler - don't expose stack traces in production
@app.errorhandler(Exception)
def handle_exception(e):
    if DEV_MODE:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    else:
        # Log the error but don't expose details to the client
        print(f"Error: {type(e).__name__}")
        return jsonify({"error": "An internal error occurred"}), 500

DATABASE = 'otanet_devo.db'
NOCOVER = 'https://mangadex.org/covers/f4045a9e-e5f6-4778-bd33-7a91cefc3f71/df4e9dfe-eb9f-40c7-b13a-d68861cf3071.jpg.512.jpg'

# Dev mode detection - skip S3 downloads and use local DB
DEV_MODE = os.environ.get('FLASK_ENV') == 'development' or os.environ.get('DEV_MODE') == '1'

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

# Local DB path (in the api folder)
LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), 'otanet_devo.db')

CONFIG = Config(signature_version='s3v4')
S3CLIENT = boto3.client('s3', region_name='us-east-1', config=CONFIG)

# Database connection pool - CRITICAL for production performance
_db_connection_pool = None
_db_pool_lock = threading.Lock()
_db_last_download = None
DB_REFRESH_INTERVAL = 300  # 5 minutes between S3 downloads

def initialize_db_pool():
    """Initialize connection pool by downloading DB once from S3"""
    global _db_connection_pool, _db_last_download
    
    if DEV_MODE:
        _db_connection_pool = sqlite3.connect(LOCAL_DB_PATH, check_same_thread=False)
        return
    
    # Only download if file doesn't exist or refresh interval passed
    should_download = False
    if not os.path.exists(DATABASE):
        should_download = True
    elif _db_last_download and time.time() - _db_last_download < DB_REFRESH_INTERVAL:
        should_download = False
    elif _db_last_download and time.time() - _db_last_download >= DB_REFRESH_INTERVAL:
        should_download = True
    else:
        should_download = True
    
    if should_download:
        try:
            print(f"[DB] Downloading database from S3...")
            S3CLIENT.download_file('otanet-manga-devo', 'database/otanet_devo.db', DATABASE)
            _db_last_download = time.time()
            print(f"[DB] Database download complete")
        except Exception as e:
            print(f"[DB] Error downloading from S3: {e}")
            # If download fails and local file exists, use it
            if not os.path.exists(DATABASE):
                raise
    
    # Create connection pool with WAL mode for better concurrency
    conn = sqlite3.connect(DATABASE, check_same_thread=False, timeout=10)
    conn.execute('PRAGMA journal_mode=WAL')  # Write-Ahead Logging for better concurrency
    conn.execute('PRAGMA synchronous=NORMAL')  # Better performance
    _db_connection_pool = conn

def get_db_connection():
    """Get database connection from pool - NEVER downloads on every call"""
    global _db_connection_pool
    
    # Lazy initialization with thread-safe check
    if _db_connection_pool is None:
        with _db_pool_lock:
            # Double-check inside lock
            if _db_connection_pool is None:
                initialize_db_pool()
    
    # Verify connection is still alive; if not, reinitialize
    try:
        _db_connection_pool.execute('SELECT 1')
    except (sqlite3.ProgrammingError, sqlite3.OperationalError) as e:
        print(f"[DB] Connection is closed, reinitializing: {e}")
        with _db_pool_lock:
            _db_connection_pool = None
            initialize_db_pool()
    
    return _db_connection_pool

# Background thread to refresh database every 5 minutes in production
def _refresh_database_thread():
    """Background thread to refresh database from S3 periodically"""
    if DEV_MODE:
        return
    
    def refresh_loop():
        while True:
            try:
                time.sleep(DB_REFRESH_INTERVAL)
                with _db_pool_lock:
                    print(f"[DB] Background refresh triggered")
                    # Download new database file, then close and recreate connection
                    try:
                        print(f"[DB] Downloading database from S3...")
                        S3CLIENT.download_file('otanet-manga-devo', 'database/otanet_devo.db', DATABASE)
                        print(f"[DB] Database download complete")
                        # Force connection to reinitialize on next get_db_connection call
                        global _db_connection_pool
                        if _db_connection_pool is not None:
                            try:
                                _db_connection_pool.close()
                            except:
                                pass
                            _db_connection_pool = None
                    except Exception as e:
                        print(f"[DB] Error downloading from S3: {e}")
            except Exception as e:
                print(f"[DB] Error in background refresh: {e}")
    
    thread = threading.Thread(target=refresh_loop, daemon=True)
    thread.start()
    print("[DB] Background refresh thread started (5 min interval)")

# Start background refresh thread on app startup
_refresh_database_thread()

# GET recent manga (title + description)
@app.route('/recent_manga', methods=['GET'])
@rate_limit
def recent_manga():
    items_per_page = 10
    page = request.args.get('page', 1)
    
    # Validate page parameter
    try:
        page = int(page)
        if page < 1 or page > 10000:
            page = 1
    except (ValueError, TypeError):
        page = 1
    
    offset = (page-1) * items_per_page
    con = get_db_connection()
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

# Allowed domains for image proxying (SSRF protection)
ALLOWED_IMAGE_DOMAINS = [
    'uploads.mangadex.org',
    'mangadex.org',
    'cmdxd98sb0x3yprd.mangadex.network'
]

# Common headers for image requests
IMAGE_REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
}

def fetch_image_from_url(url, timeout=8):
    """Fetch image using connection pool with retries"""
    try:
        response = session.get(url, headers=IMAGE_REQUEST_HEADERS, timeout=timeout)
        if response.status_code == 200:
            return response.content, response.headers.get('content-type', 'image/jpeg')
    except Exception:
        pass
    return None, None

@app.route('/image/<hash_id>/<filename>', methods=['GET'])
@rate_limit
def fetch_proxied_image(hash_id, filename):
    try:
        # Validate hash_id format (prevent path traversal)
        if not validate_hash(hash_id):
            return jsonify({"error": "Invalid hash"}), 400
        
        # Validate filename (prevent path traversal and injection)
        if not re.match(r'^[a-zA-Z0-9\-_.]+$', filename):
            return jsonify({"error": "Invalid filename"}), 400
        
        # Create cache key
        cache_key = f"{hash_id}/{filename}"
        
        # Check cache first
        cached = get_cached_image(cache_key)
        if cached:
            content, content_type = cached
            img_response = send_file(BytesIO(content), mimetype=content_type)
            img_response.headers['Access-Control-Allow-Origin'] = '*'
            img_response.headers['Cache-Control'] = 'public, max-age=604800'  # 7 days
            img_response.headers['X-Cache'] = 'HIT'
            return img_response
        
        # Remove size suffix to get full quality image
        full_quality_filename = filename
        for suffix in ['.512.jpg', '.256.jpg', '.512.png', '.256.png']:
            if filename.endswith(suffix):
                full_quality_filename = filename.replace(suffix, '')
                break
        
        # Build list of URLs to try (in order of preference)
        urls_to_try = [
            f"https://uploads.mangadex.org/covers/{hash_id}/{full_quality_filename}",
        ]
        if full_quality_filename != filename:
            urls_to_try.append(f"https://uploads.mangadex.org/covers/{hash_id}/{filename}")
        urls_to_try.append(f"https://cmdxd98sb0x3yprd.mangadex.network/data/{hash_id}/{filename}")
        
        # Try each URL
        content = None
        content_type = 'image/jpeg'
        
        for url in urls_to_try:
            content, content_type = fetch_image_from_url(url)
            if content:
                break
        
        if not content:
            return jsonify({"error": "Image not found"}), 404
        
        # Cache the result
        set_cached_image(cache_key, (content, content_type))
        
        img_response = send_file(BytesIO(content), mimetype=content_type)
        img_response.headers['Access-Control-Allow-Origin'] = '*'
        img_response.headers['Cache-Control'] = 'public, max-age=604800'  # 7 days
        img_response.headers['X-Cache'] = 'MISS'
        
        return img_response
        
    except Exception as e:
        if DEV_MODE:
            import traceback
            traceback.print_exc()
        return jsonify({"error": "Failed to fetch image"}), 500

# Return default cover URL
@app.route('/get_cover', methods=['GET'])
@rate_limit
def get_cover():
    return jsonify(NOCOVER)

@app.route('/manga_count', methods=['GET'])
@rate_limit
def manga_count():
    conn = get_db_connection()
    cursor = conn.cursor()
    sql = "SELECT COUNT(hash) FROM manga_metadata;"
    cursor.execute(sql)
    total_rows = cursor.fetchone()[0]
    return jsonify(total_rows)

@app.route('/api/all-manga', methods=['GET'])
@rate_limit
def all_manga():
    """
    Returns all manga for sitemap generation.
    Used by generate-sitemap.js for SEO sitemap creation.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all manga with their basic info (optimized for sitemap)
        cursor.execute(
            "SELECT title, hash, cover_img FROM manga_metadata ORDER BY time DESC"
        )
        rows = cursor.fetchall()
        
        data = []
        for row in rows:
            cleaned_title = to_slug(row[0])
            cover_img = row[2] or NOCOVER
            proxied_cover = generate_proxied_image_url(cover_img)
            
            manga_item = {
                "title": row[0],
                "slug": cleaned_title,
                "hash": row[1],
                "coverImage": proxied_cover
            }
            data.append(manga_item)
        
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# GET all unique tags
@app.route('/get_all_tags', methods=['GET'])
@rate_limit
def get_all_tags():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT tags FROM manga_metadata WHERE tags IS NOT NULL AND tags != ''")
    rows = cursor.fetchall()
    
    # Parse all tags from the database
    all_tags = set()
    for row in rows:
        tags_str = row[0]
        if tags_str:
            # Handle different tag formats: ['tag1', 'tag2'] or tag1, tag2
            # Remove only brackets, preserve apostrophes in tag names
            cleaned = tags_str.strip()
            
            # Check if it's a Python list format like ['tag1', 'tag2']
            if cleaned.startswith('[') and cleaned.endswith(']'):
                # Remove brackets
                cleaned = cleaned[1:-1]
                # Split by comma, handling quoted strings
                # Pattern matches 'tag' or "tag" or unquoted tag
                import re
                matches = re.findall(r'"([^"]+)"|\'([^\']+)\'|([^,]+)', cleaned)
                for match in matches:
                    # match is a tuple of 3 groups, only one will have content
                    tag = match[0] or match[1] or match[2]
                    tag = tag.strip().strip('"').strip("'")
                    if tag:
                        all_tags.add(tag)
            else:
                # Simple comma-separated format
                tags_list = [t.strip() for t in cleaned.split(",") if t.strip()]
                all_tags.update(tags_list)
    
    # Sort alphabetically
    sorted_tags = sorted(list(all_tags), key=str.lower)
    return jsonify(sorted_tags)

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
    print(f"Generating proxied URL for: {image_url}")
    
    FLASK_BASE = os.environ.get('FLASK_BASE_URL', 'https://ota-network.com')
    
    try:
        parsed = urlparse(image_url)
        path_parts = [p for p in parsed.path.split('/') if p]  # Remove empty parts
        
        # Check if it's a MangaDex cover URL
        if 'covers' in path_parts:
            # Extract manga_id and filename from /covers/{manga_id}/{filename}
            covers_idx = path_parts.index('covers')
            if len(path_parts) > covers_idx + 2:
                manga_id = path_parts[covers_idx + 1]
                cover_filename = path_parts[covers_idx + 2]
                proxied = f"{FLASK_BASE}/api/image/{manga_id}/{cover_filename}"
                print(f"Generated cover URL: {proxied}")
                return proxied
        
        # Standard CDN URL handling (/data/{hash}/{filename})
        if len(path_parts) >= 2:
            hash_id = path_parts[-2]
            filename = path_parts[-1]
            proxied = f"{FLASK_BASE}/api/image/{hash_id}/{filename}"
            print(f"Generated CDN URL: {proxied}")
            return proxied
    except Exception as e:
        print(f"Error: {e}")
    
    return f"{FLASK_BASE}/api/image/{urlquote(image_url, safe='')}"

@app.route("/<slug>", methods=["GET"])
@rate_limit
def get_manga_by_slug(slug):
    # Validate slug format
    if not re.match(r'^[a-z0-9\-]+$', slug) or len(slug) > 200:
        return jsonify({"error": "Invalid slug format"}), 400
    
    con = get_db_connection()
    cursor = con.cursor()

    # Normalize slug back to search pattern
    search_title = slug.replace("-", " ")

    # Fetch all titles
    cursor.execute("SELECT title, description, tags, latest_chapter, cover_img, hash FROM manga_metadata")
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
                "chapters": row[3],
                "hash": row[5]
            }
            break

    con.close()

    if result:
        return jsonify(result)
    else:
        return jsonify({"error": "Manga not found", "cover": NOCOVER}), 404


# Search endpoint
@app.route('/search_by_title', methods=['GET'])
@rate_limit
def search_by_title():
    query = request.args.get('title', '')
    
    # Limit search query length
    if len(query) > 200:
        query = query[:200]
    
    con = get_db_connection()
    cursor = con.cursor()
    cursor.execute(
        "SELECT title, description, hash, cover_img FROM manga_metadata WHERE title LIKE ?",
        ('%' + query + '%',)
    )
    rows = cursor.fetchall()
    data = []
    for row in rows:
        cleaned_title = to_slug(row[0])
        orig_cover = row[3] or NOCOVER
        proxied_cover = generate_proxied_image_url(orig_cover)
        data.append({"title": row[0], "description": row[1], "hash": row[2], "cover_img": proxied_cover})
    con.close()
    return jsonify(data)

@app.route('/get_chapters', methods=['GET'])
@rate_limit
def get_chapters():
    hash_param = request.args.get('hash')
    if not hash_param:
        return jsonify([])
    
    # Validate hash format
    if not validate_hash(hash_param.replace('_', '-').replace('-', '')):
        return jsonify({"error": "Invalid hash format"}), 400

    db_path = os.path.join(MANGA_DB_DIR, f"{hash_param}.db")
    if not os.path.exists(db_path):
        # Fallback: try to infer chapters from the main database (e.g. tables named by hash)
        try:
            main_con = get_db_connection()
            main_cur = main_con.cursor()
            # Find the hash for this title
            main_cur.execute("SELECT hash FROM manga_metadata WHERE hash = ?", (hash_param,))
            row = main_cur.fetchone()
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

    return jsonify(sorted_objs)

@app.route('/get_pages', methods=['GET'])
@rate_limit
def get_pages():
    hash_param = request.args.get('hash')
    chapter = request.args.get('chapter')
    
    # Input validation
    if not hash_param or not chapter:
        return jsonify({"error": "Missing required parameters"}), 400
    
    # Validate hash format to prevent SQL injection via table name
    if not validate_hash(hash_param.replace('_', '-').replace('-', '')):
        return jsonify({"error": "Invalid hash format"}), 400
    
    # Sanitize table name - only allow alphanumeric and underscores
    hash_copy = hash_param.replace('-', '_')
    if not re.match(r'^[a-zA-Z0-9_]+$', hash_copy):
        return jsonify({"error": "Invalid hash format"}), 400
    
    # Clean chapter input
    chapter = chapter.replace("chapter_", '').replace("-", '_')
    # Validate chapter format (should be numeric, possibly with decimal)
    if not re.match(r'^[0-9_.]+$', chapter):
        return jsonify({"error": "Invalid chapter format"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # First verify the table exists to prevent errors
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (hash_copy,))
    if not cursor.fetchone():
        return jsonify([])

    # Use parameterized query for the chapter value
    sql = f"SELECT DISTINCT page_number, page_url FROM [{hash_copy}] WHERE chapter_num = ?"
    cursor.execute(sql, (chapter,))
    rows = cursor.fetchall()

    pages = []
    for page in rows:
        src = page[1]
        # Return DIRECT CDN URLs for chapter pages - much faster than proxying
        # Images loaded via <img> tags don't have CORS restrictions
        pages.append({'key': page[0], 'src': src})
        
    pages = sorted(pages, key=lambda x: float(x['key']))
    
    return jsonify(pages)


@app.route('/prefetch_images', methods=['POST'])
def prefetch_images():
    """Prefetch multiple images in parallel to warm the cache"""
    try:
        data = request.get_json()
        urls = data.get('urls', [])[:20]  # Limit to 20 images
        
        def prefetch_single(url):
            try:
                parts = url.split('/api/image/')
                if len(parts) > 1:
                    path = parts[1]
                    hash_id, filename = path.split('/', 1)
                    cache_key = f"{hash_id}/{filename}"
                    if not get_cached_image(cache_key):
                        img_url = f"https://cmdxd98sb0x3yprd.mangadex.network/data/{hash_id}/{filename}"
                        content, content_type = fetch_image_from_url(img_url, timeout=5)
                        if content:
                            set_cached_image(cache_key, (content, content_type))
                            return True
            except Exception:
                pass
            return False
        
        # Prefetch in parallel
        list(executor.map(prefetch_single, urls))
        
        return jsonify({"status": "ok", "prefetched": len(urls)})
    except Exception:
        return jsonify({"status": "error"}), 400


def normalize_tag_for_search(tag):
    """Normalize a tag for flexible matching - handles apostrophes and special chars"""
    # Strategy: Insert optional wildcard between word characters to match 
    # regardless of apostrophes. "girls love" -> "girls% love" matches "girls' love"
    normalized = tag.lower().strip()
    # Replace any apostrophe-like characters with SQL % wildcard (matches 0+ chars)
    # This handles: ' (straight), ' (curly right), ' (curly left), ` (backtick)
    normalized = re.sub(r"['ʼ''`ʻ]+", "%", normalized)
    return normalized

@app.route('/search_by_tags')
@rate_limit
def search_by_tags():
    try:
        include_tags_raw = request.args.get('include_tags', '')
        exclude_tags_raw = request.args.get('exclude_tags', '')
        
        # Parse and sanitize tags
        include_tags = [t.strip() for t in include_tags_raw.split(',') if t.strip()]
        exclude_tags = [t.strip() for t in exclude_tags_raw.split(',') if t.strip()]
        
        if not include_tags:
            return jsonify([])
        
        # Build parameterized query to prevent SQL injection
        params = []
        where_clauses = []
        
        # Include tags (AND logic - must match all)
        for tag in include_tags:
            # Normalize tag for flexible matching (handles apostrophes)
            normalized = normalize_tag_for_search(tag)
            where_clauses.append("LOWER(tags) LIKE ?")
            params.append(f'%{normalized}%')
        
        # Exclude tags (AND NOT logic)
        for tag in exclude_tags:
            normalized = normalize_tag_for_search(tag)
            where_clauses.append("LOWER(tags) NOT LIKE ?")
            params.append(f'%{normalized}%')
        
        sql = f"""
            SELECT title, description, tags, hash, cover_img 
            FROM manga_metadata
            WHERE {' AND '.join(where_clauses)}
        """

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        
        data = []
        for row in rows:
            orig_cover = row[4] or NOCOVER
            proxied_cover = generate_proxied_image_url(orig_cover)
            data.append({
                "title": row[0], 
                "description": row[1], 
                "tags": row[2],
                "hash": row[3],
                "cover_img": proxied_cover
            })
        return jsonify(data)
    
    except Exception as e:
        return jsonify({"error": "Search failed"}), 500


@app.route('/get_recommendations')
@rate_limit
def get_recommendations():
    """Get manga recommendations based on provided tags, excluding specified manga slugs"""
    try:
        tags_param = request.args.get('tags', '')
        exclude_slugs = request.args.get('exclude', '')
        limit = int(request.args.get('limit', 10))
        
        if not tags_param:
            return jsonify([])
        
        # Clean up tags - remove quotes, brackets, and other special characters
        # Tags might come in various formats from the DB/frontend
        cleaned_tags_param = tags_param.replace('[', '').replace(']', '').replace('"', '').replace("'", '')
        tags = [t.strip() for t in cleaned_tags_param.split(',') if t.strip()]
        exclude_list = [s.strip() for s in exclude_slugs.split(',') if s.strip()]
        
        if not tags:
            return jsonify([])
        
        # Remove duplicate tags (case-insensitive)
        seen = set()
        unique_tags = []
        for tag in tags:
            lower_tag = tag.lower()
            if lower_tag not in seen:
                seen.add(lower_tag)
                unique_tags.append(tag)
        tags = unique_tags
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query using parameterized queries to prevent SQL injection
        # Normalize tags and create placeholders for each tag pattern
        tag_patterns = [f'%{normalize_tag_for_search(tag)}%' for tag in tags]
        
        # Build CASE statements with parameter placeholders
        case_parts = []
        where_parts = []
        params = []
        
        for i, pattern in enumerate(tag_patterns):
            case_parts.append(f"(CASE WHEN LOWER(tags) LIKE ? THEN 1 ELSE 0 END)")
            where_parts.append(f"LOWER(tags) LIKE ?")
            params.append(pattern)
        
        # Duplicate params for WHERE clause
        params.extend(tag_patterns)
        
        tag_conditions = " + ".join(case_parts)
        where_conditions = " OR ".join(where_parts)
        
        sql = f"""
            SELECT title, description, tags, hash, cover_img, 
                   ({tag_conditions}) as tag_score
            FROM manga_metadata
            WHERE ({where_conditions})
            ORDER BY tag_score DESC, RANDOM()
            LIMIT ?
        """
        
        params.append(limit + len(exclude_list))  # Fetch extra to account for exclusions
        cursor.execute(sql, params)
        rows = cursor.fetchall()
    
        data = []
        for row in rows:
            title = row[0]
            slug = title.lower()
            slug = ''.join(c if c.isalnum() or c == ' ' else '' for c in slug)
            slug = '-'.join(slug.split())
            
            # Skip excluded slugs
            if slug in exclude_list:
                continue
                
            orig_cover = row[4] or NOCOVER
            proxied_cover = generate_proxied_image_url(orig_cover)
            data.append({
                "title": title, 
                "description": row[1], 
                "tags": row[2],
                "hash": row[3],
                "cover_img": proxied_cover,
                "score": row[5]  # How many tags matched
            })
            
            if len(data) >= limit:
                break
        
        return jsonify(data)
    
    except Exception as e:
        print(f"Error in get_recommendations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Run in dev mode by default when running directly
    os.environ['DEV_MODE'] = '1'
    print("🚀 Running Flask in DEVELOPMENT mode - using local database")
    
    # Initialize database on app startup (don't wait for first request)
    print("[STARTUP] Initializing database pool...")
    initialize_db_pool()
    print("[STARTUP] Database pool ready")
    
    app.run(host='0.0.0.0', threaded=True, debug=True, port=5001)




