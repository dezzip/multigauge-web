import os
import hashlib
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from models import db, Order, Firmware, Device

admin_bp = Blueprint('admin', __name__)

@admin_bp.route("/admin")
@login_required
def admin_dashboard():
    # Check if the user is a moderator
    if not current_user.is_moderator():
        flash("You do not have permission to view this page.", "danger")
        return redirect(url_for('main.index'))
    
    return render_template("admin.html")

@admin_bp.route("/admin/orders")
@login_required
def orders():
    # Check if the user is a moderator
    if not current_user.is_moderator():
        flash("You do not have permission to view this page.", "danger")
        return redirect(url_for('main.index'))
    
    orders = Order.query.all()
    
    return render_template("orders.html", orders = orders)


@admin_bp.route("/admin/orders/<int:order_id>")
@login_required
def view_order(order_id):
    # Check if the user is a moderator
    if not current_user.is_moderator():
        flash("You do not have permission to view this page.", "danger")
        return redirect(url_for('main.index'))
    
    order = Order.query.get(order_id)

    return render_template("order.html", order = order)


# --- Firmware Management ---

@admin_bp.route("/admin/firmware")
@login_required
def firmware_list():
    if not current_user.is_moderator():
        flash("You do not have permission to view this page.", "danger")
        return redirect(url_for('main.index'))

    firmwares = Firmware.query.order_by(Firmware.uploaded_at.desc()).all()
    return render_template("admin_firmware.html", firmwares=firmwares)


@admin_bp.route("/admin/firmware/upload", methods=['GET', 'POST'])
@login_required
def firmware_upload():
    if not current_user.is_moderator():
        flash("You do not have permission to view this page.", "danger")
        return redirect(url_for('main.index'))

    if request.method == 'POST':
        version = request.form.get('version', '').strip()
        notes = request.form.get('notes', '').strip()
        firmware_file = request.files.get('firmware')

        if not version or not firmware_file:
            flash('Version and firmware file are required.', 'danger')
            return redirect(url_for('admin.firmware_upload'))

        if Firmware.query.filter_by(version=version).first():
            flash(f'Firmware version {version} already exists.', 'danger')
            return redirect(url_for('admin.firmware_upload'))

        if not firmware_file.filename.endswith('.bin'):
            flash('Only .bin files are accepted.', 'danger')
            return redirect(url_for('admin.firmware_upload'))

        filename = secure_filename(f"firmware_v{version}.bin")
        firmware_dir = current_app.config['FIRMWARE_UPLOAD_DIR']
        filepath = os.path.join(firmware_dir, filename)
        firmware_file.save(filepath)

        file_size = os.path.getsize(filepath)
        sha256 = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        checksum = sha256.hexdigest()

        fw = Firmware(
            version=version,
            filename=filename,
            file_size=file_size,
            checksum=checksum,
            notes=notes or None,
            is_active=False,
            uploaded_by=current_user.id
        )
        db.session.add(fw)
        db.session.commit()

        flash(f'Firmware v{version} uploaded successfully.', 'success')
        return redirect(url_for('admin.firmware_list'))

    return render_template("admin_firmware_upload.html")


@admin_bp.route("/admin/firmware/<int:firmware_id>/activate", methods=['POST'])
@login_required
def firmware_activate(firmware_id):
    if not current_user.is_moderator():
        flash("You do not have permission.", "danger")
        return redirect(url_for('main.index'))

    Firmware.query.update({'is_active': False})
    fw = Firmware.query.get_or_404(firmware_id)
    fw.is_active = True
    db.session.commit()

    flash(f'Firmware v{fw.version} is now the active version.', 'success')
    return redirect(url_for('admin.firmware_list'))


@admin_bp.route("/admin/firmware/<int:firmware_id>/delete", methods=['POST'])
@login_required
def firmware_delete(firmware_id):
    if not current_user.is_moderator():
        flash("You do not have permission.", "danger")
        return redirect(url_for('main.index'))

    fw = Firmware.query.get_or_404(firmware_id)

    firmware_dir = current_app.config['FIRMWARE_UPLOAD_DIR']
    filepath = os.path.join(firmware_dir, fw.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.session.delete(fw)
    db.session.commit()

    flash(f'Firmware v{fw.version} deleted.', 'success')
    return redirect(url_for('admin.firmware_list'))


# --- Admin Device Overview ---

@admin_bp.route("/admin/devices")
@login_required
def admin_devices():
    if not current_user.is_moderator():
        flash("You do not have permission to view this page.", "danger")
        return redirect(url_for('main.index'))

    devices = Device.query.order_by(Device.last_seen_at.desc().nullslast()).all()
    return render_template("admin_devices.html", devices=devices)
