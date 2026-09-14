import httpx
from typing import Dict, Any, List
from app.core.config import settings

class GitHubClient:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        if settings.GITHUB_TOKEN:
            self.headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

    async def get_user_repos(self, username: str) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/users/{username}/repos",
                headers=self.headers,
                params={"sort": "updated", "per_page": 10}
            )
            if response.status_code == 403:
                raise Exception("GitHub API rate limit exceeded. Please add a GITHUB_TOKEN to your .env file.")
            if response.status_code == 404:
                raise Exception(f"GitHub user '{username}' not found.")
            response.raise_for_status()
            return response.json()

    async def get_repo_readme(self, owner: str, repo: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/readme",
                headers=self.headers
            )
            if response.status_code == 404:
                return ""
            response.raise_for_status()
            
            # The readme content is base64 encoded
            import base64
            data = response.json()
            if "content" in data:
                return base64.b64decode(data["content"]).decode("utf-8")
            return ""

    async def get_repo_languages(self, owner: str, repo: str) -> Dict[str, int]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/languages",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

github_client = GitHubClient()
