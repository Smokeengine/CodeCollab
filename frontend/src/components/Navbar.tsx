import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import api from "../lib/axios";

const Navbar = () => {
  const navigate = useNavigate();
  const userData = localStorage.getItem("user");
  const user = userData && userData !== "undefined" ? JSON.parse(userData) : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/api/me')
        setAvatarUrl(response.data.avatarUrl)
        const updatedUser = { ...user, avatarUrl: response.data.avatarUrl }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      } catch (error) {
        console.log(error)
      }
    }
    if (user) fetchUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    try {
      const response = await api.post("/api/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarUrl(response.data.avatarUrl);
      const updatedUser = { ...user, avatarUrl: response.data.avatarUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.log(error);
    } finally {
      setUploading(false);
      setShowAvatarModal(false);
    }
  };

  return (
    <>
      <nav className="bg-gray-900 px-6 py-4 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="bg-blue-600 rounded-lg p-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white">CollabCode</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">

              {/* Avatar with change indicator */}
              <div
                className="relative cursor-pointer group"
                onClick={() => setShowAvatarModal(true)}
                title="Change profile picture"
              >
                {/* Avatar circle */}
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-600 group-hover:border-blue-500 transition">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Small arrow badge */}
                <div className="absolute -bottom-1 -right-1 bg-gray-700 group-hover:bg-blue-600 border border-gray-900 rounded-full w-4 h-4 flex items-center justify-center transition">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <span className="text-gray-400 text-sm"> {user.name}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1 cursor-pointer"
          >
            ⏻ {user ? "Logout" : "Login/Signup"}
          </button>
        </div>
      </nav>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold">Profile Picture</h2>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="text-gray-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current avatar preview */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-sm">{user?.name}</p>
              <p className="text-gray-600 text-xs">{user?.email}</p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Choose Image
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;