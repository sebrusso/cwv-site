# Configuration System

This directory contains the unified configuration system for the Creative Writing Verification Interactive application.

## Files

- **`app-config.json`** - Main configuration file containing all application settings
- **`index.ts`** - TypeScript configuration loader and utilities
- **`system-instructions.json`** - Legacy system instructions (kept for reference)

## Configuration Structure

### App Settings
- Basic app information (name, version, debug mode)
- Environment settings

### Features
- **Authentication**: Toggle authentication, anonymous access, email confirmation
- **Dashboard**: Enable/disable dashboard and navigation
- **Leaderboard**: Control leaderboard features and date filters
- **Resources**: Enable/disable resources page
- **Dataset**: Control dataset downloads and URLs
- **UI**: Theme, help buttons, and interface options

### Models
- **Model Configurations**: Complete model definitions with:
  - API identifiers (e.g., `gpt-4.5-preview-2025-02-27`)
  - Display names and descriptions
  - Provider settings (OpenAI, Anthropic, Google)
  - Temperature and token limits
  - System instructions for each model
  - Enable/disable toggles

### API Settings
- Rate limiting configuration
- Caching settings

### Database
- User limits and permissions
- Feature toggles for database operations

### Analytics & Security
- Analytics provider settings
- CORS and security configurations

## Usage

### TypeScript/JavaScript
```typescript
import { getConfig, getModelConfig, getSystemInstruction } from '../config';

// Get full configuration
const config = getConfig();

// Get specific model
const gpt4Config = getModelConfig('gpt-4.5-preview-2025-02-27');

// Get system instruction for a model
const instruction = getSystemInstruction('gpt-4o');

// Legacy compatibility (for existing code)
import { config } from '@/config';
console.log(config.debugMode);
```

## Adding New Models

To add a new model:

1. Add the model configuration to the `models.configurations` array in `app-config.json`:

```json
{
  "id": "new-model-id",
  "name": "New Model",
  "provider": "openai",
  "displayName": "New Model (Display)",
  "description": "Description of the new model",
  "temperature": 0.7,
  "maxTokens": 1024,
  "enabled": true,
  "systemInstruction": "System instruction for the new model..."
}
```

2. The model will automatically be available through the API

## Customization

### Enable/Disable Features
Edit `features` section in `app-config.json`:

```json
{
  "features": {
    "authentication": {
      "disableForAnonymous": true  // Allow anonymous usage
    },
    "dashboard": {
      "enabled": false  // Hide dashboard
    }
  }
}
```

### Modify Model Settings
Edit individual models in the `models.configurations` array:

```json
{
  "id": "gpt-4o",
  "enabled": false,  // Disable this model
  "maxTokens": 2048,  // Increase token limit
  "temperature": 0.5  // Make more deterministic
}
```

### Debug Mode
Set `app.debugMode` to `true` for development:

```json
{
  "app": {
    "debugMode": true
  }
}
```

## Migration from Old Config

The system maintains backward compatibility with the old configuration format. All existing imports will continue to work:

- `import { config } from '@/config'` - Still works
- `import { MODEL_CONFIGS } from '@/lib/models/modelConfig'` - Still works
- `import { getSystemInstruction } from '@/lib/systemInstructions'` - Still works

## Environment Variables

The configuration system still respects essential environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY`

All other settings are now controlled via the JSON configuration files. 