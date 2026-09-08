import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem("campusnotes_user");

    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    localStorage.removeItem("campusnotes_user");
    return null;
  }
};

const getSavedToken = () => {
  return localStorage.getItem("campusnotes_token");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getSavedUser);
  const [token, setToken] = useState(getSavedToken);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data;

    localStorage.setItem("campusnotes_token", token);
    localStorage.setItem("campusnotes_user", JSON.stringify(user));

    setToken(token);
    setUser(user);

    return user;
  };

  const register = async (name, email, password) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("campusnotes_token");
    localStorage.removeItem("campusnotes_user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};