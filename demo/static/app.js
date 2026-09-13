/**
 * 🌐 REACT AGENT WEB DEMO APP JAVASCRIPT
 * Handles UI interactions, API communications, tab switching, and live ReAct trace visualization.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Global DOM elements
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const matrixContainer = document.getElementById("matrix-container");
  const toolsContainer = document.getElementById("tools-container");
  const testcaseChips = document.getElementById("testcase-chips");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const reactTimeline = document.getElementById("react-timeline");
  const jsonTraceCode = document.getElementById("json-trace-code");
  const emptyTraceNotice = document.getElementById("empty-trace-notice");
  const btnRefreshWaterfall = document.getElementById("btn-refresh-waterfall");

  // Trace tabs
  const traceTabs = document.querySelectorAll(".trace-tab");
  const traceViews = document.querySelectorAll(".trace-view");

  // 1. Tab Switching
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
    });
  });

  // Trace View Switching
  traceTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetView = tab.getAttribute("data-view");
      traceTabs.forEach(t => t.classList.remove("active"));
      traceViews.forEach(v => v.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(targetView).classList.add("active");
    });
  });

  // 2. Fetch Initial System Info (/api/info)
  async function loadSystemInfo() {
    try {
      const res = await fetch("/api/info");
      if (!res.ok) return;
      const data = await res.json();

      // Render Student & Provider Info
      if (data.student) {
        document.getElementById("student-name").textContent = data.student.name;
        document.getElementById("student-id").textContent = `MSSV: ${data.student.id}`;
      }

      if (data.provider) {
        document.getElementById("llm-model-name").textContent = `Live LLM Adapter (${data.provider.model})`;
      }

      // Render Topic
      if (data.topic) {
        document.getElementById("topic-name").textContent = data.topic.name;
        document.getElementById("topic-desc").textContent = data.topic.description;
      }

      // Render Agentic Fit Matrix
      if (data.agentic_fit && data.agentic_fit.criteria) {
        matrixContainer.innerHTML = "";
        data.agentic_fit.criteria.forEach(item => {
          const percent = (item.score / 5) * 100;
          const el = document.createElement("div");
          el.className = "matrix-item";
          el.innerHTML = `
            <div class="matrix-header">
              <span class="matrix-title">${item.title}</span>
              <span class="matrix-badge">${item.score} / 5</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
            <div class="matrix-desc">${item.desc}</div>
          `;
          matrixContainer.appendChild(el);
        });
      }

      // Render Tools Specs
      if (data.tools) {
        toolsContainer.innerHTML = "";
        data.tools.forEach(tool => {
          const params = tool.parameters && tool.parameters.properties ? Object.keys(tool.parameters.properties).join(", ") : "None";
          const el = document.createElement("div");
          el.className = "tool-spec-card";
          el.innerHTML = `
            <div class="tool-spec-header">
              <span class="card-icon">🛠️</span>
              <span class="tool-spec-name">${tool.name}</span>
            </div>
            <p class="tool-spec-desc">${tool.description}</p>
            <div style="font-size: 0.75rem; color: var(--text-subtle);">
              <strong>Parameters:</strong> <code>(${params})</code>
            </div>
          `;
          toolsContainer.appendChild(el);
        });
      }

    } catch (e) {
      console.error("Failed to load system info:", e);
    }
  }

  // 3. Fetch Test Cases (/api/test-cases)
  async function loadTestCases() {
    try {
      const res = await fetch("/api/test-cases");
      if (!res.ok) return;
      const testcases = await res.json();

      testcaseChips.innerHTML = "";
      testcases.forEach(tc => {
        const btn = document.createElement("button");
        btn.className = "chip-btn";
        btn.innerHTML = `<strong>[${tc.id}]</strong> ${tc.question}`;
        btn.title = `Loại test: ${tc.type} (${tc.complexity})`;
        btn.addEventListener("click", () => {
          chatInput.value = tc.question;
          submitQuery(tc.question);
        });
        testcaseChips.appendChild(btn);
      });
    } catch (e) {
      console.error("Failed to load test cases:", e);
    }
  }

  // 4. Fetch Waterfall JSON Log
  async function loadWaterfallLog() {
    try {
      const res = await fetch("/api/waterfall");
      if (!res.ok) return;
      const logs = await res.json();
      jsonTraceCode.textContent = JSON.stringify(logs, null, 2);
      if (logs && logs.length > 0) {
        renderReActTimeline(logs);
      }
    } catch (e) {
      console.error("Failed to load waterfall log:", e);
    }
  }

  // 5. Submit Query to ReAct Agent (/api/chat)
  async function submitQuery(queryText) {
    if (!queryText) return;

    // Append User Message to Chat UI
    appendChatMessage("user", queryText);
    chatInput.value = "";

    // Show Typing Indicator
    const typingId = appendChatMessage("system", "🧠 ReAct Agent đang suy luận qua vòng lặp Thought ➔ Action ➔ Observation...");

    try {
      const startT = performance.now();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText })
      });
      const endT = performance.now();

      // Remove typing message
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      if (!res.ok) {
        appendChatMessage("system", "⚠️ Lỗi xử lý yêu cầu từ server.");
        return;
      }

      const data = await res.json();

      // Append Assistant Final Answer
      appendChatMessage("assistant", data.final_answer || "Đã hoàn tất xử lý.");

      // Render Live ReAct Steps Timeline
      renderReActTimeline(data.trace_logs, data.total_latency_ms);

      // Refresh Waterfall JSON viewer
      loadWaterfallLog();

    } catch (e) {
      console.error("Error submitting query:", e);
      appendChatMessage("system", "⚠️ Không thể kết nối tới Demo Server.");
    }
  }

  // Render ReAct Step-by-Step Timeline
  function renderReActTimeline(logs, totalLatencyMs) {
    if (!logs || logs.length === 0) {
      if (emptyTraceNotice) emptyTraceNotice.style.display = "block";
      reactTimeline.innerHTML = "";
      return;
    }

    if (emptyTraceNotice) emptyTraceNotice.style.display = "none";
    reactTimeline.innerHTML = "";

    logs.forEach((log, index) => {
      const card = document.createElement("div");
      card.className = "step-card";

      let badgeClass = "badge-thought";
      let badgeText = `Step ${log.step || index + 1}: Thought`;

      if (log.action_type === "TOOL_EXECUTION") {
        badgeClass = "badge-action";
        badgeText = `Step ${log.step || index + 1}: Action Call -> ${log.tool_name}`;
      } else if (log.action_type === "FINAL_ANSWER") {
        badgeClass = "badge-final";
        badgeText = `Step ${log.step || index + 1}: Final Answer`;
      }

      let contentHTML = `<div class="step-badge ${badgeClass}">${badgeText}</div>`;

      if (log.query) {
        contentHTML += `<div style="font-size: 0.75rem; color: var(--accent-cyan); margin-bottom: 0.4rem;"><strong>📌 Query:</strong> "${log.query}"</div>`;
      }

      if (log.thought) {
        contentHTML += `<p style="font-size: 0.85rem; color: #fff; margin-bottom: 0.5rem;"><strong>🧠 Thought:</strong> ${log.thought}</p>`;
      }

      if (log.action_type === "TOOL_EXECUTION") {
        contentHTML += `
          <div style="font-size: 0.8rem; color: var(--accent-amber); margin-bottom: 0.4rem;">
            <strong>🛠️ Action Proposed:</strong> <code>${log.tool_name}(${JSON.stringify(log.arguments)})</code>
          </div>
          <div style="font-size: 0.8rem; color: var(--accent-cyan);">
            <strong>👁️ Observation từ MCP Server:</strong>
            <pre class="code-block" style="margin-top: 0.25rem;"><code>${JSON.stringify(log.observation, null, 2)}</code></pre>
          </div>
        `;
      }

      if (log.output) {
        contentHTML += `
          <div style="font-size: 0.85rem; color: var(--accent-emerald); margin-top: 0.5rem;">
            <strong>🏁 Output:</strong> ${log.output}
          </div>
        `;
      }

      if (log.latency_ms !== undefined) {
        contentHTML += `<div style="font-size: 0.7rem; color: var(--text-subtle); margin-top: 0.4rem; text-align: right;">⏱️ Latency: ${log.latency_ms} ms</div>`;
      }

      card.innerHTML = contentHTML;
      reactTimeline.appendChild(card);
    });
  }

  // Helper: Append Chat Message
  function appendChatMessage(sender, text) {
    const msgId = "msg-" + Date.now();
    const messageEl = document.createElement("div");
    messageEl.className = `message ${sender}-message`;
    messageEl.id = msgId;

    const avatar = sender === "user" ? "👤" : sender === "assistant" ? "🤖" : "ℹ️";

    messageEl.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div class="msg-content">
        <p>${text.replace(/\n/g, "<br>")}</p>
      </div>
    `;

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgId;
  }

  // Form Submit Handler
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.strip ? chatInput.value.strip() : chatInput.value.trim();
    submitQuery(text);
  });

  // Reload Waterfall log button
  btnRefreshWaterfall.addEventListener("click", loadWaterfallLog);

  // Initialize Data
  loadSystemInfo();
  loadTestCases();
  loadWaterfallLog();
});
