let activeUsers = {};

const addUser = (socket, userId, userName, chatRooms) => {
  const socketId = socket.id;
  if (!socketId) return { error: 'SocketId is required.' };
  if (!userId) return { error: 'UserId is required.' };
  if (!chatRooms) chatRooms = [];

  activeUsers[socketId] = { userId, userName };

  chatRooms.forEach(async room => await socket.join(room));

  return;
}

const onUserDisconnect = (socketId) => {
  delete activeUsers[socketId];
  return;
}

const getUser = socketId => {
  return activeUsers[socketId]
};

const getAll = () => activeUsers;

export { addUser, onUserDisconnect, getUser, getAll };