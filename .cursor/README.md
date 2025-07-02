# Cursor Background Agent Configuration

This directory contains the configuration for Cursor's background agent feature.

## Files

- `environment.json` - Configuration file that defines how the background agent environment is set up
- `README.md` - This documentation file

## Configuration

The `environment.json` file is configured with:

- **Install command**: `./setup.sh` - Runs the project setup script to install all dependencies
- **Terminals**: Automatically starts the Next.js development server on `pnpm dev`

## How to Use

1. Press `Ctrl+E` (or `Cmd+E` on Mac) to open the background agent control panel
2. Submit a prompt to spawn a new background agent
3. The agent will automatically:
   - Clone the repository
   - Run the `setup.sh` script to install dependencies
   - Start the Next.js development server in a terminal
   - Begin working on your task

## Setup Script

The `setup.sh` script handles:
- Installing Node.js dependencies with pnpm
- Installing Python dependencies for data processing scripts  
- Verifying that all necessary tools are available
- Ensuring the environment is ready for development

### Python Environment Notes

The setup script uses the `--break-system-packages` flag for pip installations to handle Ubuntu's externally-managed Python environment in the background agent containers. This is safe and appropriate for isolated container environments that get recreated for each agent session.

## Background Agent Features

The background agent will have access to:
- The complete codebase
- Internet access for package installation and research
- Ability to run tests and build the project
- Automatic terminal commands (including running setup and dev server)

## Security Note

The background agent requires read-write access to your GitHub repository to clone and push changes. It operates in an isolated Ubuntu environment and can auto-run terminal commands.

## Troubleshooting

If you encounter Python dependency installation issues, ensure that the `--break-system-packages` flag is included in pip install commands within the setup script. This addresses the externally-managed environment restrictions in Ubuntu-based containers. 