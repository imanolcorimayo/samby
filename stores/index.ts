import { defineStore } from "pinia";

const defaultObject = {
  userRole: "employee"
};
export const useIndexStore = defineStore("index", {
  state: (): any => {
    return Object.assign({}, defaultObject);
  },
  getters: {
    getUserRole: (state) => state.userRole
  },
  actions: {
    async updateUserRole(role: string) {
      this.userRole = role;
    }
  }
});
