from pydantic import BaseModel

class ScanRequest(BaseModel):
    repo_full_name: str  # Формат "owner/repo"

class IssueItem(BaseModel):
    file: str
    line: int
    severity: str
    rule: str
    snippet: str

class ScanResponse(BaseModel):
    id: int
    repo_full_name: str
    status: str
    issues: list[IssueItem]