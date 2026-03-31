"""
5Sim 接码平台服务
https://5sim.net/docs
"""

import time
import logging
from curl_cffi import requests as cffi_requests
from typing import Optional, Dict, Any

from src.config.constants import FIVE_SIM_API_BASE

logger = logging.getLogger(__name__)


class FiveSimService:
    """5Sim 接码平台 API 封装"""

    def __init__(self, api_key: str, country: str = "usa", operator: str = "any", product: str = "openai"):
        if not api_key:
            raise ValueError("5Sim API Key 不能为空")
        self.api_key = api_key
        self.country = country
        self.operator = operator
        self.product = product
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        }

    def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        url = f"{FIVE_SIM_API_BASE}{path}"
        resp = cffi_requests.request(method, url, headers=self._headers, timeout=15, **kwargs)
        if resp.status_code != 200:
            raise RuntimeError(f"5Sim API 错误: {resp.status_code} {resp.text[:300]}")
        return resp.json()

    def buy_number(self) -> Dict[str, Any]:
        """购买一个接码号码，返回 order 信息（含 id, phone 等）"""
        path = f"/user/buy/activation/{self.country}/{self.operator}/{self.product}"
        order = self._request("GET", path)
        logger.info(f"5Sim 购买号码成功: +{order.get('phone')}, order_id={order.get('id')}")
        return order

    def check_order(self, order_id: int) -> Dict[str, Any]:
        """检查订单状态，返回含 sms 数组的 order 信息"""
        return self._request("GET", f"/user/check/{order_id}")

    def finish_order(self, order_id: int) -> Dict[str, Any]:
        """完成订单（确认已使用验证码）"""
        return self._request("GET", f"/user/finish/{order_id}")

    def cancel_order(self, order_id: int) -> Dict[str, Any]:
        """取消订单"""
        try:
            return self._request("GET", f"/user/cancel/{order_id}")
        except Exception as e:
            logger.warning(f"5Sim 取消订单失败: {e}")
            return {}

    def wait_for_code(self, order_id: int, timeout: int = 120, poll_interval: int = 3) -> Optional[str]:
        """
        轮询等待验证码

        Args:
            order_id: 订单 ID
            timeout: 超时秒数
            poll_interval: 轮询间隔秒数

        Returns:
            验证码字符串，超时返回 None
        """
        deadline = time.time() + timeout
        while time.time() < deadline:
            order = self.check_order(order_id)
            status = order.get("status", "")

            if status == "CANCELED":
                logger.warning("5Sim 订单已取消")
                return None

            sms_list = order.get("sms") or []
            if sms_list:
                code = sms_list[0].get("code") or ""
                if code:
                    logger.info(f"5Sim 收到验证码: {code}")
                    return code
                # 可能 code 字段为空但 text 字段有内容
                text = sms_list[0].get("text", "")
                if text:
                    import re
                    match = re.search(r"(?<!\d)(\d{6})(?!\d)", text)
                    if match:
                        code = match.group(1)
                        logger.info(f"5Sim 从短信内容提取验证码: {code}")
                        return code

            time.sleep(poll_interval)

        logger.warning(f"5Sim 等待验证码超时 ({timeout}s)")
        return None

    def get_balance(self) -> float:
        """获取余额"""
        data = self._request("GET", "/user/profile")
        return float(data.get("balance", 0))
