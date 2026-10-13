"""
PRIORIX Independent SLA Escalation Worker
Runs independently of browser sessions to monitor deadlines and perform idempotent escalations.

Usage:
  python run_sla_worker.py --once       # Run single escalation scan and exit
  python run_sla_worker.py --interval 60 # Run continuously every 60 seconds
"""

import sys
import time
import argparse
import logging

from app.database import Base, engine, SessionLocal
from app.services.sla_scheduler import run_sla_escalation_cycle
from app.seed_data import seed_database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [SLA-Worker]: %(message)s"
)
logger = logging.getLogger("priorix.sla.worker")


def main():
    parser = argparse.ArgumentParser(description="PRIORIX SLA Escalation Background Worker")
    parser.add_argument("--once", action="store_true", help="Execute single escalation scan and exit")
    parser.add_argument("--interval", type=int, default=60, help="Scan interval in seconds (default: 60)")
    args = parser.parse_args()

    # Ensure schema is validated
    Base.metadata.create_all(bind=engine)
    logger.info("Starting PRIORIX SLA Escalation Worker...")

    if args.once:
        db = SessionLocal()
        try:
            # Seed initial demo data if database is empty
            seed_database(db, force=False)
            results = run_sla_escalation_cycle(db)
            logger.info(f"Single scan complete. Escalated tickets: {len(results)}")
            for item in results:
                logger.info(f" - {item['ticket_number']}: Level {item['level']} ({item['status']})")
        finally:
            db.close()
        return

    logger.info(f"Worker running in continuous daemon mode (interval: {args.interval}s). Press Ctrl+C to stop.")
    while True:
        db = SessionLocal()
        try:
            results = run_sla_escalation_cycle(db)
            if results:
                logger.info(f"Scan processed: {len(results)} new escalation(s).")
        except Exception as e:
            logger.error(f"Error during SLA escalation cycle: {e}")
        finally:
            db.close()

        try:
            time.sleep(args.interval)
        except KeyboardInterrupt:
            logger.info("Worker stopped by user.")
            break


if __name__ == "__main__":
    main()
