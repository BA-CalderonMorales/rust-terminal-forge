#!/bin/bash

# Test script that mimics Claude CLI output with colors
echo -e "\n🤖 \x1b[1;34mClaude CLI Test Output\x1b[0m"
echo -e "\x1b[32m✓\x1b[0m Connection successful"
echo -e "\x1b[33m⚠\x1b[0m  Warning: API rate limit approaching"
echo -e "\x1b[31m✗\x1b[0m Error: Invalid API key"
echo -e "\n\x1b[1mCommands:\x1b[0m"
echo -e "  \x1b[36mclaude\x1b[0m --help       Show help"
echo -e "  \x1b[36mclaude\x1b[0m --version    Show version"
echo -e "  \x1b[36mclaude\x1b[0m query        Ask a question"
echo -e "\n\x1b[90mDebug info: Terminal colors working properly\x1b[0m"
echo -e "\x1b[1;32mAll tests passed!\x1b[0m\n"