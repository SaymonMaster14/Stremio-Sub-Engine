FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3 python3-pip ca-certificates \
    && pip3 install --break-system-packages 'ffsubsync==0.5.1' 'faster-whisper>=1.1,<2' \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN mkdir -p /data/cache
ENV CACHE_DIR=/data/cache HOST=0.0.0.0 PORT=7000
EXPOSE 7000
CMD ["node", "src/index.mjs"]
