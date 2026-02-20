from flask import Blueprint, render_template, Response, request, jsonify
from flask_login import current_user, login_required
from models import db, Post, User, bcrypt
import os

main_bp = Blueprint('main', __name__)

# Home route - Landing page
@main_bp.route("/")
def home():
    return render_template('index.html')


# --- Settings ---

@main_bp.route("/settings")
@login_required
def settings():
    return render_template('settings.html')


@main_bp.route("/settings/account", methods=['POST'])
@login_required
def settings_account():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request'}), 400

    email = data.get('email', '').strip()
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address'}), 400

    existing = User.query.filter(User.email == email, User.id != current_user.id).first()
    if existing:
        return jsonify({'error': 'Email already in use'}), 400

    current_user.email = email
    db.session.commit()
    return jsonify({'status': 'ok'})


@main_bp.route("/settings/password", methods=['POST'])
@login_required
def settings_password():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request'}), 400

    current_pw = data.get('current', '')
    new_pw = data.get('password', '')

    if not bcrypt.check_password_hash(current_user.password, current_pw):
        return jsonify({'error': 'Current password is incorrect'}), 400

    if len(new_pw) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    current_user.password = bcrypt.generate_password_hash(new_pw).decode('utf-8')
    db.session.commit()
    return jsonify({'status': 'ok'})


@main_bp.route("/settings/preferences", methods=['POST'])
@login_required
def settings_preferences():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request'}), 400

    allowed_languages = ['fr', 'en', 'de', 'es', 'it', 'pt', 'ja', 'zh']
    allowed_units = ['metric', 'imperial']
    allowed_themes = ['light', 'dark', 'auto']

    lang = data.get('language', 'fr')
    if lang in allowed_languages:
        current_user.language = lang

    region = data.get('region', 'FR')
    if len(region) <= 5:
        current_user.region = region

    units = data.get('units', 'metric')
    if units in allowed_units:
        current_user.units = units

    theme = data.get('theme', 'light')
    if theme in allowed_themes:
        current_user.theme = theme

    db.session.commit()
    return jsonify({'status': 'ok'})


@main_bp.route("/settings/notifications", methods=['POST'])
@login_required
def settings_notifications():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid request'}), 400

    current_user.notifications_enabled = bool(data.get('email_notifications', True))
    db.session.commit()
    return jsonify({'status': 'ok'})