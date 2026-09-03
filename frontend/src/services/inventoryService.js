import api from "./api";

const list = async (params = {}) => (await api.get("/inventory", { params })).data.data;
const getOne = async (id) => (await api.get(`/inventory/${id}`)).data.data;
const create = async (payload) => (await api.post("/inventory", payload)).data.data;
const adjust = async (id, payload) => (await api.patch(`/inventory/${id}/adjust`, payload)).data.data;

export default { list, getOne, create, adjust };