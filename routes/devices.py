import json
import secrets
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from models import db, Device, DeviceToken, Post, Firmware

devices_bp = Blueprint('devices', __name__)


@devices_bp.route('/devices')
@login_required
def my_devices():
    devices = Device.query.filter_by(user_id=current_user.id).all()
    # Get latest active firmware version for check-update
    active_fw = Firmware.query.filter_by(is_active=True).first()
    latest_fw = active_fw.version if active_fw else None
    if not latest_fw:
        # Fallback: get the newest firmware by version
        newest = Firmware.query.order_by(Firmware.uploaded_at.desc()).first()
        latest_fw = newest.version if newest else None
    return render_template('devices.html', devices=devices, latest_firmware=latest_fw)


@devices_bp.route('/devices/register', methods=['GET', 'POST'])
@login_required
def register_device():
    if request.method == 'POST':
        hardware_id = request.form.get('hardware_id', '').strip().upper()
        name = request.form.get('name', '').strip()
        is_ajax = request.form.get('ajax') == '1'

        if not hardware_id:
            if is_ajax:
                return jsonify({'status': 'error', 'error': 'Hardware ID (MAC address) is required.'}), 400
            flash('Hardware ID (MAC address) is required.', 'danger')
            return redirect(url_for('devices.register_device'))

        existing = Device.query.filter_by(hardware_id=hardware_id).first()
        if existing:
            if is_ajax:
                return jsonify({'status': 'error', 'error': 'This device is already registered.'}), 400
            flash('This device is already registered.', 'danger')
            return redirect(url_for('devices.register_device'))

        device = Device(
            hardware_id=hardware_id,
            name=name or f'Device {hardware_id[-5:]}',
            user_id=current_user.id,
            module_type=request.form.get('module_type', 'ESP32-S3').strip() or 'ESP32-S3',
            tag=request.form.get('usage', '').strip() or None,
        )

        # Store car info in config_json
        car_brand = request.form.get('car_brand', '').strip()
        car_model = request.form.get('car_model', '').strip()
        car_year = request.form.get('car_year', '').strip()
        usage = request.form.get('usage', '').strip()
        if car_brand or car_model or car_year or usage:
            import json as _json
            extra = {}
            if car_brand: extra['car_brand'] = car_brand
            if car_model: extra['car_model'] = car_model
            if car_year: extra['car_year'] = car_year
            if usage: extra['usage'] = usage
            # Merge with default config
            config = DEFAULT_ESP_CONFIG.copy()
            config['vehicle'] = extra
            device.config_json = _json.dumps(config)

        db.session.add(device)
        db.session.flush()

        token_str = secrets.token_hex(32)
        token = DeviceToken(
            token=token_str,
            device_id=device.id,
            user_id=current_user.id
        )
        db.session.add(token)
        db.session.commit()

        if is_ajax:
            return jsonify({'status': 'ok', 'device_id': device.id, 'token': token_str}), 200

        flash('Device registered successfully!', 'success')
        return render_template('device_registered.html', device=device, token=token_str)

    return render_template('register_device.html')


@devices_bp.route('/devices/<int:device_id>')
@login_required
def view_device(device_id):
    device = Device.query.get_or_404(device_id)
    if device.user_id != current_user.id:
        flash('You do not own this device.', 'danger')
        return redirect(url_for('devices.my_devices'))

    active_token = DeviceToken.query.filter_by(device_id=device.id, is_active=True).first()
    return render_template('device_detail.html', device=device, active_token=active_token)


@devices_bp.route('/devices/<int:device_id>/assign', methods=['GET', 'POST'])
@login_required
def assign_gauge(device_id):
    device = Device.query.get_or_404(device_id)
    if device.user_id != current_user.id:
        flash('You do not own this device.', 'danger')
        return redirect(url_for('devices.my_devices'))

    if request.method == 'POST':
        post_id = request.form.get('post_id', type=int)

        if post_id:
            post = Post.query.get(post_id)
            if not post:
                flash('Gauge face not found.', 'danger')
                return redirect(url_for('devices.assign_gauge', device_id=device_id))
            device.assigned_post_id = post_id
        else:
            device.assigned_post_id = None

        db.session.commit()
        flash('Gauge assignment updated!', 'success')
        return redirect(url_for('devices.my_devices'))

    posts = Post.query.order_by(Post.posted_at.desc()).all()
    return render_template('assign_gauge.html', device=device, posts=posts)


@devices_bp.route('/devices/<int:device_id>/regenerate-token', methods=['POST'])
@login_required
def regenerate_token(device_id):
    device = Device.query.get_or_404(device_id)
    if device.user_id != current_user.id:
        flash('You do not own this device.', 'danger')
        return redirect(url_for('devices.my_devices'))

    DeviceToken.query.filter_by(device_id=device.id).update({'is_active': False})

    token_str = secrets.token_hex(32)
    new_token = DeviceToken(
        token=token_str,
        device_id=device.id,
        user_id=current_user.id
    )
    db.session.add(new_token)
    db.session.commit()

    flash('New token generated. Update your ESP32 with the new token.', 'success')
    return render_template('device_registered.html', device=device, token=token_str)


