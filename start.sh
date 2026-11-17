#!/bin/bash
# Scholarship Sathi — Start All Services
# Run from the project root: bash start.sh

echo "========================================"
echo "  Scholarship Sathi — Starting Up"
echo "========================================"

# Kill anything on port 5000 or 5173
fuser -k 5000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

echo ""
echo "[1/2] Starting Python backend on http://localhost:5000 ..."
cd "$(dirname "$0")"
python backend/main.py &
BACKEND_PID=$!
echo "      Backend PID: $BACKEND_PID"

echo ""
echo "[2/2] Starting React frontend on http://localhost:5173 ..."
cd frontend && npm run dev &
FRONTEND_PID=$!
echo "      Frontend PID: $FRONTEND_PID"

echo ""
echo "========================================"
echo "  App running at http://localhost:5173"
echo "  API running at http://localhost:5000"
echo "  Press Ctrl+C to stop both servers."
echo "========================================"

# Wait for both — Ctrl+C kills both
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" INT
wait

