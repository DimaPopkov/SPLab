import json
import aio_pika
from app.config import settings

QUEUE_NAME = "scan_tasks"

async def publish_scan_task(report_id: int) -> bool:
    """Отправляет ID отчёта в RabbitMQ. Возвращает False, если брокер недоступен."""
    try:
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL, timeout=3)
        async with connection:
            channel = await connection.channel()
            await channel.declare_queue(QUEUE_NAME, durable=True)
            message = aio_pika.Message(
                body=json.dumps({"report_id": report_id}).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            )
            await channel.default_exchange.publish(message, routing_key=QUEUE_NAME)
        return True
    except Exception:
        return False