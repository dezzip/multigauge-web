import json
import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from functools import wraps
from datetime import datetime
from models import db, Device, DeviceToken, Firmware, Post

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')


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
