FROM python:3.14-slim

RUN pip install uv

ENV UV_PROJECT_ENVIRONMENT=/venv

WORKDIR /app

# Copy only the core package (build context is monorepo root)
COPY core/syris_core/pyproject.toml core/syris_core/uv.lock* ./

RUN uv sync --frozen --no-install-project

COPY core/syris_core/ .

RUN uv sync --frozen

EXPOSE 8000

CMD ["/venv/bin/syris"]