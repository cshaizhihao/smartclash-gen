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

CMD ["python", "web/dev_server.py"]
