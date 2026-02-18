#!/bin/bash
cd /home/dezzip/multigauge

# Kill any existing gunicorn
pkill -f "gunicorn.*app:app" 2>/dev/null
sleep 1

# Start gunicorn
nohup /home/dezzip/multigauge/venv/bin/gunicorn \
    --bind 0.0.0.0:5001 \
    --workers 2 \
    --timeout 120 \
    app:app \
    > /home/dezzip/multigauge/gunicorn.log 2>&1 &

echo "Gunicorn started with PID $!"
sleep 2
cat /home/dezzip/multigauge/gunicorn.log
