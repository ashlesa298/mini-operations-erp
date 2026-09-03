import api from "./api";

const list = async (params = {}) => (await api.get("/orders", { params })).data.data;
const getOne = async (id) => (await api.get(`/orders/${id}`)).data.data;
const create = async (payload) => (await api.post("/orders", payload)).data.data;
const cancel = async (id) => (await api.patch(`/orders/${id}/cancel`)).data.data;

export default { list, getOne, create, cancel };