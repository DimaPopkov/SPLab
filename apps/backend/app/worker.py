import asyncio
import json
import logging
import aio_pika

from app.config import settings
from app.database import SessionLocal
from app.auth.models import User
from app.scanner.models import ScanReport
from app.scanner.service import run_security_scan
from app.rabbitmq import QUEUE_NAME

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [WORKER] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

async def process_message(message: aio_pika.abc.AbstractIncomingMessage) -> None:
    async with message.process(requeue=False):
        data = json.loads(message.body.decode("utf-8"))
        report_id = data.get("report_id")
        logger.info(f"Получена задача на сканирование report_id={report_id}")

        db = SessionLocal()
        try:
            report = db.query(ScanReport).filter(ScanReport.id == report_id).first()
            if not report:
                logger.warning(f"Отчёт report_id={report_id} не найден в БД")
                return

            user = db.query(User).filter(User.id == report.user_id).first()
            if not user or not user.github_token:
                report.status = "failed"
                db.commit()
                logger.error(f"Не найден токен GitHub для report_id={report_id}")
                return

            report.status = "processing"
            db.commit()

            issues = await run_security_scan(report.repo_full_name, user.github_token)
            report.issues = issues
            report.status = "completed"
            db.commit()
            logger.info(f"Сканирование report_id={report_id} завершено. Найдено проблем: {len(issues)}")

        except Exception as exc:
            logger.exception(f"Ошибка при обработке report_id={report_id}: {exc}")
            report = db.query(ScanReport).filter(ScanReport.id == report_id).first()
            if report:
                report.status = "failed"
                db.commit()
        finally:
            db.close()

async def main() -> None:
    logger.info("Подключение воркера к RabbitMQ...")
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(QUEUE_NAME, durable=True)

        logger.info(f"Воркер запущен и ожидает сообщения из очереди '{QUEUE_NAME}'...")
        await queue.consume(process_message)
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
