import re
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlsplit

BASE_URL = "https://wcria.cloud/sites/olaguia/"
OUT_DIR = Path(__file__).resolve().parent
ALLOWED_HOSTS = {"wcria.cloud", "fonts.googleapis.com", "fonts.gstatic.com", "s.w.org", "static.cloudflareinsights.com"}
ASSET_EXTENSIONS = {
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".otf",
    ".json",
}

HEADERS = {"User-Agent": "Mozilla/5.0"}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read()


def normalize_url(raw: str, base: str) -> str:
    raw = raw.strip()
    if not raw or raw.startswith(("#", "mailto:", "tel:", "javascript:")):
        return ""
    if raw.startswith("//"):
        raw = "https:" + raw
    return urljoin(base, raw)


def is_allowed(url: str) -> bool:
    parsed = urlsplit(url)
    return parsed.netloc.lower() in ALLOWED_HOSTS


def rel_path_for_asset(url: str) -> str:
    parsed = urlsplit(url)
    path = parsed.path

    if "/sites/olaguia/" in path:
        path = path.replace("/sites/olaguia/", "/", 1)

    if path.startswith("/"):
        path = path[1:]

    if not path:
        path = "index.html"

    if parsed.query:
        safe_q = re.sub(r"[^a-zA-Z0-9]+", "_", parsed.query).strip("_")
        if safe_q:
            p = Path(path)
            path = str(p.with_name(f"{p.stem}__q_{safe_q}{p.suffix}"))

    return path


def collect_asset_links_from_html(html: str, base_url: str) -> list[str]:
    links: list[str] = []
    for match in re.findall(r"(?:src|href)=[\"']([^\"']+)[\"']", html, flags=re.IGNORECASE):
        full = normalize_url(match, base_url)
        if full and is_allowed(full):
            links.append(full)
    return links


def collect_asset_links_from_css(css_text: str, base_url: str) -> list[str]:
    links: list[str] = []
    for match in re.findall(r"url\(([^)]+)\)", css_text, flags=re.IGNORECASE):
        candidate = match.strip().strip("\"'")
        full = normalize_url(candidate, base_url)
        if full and is_allowed(full):
            links.append(full)
    return links


def should_download(url: str) -> bool:
    parsed = urlsplit(url)
    ext = Path(parsed.path).suffix.lower()
    return ext in ASSET_EXTENSIONS


def main() -> None:
    html = fetch(BASE_URL).decode("utf-8", "ignore")

    queue = collect_asset_links_from_html(html, BASE_URL)
    seen: set[str] = set()
    downloaded: dict[str, str] = {}

    while queue:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)

        if not should_download(url):
            continue

        rel = rel_path_for_asset(url)
        file_path = OUT_DIR / rel
        file_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            data = fetch(url)
            file_path.write_bytes(data)
            downloaded[url] = rel

            if file_path.suffix.lower() == ".css":
                css_text = data.decode("utf-8", "ignore")
                for css_link in collect_asset_links_from_css(css_text, url):
                    if css_link not in seen:
                        queue.append(css_link)
        except Exception as exc:
            print(f"FAILED: {url} -> {exc}")

    # Reescreve links absolutos para os arquivos locais baixados.
    for source_url in sorted(downloaded, key=len, reverse=True):
        html = html.replace(source_url, downloaded[source_url])

    # Também trata URLs sem query, quando o HTML usar variante diferente.
    for source_url, local_path in downloaded.items():
        base_no_query = source_url.split("?", 1)[0]
        html = html.replace(base_no_query, local_path)

    (OUT_DIR / "index.html").write_text(html, encoding="utf-8")
    print(f"Downloaded and rewritten local page: {OUT_DIR / 'index.html'}")
    print(f"Assets downloaded: {len(downloaded)}")


if __name__ == "__main__":
    main()
