#!/bin/bash

# CCPM GitHub Setup Script
# Run with: sudo bash setup-github.sh

set -e

echo "================================"
echo "CCPM GitHub Setup"
echo "================================"
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run with sudo: sudo bash setup-github.sh"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
ACTUAL_HOME=$(getent passwd "$ACTUAL_USER" | cut -d: -f6)

echo "📦 Installing GitHub CLI..."
# Install gh CLI
if ! command -v gh &> /dev/null; then
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    apt update
    apt install gh -y
    echo "✅ GitHub CLI installed"
else
    echo "✅ GitHub CLI already installed"
fi

echo ""
echo "🔐 GitHub Authentication Required"
echo "================================"
echo "Please authenticate with your GitHub account (tatofasan)"
echo "Press Enter to continue..."
read -r

# Run gh auth as the actual user
su - "$ACTUAL_USER" -c "gh auth login"

echo ""
echo "📦 Installing gh-sub-issue extension..."
su - "$ACTUAL_USER" -c "gh extension install k1LoW/gh-sub-issue"
echo "✅ Extension installed"

echo ""
echo "🆕 Creating GitHub repository 'CCPM'..."
cd /home/tatofasan/Proyectos/CCPM
su - "$ACTUAL_USER" -c "cd /home/tatofasan/Proyectos/CCPM && gh repo create CCPM --public --description 'Claude Code Project Management - Spec-driven development with AI agents' --source=. --remote=origin"
echo "✅ Repository created"

echo ""
echo "📤 Pushing initial commit..."
su - "$ACTUAL_USER" -c "cd /home/tatofasan/Proyectos/CCPM && git add -A && git commit -m 'Initial CCPM setup

- Set up Claude Code PM system
- Configure project structure
- Add documentation and commands

🤖 Generated with Claude Code' || echo 'No changes to commit'"

su - "$ACTUAL_USER" -c "cd /home/tatofasan/Proyectos/CCPM && git push -u origin main || git push -u origin master"
echo "✅ Initial commit pushed"

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "🎯 Repository: https://github.com/tatofasan/CCPM"
echo ""
echo "📋 Next Steps:"
echo "  1. Start your first PRD: /pm:prd-new <feature-name>"
echo "  2. View all commands: /pm:help"
echo "  3. Check status: /pm:status"
echo ""
echo "📚 Documentation: README.md"
echo ""