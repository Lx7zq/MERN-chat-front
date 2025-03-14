import { create } from "zustand";
import toast from "react-hot-toast";
import api from "../services/api";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  socket: null,
  isCheckingAuth: false,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await api.get("/auth/check");
      set({ authUser: res.data });
    } catch (error) {
      console.log("Error in checkAuth", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await api.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },
  signin: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await api.post("/auth/signin", data);
      set({ authUser: res.data });
      get().connectSocket();
      toast.success("Signed in successfully!");
    } catch (error) {
      toast.error(error.response.data.message || "Error signing in");
    } finally {
      set({ isLoggingIn: false });
    }
  },
  signout: async () => {
    try {
      console.log("1");

      await api.post("/auth/signout");
      set({ authUser: null });
      get().disconnect();
      toast.success("Signed out successfully!");
    } catch (error) {
      toast.error(error.response.data.message || "Error signing out");
    }
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await api.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser || socket?.connected) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    console.log("socketUrl", authUser._id);

    const newSocket = io(socketUrl, {
      query: {
        userId: authUser._id,
      },
    });

    newSocket.connect();

    set({ socket: newSocket });
    //listen for online users
    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    newSocket.on("friendRequestReceived", (friendId) => {
      const selectedUser = useChatStore.getState().selectedUser;
      if (friendId === selectedUser?._id) {
        useChatStore.getState().setFriendRequestReceived(true);
      }
    });
    newSocket.on("friendRequestSent", (friendId) => {
      const selectedUser = useChatStore.getState().selectedUser;
      if (friendId === selectedUser?._id) {
        useChatStore.getState().setFriendRequestReceived(false);
      }
    });
    newSocket.on("friendRequestReceived", (friendId) => {
      const selectedUser = useChatStore.getState().selectedUser;
      if (friendId === selectedUser?._id) {
        useChatStore.getState().setFriendRequestReceived(false);
        useChatStore.getState().setFriendRequestSent(false);
        useChatStore.getState().setIsFriend(true);
      }
    });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
