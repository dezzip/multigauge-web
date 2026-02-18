from datetime import datetime
from models import db


class Firmware(db.Model):
    __tablename__ = 'firmwares'

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    version     = db.Column(db.String(20), unique=True, nullable=False)
    filename    = db.Column(db.String(255), nullable=False)
    file_size   = db.Column(db.Integer, nullable=False)
    checksum    = db.Column(db.String(64), nullable=True)
    notes       = db.Column(db.Text, nullable=True)
    is_active   = db.Column(db.Boolean, default=False, nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', backref=db.backref('uploaded_firmwares', lazy=True))
