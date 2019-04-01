curl -s -L "https://atom.io/download/deb?channel=stable" \
  -H 'Accept: application/octet-stream' \
  -o "atom-amd64.deb"
# /sbin/start-stop-daemon --start --quiet --pidfile /tmp/custom_xvfb_99.pid --make-pidfile --background --exec /usr/bin/Xvfb -- :99 -ac -screen 0 1280x1024x16
dpkg-deb -x atom-amd64.deb "${HOME}/atom"
export APM_SCRIPT_PATH="${HOME}/atom/usr/bin/"
export PATH="${APM_SCRIPT_PATH}:${PATH}"
