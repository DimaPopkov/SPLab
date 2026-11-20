from pydantic import BaseModel

class ScanRequest(BaseModel):
    repo_full_name: str

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
    stack: dict = {}
    stats: dict = {}
    issues: list[IssueItem] = []