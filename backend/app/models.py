from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class SearchRequest(BaseModel):
    role: str = Field(..., description="Job role or title, e.g. 'Software Engineer', 'Frontend Developer'")
    location: str = Field(default="Remote", description="Location or Remote, e.g. 'Bengaluru', 'Noida', 'Remote'")
    experience_level: str = Field(default="Internship", description="Experience level: 'Internship', 'Fresher', 'Entry-level'")
    keywords: List[str] = Field(default_factory=list, description="List of technical skills/keywords")
    company: Optional[str] = Field(default=None, description="Optional target company name")
    job_type: Optional[str] = Field(default=None, description="Optional job type: 'Full-time', 'Internship', 'Contract'")
    use_agent_fallback: bool = Field(default=False, description="Enable TinyFish Agent API for complex interactive SPAs")

class JobListing(BaseModel):
    id: Optional[str] = None
    title: str
    company: str
    location: str
    role_type: str
    experience_level: str
    skills: List[str] = Field(default_factory=list)
    description: str
    source_url: str
    apply_url: str
    date_posted: Optional[str] = None
    last_checked: str
    match_score: int = Field(..., ge=0, le=100)
    match_reasons: List[str] = Field(default_factory=list)
    is_official: bool = False
    extraction_source: str = "tinyfish_search"  # tinyfish_search, tinyfish_fetch, tinyfish_agent

class TelemetryStep(BaseModel):
    step_number: int
    step_name: str
    tool: str  # TinyFish Search, TinyFish Fetch, TinyFish Agent, JobScout Normalizer, JobScout Matcher
    details: str
    status: str = "success"  # success, warning, error, info
    duration_ms: int = 0
    timestamp: str

class SearchResponse(BaseModel):
    query_id: str
    query: Dict[str, Any]
    results: List[JobListing]
    total_found: int
    total_fetched: int
    tinyfish_tools_used: List[str]
    logs: List[TelemetryStep]
    search_time_seconds: float
    error: Optional[str] = None

class SavedJobRequest(BaseModel):
    job: JobListing

class SavedJobResponse(BaseModel):
    id: int
    job: JobListing
    saved_at: str

class SearchHistoryItem(BaseModel):
    id: int
    role: str
    location: str
    experience_level: str
    keywords: str
    results_count: int
    created_at: str

class KeyUpdateRequest(BaseModel):
    api_key: str

class SystemStatusResponse(BaseModel):
    status: str
    api_key_configured: bool
    api_key_masked: str
    tinyfish_sdk_version: str
    database_connected: bool
    message: str
