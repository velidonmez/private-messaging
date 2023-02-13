const http = require('axios');
require('dotenv').config()

http.defaults.baseURL = process.env.API_URL;
http.defaults.headers.common['Content-Type'] = 'application/json';

exports.checkToken = async (token, accountType) => {
  let result = false
  if (token && accountType) {
    const reqPath = accountType === 'individual' ? '/individual/check/token' : '/employer/check/token'
    await http.post(reqPath, {token}).then(() => {
      result = true
    }).catch(() => {
      result = false
    })
  } else {
    result = false
  }
  return result
};

// fetch room list for session owner
exports.userRooms = async (token) => {
  let rooms = []
  http.defaults.headers.common['Authorization'] = `Bearer ${token}`
  await http.get('/get/messages/all').then((res) => {
    rooms = res.data.payload.messages
  }).catch((err) => {
    console.log(err.response.data)
  })
  return rooms
}

// Create room
exports.createRoom = () => {

}

// Save message to api
exports.saveMessage = async ({conversationId, content, token}) => {
  let message = null
  http.defaults.headers.common['Authorization'] = `Bearer ${token}`
  await http.post('/message/new', {
    conversation_id: conversationId,
    message: content
  }).then((res) => {
    message = res.data.payload.message
  }).catch((err) => {
    console.log(err.response.data)
  })
  return message
}

// exports.userData = async (username, token, accountType) => {
//   let result = null
//   const reqPath = accountType === 'individual' ? `individual/profile/${username}/0` : `employer/profile/${username}/0`
//
//   await http.get(reqPath, {
//     headers: {
//       Authorization: `Bearer ${token}`
//     }
//   }).then((response) => {
//     return response.data.payload.individual
//   }).catch(() => {
//     return new Error('Failed to get user information.')
//   })
//   return result
// };
