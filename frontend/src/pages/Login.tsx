import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { IoEye } from "react-icons/io5";
import { IoMdEyeOff } from "react-icons/io";
import api from '../lib/axios';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [seen, setSeen] = useState(false);
  const navigate = useNavigate();

  const Handlesubmit = async (e: any) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/login', { email, password })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed")
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0d1f3c 50%, #0d1117 100%)' }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#4ECDC4 1px, transparent 1px), linear-gradient(90deg, #4ECDC4 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full shadow-2xl border border-gray-700">

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 rounded-xl p-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-white mb-1">
            Welcome back
          </h1>
          <p className="text-center text-gray-400 text-sm mb-6">
            Sign in to continue coding
          </p>

          <div className="flex flex-col gap-4">
            {/* Email */}
            <input
              placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={seen ? "text" : "password"}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 pr-10 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
              />
              <button
                onClick={() => setSeen(!seen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
              >
                {seen ? <IoEye /> : <IoMdEyeOff />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm mt-3">{error}</div>
          )}

          <button
            onClick={Handlesubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-xl mt-6 transition cursor-pointer"
          >
            Sign In
          </button>

          <p className="text-center text-sm mt-4 text-gray-500">
            Don't have an account?{" "}
            <a href="/register" className="text-blue-400 hover:underline">
              Create one
            </a>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login