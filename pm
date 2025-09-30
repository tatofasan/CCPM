#!/bin/bash

# CCPM Command Line Interface
# Usage: ./pm <command> [arguments]

COMMAND="$1"
shift

case "$COMMAND" in
    help)
        bash .claude/scripts/pm/help.sh
        ;;
    prd-new|prd-parse|prd-list|prd-edit|prd-status)
        echo "Running: $COMMAND $@"
        echo "This command requires interactive Claude Code session."
        echo "Please restart Claude Code and use: /$COMMAND $@"
        ;;
    epic-list)
        bash .claude/scripts/pm/epic-list.sh
        ;;
    epic-show)
        bash .claude/scripts/pm/epic-show.sh "$@"
        ;;
    epic-status)
        bash .claude/scripts/pm/epic-status.sh "$@"
        ;;
    status)
        bash .claude/scripts/pm/status.sh
        ;;
    next)
        bash .claude/scripts/pm/next.sh
        ;;
    standup)
        bash .claude/scripts/pm/standup.sh
        ;;
    blocked)
        bash .claude/scripts/pm/blocked.sh
        ;;
    in-progress)
        bash .claude/scripts/pm/in-progress.sh
        ;;
    validate)
        bash .claude/scripts/pm/validate.sh
        ;;
    init)
        bash .claude/scripts/pm/init.sh
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo ""
        bash .claude/scripts/pm/help.sh
        exit 1
        ;;
esac