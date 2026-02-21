import json
import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from functools import wraps
from datetime import datetime
from models import db, Device, DeviceToken, Firmware, Post

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

# --- Debug: store last raw requests for inspection ---
_debug_log = []
_DEBUG_MAX = 50


# --- Auth decorator for ESP32 Bearer token ---

def require_device_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401

        token_str = auth_header[7:]
        token = DeviceToken.query.filter_by(token=token_str, is_active=True).first()
        if not token:
            return jsonify({'error': 'Invalid or revoked token'}), 401

        device = token.device
        device.last_seen_at = datetime.utcnow()
        db.session.commit()

        kwargs['device'] = device
        kwargs['token'] = token
        return f(*args, **kwargs)

    return decorated


# --- Endpoints ---

@api_bp.route('/heartbeat', methods=['POST'])
@require_device_token
def heartbeat(device, token):
    data = request.get_json(silent=True) or {}

    if 'firmware_version' in data:
        device.firmware_version = data['firmware_version']

    device.last_seen_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'status': 'ok',
        'device_id': device.id,
        'hardware_id': device.hardware_id
    }), 200


@api_bp.route('/gauge', methods=['GET'])
@require_device_token
def get_gauge(device, token):
    if not device.assigned_post_id:
        return jsonify({'post_id': None, 'data': None}), 200

    post = Post.query.get(device.assigned_post_id)
    if not post:
        return jsonify({'post_id': None, 'data': None}), 200

    try:
        gauge_data = json.loads(post.data)
    except (json.JSONDecodeError, TypeError):
        gauge_data = post.data

    return jsonify({
        'post_id': post.id,
        'title': post.title,
        'gauge_type': post.gauge_type,
        'data': gauge_data
    }), 200


@api_bp.route('/firmware/check', methods=['GET'])
@require_device_token
def firmware_check(device, token):
    current_version = request.args.get('current_version', '0.0.0')

    active_firmware = Firmware.query.filter_by(is_active=True).first()
    if not active_firmware:
        return jsonify({'update_available': False, 'version': current_version}), 200

    def parse_version(v):
        try:
            return tuple(int(x) for x in v.split('.'))
        except (ValueError, AttributeError):
            return (0, 0, 0)

    if parse_version(active_firmware.version) > parse_version(current_version):
        return jsonify({
            'update_available': True,
            'version': active_firmware.version,
            'file_size': active_firmware.file_size,
            'checksum': active_firmware.checksum,
            'download_url': '/api/v1/firmware/download'
        }), 200

    return jsonify({'update_available': False, 'version': current_version}), 200


@api_bp.route('/firmware/download', methods=['GET'])
@require_device_token
def firmware_download(device, token):
    active_firmware = Firmware.query.filter_by(is_active=True).first()
    if not active_firmware:
        return jsonify({'error': 'No active firmware'}), 404

    firmware_dir = current_app.config['FIRMWARE_UPLOAD_DIR']
    filepath = os.path.join(firmware_dir, active_firmware.filename)

    if not os.path.exists(filepath):
        return jsonify({'error': 'Firmware file not found'}), 404

    response = send_from_directory(
        firmware_dir,
        active_firmware.filename,
        mimetype='application/octet-stream'
    )
    response.headers['X-Firmware-Version'] = active_firmware.version
    response.headers['Content-Length'] = active_firmware.file_size
    return response


@api_bp.route('/config', methods=['GET'])
@require_device_token
def get_config(device, token):
    if not device.config_json:
        return jsonify({'config': None}), 200

    try:
        config_data = json.loads(device.config_json)
    except (json.JSONDecodeError, TypeError):
        return jsonify({'config': None}), 200

    return jsonify({'config': config_data}), 200


@api_bp.route('/status', methods=['GET'])
@require_device_token
def device_status(device, token):
    gauge_title = None
    if device.assigned_post_id:
        post = Post.query.get(device.assigned_post_id)
        gauge_title = post.title if post else None

    return jsonify({
        'device_id': device.id,
        'hardware_id': device.hardware_id,
        'name': device.name,
        'firmware_version': device.firmware_version,
        'assigned_gauge': gauge_title,
        'assigned_post_id': device.assigned_post_id
    }), 200


# --- Debug page: see what ESP32 sends ---

