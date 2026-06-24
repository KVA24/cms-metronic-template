#!/bin/sh -eu
./generate_config_js.sh >/usr/share/nginx/html/assets/js/init.js
nginx -g "daemon off;"
