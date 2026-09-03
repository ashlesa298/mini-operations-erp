import api from "./api";

const getLocations = async () => (await api.get("/meta/locations")).data.data;
const createLocation = async (payload) => (await api.post("/meta/locations", payload)).data.data;
const getCategories = async () => (await api.get("/meta/categories")).data.data;
const createCategory = async (payload) => (await api.post("/meta/categories", payload)).data.data;
const getItems = async () => (await api.get("/meta/items")).data.data;
const createItem = async (payload) => (await api.post("/meta/items", payload)).data.data;
const getUsers = async () => (await api.get("/meta/users")).data.data;
const getCustomers = async () => (await api.get("/meta/customers")).data.data;

export default {
  getLocations,
  createLocation,
  getCategories,
  createCategory,
  getItems,
  createItem,
  getUsers,
  getCustomers,
};