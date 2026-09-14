from abc import ABC, abstractmethod
from app.integrations.prism.models import AIEvent, GovernanceResult
from app.core.config import settings
import uuid

class PRISMProvider(ABC):
    @abstractmethod
    def evaluate_ai_event(self, event: AIEvent) -> GovernanceResult:
        pass
        
    @abstractmethod
    def record_audit_event(self, event: AIEvent) -> None:
        pass

class MockPRISMProvider(PRISMProvider):
    """
    Fallback/Mock provider used when official credentials/docs are unavailable.
    Provides dummy governance allowing safe fallback.
    """
    def evaluate_ai_event(self, event: AIEvent) -> GovernanceResult:
        # Mock governance: approve unless there's an obvious hallucination marker in output
        # In a real scenario, PRISM API evaluates this.
        if "hallucination_override" in event.ai_output.lower():
            return GovernanceResult(approved=False, reason="Safety check failed: unsafe output detected", audit_id=str(uuid.uuid4()))
        return GovernanceResult(approved=True, audit_id=str(uuid.uuid4()))

    def record_audit_event(self, event: AIEvent) -> None:
        # In a real scenario, this sends the audit log to Block Convey
        print(f"[PRISM MOCK AUDIT] Recorded event: {event.event_type} - {event.audit_id}")

class LivePRISMProvider(PRISMProvider):
    """
    Live implementation to connect to actual Block Convey PRISM API.
    To be populated when official SDK/docs are supplied.
    """
    def evaluate_ai_event(self, event: AIEvent) -> GovernanceResult:
        # Placeholder for live API call
        return GovernanceResult(approved=True, audit_id="live-" + str(uuid.uuid4()))

    def record_audit_event(self, event: AIEvent) -> None:
        # Placeholder for live API call
        pass

def get_prism_provider() -> PRISMProvider:
    if settings.PRISM_ENABLED and settings.PRISM_API_KEY:
        return LivePRISMProvider()
    return MockPRISMProvider()
