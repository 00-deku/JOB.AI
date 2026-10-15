import re
from typing import List, Tuple, Set
from app.models import JobListing
from app.services.normalizer import clean_url

def generate_dedupe_signature(job: JobListing) -> Tuple[str, str]:
    """
    Generates a primary and secondary deduplication signature.
    Primary: Normalized Apply URL
    Secondary: (normalized company + title + location)
    """
    clean_apply = clean_url(job.apply_url)
    
    # Secondary fingerprint: simplified company + simplified title
    norm_c = re.sub(r"[^\w]", "", job.company.lower())
    norm_t = re.sub(r"[^\w]", "", job.title.lower())
    
    # Extract first 4 significant letters of location
    norm_l = re.sub(r"[^\w]", "", job.location.lower())[:6]
    
    composite_key = f"{norm_c}:{norm_t}:{norm_l}"
    return clean_apply, composite_key

def deduplicate_job_listings(jobs: List[JobListing]) -> List[JobListing]:
    """
    Deduplicates job listings while giving preference to:
    1. Official company career portals (is_official=True)
    2. More complete listings (has skills, has apply link distinct from source, has description)
    3. TinyFish Fetch over Search snippet
    """
    seen_urls: Set[str] = set()
    seen_composites: Set[str] = set()
    unique_jobs: List[JobListing] = []

    # Sort candidates so that official and detailed listings are processed first
    def priority_score(j: JobListing) -> int:
        score = 0
        if j.is_official:
            score += 50
        if j.extraction_source == "tinyfish_fetch":
            score += 30
        if j.extraction_source == "tinyfish_agent":
            score += 40
        if j.skills:
            score += len(j.skills) * 2
        if j.apply_url and j.apply_url != j.source_url:
            score += 10
        if j.date_posted:
            score += 5
        return score

    sorted_candidates = sorted(jobs, key=priority_score, reverse=True)

    for job in sorted_candidates:
        primary_key, composite_key = generate_dedupe_signature(job)
        
        # Check if already seen
        if primary_key and primary_key in seen_urls:
            continue
        if composite_key and composite_key in seen_composites:
            continue
            
        if primary_key:
            seen_urls.add(primary_key)
        if composite_key:
            seen_composites.add(composite_key)
            
        unique_jobs.append(job)

    return unique_jobs
