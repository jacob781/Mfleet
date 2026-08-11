"""Threshold check for the Telegram reminders — run: python test_notify_telegram.py"""

from notify_telegram import is_due


def test_thresholds():
    # Speaks up only on the marks, so a 30-day alert is not repeated 30 times.
    assert [d for d in range(0, 31) if is_due(d)] == [0, 1, 3, 7, 14, 30]
    # Expired documents nag weekly, not daily.
    assert [d for d in range(-30, 0) if is_due(d)] == [-28, -21, -14, -7]
    # A document that was never uploaded has no date — the manager's problem.
    assert not is_due(None)
    # Beyond the window nothing fires.
    assert not is_due(31) and not is_due(45)


if __name__ == "__main__":
    test_thresholds()
    print("ok")
