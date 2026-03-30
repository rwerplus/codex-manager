import asyncio
from contextlib import contextmanager
from types import SimpleNamespace

import src.web.routes.accounts as accounts_routes
from src.database import crud
from src.database.session import DatabaseSessionManager
from src.web.routes.accounts import BatchSub2ApiUploadRequest, Sub2ApiUploadRequest


class _Response:
    def __init__(self, status_code, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        if self._payload is None:
            raise ValueError("no json payload")
        return self._payload


def _build_fake_get_db(manager):
    @contextmanager
    def fake_get_db():
        with manager.session_scope() as session:
            yield session

    return fake_get_db


def test_batch_upload_sub2api_forwards_group_id(tmp_path, monkeypatch):
    manager = DatabaseSessionManager(f"sqlite:///{tmp_path}/batch-sub2api.db")
    manager.create_tables()
    manager.migrate_tables()

    with manager.session_scope() as session:
        account = crud.create_account(
            session,
            email="batch@example.com",
            email_service="tempmail",
            access_token="batch-token",
        )
        service = crud.create_sub2api_service(
            session,
            name="sub2api-main",
            api_url="http://sub2api.local",
            api_key="secret-key",
            enabled=True,
            group_id=321,
            group_name="team-a",
        )
        account_id = account.id
        service_id = service.id

    captured = {}

    def fake_batch_upload(account_ids, api_url, api_key, concurrency=3, priority=50, group_id=None):
        captured["account_ids"] = account_ids
        captured["api_url"] = api_url
        captured["api_key"] = api_key
        captured["concurrency"] = concurrency
        captured["priority"] = priority
        captured["group_id"] = group_id
        return {"success_count": 1, "failed_count": 0, "skipped_count": 0, "details": []}

    monkeypatch.setattr(accounts_routes, "get_db", _build_fake_get_db(manager))
    monkeypatch.setattr(accounts_routes, "batch_upload_to_sub2api", fake_batch_upload)

    result = asyncio.run(
        accounts_routes.batch_upload_accounts_to_sub2api(
            BatchSub2ApiUploadRequest(
                ids=[account_id],
                service_id=service_id,
                concurrency=7,
                priority=88,
            )
        )
    )

    assert result["success_count"] == 1
    assert captured == {
        "account_ids": [account_id],
        "api_url": "http://sub2api.local",
        "api_key": "secret-key",
        "concurrency": 7,
        "priority": 88,
        "group_id": 321,
    }


def test_single_upload_sub2api_forwards_default_service_group_id(tmp_path, monkeypatch):
    manager = DatabaseSessionManager(f"sqlite:///{tmp_path}/single-sub2api.db")
    manager.create_tables()
    manager.migrate_tables()

    with manager.session_scope() as session:
        account = crud.create_account(
            session,
            email="single@example.com",
            email_service="tempmail",
            access_token="single-token",
        )
        crud.create_sub2api_service(
            session,
            name="sub2api-default",
            api_url="http://sub2api.default",
            api_key="default-key",
            enabled=True,
            priority=0,
            group_id=654,
            group_name="team-b",
        )
        account_id = account.id

    captured = {}

    def fake_upload(accounts, api_url, api_key, concurrency=3, priority=50, group_id=None):
        captured["emails"] = [account.email for account in accounts]
        captured["api_url"] = api_url
        captured["api_key"] = api_key
        captured["concurrency"] = concurrency
        captured["priority"] = priority
        captured["group_id"] = group_id
        return True, "ok"

    monkeypatch.setattr(accounts_routes, "get_db", _build_fake_get_db(manager))
    monkeypatch.setattr(accounts_routes, "upload_to_sub2api", fake_upload)

    result = asyncio.run(
        accounts_routes.upload_account_to_sub2api(
            account_id,
            Sub2ApiUploadRequest(concurrency=4, priority=66),
        )
    )

    assert result == {"success": True, "message": "ok"}
    assert captured == {
        "emails": ["single@example.com"],
        "api_url": "http://sub2api.default",
        "api_key": "default-key",
        "concurrency": 4,
        "priority": 66,
        "group_id": 654,
    }


def test_upload_to_sub2api_reports_group_binding_success(monkeypatch):
    account = SimpleNamespace(email="bind@example.com", access_token="token", expires_at=None, account_id="", client_id="", workspace_id="", refresh_token="")

    def fake_post(url, **kwargs):
        return _Response(201)

    def fake_bind(emails, api_url, api_key, group_id):
        assert emails == ["bind@example.com"]
        assert group_id == 123
        return True, "成功绑定 1 个账号到分组 123"

    from src.core.upload import sub2api_upload
    monkeypatch.setattr(sub2api_upload.cffi_requests, "post", fake_post)
    monkeypatch.setattr(sub2api_upload, "_bind_accounts_to_group", fake_bind)

    success, message = sub2api_upload.upload_to_sub2api(
        [account],
        "http://sub2api.example",
        "key",
        group_id=123,
    )

    assert success is True
    assert "并绑定到分组 123" in message


def test_upload_to_sub2api_reports_group_binding_failure(monkeypatch):
    account = SimpleNamespace(email="bindfail@example.com", access_token="token", expires_at=None, account_id="", client_id="", workspace_id="", refresh_token="")

    def fake_post(url, **kwargs):
        return _Response(201)

    def fake_bind(emails, api_url, api_key, group_id):
        return False, "未找到账号 bindfail@example.com"

    from src.core.upload import sub2api_upload
    monkeypatch.setattr(sub2api_upload.cffi_requests, "post", fake_post)
    monkeypatch.setattr(sub2api_upload, "_bind_accounts_to_group", fake_bind)

    success, message = sub2api_upload.upload_to_sub2api(
        [account],
        "http://sub2api.example",
        "key",
        group_id=456,
    )

    assert success is True
    assert "但分组绑定失败" in message
    assert "未找到账号 bindfail@example.com" in message


def test_bind_accounts_to_group_accepts_nested_search_results(monkeypatch):
    from src.core.upload import sub2api_upload

    calls = {"put_payloads": []}

    def fake_get(url, **kwargs):
        return _Response(200, {"data": {"items": [{"id": 99, "name": "nested@example.com"}]}})

    def fake_put(url, **kwargs):
        calls["put_payloads"].append(kwargs["json"])
        return _Response(200, {"success": True})

    monkeypatch.setattr(sub2api_upload.cffi_requests, "get", fake_get)
    monkeypatch.setattr(sub2api_upload.cffi_requests, "put", fake_put)

    success, message = sub2api_upload._bind_accounts_to_group(
        ["nested@example.com"],
        "http://sub2api.example",
        "key",
        789,
    )

    assert success is True
    assert calls["put_payloads"] == [{"group_ids": [789]}]
    assert "成功绑定 1 个账号到分组 789" == message
