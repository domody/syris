"""
RiskClassifier — classify a tool action's risk level, applying adjusters.

Adjusters can only raise the risk level, never lower it. CRITICAL is the
ceiling. The classifier operates on pure data and does not touch the DB.
"""

from ..schemas.audit import RiskLevel

# Numeric ranks for comparison and arithmetic
_RISK_RANK: dict[str, int] = {
    "low": 0,
    "medium": 1,
    "high": 2,
    "critical": 3,
}

_RANK_TO_RISK: dict[int, str] = {v: k for k, v in _RISK_RANK.items()}


def _to_rank(level: str) -> int:
    return _RISK_RANK[level]


def _to_level(rank: int) -> RiskLevel:
    return _RANK_TO_RISK[min(rank, 3)]  # type: ignore[return-value]


class RiskClassifier:
    """
    Determines the effective risk level for a tool action.

    Start from `base_risk` and apply each adjuster that is true.
    Each adjuster can raise the risk by one level. Multiple adjusters
    stack — two active adjusters on a `low` base yield `high`.
    """

    def classify(
        self,
        base_risk: RiskLevel,
        *,
        is_broadcast: bool = False,
        is_destructive: bool = False,
        blast_radius_exceeded: bool = False,
        within_quiet_hours: bool = False,
    ) -> RiskLevel:
        """
        Compute effective risk level from base risk and active adjusters.

        Args:
            base_risk: Starting risk level (from tool definition or step spec).
            is_broadcast: Target is a broadcast/group channel (not private).
            is_destructive: Action deletes, wipes, or resets data.
            blast_radius_exceeded: Action targets many devices or has wide scope.
            within_quiet_hours: Current time is within a configured quiet window.

        Returns:
            Effective RiskLevel after all adjusters are applied.
        """
        rank = _to_rank(base_risk)
        if is_broadcast:
            rank += 1
        if is_destructive:
            rank += 1
        if blast_radius_exceeded:
            rank += 1
        if within_quiet_hours:
            rank += 1
        return _to_level(rank)
