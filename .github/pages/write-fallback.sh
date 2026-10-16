#!/bin/sh
# Writes the site-wide 404.html that GitHub Pages serves for every unknown path. It sends the path to the app
# that owns it (the site root, or a branch preview under preview/<branch>/) as ?redirect=, and the app
# restores it (see src/main.tsx). Usage: write-fallback.sh <site dir> <repo name>
set -eu
site="$1"
repo="$2"
cat > "$site/404.html" <<HTML
<!doctype html>
<html lang="en">
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>From Sand to Stars</title>
<body style="background:#120f16;color:#f4efe6;font-family:system-ui,sans-serif;padding:24px">
<script>
  (function () {
    var repo = '/$repo/';
    var path = location.pathname;
    var preview = path.match(new RegExp('^' + repo + 'preview/[^/]+/'));
    var root = preview ? preview[0] : repo;
    var rest = path.slice(root.length) + location.search + location.hash;
    // Nothing to hand over (or we already tried): the app itself is missing, so stop here.
    if (!rest || location.search.indexOf('redirect=') !== -1) {
      document.body.innerHTML = 'Not found. <a style="color:inherit" href="' + repo + '">Go to the start</a>';
      return;
    }
    location.replace(root + '?redirect=' + encodeURIComponent(rest));
  })();
</script>
</body>
</html>
HTML
touch "$site/.nojekyll"
