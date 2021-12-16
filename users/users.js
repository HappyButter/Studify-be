let activeUsers = {};
// let chatRooms = {};

const addUser = (socket, userId, userName, chatRooms) => {
  const socketId = socket.id;
  if (!socketId) return { error: 'SocketId is required.' };
  if (!userId) return { error: 'UserId is required.' };
  if (!!chatRooms) chatRooms = [];

  activeUsers[socketId] = { userId, userName }

  chatRooms.forEach(room => socket.join(room));
  // chatRooms = chatRooms.reduce((prev, room) => {
  //   prev[room] = [...(prev[room] || []), socketId]; 
  //   return prev;
  // }, chatRooms);
  
  return;
}

const onUserDisconnect = (socketId) => {
  console.log(`delete socketId: ${socketId}`)
  delete activeUsers[socketId];
  return;

  // chatRooms = Object.keys(chatRooms).reduce((prev, room) => {
  //   const socketIndex = prev[room].indexOf(socketId);
    
  //   if (socketIndex === -1) return prev;
    
  //   prev[socketId] = prev[socketId].splice(socketIndex, 1)[0]; 
  //   return prev;
  // }, chatRooms)
}
const getUser = socketId => activeUsers[socketId];

// const addUser = ({ id, name, chatRooms }) => {

//   const existingUser = users.find(
//     user => user.id === id
//   );

//   if (!id) return { error: 'UserId and room are required.' };
//   if (existingUser) return { error: 'User already exists.' };

//   const newUser = { id, name, room };
//   users.push(newUser);

//   return newUser;
// };

// const removeUser = id => {
//   const index = users.findIndex(user => user.id === id);

//   if (index !== -1) return users.splice(index, 1)[0];
// };

// const getUser = id => users.find(user => user.id === id);

// const getUsersInRoom = room => users.filter(user => user.room === room);

export { addUser, onUserDisconnect, getUser };