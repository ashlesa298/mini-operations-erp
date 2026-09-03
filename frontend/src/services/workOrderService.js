import api from "./api";

const list = async (params = {}) => (await api.get("/work-orders", { params })).data.data;
const getOne = async (id) => (await api.get(`/work-orders/${id}`)).data.data;
const create = async (payload) => (await api.post("/work-orders", payload)).data.data;
const updateStatus = async (id, status) => (await api.patch(`/work-orders/${id}/status`, { status })).data.data;

export default { list, getOne, create, updateStatus };