from app.integrations.prism.models import AIEvent, GovernanceResult
from app.integrations.prism.provider import get_prism_provider

class PrismClient:
    def __init__(self):
        self.provider = get_prism_provider()

    def evaluate_ai_event(self, event: AIEvent) -> GovernanceResult:
        """
        Evaluate an AI event using PRISM.
        If the integration is unavailable, it gracefully uses the fallback mock provider.
        """
        try:
            return self.provider.evaluate_ai_event(event)
        except Exception as e:
            print(f"[PRISM CLIENT ERROR] Evaluation failed: {e}")
            # Fail-open or block depending on strictness. Here we fail-open for continuity but log it.
            return GovernanceResult(approved=True, reason="Governance API unavailable, fail-open policy applied.")

    def record_audit_event(self, event: AIEvent) -> None:
        """
        Asynchronously or synchronously records an audit event in PRISM.
        """
        try:
            self.provider.record_audit_event(event)
        except Exception as e:
            print(f"[PRISM CLIENT ERROR] Audit recording failed: {e}")

prism_client = PrismClient()
