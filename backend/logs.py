"""One logging setup, shared by the API and the cron scripts.

Everything used to go through `print`, which journald keeps but nothing can filter:
no level, no source, no timestamp of its own. This gives all three at the cost of
one call, and `LOG_LEVEL=DEBUG` in the environment turns the volume up without a
code change.

Never log document contents, names, addresses or anything else off a licence — the
logs are the one place PII leaks without anybody noticing.
"""

import logging
import os

FORMAT = "%(asctime)s %(levelname)-7s %(name)s: %(message)s"


def setup(name: str = "mfleet") -> logging.Logger:
    """Configure logging once and hand back a named logger."""
    if not logging.getLogger().handlers:
        logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper(), format=FORMAT)
    return logging.getLogger(name)
