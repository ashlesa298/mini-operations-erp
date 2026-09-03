import api from "./api";

const register = async (payload) => (await api.post("/auth/register", payload)).data.data;
const login = async (payload) => (await api.post("/auth/login", payload)).data.data;
const getMe = async () => (await api.get("/auth/get-me")).data.data;
const logout = async () => {
  await api.post("/auth/logout");
};

export default { register, login, getMe, logout };