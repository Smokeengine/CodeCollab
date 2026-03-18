import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Editor from "./pages/Editor";
import Navbar from "./components/Navbar";
import Join from './pages/Join'




function App() {

  return (
    <BrowserRouter>
    <Navbar/>
     <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register />}/>
      <Route path="/editor/:id" element={<Editor/>}/>
      <Route path="/join/:token" element={<Join />} />
     </Routes>
    </BrowserRouter>
  )
}

export default App
