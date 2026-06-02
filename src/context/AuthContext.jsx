import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();
const API_URL = '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load active user session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('activeUserSession');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        console.error("Failed to parse active user session");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password, role) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('activeUserSession', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.error || 'Login gagal.' };
      }
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Koneksi ke server gagal.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('activeUserSession');
  };

  const updateCompanyInfo = async (info) => {
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/company`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: info.name })
      });
      if (res.ok) {
        const updatedUser = { ...user, companyInfo: info };
        setUser(updatedUser);
        localStorage.setItem('activeUserSession', JSON.stringify(updatedUser));
      }
    } catch(e) { 
      console.error(e); 
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        return { success: true };
      } else {
        return { success: false, message: data.error || 'Registrasi gagal.' };
      }
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Koneksi ke server gagal.' };
    }
  };

  const updateProfile = async (profileData) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        const updatedUser = { ...user, profile: { ...user.profile, ...profileData } };
        setUser(updatedUser);
        localStorage.setItem('activeUserSession', JSON.stringify(updatedUser));
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menyimpan profil');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateCompanyInfo, register, updateProfile, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
