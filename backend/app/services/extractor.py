import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from app.models import JobListing
from app.services.normalizer import (
    clean_url,
    normalize_company_name,
    normalize_title,
    normalize_location,
)

COMMON_TECH_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Vue", "Angular",
    "C++", "C#", "Java", "Go", "Rust", "SQL", "PostgreSQL", "MongoDB", "Redis",
    "FastAPI", "Django", "Flask", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Git", "GitHub", "Linux", "REST API", "GraphQL", "Machine Learning", "AI",
    "PyTorch", "TensorFlow", "Scikit-Learn", "NLP", "Pandas", "NumPy", "Tailwind CSS",
    "HTML/CSS", "HTML", "CSS"
]

OFFICIAL_ATS_DOMAINS = {
    "greenhouse.io", "boards.greenhouse.io", "lever.co", "jobs.lever.co",
    "workday.com", "myworkdayjobs.com", "ashbyhq.com", "smartrecruiters.com",
    "breezy.hr", "workable.com", "rippling.com", "recruitee.com"
}

AGGREGATOR_DOMAINS = {
    "indeed.com", "naukri.com", "linkedin.com", "glassdoor.com",
    "monster.com", "internshala.com", "shine.com", "foundit.in"
}

def is_official_career_page(url: str) -> bool:
    """Identifies if a URL belongs to an official company ATS or company domain."""
    if not url:
        return False
    domain = urlparse(url).netloc.lower()
    for ats in OFFICIAL_ATS_DOMAINS:
        if ats in domain:
            return True
    for agg in AGGREGATOR_DOMAINS:
        if agg in domain:
            return False
    # If it has /careers or /jobs and isn't a known aggregator, treat as company portal
    path = urlparse(url).path.lower()
    if any(k in path for k in ["career", "careers", "jobs", "job-opening", "positions"]):
        return True
    return False

def extract_skills_from_text(text: str) -> List[str]:
    """Scans text for verified technology keywords."""
    if not text:
        return []
    found = []
    text_lower = f" {text.lower()} "
    for skill in COMMON_TECH_SKILLS:
        skill_clean = skill.lower()
        # Word boundary match
        pattern = r"(?:\b|\s)" + re.escape(skill_clean) + r"(?:\b|[,\.\s;])"
        if re.search(pattern, text_lower):
            found.append(skill)
    return found[:12]

def infer_experience_level(title: str, text: str) -> str:
    """Infers experience level: Internship, Fresher, Entry-level."""
    combined = f"{title} {text[:500]}".lower()
    if "intern" in combined or "trainee" in combined or "co-op" in combined:
        return "Internship"
    if "fresher" in combined or "graduate" in combined or "2024 batch" in combined or "2025 batch" in combined or "2026 batch" in combined:
        return "Fresher"
    if "junior" in combined or "entry" in combined or "associate" in combined or "0-1" in combined or "0 to 1" in combined:
        return "Entry-level"
    return "Entry-level"

def extract_apply_url(source_url: str, links: List[Any], text: str) -> str:
    """Discovers direct application URLs from page links or fallback to clean source."""
    if links:
        for l in links:
            url_str = ""
            if isinstance(l, str):
                url_str = l
            elif isinstance(l, dict):
                url_str = l.get("href") or l.get("url") or ""
            
            url_str_lower = url_str.lower()
            if any(term in url_str_lower for term in ["/apply", "application", "submit_application", "apply_now", "mode=apply"]):
                return clean_url(url_str)
                
    # Search text for direct markdown links like [Apply Here](url)
    apply_markdown = re.search(r"\[(?:Apply|Apply Now|Submit Application)\]\((https?://[^\s\)]+)\)", text, re.IGNORECASE)
    if apply_markdown:
        return clean_url(apply_markdown.group(1))

    return clean_url(source_url)

