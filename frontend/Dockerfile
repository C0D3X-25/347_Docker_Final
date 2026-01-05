# Stage 1: Obfuscation du JavaScript
FROM node:20-slim AS obfuscator
WORKDIR /build
RUN npm install -g javascript-obfuscator
COPY ./src/static/scripts/game.js .
RUN javascript-obfuscator game.js --output game.obf.js \
    --compact true \
    --control-flow-flattening true \
    --dead-code-injection true \
    --string-array true \
    --string-array-encoding base64

# Stage 2: Application Python finale
FROM python:3.13-slim
WORKDIR /app
COPY ./src .
COPY ./requirements.txt .
COPY --from=obfuscator /build/game.obf.js ./static/scripts/game.js
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "main.py"]
EXPOSE 5000
