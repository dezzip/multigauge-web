# Multigauge Website

## Overview
Flask web application for the Multigauge digital gauge cluster product. Manages e-commerce, user accounts, gauge face workshop/editor, ESP32 device management, firmware OTA updates, and device configuration.

## Tech Stack
- **Backend**: Flask (Python), SQLAlchemy (SQLite), Flask-Login, Flask-Bcrypt
- **Payments**: Stripe
- **Frontend**: Jinja2 templates, vanilla CSS (utility-first in `common.css`), vanilla JS
- **Database**: SQLite (`instance/site.db`)
- **ESP32 API**: REST API at `/api/v1/` with Bearer token auth for device communication

## Project Structure
```
app.py                  # Entry point, blueprint registration, seed data
models/                 # SQLAlchemy models
  __init__.py           # db, bcrypt exports + model imports
  user.py, post.py, product.py, cart.py, order.py, subscriber.py
  device.py             # Device + DeviceToken models
  firmware.py           # Firmware model (OTA)
routes/                 # Flask blueprints
  __init__.py           # Blueprint imports
  admin.py              # Admin dashboard, firmware CRUD, device overview
  api.py                # ESP32 REST API (heartbeat, gauge, firmware, status)
  auth.py, cart.py, main.py, payment.py, products.py, users.py, workshop.py
  devices.py            # User device management (register, assign gauge, tokens)
templates/              # Jinja2 HTML templates
static/
  css/
    variables.css       # CSS custom properties (colors, spacing, radii)
    style.css           # Global styles, page layout
    common.css          # Utility classes (flex, grid, spacing, alignment)
    navbar.css, footer.css, product.css, cart.css, ...
    editor/             # Gauge editor CSS
  images/               # Icons, backgrounds
uploads/firmware/       # OTA firmware .bin files
```

## Key Conventions
- **Dark theme**: background `#242427`, text `#fffaf2`, accent `#ed1c24`
- **CSS utilities**: `flex-row`, `flex-col`, `gap-common`, `p-common`, `items-center`, `justify-between`, `margined`
- **Template pattern**: Each page includes `navbar.html` + `footer.html`, uses `page > page-header > page-header-content.margined` + `page-content.margined`
- **Buttons**: class `upload-button` with accent background
- **Flash messages**: `get_flashed_messages(with_categories=true)` with green/red backgrounds
- **Card pattern**: `div.p-common` with `background-color: var(--darker-background-color)` and `border-radius: var(--common-border-radius)`

## ESP32 Device System
- Devices registered by users with hardware_id (MAC address)
- DeviceToken for API auth (Bearer token)
- API endpoints: `/api/v1/heartbeat`, `/api/v1/gauge`, `/api/v1/firmware/check`, `/api/v1/firmware/download`, `/api/v1/status`
- ESP32 runs a local webserver at `192.168.4.1` with full config UI (WiFi AP mode)
- Config stored in NVS on ESP32 via `dash_config_t` struct

## ESP32 Configuration (from projet-gage-fresh)
The ESP32 gauge cluster has configurable parameters in `dash_config_t`:
- **General**: language (FR/EN/ES), brightness, welcome word
- **Speed screen**: unit (km/h, mph, knots), colors (number, unit, grid, car, shadow)
- **Inclinometer**: angle color, unit color, warning threshold, danger color, tilt speed
- **Data screen**: circle colors (main, dim, inner), bar color, center color
- **Volt gauge**: gauge color, warning color, low/high thresholds, simulation toggle/value
- **RPM gauge**: simulation toggle/value
- **Sensors**: IMU smoothing (filter tau), speed simulation (enabled, max, accel, decel)
- **WiFi AP**: SSID, password, channel

## Running
```bash
pip install -r requirements.txt
python app.py  # Runs on http://0.0.0.0:5001
```

## Admin Credentials (dev)
- Username: `bluesq` / Password: `@dm1nP@ssw0rd!-Mult1G@ug3-`
