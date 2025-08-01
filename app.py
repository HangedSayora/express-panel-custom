from flask import Flask, jsonify, render_template, request, send_from_directory
import sqlite3
import os
import re
import requests
import subprocess
import glob
import platform
from urllib.parse import urlparse
from mimetypes import guess_extension

app = Flask(__name__)
DB_FILE = 'express_panel.db'
ICONS_PAGE_FOLDER = os.path.join(app.root_path, 'static', 'page', 'icons')
ICONS_SITE_FOLDER = os.path.join(app.root_path, 'static', 'site', 'favicons')
BACKGROUND_FOLDER = os.path.join(app.root_path, 'static', 'background')

def init_db():
    if not os.path.exists(DB_FILE):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_index INTEGER NOT NULL,
                name TEXT NOT NULL,
                icon TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE sites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parent_id INTEGER NOT NULL,
                order_index INTEGER NOT NULL,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                icon TEXT
            )
        ''')

        conn.commit()
        conn.close()

def process_name(name):
    name = re.sub(r'^\s+|\s+$', '', name)
    name = re.sub(r'\s+', '_', name)
    return name

def process_name2(name):
    name = re.sub(r'^\s+|\s+$', '', name)
    return name

def delete_extra(path, name):
    name_ext = f"{name}.*"
    files_to_delete = glob.glob(os.path.join(path, name_ext))
    for file_path in files_to_delete:
        try:
            os.remove(file_path)
        except OSError as e:
            print(f"Ошибка при удалении файла {file_path}: {e}")

def get_ffmpeg_path():
    base_dir = os.path.join(os.path.dirname(__file__), 'static', 'ffmpeg')
    system = platform.system()

    if system == 'Windows':
        ffmpeg_path = os.path.join(base_dir, 'windows', 'ffmpeg.exe')
    elif system == 'Linux':
        ffmpeg_path = os.path.join(base_dir, 'linux', 'ffmpeg')
    else:
        raise RuntimeError(f"Unsupported OS: {system}")

    if not os.path.isfile(ffmpeg_path):
        raise FileNotFoundError(f"FFmpeg binary not found at {ffmpeg_path}")

    return ffmpeg_path

def extract_domain(url):
    url = url.strip()
    
    if not re.match(r'^https?://', url):
        url = 'https://' + url
    
    url = re.sub(r'^(https?:/)([^/])', r'\1/\2', url)
    
    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        
        domain = domain.split(':')[0]
        
        if '@' in domain:
            domain = domain.split('@')[-1]
        
        if not domain or '.' not in domain:
            raise ValueError("Invalid domain")
            
        return domain
    except Exception as e:
        print(f"Error parsing URL {url}: {e}")
        match = re.search(r'([a-z0-9-]+\.)+[a-z]{2,}', url)
        return match.group(0) if match else "unknown-domain"


def save_file_from_url(url, save_dir, filename, type):
    try:
        abs_save_dir = os.path.join(app.root_path, save_dir)
        os.makedirs(abs_save_dir, exist_ok=True)
        
        response = requests.get(url, stream=True, timeout=10)
        response.raise_for_status()
        
        ext = get_file_extension(url, response.headers.get('content-type', ''))
        if not ext:
            ext = 'png'
            
        temp_filename = f"temp_{filename}.{ext}"
        temp_path = os.path.join(abs_save_dir, temp_filename)
        
        with open(temp_path, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        
        if ext.lower() in ['mp4', 'webm', 'webp']:
            target_ext = 'gif'
        elif ext.lower() in ['jpg', 'jpeg', 'ico']:
            target_ext = 'png'
        else:
            target_ext = ext.lower()
        
        final_filename = f"{filename}.{target_ext}"
        final_path = os.path.join(abs_save_dir, final_filename)
        
        if target_ext == 'gif':
            try:
                ffmpeg_path = get_ffmpeg_path()
                subprocess.run([
                    ffmpeg_path, 
                    '-y',
                    '-i', temp_path, 
                    '-vf', 'fps=30,scale=320:-1:flags=lanczos',
                    '-f', 'gif', 
                    final_path
                ], check=True, timeout=30)
                os.remove(temp_path)
            except Exception as e:
                print(f"GIF conversion failed, saving original: {e}")
                os.rename(temp_path, final_path)
                
        elif target_ext == 'png' and ext.lower() != 'png':
            try:
                img = Image.open(temp_path)
                img.save(final_path, 'PNG')
                os.remove(temp_path)
            except Exception as e:
                print(f"PNG conversion failed, saving original: {e}")
                os.rename(temp_path, final_path)
        else:
            os.rename(temp_path, final_path)
        
        return f"http://127.0.0.1:5001/{type}-icon/{final_filename}"
    
    except Exception as e:
        print(f"Failed to save {url}: {str(e)}")
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        return None


def get_file_extension(url, content_type):
    path = urlparse(url).path
    ext = path.split('.')[-1].lower() if '.' in path else None
    
    if ext and ext in {'gif', 'png', 'jpg', 'jpeg', 'webp', 'ico', "mp4"}:
        return ext
    
    if 'image/' in content_type:
        guessed_ext = guess_extension(content_type.partition(';')[0].strip())
        if guessed_ext:
            return guessed_ext[1:]
    
    if 's2/favicons' in url:
        return 'png'
    
    return 'png'


def get_favicon_url(site_url, filename, size=256):
    domain = extract_domain(site_url)
    if domain in ("bilibili.com", "osu.ppy.sh"):
        size = 32
    elif domain in ("www.nicovideo.jp"):
        size = 128
    
    sources = [
        f"https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&url={domain}&size={size}",
        f"https://www.google.com/s2/favicons?domain={domain}&sz={size}",
        f"https://{domain}/favicon.ico",
    ]
    
    for url in sources:
        favicon = save_file_from_url(url, "static/site/favicons", filename, "site")
        if favicon:
            return favicon
    
    return "http://127.0.0.1:5001/static/site/favicons/Default.png"


@app.route('/api/add/page/<name>/', methods=['POST'])
def add_page(name):
    icon = "http://127.0.0.1:5001/page-icon/Default.gif"
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT MAX(order_index) FROM pages")
    result = cursor.fetchone()
    next_index = (result[0] or 0) + 1

    cursor.execute(
        'INSERT INTO pages (order_index, name, icon) VALUES (?, ?, ?)',
        (next_index, process_name2(name), icon)
    )
    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok",
        "message": f"Page '{name}' added successfully",
        "order_index": next_index
    })



@app.route('/api/add/site/<int:parent_id>/', methods=['POST'])
def add_site(parent_id):
    data = request.get_json()

    if 'name' not in data and 'url' not in data:
        return jsonify({"error": "Missing 'name' or 'url' in request"}), 400

    name = data["name"]
    url = data["url"]

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT MAX(order_index) FROM sites WHERE parent_id = ?", (parent_id,))
    result = cursor.fetchone()
    next_index = (result[0] or 0) + 1

    cursor.execute(
        'INSERT INTO sites (parent_id, order_index, name, url, icon) VALUES (?, ?, ?, ?, ?)',
        (parent_id, next_index, process_name2(name), url, 'temp_icon')
    )

    site_id = cursor.lastrowid

    icon = get_favicon_url(url, f"{process_name(name)}_{site_id}_{parent_id}")

    cursor.execute(
        'UPDATE sites SET icon = ? WHERE id = ?',
        (icon, site_id)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok",
        "message": f"Site '{name}' added to page {parent_id}",
        "order_index": next_index
    })


@app.route('/api/del/page/<int:page_id>/', methods=['DELETE'])
def del_page(page_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM pages WHERE id = ?", (page_id,))
    result = cursor.fetchone()
    if not result:
        conn.close()
        return jsonify({"status": "error", "message": "Page not found"}), 404

    name = process_name(f"{result[0]}_{page_id}")
    delete_extra("static/page/icons", name)

    try:
        cursor.execute("SELECT name, id FROM sites WHERE parent_id = ?", (page_id,))
        sites = cursor.fetchall()
        if sites:
            for name, site_id in sites:
                name2 = process_name(f"{name}_{site_id}_{page_id}")
                delete_extra("static/site/favicons", name2)
    except Exception as e:
        print(f"Error processing sites: {e}")

    cursor.execute("DELETE FROM sites WHERE parent_id = ?", (page_id,))

    cursor.execute("DELETE FROM pages WHERE id = ?", (page_id,))

    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok",
        "message": f"Page {page_id} and its sites deleted"
    })


@app.route('/api/del/site/<int:site_id>/', methods=['DELETE'])
def del_site(site_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT parent_id, name FROM sites WHERE id = ?", (site_id,))
    result = cursor.fetchone()
    if not result:
        conn.close()
        return jsonify({"status": "error", "message": "Site not found"}), 404

    name = process_name(f"{result[1]}_{site_id}_{result[0]}")
    delete_extra("static/site/favicons", name)

    cursor.execute("DELETE FROM sites WHERE id = ?", (site_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok",
        "message": f"Site {site_id} deleted"
    })


@app.route('/api/reorder/pages/', methods=['POST'])
def reorder_pages():
    try:
        new_order = request.get_json()
        if not new_order or not isinstance(new_order, list):
            return jsonify({"status": "error", "message": "Invalid request data"}), 400

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        placeholders = ','.join(['?'] * len(new_order))
        cursor.execute(f"SELECT COUNT(*) FROM pages WHERE id IN ({placeholders})", new_order)
        if cursor.fetchone()[0] != len(new_order):
            return jsonify({"status": "error", "message": "One or more page IDs are invalid"}), 400

        # Обновляем порядок в транзакции
        try:
            cursor.execute("BEGIN TRANSACTION")
            
            for index, page_id in enumerate(new_order, start=1):
                cursor.execute(
                    "UPDATE pages SET order_index = ? WHERE id = ?",
                    (index, page_id)
                )
            
            conn.commit()
            return jsonify({
                "status": "ok",
                "message": "Pages reordered successfully",
                "new_order": new_order
            })

        except sqlite3.Error as e:
            conn.rollback()
            return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500

        finally:
            conn.close()

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


@app.route('/api/reorder/sites/<int:parent_id>/', methods=['POST'])
def reorder_sites(parent_id):
    try:
        new_order = request.get_json()
        
        if not new_order or not isinstance(new_order, list):
            return jsonify({
                "status": "error", 
                "message": "Invalid request data: expected array of site IDs"
            }), 400

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        placeholders = ','.join(['?'] * len(new_order))
        cursor.execute(
            f"""SELECT COUNT(*) FROM sites 
            WHERE id IN ({placeholders}) AND parent_id = ?""",
            (*new_order, parent_id)
        )
        
        if cursor.fetchone()[0] != len(new_order):
            return jsonify({
                "status": "error",
                "message": "One or more site IDs are invalid or don't belong to this parent"
            }), 400

        try:
            cursor.execute("BEGIN TRANSACTION")
            
            for index, site_id in enumerate(new_order, start=1):
                cursor.execute(
                    """UPDATE sites SET order_index = ? 
                    WHERE id = ? AND parent_id = ?""",
                    (index, site_id, parent_id)
                )
            
            conn.commit()
            return jsonify({
                "status": "ok",
                "message": "Sites reordered successfully",
                "parent_id": parent_id,
                "new_order": new_order
            })

        except sqlite3.Error as e:
            conn.rollback()
            return jsonify({
                "status": "error",
                "message": f"Database error: {str(e)}"
            }), 500

        finally:
            conn.close()

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500


@app.route('/api/get/page/list', methods=['GET'])
def get_page_list():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT id, order_index, name, icon FROM pages ORDER BY order_index ASC")
    rows = cursor.fetchall()

    conn.close()

    pages = []
    for row in rows:
        pages.append({
            "id": row[0],
            "order_index": row[1],
            "name": row[2],
            "icon": row[3]
        })

    return jsonify(pages)


@app.route('/api/get/site/list/<int:parent_id>/', methods=['GET'])
def get_site_list(parent_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT id, parent_id, order_index, name, url, icon FROM sites WHERE parent_id = ? ORDER BY order_index ASC", (parent_id,))
    rows = cursor.fetchall()

    conn.close()

    sites = []
    for row in rows:
        sites.append({
            "id": row[0],
            "parent_id": row[1],
            "order_index": row[2],
            "name": row[3],
            "url": row[4],
            "icon": row[5]
        })

    return jsonify(sites)


@app.route('/api/change/page/<int:id>/', methods=['PATCH'])
def change_page(id):
    data = request.get_json()

    if 'name' not in data and 'icon' not in data:
        return jsonify({"error": "Missing 'name' or 'icon' in request"}), 400

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    updates = []
    new_name = None

    try:
        cursor.execute("SELECT name, icon FROM pages WHERE id = ?", (id,))
        current_data = cursor.fetchone()
        current_name = current_data[0]
        current_icon = current_data[1]

        if "name" in data and data["name"] != "":
            processed_name = process_name2(data["name"])
            if processed_name != current_name:
                new_name = processed_name
                cursor.execute("UPDATE pages SET name = ? WHERE id = ?", 
                             (new_name, id))
                updates.append("name updated")

        if "icon" in data and data["icon"] != "":
            icon_name = new_name if new_name else current_name
            icon_filename = f"{process_name(icon_name)}_{id}"
            
            if data["icon"] != current_icon or new_name:
                new_icon_path = save_file_from_url(data["icon"], "static/page/icons", icon_filename, "page")
                cursor.execute("UPDATE pages SET icon = ? WHERE id = ?", 
                             (new_icon_path, id))
                updates.append("icon updated")
                
                if new_name:
                    old_icon_filename = f"{process_name(current_name)}_{id}"
                    delete_extra("static/page/icons", old_icon_filename)

        conn.commit()
        return jsonify({
            "status": "success",
            "message": f"Page {id} updated",
            "updates": updates
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route('/api/change/site/<int:parent_id>/<int:id>/', methods=['PATCH'])
def change_site(parent_id, id):
    data = request.get_json()

    if 'name' not in data and 'url' not in data:
        return jsonify({"error": "Missing 'name' or 'url' in request"}), 400

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    updates = []
    new_name = None

    try:
        cursor.execute("SELECT name, url, icon FROM sites WHERE parent_id = ? AND id = ?", (parent_id, id,))
        current_data = cursor.fetchone()
        current_name = current_data[0]
        current_url = current_data[1]
        current_icon = current_data[2]

        if "name" in data and data["name"] != "" and process_name2(data["name"]) != current_name:
            new_name = process_name2(data["name"])
            cursor.execute("UPDATE sites SET name = ? WHERE parent_id = ? AND id = ?", 
                         (new_name, parent_id, id))
            updates.append("name updated")

        if "url" in data and data["url"] != "":
            if data["url"] != current_url:
                cursor.execute("UPDATE sites SET url = ? WHERE parent_id = ? AND id = ?", 
                             (data["url"], parent_id, id))
                updates.append("url updated")

            icon_name = new_name if new_name else current_name
            new_icon = get_favicon_url(data["url"], f"{process_name(icon_name)}_{id}_{parent_id}")
            
            if new_icon != current_icon or new_name:
                cursor.execute("UPDATE sites SET icon = ? WHERE parent_id = ? AND id = ?", 
                             (new_icon, parent_id, id))
                updates.append("icon updated")
                
                if new_name:
                    delete_extra("static/site/favicons", process_name(f"{current_name}_{id}_{parent_id}"))

        conn.commit()
        return jsonify({
            "status": "success",
            "message": f"Site {id} updated",
            "updates": updates
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route('/')
def serve_index():
    return render_template('index.html')


@app.route('/page-icon/<filename>')
def serve_index_page_icon(filename):

    allowed_extensions = {'gif'}
    if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return "Invalid file type", 400
    
    safe_filename = os.path.basename(filename)
    
    if not os.path.exists(os.path.join(ICONS_PAGE_FOLDER, safe_filename)):
        return "File not found", 404
    
    return send_from_directory(
        ICONS_PAGE_FOLDER,
        safe_filename,
        mimetype=f'image/{filename.rsplit(".", 1)[1].lower()}',
        as_attachment=False
    )


@app.route('/site-icon/<filename>')
def serve_index_site_icon(filename):

    allowed_extensions = {'png'}
    if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return "Invalid file type", 400
    
    safe_filename = os.path.basename(filename)
    
    if not os.path.exists(os.path.join(ICONS_SITE_FOLDER, safe_filename)):
        return "File not found", 404
    
    return send_from_directory(
        ICONS_SITE_FOLDER,
        safe_filename,
        mimetype=f'image/{filename.rsplit(".", 1)[1].lower()}',
        as_attachment=False
    )


@app.route('/background/<filename>')
def serve_index_background(filename):

    allowed_extensions = {'png'}
    if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return "Invalid file type", 400
    
    safe_filename = os.path.basename(filename)
    
    if not os.path.exists(os.path.join(BACKGROUND_FOLDER, safe_filename)):
        return "File not found", 404
    
    return send_from_directory(
        BACKGROUND_FOLDER,
        safe_filename,
        mimetype=f'image/{filename.rsplit(".", 1)[1].lower()}',
        as_attachment=False
    )


@app.route('/static/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename, mimetype='application/javascript')


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001)
