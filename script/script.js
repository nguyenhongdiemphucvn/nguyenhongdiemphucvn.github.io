let editor;

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' }});
require(["vs/editor/editor.main"], function () {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: "// Viết mã tại đây...",
    language: "plaintext",
    theme: "vs-dark",
    automaticLayout: true,
    fontSize: 14
  });

  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: () => ({
      suggestions: [{
        label: 'console.log',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'console.log($1);',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Xuất dữ liệu ra bảng điều khiển'
      }]
    })
  });

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    uploadEditorCode();
  });

  monaco.editor.setModelMarkers(editor.getModel(), 'owner', [{
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: 1,
    endColumn: 10,
    message: "Cảnh báo mẫu: thay thế dòng này",
    severity: monaco.MarkerSeverity.Warning
  }]);
});

function changeFontSize(size) {
  editor.updateOptions({ fontSize: parseInt(size) });
}

function changeTheme(theme) {
  monaco.editor.setTheme(theme);
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    editor.setValue(content);
    setLanguageByFilename(file.name);
    showStatus(`Đang chỉnh sửa: ${file.name}`);
  };
  reader.readAsText(file);
}

function setLanguageByFilename(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript', py: 'python', html: 'html', css: 'css', json: 'json',
    md: 'markdown', java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp',
    ts: 'typescript', php: 'php', go: 'go', sh: 'shell', xml: 'xml',
    yaml: 'yaml', yml: 'yaml', swift: 'swift', rb: 'ruby', rs: 'rust',
    kt: 'kotlin', tex: 'latex'
  };
  const lang = map[ext] || 'plaintext';
  monaco.editor.setModelLanguage(editor.getModel(), lang);
}

async function fetchFileFromGitHub() {
  const token = prompt("Nhập GitHub Token:");
  const owner = prompt("Nhập tên người dùng GitHub:");
  const repo = prompt("Nhập tên kho lưu trữ:");
  const branch = prompt("Nhập tên nhánh (ví dụ: main):");
  const filename = prompt("Nhập tên tệp (ví dụ: index.html):");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${branch}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const content = atob(data.content);
      editor.setValue(content);
      setLanguageByFilename(filename);
      showStatus(`Đã tải ${filename} từ GitHub`);
    } else {
      const error = await res.json();
      showStatus(`❌ Lỗi: ${error.message}`, true);
    }
  } catch (error) {
    showStatus(`❌ Lỗi kết nối: ${error.message}`, true);
  }
}

async function uploadToGitHub(filename, content) {
  const token = prompt("Nhập GitHub Token:");
  const owner = prompt("Nhập tên người dùng GitHub:");
  const repo = prompt("Nhập tên kho lưu trữ:");
  const branch = prompt("Nhập tên nhánh (ví dụ: main):", "main");

  const encoded = btoa(unescape(encodeURIComponent(content)));
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;

  const data = {
    message: `Tải lên ${filename} qua Web`,
    content: encoded,
    branch: branch
  };

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (res.ok) {
      showStatus(`✔️ Đã tải lên ${filename} lên GitHub`);
    } else {
      showStatus(`❌ Lỗi: ${json.message}`, true);
    }
  } catch (err) {
    showStatus(`❌ Lỗi kết nối: ${err.message}`, true);
  }
}

function uploadEditorCode() {
  const content = editor.getValue();
  const filename = prompt("Nhập tên tệp để lưu lên GitHub:");
  if (!filename) return showStatus("Bạn cần nhập tên tệp.", true);
  setLanguageByFilename(filename);
  uploadToGitHub(filename, content);
}

function downloadFile() {
  const content = editor.getValue();
  const filename = prompt("Nhập tên tệp để tải xuống:", "code.txt");
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function previewCode() {
  const content = editor.getValue();
  const model = editor.getModel();
  const language = monaco.editor.getModelLanguage(model);

  document.getElementById("preview").style.display = "block";
  document.getElementById("htmlPreview").style.display = "none";
  document.getElementById("mdPreview").style.display = "none";

  if (language === "html") {
    const iframe = document.getElementById("htmlPreview");
    iframe.style.display = "block";
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();
  } else if (language === "markdown") {
    const mdDiv = document.getElementById("mdPreview");
    mdDiv.innerHTML = marked.parse(content);
    mdDiv.style.display = "block";
  } else {
    showStatus("❌ Chỉ hỗ trợ xem trước HTML và Markdown.", true);
  }
}

function showStatus(msg, isError = false) {
  const status = document.getElementById("status");
  status.style.color = isError ? "red" : "lightgreen";
  status.textContent = msg;
}

window.addEventListener('DOMContentLoaded', () => {
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  for (let i = 8; i <= 40; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${i}px`;
    if (i === 14) option.selected = true;
    fontSizeSelect.appendChild(option);
  }

  fontSizeSelect.addEventListener('change', (e) => changeFontSize(e.target.value));
  document.getElementById('themeSelect').addEventListener('change', (e) => changeTheme(e.target.value));
});
