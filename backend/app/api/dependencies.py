from app.services.asr_service import ASRService


def get_asr_service() -> ASRService:
    return ASRService()