@devices_bp.route('/devices/<int:device_id>/rename', methods=['POST'])
@login_required
def rename_device(device_id):
    device = Device.query.get_or_404(device_id)
    if device.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json(silent=True)
    if not data or not data.get('name', '').strip():
        return jsonify({'error': 'Name is required'}), 400

    name = data['name'].strip()[:40]
    device.name = name
    db.session.commit()
    return jsonify({'status': 'ok', 'name': device.name}), 200


@devices_bp.route('/devices/<int:device_id>/tag', methods=['POST'])
@login_required
def update_device_tag(device_id):
    device = Device.query.get_or_404(device_id)
    if device.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json(silent=True)
    if not data or 'tag' not in data:
        return jsonify({'error': 'Missing tag'}), 400

    allowed = ['production', 'test', 'vehicle', 'lab']
    if data['tag'] not in allowed:
        return jsonify({'error': 'Invalid tag'}), 400

    device.tag = data['tag']
    db.session.commit()
    return jsonify({'status': 'ok', 'tag': device.tag}), 200


@devices_bp.route('/devices/<int:device_id>/delete', methods=['POST'])
@login_required
def delete_device(device_id):
    device = Device.query.get_or_404(device_id)
    if device.user_id != current_user.id:
        flash('You do not own this device.', 'danger')
        return redirect(url_for('devices.my_devices'))

    DeviceToken.query.filter_by(device_id=device.id).update({'is_active': False})
    db.session.delete(device)
    db.session.commit()

    flash('Device removed.', 'success')
    return redirect(url_for('devices.my_devices'))


# --- Default ESP32 config (matches dash_config_t defaults) ---
DEFAULT_ESP_CONFIG = {
    "speed_unit": 0,
    "speed_number_color": {"r": 255, "g": 255, "b": 255},
    "speed_unit_color": {"r": 150, "g": 150, "b": 150},
    "speed_grid_color": {"r": 0, "g": 60, "b": 140},
    "speed_car_color": {"r": 255, "g": 255, "b": 255},
    "speed_shadow_color": {"r": 120, "g": 120, "b": 120},
    "tilt_angle_color": {"r": 255, "g": 80, "b": 80},
    "tilt_unit_color": {"r": 130, "g": 130, "b": 130},
    "tilt_warning_deg": 25,
    "danger_color": {"r": 200, "g": 0, "b": 0},
    "tilt_speed": 1.0,
    "data_circle_color": {"r": 0, "g": 212, "b": 255},
    "data_circle_dim_color": {"r": 0, "g": 100, "b": 120},
    "data_circle_inner_color": {"r": 0, "g": 60, "b": 140},
    "data_bar_color": {"r": 0, "g": 212, "b": 255},
    "data_center_color": {"r": 0, "g": 212, "b": 255},
    "volt_gauge_color": {"r": 255, "g": 149, "b": 0},
    "volt_warning_color": {"r": 255, "g": 0, "b": 0},
    "volt_warning_low": 11.7,
    "volt_warning_high": 13.5,
    "volt_sim_enabled": True,
    "volt_sim_value": 12.8,
    "rpm_sim_enabled": True,
    "rpm_sim_value": 3500.0,
    "imu_filter_tau": 0.35,
    "speed_sim_enabled": True,
    "speed_sim_max": 200,
    "speed_sim_accel": 40,
    "speed_sim_decel": 50,
    "language": 0,
    "brightness": 80,
    "welcome_word": "utilisateurs",
    "wifi_ssid": "GaugeCluster",
    "wifi_password": "12345678",
    "wifi_channel": 1
}


@devices_bp.route('/devices/<int:device_id>/configure')
@login_required
def configure_device(device_id):
    device = Device.query.get_or_404(device_id)
    if device.user_id != current_user.id:
        flash('You do not own this device.', 'danger')
        return redirect(url_for('devices.my_devices'))

    if device.config_json:
        try:
            config = json.loads(device.config_json)
        except (json.JSONDecodeError, TypeError):
            config = DEFAULT_ESP_CONFIG.copy()
    else:
        config = DEFAULT_ESP_CONFIG.copy()

    return render_template('device_configure.html', device=device, config=config, defaults=DEFAULT_ESP_CONFIG)


@devices_bp.route('/devices/<int:device_id>/configure/save', methods=['POST'])
@login_required
def save_device_config(device_id):
    device = Device.query.get_or_404(device_id)
    if device.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    device.config_json = json.dumps(data)
    db.session.commit()

    return jsonify({'status': 'ok', 'config': data}), 200


@devices_bp.route('/devices/<int:device_id>/configure/reset', methods=['POST'])
@login_required
def reset_device_config(device_id):
    device = Device.query.get_or_404(device_id)
    if device.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    device.config_json = json.dumps(DEFAULT_ESP_CONFIG)
    db.session.commit()

    return jsonify({'status': 'ok', 'config': DEFAULT_ESP_CONFIG}), 200