def extract_from_fetch_result(page: Dict[str, Any], query_role: str, query_loc: str) -> Optional[JobListing]:
    """Converts a TinyFish Fetch result into a validated JobListing."""
    url = page.get("url", "")
    title_raw = page.get("title", "")
    text = page.get("text", "")
    description_meta = page.get("description", "")
    published_date = page.get("published_date")
    links = page.get("links", [])

    if not title_raw and not text:
        return None

    # Discard non-job pages (e.g. general 404s, login walls, search listings aggregations)
    title_lower = title_raw.lower()
    if any(stop in title_lower for stop in ["page not found", "404", "sign in", "login required", "access denied", "blocked"]):
        return None

    # Parse company name from title or domain
    company_name = "Company"
    if " at " in title_raw:
        parts = title_raw.split(" at ")
        job_title = parts[0]
        company_name = parts[1].split("-")[0].split("|")[0]
    elif " - " in title_raw:
        parts = title_raw.split(" - ")
        job_title = parts[0]
        company_name = parts[1].split("|")[0]
    elif " | " in title_raw:
        parts = title_raw.split(" | ")
        job_title = parts[0]
        company_name = parts[1]
    else:
        job_title = title_raw
        domain = urlparse(url).netloc.split(".")
        if len(domain) >= 2:
            company_name = domain[-2].capitalize()

    # Extract summary description
    summary = ""
    if description_meta and len(description_meta) > 40:
        summary = description_meta
    elif text:
        lines = [line.strip() for line in text.splitlines() if len(line.strip()) > 30 and not line.strip().startswith("#")]
        summary = " ".join(lines[:3]) if lines else text[:250]
    summary = summary[:450].strip()

    skills = extract_skills_from_text(f"{job_title} {summary} {text[:1500]}")
    exp_level = infer_experience_level(job_title, f"{summary} {text[:800]}")
    apply_url = extract_apply_url(url, links, text)
    is_official = is_official_career_page(url)

    # Cleaned attributes
    clean_title = normalize_title(job_title)
    clean_company = normalize_company_name(company_name)
    clean_loc = normalize_location(query_loc if query_loc else "Remote")

    role_type = "Internship" if "intern" in clean_title.lower() or exp_level == "Internship" else "Full-time"

    return JobListing(
        title=clean_title,
        company=clean_company,
        location=clean_loc,
        role_type=role_type,
        experience_level=exp_level,
        skills=skills,
        description=summary or f"Role opportunity for {clean_title} at {clean_company}.",
        source_url=clean_url(url),
        apply_url=apply_url,
        date_posted=published_date if published_date else None,
        last_checked=datetime.utcnow().isoformat() + "Z",
        match_score=0,  # calculated later in matcher
        match_reasons=[],
        is_official=is_official,
        extraction_source="tinyfish_fetch"
    )

def extract_from_search_result(item: Dict[str, Any], query_role: str, query_loc: str) -> Optional[JobListing]:
    """Extracts a structured job record directly from TinyFish Search API snippet & metadata."""
    title_raw = item.get("title", "")
    url = item.get("url", "")
    snippet = item.get("snippet", "")
    site_name = item.get("site_name", "")
    date_val = item.get("date")

    if not title_raw or not url:
        return None

    # Parse company from site_name or title
    company_name = site_name or "Hiring Organization"
    job_title = title_raw
    if " at " in title_raw:
        parts = title_raw.split(" at ")
        job_title = parts[0]
        company_name = parts[1].split("-")[0].split("|")[0]
    elif " - " in title_raw:
        parts = title_raw.split(" - ")
        job_title = parts[0]
        company_name = parts[1].split("|")[0]

    skills = extract_skills_from_text(f"{job_title} {snippet}")
    exp_level = infer_experience_level(job_title, snippet)
    clean_title = normalize_title(job_title)
    clean_company = normalize_company_name(company_name)
    clean_loc = normalize_location(query_loc if query_loc else "Remote")
    role_type = "Internship" if "intern" in clean_title.lower() or exp_level == "Internship" else "Full-time"
    is_official = is_official_career_page(url)

    return JobListing(
        title=clean_title,
        company=clean_company,
        location=clean_loc,
        role_type=role_type,
        experience_level=exp_level,
        skills=skills,
        description=snippet or f"Active position for {clean_title} at {clean_company}.",
        source_url=clean_url(url),
        apply_url=clean_url(url),
        date_posted=date_val if date_val else None,
        last_checked=datetime.utcnow().isoformat() + "Z",
        match_score=0,
        match_reasons=[],
        is_official=is_official,
        extraction_source="tinyfish_search"
    )
