# 🎨 Branding & Customization Guide

MonshyFlow is open source and allows you to customize the branding (logo, app name, favicon) for your deployment.

## Quick Start

### Option 1: Replace Files (Easiest)

Simply replace these files in `frontend/public/`:
- `logo.png` - Logo shown in navigation (recommended: 200-300px width, transparent background)
- `favicon.png` - Browser tab icon (recommended: 32x32px or 64x64px)

### Option 2: Environment Variables (For Docker/CI)

Set these environment variables during build:

```bash
# In .env file or docker-compose.yml
VITE_LOGO_PATH=/custom-logo.png
VITE_APP_NAME="Your Company Name"
```

Then rebuild:
```bash
docker compose -f docker-compose.prod.yml build --no-cache monshyflow-frontend
```

### Option 3: Build Arguments (Docker)

```dockerfile
ARG VITE_LOGO_PATH=/logo.png
ARG VITE_APP_NAME=Monshy
```

## File Locations

- **Logo**: `frontend/public/logo.png` (or path specified in `VITE_LOGO_PATH`)
- **Favicon**: `frontend/public/favicon.png`
- **App Name**: Set via `VITE_APP_NAME` environment variable (default: "Monshy")

## Logo Specifications

- **Format**: PNG (with transparency) or SVG
- **Navigation Logo**: 200-300px width, 40-60px height recommended
- **Favicon**: 32x32px or 64x64px square
- **Background**: Transparent recommended

## Example: Custom Branding

1. **Add your logo**:
   ```bash
   cp your-logo.png frontend/public/logo.png
   cp your-favicon.png frontend/public/favicon.png
   ```

2. **Set app name** (optional):
   ```bash
   export VITE_APP_NAME="MyCompany Workflow"
   ```

3. **Rebuild**:
   ```bash
   npm run build
   # or
   docker compose -f docker-compose.prod.yml build monshyflow-frontend
   ```

## Default Behavior

- If no custom logo is provided, MonshyFlow uses the default Monshy logo
- The logo path defaults to `/logo.png` (from `public/` directory)
- The app name defaults to "Monshy"

## Notes

- Logo files in `public/` are copied as-is to the build output
- Environment variables must be set at **build time** (not runtime)
- Changes require a rebuild of the frontend container
- The logo is used in:
  - Navigation sidebar
  - Browser tab (favicon)
  - Social media previews (Open Graph meta tags)

