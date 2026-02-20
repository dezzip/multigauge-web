#!/usr/bin/env python3
import sqlite3, datetime, hashlib, os

conn = sqlite3.connect('instance/site.db')
c = conn.cursor()

# Add country column to devices
cols = [r[1] for r in c.execute('PRAGMA table_info(devices)').fetchall()]
if 'country' not in cols:
    c.execute("ALTER TABLE devices ADD COLUMN country VARCHAR(5) DEFAULT 'FR'")
    print('Added: devices.country')
else:
    print('devices.country already exists')

# Add new columns to users
ucols = [r[1] for r in c.execute('PRAGMA table_info(users)').fetchall()]
new_cols = [
    ('language', 'VARCHAR(10)', "'fr'"),
    ('region', 'VARCHAR(5)', "'FR'"),
    ('theme', 'VARCHAR(20)', "'light'"),
    ('units', 'VARCHAR(10)', "'metric'"),
    ('notifications_enabled', 'BOOLEAN', '1'),
]
for col, dtype, default in new_cols:
    if col not in ucols:
        c.execute(f'ALTER TABLE users ADD COLUMN {col} {dtype} DEFAULT {default}')
        print(f'Added: users.{col}')
    else:
        print(f'users.{col} already exists')

conn.commit()

# Seed 2 fake firmwares
existing = [r[0] for r in c.execute('SELECT version FROM firmwares').fetchall()]
print('Existing firmwares:', existing)

fwdir = 'uploads/firmware'
os.makedirs(fwdir, exist_ok=True)

firmwares = [
    ('2.0.0', 'Initial stable release. OBD-II support, WiFi config, basic gauges.', False),
    ('3.0.0', 'Major update: CAN bus improvements, new gauge engine, OTA support.', True),
]

for ver, notes, active in firmwares:
    if ver not in existing:
        fname = f'firmware_v{ver}.bin'
        fpath = os.path.join(fwdir, fname)
        fake_data = os.urandom(65536)
        with open(fpath, 'wb') as f:
            f.write(fake_data)
        checksum = hashlib.sha256(fake_data).hexdigest()
        fsize = len(fake_data)
        c.execute(
            'INSERT INTO firmwares (version, filename, file_size, checksum, notes, is_active, uploaded_by, uploaded_at) VALUES (?,?,?,?,?,?,?,?)',
            (ver, fname, fsize, checksum, notes, active, 2, datetime.datetime.now().isoformat())
        )
        print(f'Seeded firmware v{ver}')
    else:
        print(f'Firmware v{ver} already exists')

conn.commit()
conn.close()
print('All done!')
