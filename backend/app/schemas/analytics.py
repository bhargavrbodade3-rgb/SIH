from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class StatusCount(BaseModel):
    status: str
    count: int

class DepartmentStats(BaseModel):
    department: str
    total_applications: int
    avg_processing_days: float
    approved_count: int
    pending_count: int

class BottleneckItem(BaseModel):
    step_name: str
    average_delay_days: float
    impact_level: str # HIGH, MEDIUM, LOW
    affected_applications: int
    root_cause_summary: str
    recommended_mitigation: str

class BottlenecksResponse(BaseModel):
    bottlenecks: List[BottleneckItem]

class DashboardAnalyticsResponse(BaseModel):
    total_users: int
    total_businesses: int
    total_applications: int
    total_pending: int
    total_approved: int
    total_overdue: int
    total_queries: int
    total_inspections: int
    status_distribution: List[StatusCount]
    department_stats: List[DepartmentStats]
    bottlenecks: List[BottleneckItem]
    recent_activities: List[Dict[str, Any]]
