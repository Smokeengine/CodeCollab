import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import Input from "../components/Input";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoCloseSharp } from "react-icons/io5";


const Home = () => {
  const navigate = useNavigate();
  const [documents, setdocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("CODE");
  const [language, setLanguage] = useState("javascript");
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [editDoc, setEditDoc] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");

  const fetchDocuments = async () => {
    try {
      const response = await api.get("/api/documents");
      setdocuments(response.data.documents);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    fetchDocuments();
  }, []);

  const createDocument = async () => {
    try {
      if (!title) return setErr("Please Enter the title!");
      await api.post("/api/document", {
        title,
        type,
        language: type === "CODE" ? language : null,
      });
      setShowModal(false);
      setTitle("");
      setErr("");
      fetchDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteDocument = async (id: any) => {
    try {
      await api.delete(`/api/documents/${id}`);
      setShowMenu(null);
      fetchDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  const updateDocument = async () => {
    if (!editTitle.trim()) return;
    try {
      await api.patch(`/api/documents/${editDoc.id}`, {
        title: editTitle,
        type: editType,
      });
      setEditDoc(null);
      fetchDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">


      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            onClick={() => setShowModal(true)}
          >
            + New Document
          </button>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-white font-bold text-lg mb-4">New Document</h2>
              <div className="flex flex-col gap-4">
                <Input
                  type="text"
                  placeholder="Document title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
                />
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    if (e.target.value === "MARKDOWN") setLanguage("");
                  }}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 text-sm focus:outline-none"
                >
                  <option value="CODE">Code</option>
                  <option value="MARKDOWN">Markdown</option>
                </select>
                {type === "CODE" && (
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 text-sm focus:outline-none"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                )}
              </div>
              {err && <p className="flex italic items-center justify-center mt-4 text-red-500">{err}</p>}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-600 text-gray-400 rounded-lg p-3 text-sm hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={createDocument}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 text-sm font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editDoc && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold">Edit Document</h2>
                <button onClick={() => setEditDoc(null)} className="text-gray-500 hover:text-white cursor-pointer">✕</button>
              </div>
              <div className="flex flex-col gap-4">
                <input
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Document title"
                />
               
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditDoc(null)}
                  className="flex-1 border border-gray-600 text-gray-400 rounded-lg p-3 text-sm hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={updateDocument}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 text-sm font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc: any) => (
            <div
              key={doc.id}
              className="relative bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition cursor-pointer"
              onDoubleClick={() => navigate(`/editor/${doc.id}`)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{doc.title}</h3>
                  <p className="text-gray-500 text-xs mt-1">{doc.language && doc.language}</p>
                </div>
                <div className="flex items-center gap-4 justify-evenly">
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{doc.type}</span>
                  <button
                    className="relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(showMenu === doc.id ? null : doc.id);
                    }}
                  >
                    {showMenu === doc.id ? <IoCloseSharp /> : <BsThreeDotsVertical />}
                  </button>
                </div>
              </div>

              {showMenu === doc.id && (
                <div className="absolute right-4 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 w-36">
                  <button
                    onClick={() => {
                      setEditDoc(doc);
                      setEditTitle(doc.title);
                      setEditType(doc.type);
                      setShowMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg"
                  >
                    Delete
                  </button>
                </div>
              )}

              <p className="text-gray-600 text-xs mt-4">
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}

          {documents.length === 0 && (
            <div className="col-span-3 text-center text-gray-600 py-20">
              No projects yet. Create your first one!
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;