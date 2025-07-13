# YouTube 콘텐츠 추출기 MCP

YouTube 비디오 콘텐츠를 추출하는 MCP 서버입니다.

- 비디오 제목 및 설명
- 트랜스크립트 (자막 또는 Whisper 음성-텍스트 변환)
- 비디오 메타데이터

## 사전 요구사항

이 MCP 서버를 설치하기 전에 다음 종속성을 설치해야 합니다:

### 필수 종속성

1. **yt-dlp** (YouTube 콘텐츠 추출):

   ```bash
   pip install yt-dlp
   # 또는 Homebrew를 통해
   brew install yt-dlp
   ```

2. **OpenAI Whisper** (오디오 전사 대체용):

   ```bash
   pip install openai-whisper
   # 또는 Homebrew를 통해
   brew install openai-whisper
   ```

### 설치 확인

모든 종속성이 올바르게 설치되었는지 확인하세요:

```bash
yt-dlp --version
whisper --help
```

## 설치

### 옵션 1: NPM 패키지 (권장)

```bash
npm install -g youtube-scrap-mcp
```

Claude Desktop 설정에 다음을 추가하세요:

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

### 옵션 2: 소스에서 설치

```bash
git clone https://github.com/your-username/youtube-scrap-mcp.git
cd youtube-scrap-mcp
pnpm install
pnpm build
```

Claude Desktop 설정에 다음을 추가하세요:

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
