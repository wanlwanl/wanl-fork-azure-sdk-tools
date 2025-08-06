#!/bin/bash

# Azure SDK QA Bot Service Management Script
# This script manages both the Go backend service and the shared TypeScript service

GO_SERVICE_DIR="azure-sdk-qa-bot-backend"
SHARED_SERVICE_DIR="azure-sdk-qa-bot-backend-shared"
PID_FILE="service.pid"
SHARED_PID_FILE="shared_service.pid"
DEV_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        start|stop|restart|status)
            COMMAND=$1
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 {start|stop|restart|status}"
            exit 1
            ;;
    esac
done

start_service() {
    if [ -f "$PID_FILE" ]; then
        echo "Go service is already running (PID file exists)."
        return 1
    fi
    
    # Start the Go backend service
    cd "$GO_SERVICE_DIR" || { echo "Error: Cannot access Go service directory"; return 1; }
    echo "Starting Go backend service from $(pwd)..."
    nohup go run . > ../service.log 2>&1 &
    cd ..
    
    # Wait for the service to initialize
    sleep 2
    # Capture the PID of the process listening on port 8088
    SERVICE_PID=$(lsof -ti:8088)
    if [ ! -z "$SERVICE_PID" ]; then
        echo $SERVICE_PID > "$PID_FILE"
        echo "✓ Go backend service started successfully (PID: $SERVICE_PID)"
    else
        echo "⚠ Warning: Could not detect service process on port 8088"
    fi
    
    # Start the shared TypeScript service
    if [ -f "$SHARED_PID_FILE" ]; then
        echo "Shared service is already running (PID file exists)."
    else
        echo "Starting shared TypeScript service from $SHARED_SERVICE_DIR..."
        cd "$SHARED_SERVICE_DIR" || { echo "Error: Cannot access shared service directory"; return 1; }
        nohup npm run dev:local > ../shared_service.log 2>&1 &
        SHARED_PID=$!
        cd ..
        echo $SHARED_PID > "$SHARED_PID_FILE"
        echo "✓ Shared service started successfully (PID: $SHARED_PID)"
    fi
}

stop_service() {
    # Stop the Go backend service
    if [ -f "$PID_FILE" ]; then
        echo "Stopping Go backend service..."
        SERVICE_PID=$(cat "$PID_FILE")
        # Also check for any process listening on port 8088
        PORT_PID=$(lsof -ti:8088)
        if [ ! -z "$SERVICE_PID" ]; then
            kill $SERVICE_PID 2>/dev/null
        fi
        if [ ! -z "$PORT_PID" ] && [ "$PORT_PID" != "$SERVICE_PID" ]; then
            kill $PORT_PID 2>/dev/null
        fi
        rm "$PID_FILE"
        echo "✓ Go backend service stopped"
    else
        # Attempt to stop by port if PID file doesn't exist
        PORT_PID=$(lsof -ti:8088)
        if [ ! -z "$PORT_PID" ]; then
            kill $PORT_PID 2>/dev/null
            echo "✓ Go backend service stopped (by port)"
        else
            echo "Go backend service was not running"
        fi
    fi
    
    # Stop the shared TypeScript service
    if [ -f "$SHARED_PID_FILE" ]; then
        echo "Stopping shared service..."
        SHARED_PID=$(cat "$SHARED_PID_FILE")
        kill $SHARED_PID 2>/dev/null
        # Terminate any child processes
        pkill -P $SHARED_PID 2>/dev/null
        rm "$SHARED_PID_FILE"
        echo "✓ Shared service stopped"
    else
        echo "Shared service was not running"
    fi
}

status_service() {
    echo "=== Azure SDK QA Bot Service Status ==="
    
    # Check Go backend service status
    PORT_PID=$(lsof -ti:8088)
    if [ -f "$PID_FILE" ]; then
        STORED_PID=$(cat "$PID_FILE")
        if [ ! -z "$PORT_PID" ]; then
            if [ "$PORT_PID" = "$STORED_PID" ]; then
                echo "✓ Go backend service: Running (PID: $PORT_PID)"
            else
                echo "⚠ Go backend service: Running (PID: $PORT_PID, file shows: $STORED_PID)"
            fi
        else
            echo "✗ Go backend service: Not responding on port 8088"
        fi
    else
        if [ ! -z "$PORT_PID" ]; then
            echo "⚠ Go backend service: Running (PID: $PORT_PID, no PID file)"
        else
            echo "✗ Go backend service: Not running"
        fi
    fi
    
    # Check shared TypeScript service status
    if [ -f "$SHARED_PID_FILE" ]; then
        SHARED_PID=$(cat "$SHARED_PID_FILE")
        if kill -0 $SHARED_PID 2>/dev/null; then
            echo "✓ Shared service: Running (PID: $SHARED_PID)"
        else
            echo "✗ Shared service: PID file exists but process not running"
        fi
    else
        echo "✗ Shared service: Not running"
    fi
}

case "$COMMAND" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        sleep 2
        start_service
        ;;
    status)
        status_service
        ;;
    *)
        echo "Usage: $0 [-dev] {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0
