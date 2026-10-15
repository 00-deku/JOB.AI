import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.config import settings
from app.models import JobListing, SavedJobResponse, SearchHistoryItem

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Table for saved jobs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        role_type TEXT,
        experience_level TEXT,
        skills TEXT,
        description TEXT,
        source_url TEXT,
        apply_url TEXT,
        date_posted TEXT,
        last_checked TEXT,
        match_score INTEGER,
        match_reasons TEXT,
        is_official BOOLEAN,
        extraction_source TEXT,
        saved_at TEXT NOT NULL
    )
    """)
    
    # Table for search history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        location TEXT NOT NULL,
        experience_level TEXT,
        keywords TEXT,
        results_count INTEGER,
        created_at TEXT NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()

def save_job(job: JobListing) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Avoid duplicate saves by apply_url or title+company
    cursor.execute("SELECT id FROM saved_jobs WHERE apply_url = ? OR (title = ? AND company = ?)", 
                   (job.apply_url, job.title, job.company))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return existing["id"]
        
    cursor.execute("""
        INSERT INTO saved_jobs (
            title, company, location, role_type, experience_level,
            skills, description, source_url, apply_url, date_posted,
            last_checked, match_score, match_reasons, is_official,
            extraction_source, saved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job.title,
        job.company,
        job.location,
        job.role_type,
        job.experience_level,
        json.dumps(job.skills),
        job.description,
        job.source_url,
        job.apply_url,
        job.date_posted,
        job.last_checked,
        job.match_score,
        json.dumps(job.match_reasons),
        1 if job.is_official else 0,
        job.extraction_source,
        datetime.utcnow().isoformat() + "Z"
    ))
    job_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return job_id

def get_saved_jobs() -> List[SavedJobResponse]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saved_jobs ORDER BY id DESC")
    rows = cursor.fetchall()
    
    result = []
    for r in rows:
        job = JobListing(
            id=str(r["id"]),
            title=r["title"],
            company=r["company"],
            location=r["location"],
            role_type=r["role_type"] or "Full-time",
            experience_level=r["experience_level"] or "Entry-level",
            skills=json.loads(r["skills"]) if r["skills"] else [],
            description=r["description"] or "",
            source_url=r["source_url"] or "",
            apply_url=r["apply_url"] or "",
            date_posted=r["date_posted"],
            last_checked=r["last_checked"] or "",
            match_score=r["match_score"] or 0,
            match_reasons=json.loads(r["match_reasons"]) if r["match_reasons"] else [],
            is_official=bool(r["is_official"]),
            extraction_source=r["extraction_source"] or "saved"
        )
        result.append(SavedJobResponse(
            id=r["id"],
            job=job,
            saved_at=r["saved_at"]
        ))
    conn.close()
    return result

def delete_saved_job(job_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_jobs WHERE id = ?", (job_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def record_search_history(role: str, location: str, experience_level: str, keywords: List[str], count: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO search_history (role, location, experience_level, keywords, results_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        role,
        location,
        experience_level,
        ", ".join(keywords),
        count,
        datetime.utcnow().isoformat() + "Z"
    ))
    conn.commit()
    conn.close()

def get_search_history(limit: int = 15) -> List[SearchHistoryItem]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM search_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    result = [
        SearchHistoryItem(
            id=r["id"],
            role=r["role"],
            location=r["location"],
            experience_level=r["experience_level"] or "",
            keywords=r["keywords"] or "",
            results_count=r["results_count"] or 0,
            created_at=r["created_at"]
        ) for r in rows
    ]
    conn.close()
    return result
