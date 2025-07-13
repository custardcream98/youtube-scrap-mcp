# YouTube Content Extractor MCP

MCP (Model Context Protocol) server provides intelligent YouTube content extraction with advanced language detection and transcript processing capabilities.

- Video title and description
- Transcript (from subtitles or Whisper speech-to-text)
- Video metadata

## Prerequisites

Before installing this MCP server, you need to install the following dependencies:

### Required Dependencies

1. **yt-dlp** (YouTube content extraction):

   ```bash
   pip install yt-dlp
   # or via Homebrew
   brew install yt-dlp
   ```

2. **OpenAI Whisper** (for audio transcription fallback):

   ```bash
   pip install openai-whisper
   # or via Homebrew
   brew install openai-whisper
   ```

### Verify Installation

Check that all dependencies are properly installed:

```bash
yt-dlp --version
whisper --help
```

## Installation

### Option 1: NPM Package (Recommended)

```bash
npm install -g youtube-scrap-mcp
```

### Option 2: From Source

```bash
git clone https://github.com/your-username/youtube-scrap-mcp.git
cd youtube-scrap-mcp
pnpm install
pnpm build
```

## Claude Desktop Configuration

Add this configuration to your Claude Desktop settings:

```json
{
  "mcpServers": {
    "youtube-scrap": {
      "command": "npx",
      "args": ["youtube-scrap-mcp"]
    }
  }
}
```

For local development:

```json
{
  "mcpServers": {
    "youtube-scrap": {
      "command": "node",
      "args": ["/path/to/youtube-scrap-mcp/dist/stdio.js"]
    }
  }
}
```
