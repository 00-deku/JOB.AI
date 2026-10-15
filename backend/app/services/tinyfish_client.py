import time
import logging
from typing import List, Dict, Any, Optional
from tinyfish import TinyFish
from tinyfish._utils.exceptions import (
    AuthenticationError,
    RateLimitError,
    APIConnectionError,
    APITimeoutError,
    SDKError,
    APIError,
)
from app.config import settings

logger = logging.getLogger("tinyfish_client")

class TinyFishClientWrapper:
    """
    Robust wrapper around the official TinyFish SDK with error classification,
    timeouts, telemetry tracking, and graceful diagnostics.
    """

    def __init__(self):
        self._client: Optional[TinyFish] = None

    def get_client(self) -> TinyFish:
        api_key = settings.TINYFISH_API_KEY
        if not api_key:
            raise AuthenticationError(
                "TINYFISH_API_KEY is not set. Please set the TINYFISH_API_KEY environment variable or enter it in the JobScout UI settings."
            )
        # Reinitialize if key changed or not set
        if self._client is None or getattr(self._client, "_api_key", None) != api_key:
            self._client = TinyFish(api_key=api_key)
        return self._client

    def is_configured(self) -> bool:
        return bool(settings.TINYFISH_API_KEY and len(settings.TINYFISH_API_KEY.strip()) > 5)

    def verify_key(self) -> Dict[str, Any]:
        """Verifies if the configured key is accepted by the TinyFish API."""
        if not self.is_configured():
            return {
                "valid": False,
                "error": "No API key configured. Set TINYFISH_API_KEY in your environment or enter it in the header.",
            }
        try:
            client = self.get_client()
            # Test with a lightweight search query
            client.search.query(query="ping test", purpose="JobScout health check")
            return {"valid": True, "error": None}
        except AuthenticationError as e:
            return {"valid": False, "error": f"Authentication failed: {str(e)}"}
        except RateLimitError as e:
            return {"valid": True, "error": f"Rate limited currently: {str(e)}"}
        except Exception as e:
            return {"valid": False, "error": f"Connection error: {str(e)}"}

    def search_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        purpose: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes a web search query via TinyFish Search API.
        Returns a list of raw search result dictionaries.
        """
        client = self.get_client()
        default_purpose = "Find active job postings and company career portal listings"
        clean_purpose = purpose or default_purpose

        try:
            response = client.search.query(
                query=query,
                purpose=clean_purpose,
                location=location if location and location.lower() != "remote" else None,
            )

            results = []
            if hasattr(response, "results") and response.results:
                for item in response.results:
                    results.append({
                        "position": getattr(item, "position", None),
                        "title": getattr(item, "title", "") or "",
                        "url": getattr(item, "url", "") or "",
                        "snippet": getattr(item, "snippet", "") or "",
                        "site_name": getattr(item, "site_name", "") or "",
                        "date": getattr(item, "date", None),
                        "publisher": getattr(item, "publisher", None),
                    })
            return results

        except AuthenticationError as e:
            logger.error(f"TinyFish Search Authentication Error: {e}")
            raise
        except RateLimitError as e:
            logger.error(f"TinyFish Search Rate Limit: {e}")
            raise
        except (APIConnectionError, APITimeoutError) as e:
            logger.error(f"TinyFish Search Connection Timeout: {e}")
            raise
        except Exception as e:
            logger.error(f"TinyFish Search Unexpected Error: {e}")
            raise

    def fetch_pages(
        self,
        urls: List[str],
        purpose: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves clean page content (markdown, links, metadata) using TinyFish Fetch API.
        Respects TinyFish's 10-URL batch maximum and per-url timeouts.
        """
        if not urls:
            return []

        client = self.get_client()
        clean_purpose = purpose or "Extract job requirements, title, apply link and qualifications"

        # TinyFish batch limit is 10 URLs
        batch_urls = urls[:10]

        try:
            response = client.fetch.get_contents(
                urls=batch_urls,
                purpose=clean_purpose,
                format="markdown",
                links=True,
                per_url_timeout_ms=settings.FETCH_TIMEOUT_MS,
            )

            extracted_pages = []
            if hasattr(response, "results") and response.results:
                for res in response.results:
                    extracted_pages.append({
                        "url": getattr(res, "url", ""),
                        "final_url": getattr(res, "final_url", getattr(res, "url", "")),
                        "title": getattr(res, "title", "") or "",
                        "description": getattr(res, "description", "") or "",
                        "text": getattr(res, "text", "") or "",
                        "published_date": getattr(res, "published_date", None),
                        "links": getattr(res, "links", []) or [],
                        "latency_ms": getattr(res, "latency_ms", 0),
                    })
            return extracted_pages

        except AuthenticationError:
            raise
        except Exception as e:
            logger.warning(f"TinyFish Fetch Warning on batch {batch_urls}: {e}")
            return []

    def run_agent_job_extraction(
        self,
        target_url: str,
        role: str
    ) -> Optional[Dict[str, Any]]:
        """
        Uses TinyFish Agent API when page interaction or dynamic client-side rendering
        is needed to inspect dynamic job boards (e.g. Workday, Lever, dynamic career portals).
        """
        client = self.get_client()
        goal = (
            f"Navigate to this career listing, find the application link and requirements for {role}, "
            "and extract the job title, company name, location, and apply button URL."
        )

        try:
            response = client.agent.run(
                goal=goal,
                url=target_url,
                browser_profile="lite",
            )
            return {
                "status": getattr(response, "status", "unknown"),
                "run_id": getattr(response, "run_id", None),
                "result": getattr(response, "result", None),
                "num_of_steps": getattr(response, "num_of_steps", 0),
            }
        except Exception as e:
            logger.warning(f"TinyFish Agent extraction skipped/failed on {target_url}: {e}")
            return None

tinyfish_service = TinyFishClientWrapper()
