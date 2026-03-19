import { useParams } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import { useEffect, useState, useRef } from "react";
import api from "../lib/axios";
import { io } from "socket.io-client";
import * as Y from "yjs";
import * as monaco from "monaco-editor";
import Input from "../components/Input";
import { IoSend } from "react-icons/io5";

const Editor = () => {
  const { id } = useParams();

  const ydocRef = useRef<Y.Doc | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);

  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
    yTextRef.current = ydocRef.current.getText("code");
  }

  const ydoc = ydocRef.current;
  const yText = yTextRef.current!;

  const [language, setLanguage] = useState("javascript");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ userId: string; name: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const socketRef = useRef<any>(null);
  const contentLoaded = useRef(false);
  const suppressRef = useRef(false);
  const docReady = useRef(false);
  const editorRef = useRef<any>(null);
  const [output, setOutput] = useState("");
  const [outputOpen, setOutputOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareRole, setShareRole] = useState("VIEWER");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const generateShareLink = async () => {
    try {
      const response = await api.post(`/api/documents/${id}/share`, { role: shareRole });
      const token = response.data.token;
      setShareLink(`${window.location.origin}/join/${token}`);
    } catch (error) {
      console.log(error);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveDocument = async () => {
    const content = editorRef.current?.getValue();
    if (!content) return;
    try {
      await api.patch(`/api/documents/${id}`, { content });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-doc", { docId: id });
    });

    socket.on("doc-update", ({ update }: { update: number[] }) => {
      if (!docReady.current) return;
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    ydoc.on("update", (update: Uint8Array, origin: any) => {
      if (origin === "local") return;
      if (!docReady.current) return;
      socket.emit("doc-update", { docId: id, update: Array.from(update) });
    });

    socket.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => { socket.disconnect(); };
  }, [id]);

  const handleMount = (editor: any) => {
    editorRef.current = editor;
    const model = editor.getModel();

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => { saveDocument(); }
    );

    const loadContent = async () => {
      if (contentLoaded.current) return;
      contentLoaded.current = true;
      

      try {
        const response = await api.get(`/api/documents/${id}`);
        setLanguage(response.data.documents.language || "javascript");
        setTitle(response.data.documents.title);
        setRole(response.data.role);
        console.log('role from api', response.data.role)

        const savedContent = response.data.documents.content;
        if (savedContent) {
          suppressRef.current = true;

          const fullRange = model.getFullModelRange();
          model.pushEditOperations(
            [],
            [{ range: fullRange, text: savedContent }],
            () => null
          );

          ydoc.transact(() => {
            if (yText.length > 0) yText.delete(0, yText.length);
            yText.insert(0, savedContent);
          }, "load");

          setTimeout(() => {
            suppressRef.current = false;
            docReady.current = true;
          }, 200);
        } else {
          docReady.current = true;
        }
      } catch (error) {
        suppressRef.current = false;
        docReady.current = true;
        console.log(error);
      }
    };
    loadContent();

    model.onDidChangeContent(() => {
      if (suppressRef.current) return;
      const value = editor.getValue();
      if (value !== yText.toString()) {
        suppressRef.current = true;
        ydoc.transact(() => {
          yText.delete(0, yText.length);
          yText.insert(0, value);
        }, "local");
        suppressRef.current = false;
      }
    });

    yText.observe((_event, transaction) => {
      if (transaction.origin === "local") return;
      if (transaction.origin === "load") return;
      if (suppressRef.current) return;
      const value = yText.toString();
      if (editor.getValue() !== value) {
        suppressRef.current = true;
        model.setValue(value);
        suppressRef.current = false;
      }
    });
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userData = localStorage.getItem("user");
    if (!userData || userData === "undefined") return;
    const user = JSON.parse(userData);
    socketRef.current.emit("chat-message", {
      docId: id,
      message: { userId: user.id, name: user.name, text: chatInput },
    });
    setChatInput("");
  };

  const runCode = async () => {
    setRunning(true);
    setOutputOpen(true);
    setOutput("");
    const code = editorRef.current?.getValue() || "";

    if (language === "javascript") {
      const logs: string[] = [];
      try {
        const capturedConsole = {
          log: (...args: any[]) => logs.push(args.map(String).join(" ")),
          error: (...args: any[]) => logs.push("Error: " + args.map(String).join(" ")),
          warn: (...args: any[]) => logs.push("Warning: " + args.map(String).join(" ")),
        };
        const fn = new Function("console", code);
        fn(capturedConsole);
        setOutput(logs.join("\n") || "Code ran with no output");
      } catch (err: any) {
        setOutput("Error: " + err.message);
      } finally {
        setRunning(false);
      }
      return;
    }

    const languageIds: Record<string, number> = {
      python: 71, typescript: 74, go: 60, rust: 73, cpp: 54, java: 62,
    };

    const languageId = languageIds[language.toLowerCase()];
    if (!languageId) {
      setOutput(`Language ${language} not supported yet`);
      setRunning(false);
      return;
    }

    try {
      const submitRes = await fetch(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": import.meta.env.VITE_JUDGE0_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          body: JSON.stringify({ source_code: code, language_id: languageId }),
        }
      );
      const result = await submitRes.json();
      if (result.stdout) setOutput(result.stdout);
      else if (result.stderr) setOutput("Error: " + result.stderr);
      else if (result.compile_output) setOutput("Compile error: " + result.compile_output);
      else setOutput("No output");
    } catch (err: any) {
      setOutput("Error: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-screen bg-gray-950 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
          <span className="text-white font-bold text-sm">{title}</span>
          <div className="flex items-center gap-2">

            {role !== 'VIEWER' && (
              <button onClick={saveDocument}
                className={`px-3 py-1 rounded-lg text-sm font-medium cursor-pointer ${
                  saved ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}>
                {saved ? "✓ Saved" : "Save"}
              </button>
            )}

            {role !== 'VIEWER' && language !== 'MARKDOWN' && language !== 'markdown' && (
              <button onClick={runCode} disabled={running}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50">
                {running ? "Running..." : "▶ Run"}
              </button>
            )}

            {role === 'OWNER' && (
              <button onClick={() => setShowShareModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium cursor-pointer">
                Share
              </button>
            )}

            <button onClick={() => setChatOpen(!chatOpen)}
              className={`px-3 py-1 rounded-lg text-sm font-medium cursor-pointer ${
                chatOpen ? "text-gray-400 hover:text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}>
              {chatOpen ? "Hide chat" : "Show chat"} 💬
            </button>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold">Share Document</h2>
                <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-white cursor-pointer">✕</button>
              </div>
              <div className="flex flex-col gap-4">
                <select value={shareRole} onChange={(e) => setShareRole(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white rounded-lg p-3 text-sm focus:outline-none">
                  <option value="VIEWER">Viewer — can read only</option>
                  <option value="EDITOR">Editor — can edit</option>
                </select>
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg cursor-pointer font-medium"
                  onClick={generateShareLink}>Generate Link</button>
                {shareLink && (
                  <div className="flex flex-col gap-2">
                    <input type="text" value={shareLink} readOnly
                      className="w-full bg-gray-800 border border-gray-600 text-gray-300 rounded-lg p-3 text-xs font-mono" />
                    <button onClick={copyLink}
                      className={`p-3 rounded-lg cursor-pointer font-medium text-sm ${
                        copied ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                      }`}>
                      {copied ? "✓ Copied!" : "Copy Link"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Monaco */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`${outputOpen ? "h-2/3" : "flex-1"} overflow-hidden`}>
            <MonacoEditor
              height="100%"
              language={language}
              theme="vs-dark"
              onMount={handleMount}
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: role === 'VIEWER',
              }}
            />
          </div>
          {outputOpen && (
            <div className="h-1/3 bg-gray-950 border-t border-gray-700 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                <span className="text-gray-400 text-xs font-semibold uppercase">Output</span>
                <button onClick={() => setOutputOpen(false)} className="text-gray-500 hover:text-white text-xs">✕ Close</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-400 whitespace-pre-wrap">{output}</div>
            </div>
          )}
        </div>
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">Chat</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((m, index) => (
              <div key={index}>
                <p className="text-xs text-green-400 font-semibold">{m.name}</p>
                <p className="text-white text-sm bg-gray-800 rounded-lg p-2 mt-1">{m.text}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-800 flex gap-2">
            <Input className="text-white flex-1" value={chatInput}
              onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." />
            <button className="bg-green-500 p-3 rounded-full cursor-pointer hover:bg-green-600" onClick={sendMessage}>
              <IoSend className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;