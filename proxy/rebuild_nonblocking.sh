#!/bin/zsh
# Non-blocking version of rebuild_stack.sh that doesn't tail logs

# Get directory of this script
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"

# Run the rebuild script but don't tail the logs
export NOTAIL=true
./rebuild_stack.sh > rebuild_output.log 2>&1 &

echo "Rebuild process started in background"
echo "Check rebuild_output.log for details"
exit 0
