import re
from typing import List, Tuple
from datetime import datetime
from app.models import JobListing, SearchRequest

def calculate_match(job: JobListing, query: SearchRequest) -> Tuple[int, List[str]]:
    """
    Computes deterministic, transparent match score (0-100) and human-readable reasons.
    - Role Match: max 35 pts
    - Location Match: max 25 pts
    - Seniority Match: max 20 pts
    - Keyword Match: max 15 pts
    - Recency Bonus: max 5 pts
    """
    score = 0
    reasons: List[str] = []

    # 1. Role Match (35 pts max)
    target_role = query.role.lower().strip()
    job_title = job.title.lower()
    job_desc = job.description.lower()
    
    # Check exact role tokens
    role_tokens = [t for t in re.split(r"\s+", target_role) if len(t) > 2]
    matched_role_tokens = [t for t in role_tokens if t in job_title]

    if target_role in job_title or (len(role_tokens) > 0 and len(matched_role_tokens) == len(role_tokens)):
        score += 35
        reasons.append(f"Direct role title match for '{query.role}'")
    elif len(matched_role_tokens) > 0:
        token_ratio = len(matched_role_tokens) / max(len(role_tokens), 1)
        pts = int(25 * token_ratio)
        score += pts
        reasons.append(f"Partial role match ({', '.join(matched_role_tokens)})")
    elif any(t in job_desc for t in role_tokens):
        score += 15
        reasons.append("Role keywords found in job description")

    # 2. Location Match (25 pts max)
    query_loc = query.location.lower().strip()
    job_loc = job.location.lower()
    
    if "remote" in query_loc:
        if "remote" in job_loc or "remote" in job_desc or "work from home" in job_desc:
            score += 25
            reasons.append("Matches remote work preference")
        else:
            # penalize slightly if user specifically asked for remote but job is strictly onsite
            score += 5
    elif query_loc in job_loc:
        score += 25
        reasons.append(f"Located in '{job.location}'")
    elif any(part.strip() in job_loc for part in query_loc.split(",") if len(part.strip()) > 2):
        score += 20
        reasons.append(f"Regional location match in '{job.location}'")
    elif "remote" in job_loc:
        score += 18
        reasons.append("Remote flexibility available")
    else:
        # fallback minimal
        score += 5

    # 3. Seniority / Experience Level Match (20 pts max)
    requested_exp = query.experience_level.lower().strip()
    job_exp = job.experience_level.lower()
    job_role_type = job.role_type.lower()
    
    if requested_exp == "internship":
        if "intern" in job_title or "intern" in job_exp or "intern" in job_role_type:
            score += 20
            reasons.append("Verified internship opening")
        elif "trainee" in job_title or "fresher" in job_exp:
            score += 15
            reasons.append("Early-career / trainee suitability")
        else:
            score += 5
    elif requested_exp == "fresher":
        if "fresher" in job_exp or "graduate" in job_title or "entry" in job_exp:
            score += 20
            reasons.append("Suitable for fresh graduates (0 years exp)")
        elif "intern" in job_exp:
            score += 12
            reasons.append("Internship suitable for freshers")
        else:
            score += 8
    elif requested_exp == "entry-level":
        if "entry" in job_exp or "junior" in job_title or "associate" in job_title:
            score += 20
            reasons.append("Entry-level / Junior position")
        else:
            score += 10
    else:
        # Any
        score += 15

    # 4. Keyword / Skill Match (15 pts max)
    matched_skills = []
    if query.keywords:
        user_keywords_lower = [k.lower().strip() for k in query.keywords if k.strip()]
        job_skills_lower = [s.lower() for s in job.skills]
        
        for k in user_keywords_lower:
            # Check in skills list or text
            if k in job_skills_lower or k in job_title or k in job_desc:
                matched_skills.append(k.title())

        if user_keywords_lower:
            ratio = len(matched_skills) / len(user_keywords_lower)
            score += int(15 * ratio)
            if matched_skills:
                reasons.append(f"Matched skills: {', '.join(matched_skills)}")
    else:
        score += 10  # default baseline when no explicit skills specified

    # 5. Recency Bonus (5 pts max)
    if job.date_posted:
        # Only give recency points if verified date is present
        score += 5
        reasons.append(f"Verified posting date: {job.date_posted}")
    else:
        # Do not fabricate or award bonus for unverified dates
        pass

    # Cap score between 0 and 100
    final_score = max(0, min(100, score))
    return final_score, reasons

def rank_jobs(jobs: List[JobListing], query: SearchRequest) -> List[JobListing]:
    """Scores all listings and sorts them in descending match order."""
    ranked = []
    for job in jobs:
        score, reasons = calculate_match(job, query)
        job.match_score = score
        job.match_reasons = reasons
        ranked.append(job)

    # Sort primarily by match_score descending, secondarily by official page
    ranked.sort(key=lambda j: (j.match_score, 1 if j.is_official else 0), reverse=True)
    return ranked
