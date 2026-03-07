import { useState } from 'react';
import axios from 'axios';

// Dynamically route to Render in production, or localhost during development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AuthModals({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // UPDATED: Using the dynamic API_BASE_URL
    const url = isLogin ? `${API_BASE_URL}/api/token/` : `${API_BASE_URL}/api/register/`;
    
    try {
      const res = await axios.post(url, formData);
      if (isLogin) {
        // Store the JWT tokens securely
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        localStorage.setItem('username', formData.username);
        onLoginSuccess(formData.username);
      } else {
        setIsLogin(true); // Move to login after successful registration
        alert("Account created! Please log in.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 w-full max-w-md">
      <h2 className="text-2xl font-bold text-brand-dark mb-6 text-center">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username"
          className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none"
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          required
        />
        {!isLogin && (
          <input
            type="email"
            placeholder="Email Address"
            className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        )}
        <input
          type="password"
          placeholder="Password"
          className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button type="submit" className="bg-brand-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all">
          {isLogin ? 'Login to Car Match' : 'Register Now'}
        </button>
      </form>

      <button 
        onClick={() => setIsLogin(!isLogin)}
        className="mt-6 text-sm text-gray-500 hover:text-brand-primary w-full text-center font-medium"
      >
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
      </button>
    </div>
  );
}