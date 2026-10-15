import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.models import JobListing, SearchRequest
from app.services.normalizer import clean_url, normalize_company_name, normalize_title, normalize_location
from app.services.deduplicator import deduplicate_job_listings
from app.services.matcher import calculate_match, rank_jobs
from app.services.extractor import extract_skills_from_text, is_official_career_page
from app.database import init_db, save_job, get_saved_jobs, delete_saved_job

def test_normalization():
    print("Testing normalization...")
    assert normalize_company_name("Google India Pvt. Ltd.") == "Google India"
    assert normalize_company_name("Acme Technologies Inc.") == "Acme"
    
    # Title cleanup
    assert normalize_title("Software Engineer Intern - Apply Now (Immediate)") == "Software Engineer Intern"
    
    # Location normalization
    assert normalize_location("Bangalore, Karnataka") == "Bengaluru, India"
    assert normalize_location("Noida, Uttar Pradesh") == "Noida, India"
    assert normalize_location("Work from home / Remote") == "Remote"
    
    # URL tracking param cleanup
    raw_url = "https://boards.greenhouse.io/company/jobs/12345?gh_src=linkedin&utm_source=aggregator&utm_campaign=hiring"
    cleaned = clean_url(raw_url)
    assert "utm_source" not in cleaned
    assert "gh_src" not in cleaned
    assert cleaned == "https://boards.greenhouse.io/company/jobs/12345"
    print("[OK] Normalization tests passed!")

def test_extractor_helpers():
    print("Testing extractor helpers...")
    assert is_official_career_page("https://boards.greenhouse.io/uber/jobs/123") is True
    assert is_official_career_page("https://jobs.lever.co/stripe/abc") is True
    assert is_official_career_page("https://www.indeed.com/viewjob?jk=123") is False
    
    text = "We are seeking a Python and FastAPI engineer with strong Git and SQL knowledge."
    skills = extract_skills_from_text(text)
    assert "Python" in skills
    assert "FastAPI" in skills
    assert "Git" in skills
    assert "SQL" in skills
    print("[OK] Extractor tests passed!")

def test_deduplication():
    print("Testing deduplication...")
    j1 = JobListing(
        title="Software Engineer Intern",
        company="Razorpay",
        location="Bengaluru, India",
        role_type="Internship",
        experience_level="Internship",
        skills=["Python"],
        description="Internship on payment gateway team.",
        source_url="https://boards.greenhouse.io/razorpay/jobs/101",
        apply_url="https://boards.greenhouse.io/razorpay/jobs/101/apply",
        date_posted="2026-10-10",
        last_checked="2026-10-15T10:00:00Z",
        match_score=90,
        is_official=True,
        extraction_source="tinyfish_fetch"
    )
    # Duplicate from aggregator with tracking params
    j2 = JobListing(
        title="Software Engineer Intern - Hiring",
        company="Razorpay Pvt Ltd",
        location="Bengaluru",
        role_type="Internship",
        experience_level="Internship",
        skills=["Python"],
        description="Internship on payment gateway team.",
        source_url="https://jobboard.com/razorpay-intern?utm_source=feed",
        apply_url="https://boards.greenhouse.io/razorpay/jobs/101/apply?ref=board",
        date_posted=None,
        last_checked="2026-10-15T10:00:00Z",
        match_score=80,
        is_official=False,
        extraction_source="tinyfish_search"
    )
    deduped = deduplicate_job_listings([j2, j1])
    assert len(deduped) == 1
    # Verify official source is prioritized
    assert deduped[0].is_official is True
    print("[OK] Deduplication tests passed!")

