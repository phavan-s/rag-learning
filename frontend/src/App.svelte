<script>
  let question = $state('');
  let answer = $state('');
  let sources = $state([]);
  let isAsking = $state(false);
  let isUploading = $state(false);
  let uploadMessage = $state('');
  let uploadSuccess = $state(null);
  let fileInput = $state(null);
  let history = $state([]);

  async function askQuestion() {
    if (!question.trim() || isAsking) return;

    const q = question.trim();
    isAsking = true;
    answer = '';
    sources = [];
    question = '';

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Request failed');

      answer = data.answer;
      sources = data.sources ?? [];

      history = [{ q, answer: data.answer, sources: data.sources ?? [] }, ...history];
    } catch (e) {
      answer = `Error: ${e.message}`;
    } finally {
      isAsking = false;
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    isUploading = true;
    uploadMessage = `Uploading "${file.name}"…`;
    uploadSuccess = null;

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      uploadMessage = `✓ "${file.name}" ingested — ${data.totalChunks} chunks`;
      uploadSuccess = true;
    } catch (e) {
      uploadMessage = `✗ ${e.message}`;
      uploadSuccess = false;
    } finally {
      isUploading = false;
      event.target.value = '';
      setTimeout(() => { uploadMessage = ''; uploadSuccess = null; }, 5000);
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  }

  function triggerUpload() {
    fileInput?.click();
  }
</script>

