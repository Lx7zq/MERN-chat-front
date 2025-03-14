import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { formatMessageTime } from "../utils/formatTime.js";
import ChatHeader from "./ChatHeader.jsx";
import MessageInput from "./MessageInput.jsx";
import MessageSkeleton from "./skeleton/MessageSkeleton.jsx";

const ChatContainer = () => {
  const {
    messages,
    isMessagesLoading,
    selectedUser,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    isFriend,
    friendRequestSent,
    friendRequestReceived,
    setIsFriend,
    setFriendRequestSent,
    setFriendRequestReceived,
    addFriend,
    acceptFriendRequest,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  useEffect(() => {
    //Get history messages
    getMessages(selectedUser?._id);
    //listen to socket
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedUser?._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);
  useEffect(() => {
    if (authUser && selectedUser) {
      setIsFriend(authUser.friends.includes(selectedUser._id));
      setFriendRequestReceived(
        authUser.friendRequestsReceived.includes(selectedUser._id)
      );
      setFriendRequestSent(authUser.friendRequests.includes(selectedUser._id));
    }
  }, [
    authUser,
    selectedUser,
    setIsFriend,
    setFriendRequestReceived,
    setFriendRequestSent,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  const handleAddFriend = () => {
    addFriend(selectedUser._id);
    setFriendRequestSent(true);
  };

  const handleAcceptFriendRequest = () => {
    acceptFriendRequest(selectedUser._id);
    setFriendRequestReceived(false);
    setFriendRequestSent(false);
    setIsFriend(true);
  };

  if (isMessagesLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />;
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="w-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>
      {!isFriend && !friendRequestSent && !friendRequestReceived && (
        <div className="flex justify-center items-center p-4">
          You must be friends with this user to send messages.
          <button className="ml-2 btn btn-primary" onClick={handleAddFriend}>
            Add friend
          </button>
        </div>
      )}
      {friendRequestSent && !isFriend && !friendRequestReceived && (
        <div className="flex justify-center items-center p-4">
          Friend request sent. Waiting for accept.
        </div>
      )}
      {friendRequestReceived && !isFriend && !friendRequestSent && (
        <div className="flex justify-center items-center p-4">
          This user has sent you a friend request.
          <button
            className="ml-2 btn btn-primary"
            onClick={handleAcceptFriendRequest}
          >
            Accept friend request
          </button>
        </div>
      )}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
