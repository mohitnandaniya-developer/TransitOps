import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// x-user-email and x-user-role are set in App.jsx on login
export default api;
