from contextlib import contextmanager
from types import SimpleNamespace

import src.web.routes.registration as registration_routes
from src.core.register import RegistrationResult
from src.core.upload import sub2api_upload


class _FakeQuery:
    def __init__(self, account):
        self._account = account

    def filter_by(self, **kwargs):
        return self

    def first(self):
        return self._account


class _FakeDB:
    def __init__(self, account):
        self._account = account
        self.committed = False

    def query(self, model):
        return _FakeQuery(self._account)

    def commit(self):
        self.committed = True


def test_run_sync_registration_task_forwards_sub2api_group_id(monkeypatch):
    captured = {}
    saved_account = SimpleNamespace(email="reg@example.com", access_token="reg-token")
    fake_db = _FakeDB(saved_account)
    service = SimpleNamespace(
        id=99,
        name="sub2api-reg",
        api_url="http://sub2api.reg",
        api_key="reg-key",
        group_id=777,
    )

    @contextmanager
    def fake_get_db():
        yield fake_db

    class _FakeEngine:
        def save_to_database(self, result):
            return None

    def fake_run_registration_engine_attempt(**kwargs):
        result = RegistrationResult(success=True, email="reg@example.com", access_token="reg-token", logs=[])
        return _FakeEngine(), result, None, None, None

    def fake_upload(accounts, api_url, api_key, concurrency=3, priority=50, group_id=None):
        captured["emails"] = [account.email for account in accounts]
        captured["api_url"] = api_url
        captured["api_key"] = api_key
        captured["group_id"] = group_id
        return True, "ok"

    monkeypatch.setattr(registration_routes, "get_db", fake_get_db)
    monkeypatch.setattr(registration_routes.task_manager, "is_cancelled", lambda task_uuid: False)
    monkeypatch.setattr(registration_routes.task_manager, "update_status", lambda *args, **kwargs: None)
    monkeypatch.setattr(registration_routes.task_manager, "create_log_callback", lambda *args, **kwargs: lambda message: None)
    monkeypatch.setattr(registration_routes, "get_proxy_for_registration", lambda db, exclude_proxy_ids=None: (None, None))
    monkeypatch.setattr(registration_routes, "update_proxy_usage", lambda db, proxy_id: None)
    monkeypatch.setattr(registration_routes, "_build_email_service_candidates", lambda *args, **kwargs: [{"service_type": registration_routes.EmailServiceType.TEMPMAIL, "config": {}, "db_service": None}])
    monkeypatch.setattr(registration_routes, "_create_task_status_callback", lambda *args, **kwargs: lambda *a, **k: None)
    monkeypatch.setattr(registration_routes, "_run_registration_engine_attempt", fake_run_registration_engine_attempt)
    monkeypatch.setattr(registration_routes.crud, "update_registration_task", lambda *args, **kwargs: object())
    monkeypatch.setattr(registration_routes.crud, "get_sub2api_service_by_id", lambda db, service_id: service)
    monkeypatch.setattr(registration_routes.EmailServiceFactory, "create", lambda *args, **kwargs: object())
    monkeypatch.setattr(sub2api_upload, "upload_to_sub2api", fake_upload)

    registration_routes._run_sync_registration_task(
        task_uuid="task-sub2api-group",
        email_service_type="tempmail",
        proxy=None,
        email_service_config=None,
        auto_upload_sub2api=True,
        sub2api_service_ids=[service.id],
    )

    assert captured == {
        "emails": ["reg@example.com"],
        "api_url": "http://sub2api.reg",
        "api_key": "reg-key",
        "group_id": 777,
    }
