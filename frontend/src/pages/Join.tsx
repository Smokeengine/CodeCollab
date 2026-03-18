import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/axios'

const Join = () => {
  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const joinDoc = async () => {
      try {
        const response = await api.get(`/api/join/${token}`)
        navigate(`/editor/${response.data.docID}`)
      } catch (error) {
        console.log(error)
        navigate('/login')
      }
    }
    joinDoc()
  }, [token])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Joining document...</p>
    </div>
  )
}

export default Join