"""应用配置：统一从环境变量 / .env 读取。

所有可调参数都集中在这里，通过 pydantic-settings 管理。
新增配置项时：先在 .env.example 加示例，再在这里加字段。
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """全局配置。

    字段命名与 .env 一致（大小写不敏感）。
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # 应用
    app_name: str = "奥奇传说图鉴 API"
    app_env: str = "dev"
    app_debug: bool = True

    # Oracle
    db_user: str = "scott"
    db_password: str = ""
    db_dsn: str = "localhost:1521/orclpdb"
    db_schema: str = "SCOTT"
    db_pool_min: int = 1
    db_pool_max: int = 8
    db_pool_increment: int = 1

    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @property
    def database_url(self) -> str:
        """SQLAlchemy 连接串（oracledb thin 模式）。"""
        return (
            f"oracle+oracledb://{self.db_user}:{self.db_password}"
            f"@{self.db_dsn}"
        )


@lru_cache
def get_settings() -> Settings:
    """缓存配置实例，进程内只解析一次。"""
    return Settings()


settings = get_settings()
