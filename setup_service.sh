#!/bin/bash
# Kill existing gunicorn processes
pkill -f "gunicorn.*app:app" 2>/dev/null
sleep 1

# Install systemd service
sudo cp /tmp/multigauge.service /etc/systemd/system/multigauge.service
sudo systemctl daemon-reload
sudo systemctl enable multigauge
sudo systemctl start multigauge
sleep 2
sudo systemctl status multigauge --no-pager
echo "---"
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:5001/
