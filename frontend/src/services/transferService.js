import api from "./api";

const list = async (params = {}) => (await api.get("/transfers", { params })).data.data;
const getOne = async (id) => (await api.get(`/transfers/${id}`)).data.data;
const create = async (payload) => (await api.post("/transfers", payload)).data.data;
const dispatch = async (id) => (await api.patch(`/transfers/${id}/dispatch`)).data.data;
const receive = async (id) => (await api.patch(`/transfers/${id}/receive`)).data.data;

export default { list, getOne, create, dispatch, receive };