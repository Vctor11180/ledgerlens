# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""
LedgerLens - Intelligent Contract para análisis de billeteras Avalanche.
Clasifica Humano vs Bot usando consenso LLM descentralizado de GenLayer.
"""

from genlayer import *
import typing


class WalletAnalyzer(gl.Contract):
    """Contrato que analiza resúmenes estadísticos de transacciones y emite veredicto IA."""

    last_identity: str
    last_risk_score: i32
    last_narrative: str

    def __init__(self):
        self.last_identity = ""
        self.last_risk_score = 0
        self.last_narrative = ""

    def _validate_verdict(self, data: typing.Any) -> bool:
        """Valida que la respuesta del LLM tenga el formato esperado."""
        if not isinstance(data, dict):
            return False
        identity = data.get("identity")
        risk_score = data.get("risk_score")
        narrative = data.get("narrative")
        if not isinstance(identity, str) or not identity.strip():
            return False
        if risk_score is None:
            return False
        try:
            score = int(risk_score) if isinstance(risk_score, (int, float, str)) else -1
            if score < 0 or score > 100:
                return False
        except (ValueError, TypeError):
            return False
        if not isinstance(narrative, str) or not narrative.strip():
            return False
        return True

    @gl.public.write
    def analyze_wallet(self, statistical_summary: str) -> None:
        """
        Analiza el resumen estadístico de una billetera usando consenso LLM.
        Almacena identity, risk_score y narrative en el estado del contrato.
        """
        def leader_fn() -> typing.Any:
            prompt = f"""Eres un auditor experto de blockchain. Analiza el siguiente resumen estadístico de las últimas 50 transacciones de una billetera en Avalanche.

Resumen:
{statistical_summary}

Debes clasificar la billetera en una de estas 3 categorías de 'identity': 'Verified Human User', 'High-Frequency Trading Bot', o 'Smart Contract Service'.

También debes asignar un 'risk_score' del 0 al 100 (donde 100 es alto riesgo de bot/MEV) y generar una 'narrative' de 2 oraciones explicando por qué tomaste esa decisión.

Devuelve ÚNICAMENTE un objeto JSON con estas claves exactas, sin texto adicional:
{{ "identity": "...", "risk_score": 0, "narrative": "..." }}"""
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_result: typing.Any) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            return self._validate_verdict(leader_result.calldata)

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.last_identity = str(result.get("identity", ""))
        raw_score = result.get("risk_score", 0)
        self.last_risk_score = int(round(float(raw_score))) if raw_score is not None else 0
        self.last_narrative = str(result.get("narrative", ""))

    @gl.public.view
    def get_last_verdict(self) -> typing.Any:
        """Devuelve el último veredicto almacenado (identity, risk_score, narrative)."""
        return {
            "identity": self.last_identity,
            "risk_score": self.last_risk_score,
            "narrative": self.last_narrative,
        }
