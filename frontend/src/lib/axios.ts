import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('interceptor firing, token:', token)
    console.log('interceptor firing, user:', user)
    console.log('headers:', config.headers)
    if(token){
        config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
})

export default api;