@api_bp.before_request
def _log_all_requests():
    """Log every request hitting /api/v1/ for debug purposes."""
    entry = {
        'time': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
        'method': request.method,
        'path': request.full_path,
        'remote': request.remote_addr,
        'headers': {k: v for k, v in request.headers if k in (
            'Authorization', 'Content-Type', 'User-Agent', 'Host')},
        'body': request.get_data(as_text=True)[:2000],
    }
    _debug_log.append(entry)
    if len(_debug_log) > _DEBUG_MAX:
        _debug_log.pop(0)


@api_bp.route('/debug', methods=['GET'])
def debug_page():
    """Raw HTML page showing all recent API requests."""
    devices = Device.query.all()
    tokens = DeviceToken.query.all()

    rows = ''
    for e in reversed(_debug_log):
        rows += (
            f'<tr><td>{e["time"]}</td><td>{e["method"]}</td>'
            f'<td>{e["path"]}</td><td>{e["remote"]}</td>'
            f'<td style="font-size:11px">{e["headers"]}</td>'
            f'<td style="max-width:400px;word-break:break-all;font-size:11px">{e["body"]}</td></tr>'
        )

    dev_rows = ''
    for d in devices:
        dev_rows += (
            f'<tr><td>{d.id}</td><td>{d.hardware_id}</td><td>{d.name}</td>'
            f'<td>{d.firmware_version or "—"}</td>'
            f'<td>{d.last_seen_at or "Never"}</td>'
            f'<td>{"ONLINE" if d.is_online() else "offline"}</td></tr>'
        )

    tok_rows = ''
    for t in tokens:
        tok_rows += (
            f'<tr><td>{t.device_id}</td>'
            f'<td style="font-size:10px;word-break:break-all">{t.token[:16]}...{t.token[-8:]}</td>'
            f'<td>{"active" if t.is_active else "revoked"}</td></tr>'
        )

    html = f'''<!DOCTYPE html><html><head><title>API Debug</title>
<meta http-equiv="refresh" content="10">
<style>body{{font-family:monospace;margin:20px;background:#111;color:#eee}}
table{{border-collapse:collapse;width:100%;margin-bottom:30px}}
th,td{{border:1px solid #444;padding:6px 10px;text-align:left;font-size:13px}}
th{{background:#222}}h2{{color:#4CAF50}}</style></head><body>
<h1>API Debug - dezzip.fr</h1>
<p>Auto-refresh toutes les 10s. {len(_debug_log)} requetes en memoire.</p>

<h2>Devices en DB</h2>
<table><tr><th>ID</th><th>HW ID</th><th>Name</th><th>FW</th><th>Last Seen</th><th>Status</th></tr>
{dev_rows}</table>

<h2>Tokens</h2>
<table><tr><th>Device ID</th><th>Token (tronque)</th><th>Status</th></tr>
{tok_rows}</table>

<h2>Dernières requetes API ({len(_debug_log)})</h2>
<table><tr><th>Time</th><th>Method</th><th>Path</th><th>Remote IP</th><th>Headers</th><th>Body</th></tr>
{rows}</table>

<h2>Test manuel</h2>
<p>POST open (sans auth) : <code>curl -X POST {request.host_url}api/v1/debug-ping -H "Content-Type: application/json" -d '{{"test":"hello"}}'</code></p>
</body></html>'''
    return html, 200, {'Content-Type': 'text/html'}


@api_bp.route('/debug-ping', methods=['POST'])
def debug_ping():
    """Open endpoint (no auth) to test if ESP32 can reach the server."""
    data = request.get_json(silent=True) or {}
    return jsonify({
        'status': 'ok',
        'received': data,
        'your_ip': request.remote_addr,
        'time': datetime.utcnow().isoformat()
    }), 200


@api_bp.route('/ping', methods=['POST'])
def device_ping():
    """Open endpoint — ESP32 authenticates by MAC address (hardware_id).
    Updates last_seen_at and firmware_version for the matching device."""
    data = request.get_json(silent=True) or {}

    mac = data.get('mac', '').upper().strip()
    if not mac:
        return jsonify({'error': 'mac required'}), 400

    device = Device.query.filter_by(hardware_id=mac).first()
    if not device:
        return jsonify({'error': 'unknown device', 'mac': mac}), 404

    device.last_seen_at = datetime.utcnow()
    if 'firmware_version' in data:
        device.firmware_version = data['firmware_version']
    db.session.commit()

    return jsonify({
        'status': 'ok',
        'device': device.name,
        'hardware_id': device.hardware_id,
    }), 200
