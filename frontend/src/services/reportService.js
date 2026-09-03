import api from "./api";

const getDashboard = async () => (await api.get("/reports/dashboard")).data.data;

export default { getDashboard };