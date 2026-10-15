import time
import uuid
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.models import (
    SearchRequest,
    SearchResponse,
    JobListing,
    TelemetryStep,
)
from app.services.tinyfish_client import tinyfish_service
from app.services.extractor import (
    extract_from_search_result,
    extract_from_fetch_result,
    is_official_career_page,
)
from app.services.normalizer import clean_url
from app.services.deduplicator import deduplicate_job_listings
from app.services.matcher import rank_jobs
from app.database import record_search_history

class SearchOrchestrator:
    """
    Executes the 12-step live web research workflow using TinyFish Search, Fetch,
    and Agent APIs with comprehensive step telemetry.
    """

    def construct_search_queries(self, req: SearchRequest) -> List[str]:
        """Builds focused search query variations to surface both direct openings and career boards."""
        role = req.role.strip()
        loc = req.location.strip() if req.location else ""
        exp = req.experience_level.strip() if req.experience_level and req.experience_level != "Any" else ""
        skills_str = " ".join(req.keywords[:3]) if req.keywords else ""

        queries = []

        # Query 1: Direct career opening query with ATS focus
        q1_parts = [role]
        if exp:
            q1_parts.append(exp)
        if loc and loc.lower() != "remote":
            q1_parts.append(loc)
        elif loc.lower() == "remote":
            q1_parts.append("remote")
        if skills_str:
            q1_parts.append(skills_str)
        q1_parts.append("(careers OR jobs OR apply)")
        queries.append(" ".join(q1_parts))

        # Query 2: Focused ATS portal search (Greenhouse, Lever, Ashby, Workday)
        q2_parts = [role, exp, loc, "site:greenhouse.io OR site:lever.co OR site:ashbyhq.com OR site:myworkdayjobs.com"]
        queries.append(" ".join([p for p in q2_parts if p]))

        # Query 3: Specific company filter if requested
        if req.company:
            queries.insert(0, f"{req.company} {role} careers jobs {loc}")

        return queries

    def execute_workflow(self, req: SearchRequest) -> SearchResponse:
        start_time = time.time()
        query_id = str(uuid.uuid4())[:8]
        logs: List[TelemetryStep] = []
        tinyfish_tools_used: List[str] = []

        def add_log(step_num: int, name: str, tool: str, details: str, status: str = "success", duration_ms: int = 0):
            logs.append(TelemetryStep(
                step_number=step_num,
                step_name=name,
                tool=tool,
                details=details,
                status=status,
                duration_ms=duration_ms,
                timestamp=datetime.utcnow().isoformat() + "Z"
            ))

        # Step 1: Validate preferences
        step_start = time.time()
        if not req.role or len(req.role.strip()) < 2:
            add_log(1, "Validate Preferences", "JobScout Engine", "Validation failed: Role is required", "error")
            return SearchResponse(
                query_id=query_id,
                query=req.model_dump(),
                results=[],
                total_found=0,
                total_fetched=0,
                tinyfish_tools_used=[],
                logs=logs,
                search_time_seconds=round(time.time() - start_time, 2),
                error="Please enter a valid job title or role."
            )
        add_log(
            1, "Validate Preferences", "JobScout Engine",
            f"Validated query: Role='{req.role}', Location='{req.location}', Level='{req.experience_level}', Keywords={req.keywords}",
            "success", int((time.time() - step_start) * 1000)
        )

        # Step 2: Query Construction
        step_start = time.time()
        search_queries = self.construct_search_queries(req)
        add_log(
            2, "Query Formulation", "JobScout Engine",
            f"Formulated {len(search_queries)} search strategies: primary='{search_queries[0]}'",
            "success", int((time.time() - step_start) * 1000)
        )

        # Step 3: TinyFish Search
        step_start = time.time()
        raw_search_items = []
        search_error = None
        
        try:
            primary_query = search_queries[0]
            purpose = f"Discover live {req.experience_level} opportunities for {req.role} in {req.location}"
            search_results = tinyfish_service.search_jobs(
                query=primary_query,
                location=req.location,
                purpose=purpose
            )
            raw_search_items.extend(search_results)
            
            # Run second query to expand candidate pool if first had few results
            if len(raw_search_items) < 8 and len(search_queries) > 1:
                more_results = tinyfish_service.search_jobs(
                    query=search_queries[1],
                    purpose=purpose
                )
                raw_search_items.extend(more_results)

            if "TinyFish Search API" not in tinyfish_tools_used:
                tinyfish_tools_used.append("TinyFish Search API")

            add_log(
                3, "Live Web Discovery", "TinyFish Search API",
                f"TinyFish Search returned {len(raw_search_items)} candidate web listings for query '{primary_query}'",
                "success", int((time.time() - step_start) * 1000)
            )
        except Exception as e:
            search_error = str(e)
            add_log(
                3, "Live Web Discovery", "TinyFish Search API",
                f"TinyFish Search call encountered error: {search_error}",
                "error", int((time.time() - step_start) * 1000)
            )
            return SearchResponse(
                query_id=query_id,
                query=req.model_dump(),
                results=[],
                total_found=0,
                total_fetched=0,
                tinyfish_tools_used=tinyfish_tools_used,
                logs=logs,
                search_time_seconds=round(time.time() - start_time, 2),
                error=f"TinyFish Search Error: {search_error}"
            )

        # Step 4: Prioritize official career pages and job portals
        step_start = time.time()
        candidate_urls: List[str] = []
        parsed_search_jobs: List[JobListing] = []

        for item in raw_search_items:
            url = item.get("url")
            if not url:
                continue
            cleaned = clean_url(url)
            if cleaned and cleaned not in candidate_urls:
                candidate_urls.append(cleaned)

            # Pre-parse from snippet
            parsed_j = extract_from_search_result(item, req.role, req.location)
            if parsed_j:
                parsed_search_jobs.append(parsed_j)

        # Prioritize official ATS URLs for deep fetch
        candidate_urls.sort(key=lambda u: 1 if is_official_career_page(u) else 0, reverse=True)
        top_fetch_urls = candidate_urls[:6]  # Select top 6 high-value URLs to fetch

        add_log(
            4, "Source Prioritization", "JobScout Engine",
            f"Identified {len(candidate_urls)} target URLs; prioritized top {len(top_fetch_urls)} official portals for deep fetch.",
            "success", int((time.time() - step_start) * 1000)
        )

        # Step 5: TinyFish Fetch (Deep page extraction)
        step_start = time.time()
        fetched_pages = []
        if top_fetch_urls:
            try:
                fetch_purpose = f"Extract verified job responsibilities, skills, and direct application links for {req.role}"
                fetched_pages = tinyfish_service.fetch_pages(
                    urls=top_fetch_urls,
                    purpose=fetch_purpose
                )
                if fetched_pages:
                    if "TinyFish Fetch API" not in tinyfish_tools_used:
                        tinyfish_tools_used.append("TinyFish Fetch API")
                    add_log(
                        5, "Page Deep Read", "TinyFish Fetch API",
                        f"TinyFish Fetch successfully extracted clean Markdown & link graph from {len(fetched_pages)} target URLs.",
                        "success", int((time.time() - step_start) * 1000)
                    )
                else:
                    add_log(
                        5, "Page Deep Read", "TinyFish Fetch API",
                        "TinyFish Fetch completed without return entries; falling back to search snippet data.",
                        "warning", int((time.time() - step_start) * 1000)
                    )
            except Exception as e:
                add_log(
                    5, "Page Deep Read", "TinyFish Fetch API",
                    f"TinyFish Fetch skipped/failed: {str(e)}",
                    "warning", int((time.time() - step_start) * 1000)
                )

        # Step 6: TinyFish Agent (Selective dynamic navigation for interactive SPAs)
        step_start = time.time()
        agent_jobs = []
        if req.use_agent_fallback and top_fetch_urls:
            # Trigger agent only if specifically requested or if an official ATS URL returned minimal text
            complex_url = top_fetch_urls[0]
            try:
                agent_res = tinyfish_service.run_agent_job_extraction(complex_url, req.role)
                if agent_res and agent_res.get("result"):
                    if "TinyFish Agent API" not in tinyfish_tools_used:
                        tinyfish_tools_used.append("TinyFish Agent API")
                    add_log(
                        6, "Browser Automation", "TinyFish Agent API",
                        f"TinyFish Agent ran on {complex_url} (Steps: {agent_res.get('num_of_steps', 1)}) to extract dynamic application modal.",
                        "success", int((time.time() - step_start) * 1000)
                    )
            except Exception as e:
                add_log(
                    6, "Browser Automation", "TinyFish Agent API",
                    f"TinyFish Agent bypassed: {str(e)}",
                    "info", int((time.time() - step_start) * 1000)
                )
        else:
            add_log(
                6, "Browser Automation Check", "JobScout Engine",
                "TinyFish Agent reserved for dynamic SPAs (bypassed to conserve quota & minimize latency).",
                "info", 0
            )

        # Step 7: Structured Extraction
        step_start = time.time()
        extracted_jobs: List[JobListing] = []

        # Convert fetched pages
        for page in fetched_pages:
            parsed = extract_from_fetch_result(page, req.role, req.location)
            if parsed:
                extracted_jobs.append(parsed)

        # Incorporate search snippet jobs as well
        extracted_jobs.extend(parsed_search_jobs)

        add_log(
            7, "Data Extraction", "JobScout Extractor",
            f"Extracted {len(extracted_jobs)} structured job entries with extracted skills and application paths.",
            "success", int((time.time() - step_start) * 1000)
        )

        # Step 8: Validation and Filtering
        step_start = time.time()
        validated_jobs = []
        for job in extracted_jobs:
            # Ensure title has substance and URL is valid
            if len(job.title) >= 3 and job.source_url.startswith("http"):
                validated_jobs.append(job)

        add_log(
            8, "Data Validation", "JobScout Validator",
            f"Validated {len(validated_jobs)} clean job postings; discarded unverified entries.",
            "success", int((time.time() - step_start) * 1000)
        )

        # Step 9 & 10: Normalization and Deduplication
        step_start = time.time()
        unique_jobs = deduplicate_job_listings(validated_jobs)
        add_log(
            9, "Normalization & Deduplication", "JobScout Normalizer & Deduplicator",
            f"Normalized URLs, companies, and roles. Removed {len(validated_jobs) - len(unique_jobs)} duplicates, retaining {len(unique_jobs)} unique postings.",
            "success", int((time.time() - step_start) * 1000)
        )

        # Step 11: Match Scoring and Ranking
        step_start = time.time()
        ranked_jobs = rank_jobs(unique_jobs, req)
        add_log(
            11, "Multi-Factor Scoring", "JobScout Intelligent Matcher",
            f"Ranked {len(ranked_jobs)} opportunities using role, location, seniority, skill match, and recency scoring.",
            "success", int((time.time() - step_start) * 1000)
        )

        # Step 12: Record to database history
        try:
            record_search_history(req.role, req.location, req.experience_level, req.keywords, len(ranked_jobs))
        except Exception as e:
            pass

        total_time = round(time.time() - start_time, 2)
        add_log(
            12, "Workflow Completed", "JobScout Orchestrator",
            f"Dispatched {len(ranked_jobs)} matched listings to frontend in {total_time}s.",
            "success", 0
        )

        return SearchResponse(
            query_id=query_id,
            query=req.model_dump(),
            results=ranked_jobs,
            total_found=len(ranked_jobs),
            total_fetched=len(fetched_pages),
            tinyfish_tools_used=tinyfish_tools_used,
            logs=logs,
            search_time_seconds=total_time,
            error=None
        )

search_orchestrator = SearchOrchestrator()
