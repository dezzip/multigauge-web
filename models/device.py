from datetime import datetime
from models import db


class Device(db.Model):
    __tablename__ = 'devices'

    id               = db.Column(db.Integer, primary_key=True, autoincrement=True)
    hardware_id      = db.Column(db.String(50), unique=True, nullable=False)
    name             = db.Column(db.String(100), nullable=True)
    user_id          = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=True)
    firmware_version = db.Column(db.String(20), nullable=True)
    last_seen_at     = db.Column(db.DateTime, nullable=True)
    registered_at    = db.Column(db.DateTime, default=datetime.utcnow)
    config_json      = db.Column(db.Text, nullable=True)
    tag              = db.Column(db.String(30), nullable=True, default=None)
    latitude         = db.Column(db.Float, nullable=True)
    longitude        = db.Column(db.Float, nullable=True)
    module_type      = db.Column(db.String(30), nullable=True, default='ESP32-S3')
    country          = db.Column(db.String(5), nullable=True, default='FR')

    user          = db.relationship('User', backref=db.backref('devices', lazy=True))
    assigned_post = db.relationship('Post', backref=db.backref('assigned_devices', lazy=True))

    def is_online(self, threshold_minutes=10):
        if not self.last_seen_at:
            return False
        diff = (datetime.utcnow() - self.last_seen_at).total_seconds()
        return diff < (threshold_minutes * 60)


class DeviceToken(db.Model):
    __tablename__ = 'device_tokens'

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    token      = db.Column(db.String(64), unique=True, nullable=False, index=True)
    device_id  = db.Column(db.Integer, db.ForeignKey('devices.id'), nullable=False)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active  = db.Column(db.Boolean, default=True, nullable=False)

    device = db.relationship('Device', backref=db.backref('tokens', lazy=True))
    user   = db.relationship('User', backref=db.backref('device_tokens', lazy=True))
