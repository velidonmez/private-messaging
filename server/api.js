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
exports.userRooms = () => {
  return [
    {
      id: 1,
      title: 'room#1',
      lastMessage: 'Thank you. See you soon.',
      participants: [
        {
          id: 5,
          username: 'individual_bengisu'
        },
        {
          id: 1,
          username: 'individual_cagri'
        }
      ]
    },
    {
      id: 2,
      title: 'room#2',
      lastMessage: 'Have a nice day',
      participants: [
        {
          id: 5,
          username: 'individual_bengisu'
        },
        {
          id: 1,
          username: 'individual_cagri'
        }
      ]
    }
  ]
}

// fetch chat history
exports.roomHistory = () => {
  return [
    {
      sender: 5,
      room: 'room#1',
      content: 'How can I help you?',
    },
    {
      sender: 1,
      room: 'room#1',
      content: 'You cant',
    }
  ]
}

// Create room
exports.createRoom = () => {

}

// Save message to api
exports.saveMessage = ({room, content, sender}) => {
  console.log({room, content, sender})
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
