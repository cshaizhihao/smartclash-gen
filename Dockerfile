FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY generate.py ./
COPY VERSION ./
COPY web ./web

ENV HOST=0.0.0.0
ENV PORT=10100

EXPOSE 10100

HEALTHCHECK --interval=20s --timeout=3s --start-period=10s --retries=3 CMD python - <<'PY' || exit 1
import urllib.request
urllib.request.urlopen('http://127.0.0.1:10100/api/health', timeout=2)
PY

CMD ["python", "web/dev_server.py"]
