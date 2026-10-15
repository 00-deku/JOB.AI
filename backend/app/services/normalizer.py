import re
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

# Common tracking parameters to strip
TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "ref", "source", "gh_src", "fbclid", "gclid", "trk", "trkCampaign",
    "sc_channel", "sid", "src", "job_board", "from"
}

# Suffixes to clean from company names
COMPANY_SUFFIX_REGEX = re.compile(
    r"\b(inc\.?|llc\.?|ltd\.?|pvt\.?\s*ltd\.?|private\s+limited|corp\.?|corporation|technologies|solutions|services|group|co\.?)\b",
    re.IGNORECASE
)

# Common title cleanups
TITLE_CLEANUP_REGEX = re.compile(
    r"(\s*[-–|]\s*(remote|hybrid|full\s*time|part\s*time|immediate|urgent|hiring|fresher|internship|job|careers?|apply\s*now).*$)",
    re.IGNORECASE
)

def clean_url(url: str) -> str:
    """Removes tracking query parameters and standardizes the URL structure."""
    if not url:
        return ""
    try:
        parsed = urlparse(url.strip())
        query_pairs = parse_qsl(parsed.query, keep_blank_values=False)
        cleaned_query = [
            (k, v) for k, v in query_pairs
            if k.lower() not in TRACKING_PARAMS
        ]
        new_query = urlencode(cleaned_query)
        # Standardize scheme and netloc to lowercase
        cleaned_url = urlunparse((
            parsed.scheme.lower() or "https",
            parsed.netloc.lower(),
            parsed.path.rstrip("/") if parsed.path != "/" else "/",
            "",
            new_query,
            ""  # strip fragments
        ))
        return cleaned_url
    except Exception:
        return url.strip()

def normalize_company_name(name: str) -> str:
    """Normalizes company name for consistent matching and deduplication."""
    if not name:
        return "Unknown Company"
    cleaned = COMPANY_SUFFIX_REGEX.sub("", name)
    cleaned = re.sub(r"[^\w\s&]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned.title() if cleaned else name.strip()

def normalize_title(title: str) -> str:
    """Cleans up recruiter taglines and fluff from job titles."""
    if not title:
        return "Software Role"
    cleaned = TITLE_CLEANUP_REGEX.sub("", title)
    cleaned = re.sub(r"[\(\[\{].*?[\)\]\}]", "", cleaned)  # remove bracketed notes
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned.title() if cleaned else title.strip()

def normalize_location(loc: str, default: str = "Remote") -> str:
    """Normalizes common cities, handles Bengaluru/Bangalore aliases, and flags Remote."""
    if not loc:
        return default
    lower = loc.lower()
    if "remote" in lower or "anywhere" in lower or "work from home" in lower:
        return "Remote"
    if "bengaluru" in lower or "bangalore" in lower:
        return "Bengaluru, India"
    if "noida" in lower:
        return "Noida, India"
    if "gurugram" in lower or "gurgaon" in lower:
        return "Gurugram, India"
    if "delhi" in lower:
        return "Delhi NCR, India"
    if "hyderabad" in lower:
        return "Hyderabad, India"
    if "pune" in lower:
        return "Pune, India"
    if "mumbai" in lower:
        return "Mumbai, India"
    if "chennai" in lower:
        return "Chennai, India"
    # General cleanup
    cleaned = re.sub(r"\s+", " ", loc).strip()
    return cleaned