def test_matching_scenarios():
    print("Testing matching and ranking on 3 hackathon test scenarios...")
    
    # Scenario 1: Python internships in Bengaluru
    req1 = SearchRequest(
        role="Python Intern",
        location="Bengaluru",
        experience_level="Internship",
        keywords=["Python", "FastAPI"]
    )
    job_bengaluru = JobListing(
        title="Python Developer Intern",
        company="Zomato",
        location="Bengaluru, India",
        role_type="Internship",
        experience_level="Internship",
        skills=["Python", "FastAPI", "PostgreSQL"],
        description="Looking for Python intern in Bengaluru.",
        source_url="https://careers.zomato.com/python-intern",
        apply_url="https://careers.zomato.com/apply",
        date_posted="2026-10-12",
        last_checked="2026-10-15T12:00:00Z",
        match_score=0,
        is_official=True
    )
    score1, reasons1 = calculate_match(job_bengaluru, req1)
    assert score1 >= 80, f"Expected high score, got {score1}"
    assert any("Python" in r for r in reasons1)
    assert any("Bengaluru" in r for r in reasons1)
    print(f"[OK] Scenario 1 (Python in Bengaluru) Match Score: {score1}%, Reasons: {reasons1}")

    # Scenario 2: Frontend developer fresher jobs in Noida
    req2 = SearchRequest(
        role="Frontend Developer",
        location="Noida",
        experience_level="Fresher",
        keywords=["React", "Tailwind CSS"]
    )
    job_noida = JobListing(
        title="Frontend Developer",
        company="Paytm",
        location="Noida, India",
        role_type="Full-time",
        experience_level="Fresher",
        skills=["React", "Tailwind CSS", "JavaScript"],
        description="Fresh graduate frontend engineer wanted for consumer app.",
        source_url="https://careers.paytm.com/frontend",
        apply_url="https://careers.paytm.com/apply",
        date_posted="2026-10-14",
        last_checked="2026-10-15T12:00:00Z",
        match_score=0,
        is_official=True
    )
    score2, reasons2 = calculate_match(job_noida, req2)
    assert score2 >= 80, f"Expected high score, got {score2}"
    assert any("Noida" in r for r in reasons2)
    print(f"[OK] Scenario 2 (Frontend Fresher in Noida) Match Score: {score2}%, Reasons: {reasons2}")

    # Scenario 3: Remote AI/ML internships in India
    req3 = SearchRequest(
        role="Machine Learning Intern",
        location="Remote",
        experience_level="Internship",
        keywords=["AI", "PyTorch", "Python"]
    )
    job_remote = JobListing(
        title="Machine Learning Intern",
        company="Sarvam AI",
        location="Remote",
        role_type="Internship",
        experience_level="Internship",
        skills=["Python", "PyTorch", "AI", "NLP"],
        description="Research internship on foundational models.",
        source_url="https://sarvam.ai/careers/ml-intern",
        apply_url="https://sarvam.ai/apply",
        date_posted="2026-10-13",
        last_checked="2026-10-15T12:00:00Z",
        match_score=0,
        is_official=True
    )
    score3, reasons3 = calculate_match(job_remote, req3)
    assert score3 >= 85, f"Expected high score, got {score3}"
    assert any("Remote" in r or "remote" in r.lower() for r in reasons3)
    print(f"[OK] Scenario 3 (Remote AI/ML Intern) Match Score: {score3}%, Reasons: {reasons3}")

def test_sqlite_operations():
    print("Testing SQLite saved jobs and history...")
    init_db()
    test_job = JobListing(
        title="Test Backend Intern",
        company="Galgotias Tech Lab",
        location="Greater Noida, India",
        role_type="Internship",
        experience_level="Internship",
        skills=["Python", "SQL"],
        description="Backend lab intern opening.",
        source_url="https://galgotias.edu/careers/test",
        apply_url="https://galgotias.edu/careers/test/apply",
        date_posted=None,
        last_checked="2026-10-15T12:00:00Z",
        match_score=85,
        match_reasons=["Role matches"],
        is_official=True,
        extraction_source="tinyfish_fetch"
    )
    saved_id = save_job(test_job)
    assert saved_id > 0
    saved_list = get_saved_jobs()
    assert any(j.job.title == "Test Backend Intern" for j in saved_list)
    
    # Clean up
    deleted = delete_saved_job(saved_id)
    assert deleted is True
    print("[OK] SQLite database operations passed!")

if __name__ == "__main__":
    test_normalization()
    test_extractor_helpers()
    test_deduplication()
    test_matching_scenarios()
    test_sqlite_operations()
    print("\nALL TESTS PASSED SUCCESSFULLY!")
