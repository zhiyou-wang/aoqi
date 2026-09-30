"""统一响应模型。

所有接口返回 { data, meta } 结构，错误走统一异常。
"""
from __future__ import annotations

from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PageMeta(BaseModel):
    """分页元信息。"""

    total: int
    page: int
    size: int
    pages: int


class ApiResponse(BaseModel, Generic[T]):
    """统一响应封装。"""

    data: Optional[T] = None
    meta: Optional[PageMeta] = None
    message: str = "ok"


def ok(data: T = None, meta: PageMeta | None = None, message: str = "ok") -> dict:
    """构造成功响应。"""
    return {"data": data, "meta": meta, "message": message}
