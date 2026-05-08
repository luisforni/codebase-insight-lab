#!/bin/bash
set -e

MODEL_NAME="qwen25-7b-instruct"

ollama serve &
OLLAMA_PID=$!

echo "[ollama] Starting server..."
until ollama list > /dev/null 2>&1; do
  sleep 1
done
echo "[ollama] Server ready."

if ollama list 2>/dev/null | grep -q "^${MODEL_NAME}"; then
  echo "[ollama] Model '${MODEL_NAME}' found — ready to serve."
else
  echo "[ollama] WARNING: Model '${MODEL_NAME}' not found."
  echo "[ollama] Register it once on your HOST machine:"
  echo "[ollama]   cd <directory-containing-your-gguf>"
  echo "[ollama]   ollama create ${MODEL_NAME} -f /path/to/Modelfile"
  echo "[ollama] See ollama/Modelfile in this repo for the recommended configuration."
fi

wait $OLLAMA_PID