<div class="shell">
  <div class="card">

    <!-- Header -->
    <header class="header">
      <div class="logo">
        <span class="logo-icon">◈</span>
        <span class="logo-text">RAG Assistant</span>
      </div>
      <p class="subtitle">Ask questions about your documents</p>
    </header>

    <!-- Upload zone -->
    <div class="upload-row">
      <button
        class="upload-btn"
        class:spinning={isUploading}
        onclick={triggerUpload}
        disabled={isUploading}
        title="Upload PDF knowledge base"
        aria-label="Upload PDF"
      >
        {#if isUploading}
          <span class="spinner">⟳</span>
        {:else}
          <span>+</span>
        {/if}
      </button>

      <div class="upload-label">
        {#if uploadMessage}
          <span
            class="upload-msg"
            class:success={uploadSuccess === true}
            class:error={uploadSuccess === false}
          >
            {uploadMessage}
          </span>
        {:else}
          <span class="upload-hint">Upload a PDF to build knowledge base</span>
        {/if}
      </div>

      <input
        bind:this={fileInput}
        type="file"
        accept=".pdf"
        class="hidden-input"
        onchange={handleUpload}
      />
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Answer panel -->
    {#if answer || isAsking}
      <div class="answer-panel" class:loading={isAsking}>
        {#if isAsking}
          <div class="thinking">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        {:else}
          <p class="answer-text">{answer}</p>

          {#if sources.length > 0}
            <div class="sources">
              <span class="sources-label">Sources</span>
              {#each sources as src}
                <span class="source-chip">{src.document}</span>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    {/if}

    <!-- Input row -->
    <div class="input-row">
      <textarea
        class="question-input"
        bind:value={question}
        onkeydown={handleKeydown}
        placeholder="Ask a question about your documents…"
        rows="3"
        disabled={isAsking}
      ></textarea>

      <button
        class="send-btn"
        onclick={askQuestion}
        disabled={isAsking || !question.trim()}
        title="Send (Enter)"
        aria-label="Send question"
      >
        {#if isAsking}
          <span class="spinner">⟳</span>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        {/if}
      </button>
    </div>

    <p class="hint">Press Enter to send · Shift+Enter for new line</p>

    <!-- History -->
    {#if history.length > 0}
      <div class="history">
        <div class="history-header">Recent</div>
        {#each history.slice(0, 5) as item}
          <div class="history-item">
            <p class="history-q">Q: {item.q}</p>
            <p class="history-a">{item.answer}</p>
          </div>
        {/each}
      </div>
    {/if}

  </div>
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: 'Inter', sans-serif;
    background: #e8f4ec;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }

  /* ── Layout ── */
  .shell {
    width: 100%;
    max-width: 680px;
  }

  .card {
    background: #e8f4ec;
    border-radius: 24px;
    padding: 2.5rem 2rem;
    box-shadow: 10px 10px 20px #c2d9c8, -10px -10px 20px #ffffff;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* ── Header ── */
  .header {
    text-align: center;
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }

  .logo-icon {
    font-size: 1.6rem;
    color: #27ae60;
    filter: drop-shadow(0 0 6px #27ae6088);
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a3d2b;
    letter-spacing: -0.3px;
  }

  .subtitle {
    font-size: 0.85rem;
    color: #6b8f75;
    font-weight: 400;
  }

  /* ── Upload row ── */
  .upload-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .upload-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: #e8f4ec;
    color: #27ae60;
    font-size: 1.6rem;
    font-weight: 300;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 5px 5px 10px #c2d9c8, -5px -5px 10px #ffffff;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
    flex-shrink: 0;
  }

  .upload-btn:hover:not(:disabled) {
    box-shadow: 7px 7px 14px #c2d9c8, -7px -7px 14px #ffffff;
    transform: scale(1.05);
  }

  .upload-btn:active:not(:disabled) {
    box-shadow: inset 4px 4px 8px #c2d9c8, inset -4px -4px 8px #ffffff;
    transform: scale(0.97);
  }

  .upload-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .upload-label {
    flex: 1;
    min-width: 0;
  }

  .upload-hint {
    font-size: 0.83rem;
    color: #8aad93;
  }

  .upload-msg {
    font-size: 0.83rem;
    font-weight: 500;
  }

  .upload-msg.success { color: #1e8449; }
  .upload-msg.error   { color: #c0392b; }

  .hidden-input {
    display: none;
  }

  /* ── Divider ── */
  .divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #a8cfb4, transparent);
  }

  /* ── Answer panel ── */
  .answer-panel {
    background: #ffffff;
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    box-shadow: inset 3px 3px 8px #c2d9c8, inset -3px -3px 8px #f0faf4;
    min-height: 80px;
    border-left: 3px solid #27ae60;
  }

  .answer-text {
    font-size: 0.95rem;
    color: #1a3d2b;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .sources {
    margin-top: 0.85rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .sources-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #8aad93;
  }

  .source-chip {
    font-size: 0.75rem;
    color: #1e8449;
    background: #e8f4ec;
    border-radius: 20px;
    padding: 0.2rem 0.65rem;
    box-shadow: 3px 3px 6px #c2d9c8, -3px -3px 6px #ffffff;
  }

  /* ── Thinking dots ── */
  .thinking {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.4rem 0;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #27ae60;
    animation: pulse 1.2s ease-in-out infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.1); }
  }

  /* ── Input row ── */
  .input-row {
    display: flex;
    gap: 0.85rem;
    align-items: flex-end;
  }

  .question-input {
    flex: 1;
    resize: none;
    border: none;
    outline: none;
    background: #ffffff;
    border-radius: 16px;
    padding: 0.85rem 1.1rem;
    font-family: inherit;
    font-size: 0.9rem;
    color: #1a3d2b;
    line-height: 1.6;
    box-shadow: inset 4px 4px 10px #c2d9c8, inset -4px -4px 10px #f0faf4;
    transition: box-shadow 0.2s ease;
  }

  .question-input::placeholder {
    color: #8aad93;
  }

  .question-input:focus {
    box-shadow: inset 5px 5px 12px #b8d4be, inset -5px -5px 12px #ffffff;
  }

  .question-input:disabled {
    opacity: 0.6;
  }

  .send-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: #27ae60;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 5px 5px 10px #c2d9c8, -5px -5px 10px #ffffff,
                0 4px 15px #27ae6055;
    transition: box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
  }

  .send-btn svg {
    width: 18px;
    height: 18px;
  }

  .send-btn:hover:not(:disabled) {
    transform: scale(1.07);
    box-shadow: 7px 7px 14px #c2d9c8, -7px -7px 14px #ffffff,
                0 6px 20px #27ae6077;
  }

  .send-btn:active:not(:disabled) {
    transform: scale(0.95);
    box-shadow: inset 3px 3px 6px #1e8449, inset -2px -2px 4px #2ecc71;
  }

  .send-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    background: #7dba97;
    box-shadow: 4px 4px 8px #c2d9c8, -4px -4px 8px #ffffff;
  }

  /* ── Hint ── */
  .hint {
    font-size: 0.75rem;
    color: #8aad93;
    text-align: center;
    margin-top: -0.75rem;
  }

  /* ── Spinner ── */
  .spinner {
    display: inline-block;
    animation: spin 0.8s linear infinite;
    font-size: 1.2rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── History ── */
  .history {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .history-header {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #8aad93;
    padding-bottom: 0.25rem;
  }

  .history-item {
    background: #ffffff;
    border-radius: 12px;
    padding: 0.85rem 1rem;
    box-shadow: 4px 4px 8px #c2d9c8, -4px -4px 8px #ffffff;
  }

  .history-q {
    font-size: 0.8rem;
    font-weight: 600;
    color: #1e8449;
    margin-bottom: 0.3rem;
  }

  .history-a {
    font-size: 0.82rem;
    color: #4a7a5a;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
