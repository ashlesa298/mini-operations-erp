import api from "./api";

const list = async () => (await api.get("/employees")).data.data;
const create = async (payload) => (await api.post("/employees", payload)).data.data;
const update = async (id, payload) => (await api.patch(`/employees/${id}`, payload)).data.data;

export default { list, create, update };