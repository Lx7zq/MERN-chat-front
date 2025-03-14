import { create } from "zustand";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUserLoading: false,
  isMessagesLoading: false,
  isFriend: false,
  friendRequestSent: false,
  friendRequestReceived: false,
  getUsers: async () => {
    set({ isMessagesLoading: true });
    try {
      const { data } = await api.get("/message/users");
      set({ users: data });
    } catch (error) {
      toast.error(error.response.data.messages || "Error while getting users");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    api
      .get(`/messages/${userId}`)
      .then(({ data }) => set({ messages: data, selectedUser: userId }))
      .catch((error) => {
        toast.error(
          error.response.data.messages || "Error while getting messages"
        );
      })
      .finally(() => set({ isMessagesLoading: false }));
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await api.post(
        `/messages/send${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(
        error.response.data.messages || "Error while sending message"
      );
    }
  },
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    socket.on("newMessage", (newMessage) => {
      const isMessageSendFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSendFromSelectedUser) return;
      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
  },
  addFriend: async (friendId) => {
    try {
      const res = await api.post(`/friends/add/${friendId}`);
      toast.success(res.data.message);

      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("friendRequestSent", friendId);
      }
      set({ friendRequestSent: true });
    } catch (error) {
      toast.error(
        error.response.data.message || "Error sending friend request"
      );
    }
  },
  // acceptFriendRequest: async (friend) => {},

  setIsFriend: (isFriend) => {
    set({ isFriend });
  },
  setIsFriendRequestSent: (sent) => {
    set({ friendRequestSent: sent });
  },
  setIsFriendRequestReceived: (received) => {
    set({ friendRequestReceived: received });
  },
}));
