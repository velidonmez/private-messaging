<template>
  <div id="app" style="display: flex">
    <select-username v-if="!usernameAlreadySelected" @input="onUsernameSelection"/>
    <chat v-else/>
    <div style="display: flex;flex-direction: column">
      <button v-for="room in rooms" :key="room.id" @click="joinRoom(room.title)">{{ room.title }}</button>
      <span>---------------</span>
      <button v-for="user in users" :key="user.username" @click="userConnect(user)">Connect {{ user.username }}</button>
      <span>----------------</span>
      <button @click="userDisconnect">Disconnect</button>
      <span>----------------</span>
      {{ roomHistory }}
      <span>----------------</span>
      <form @submit.prevent="sendMessage" class="form">
        <textarea v-model="message" placeholder="Your message..." class="input"/>
        <button class="send-button">Send</button>
      </form>
    </div>
  </div>
</template>

<script>
import SelectUsername from "./components/SelectUsername.vue";
import Chat from "./components/Chat.vue";
import socket from "./socket";

export default {
  name: "App",
  components: {
    Chat,
    SelectUsername,
  },
  data() {
    return {
      usernameAlreadySelected: true,
      rooms: [],
      roomHistory: [],
      activeRoom: '',
      sender: '',
      message: '',
      users: [
        {
          accountType: 'individual',
          "id": 5,
          "email": "bengisu@yopaat.com",
          "first_name": "Bengisu",
          "middle_name": null,
          "last_name": "Akdeniz",
          "username": "individual_bengisu",
          "token": 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczpcL1wvdGVzdC5nZXN1bWUuY29tIiwiYXVkIjoiSW5kaXZpZHVhbCIsInN1YiI6NSwiaWF0IjoxNjc0NjU0MDMxLCJleHAiOjE2NzQ2ODY0MzEsImp0aSI6IjExNTc1NDA5Mzc2M2QxMzE0ZjI0Y2E3MS42NjE0MDY2NCJ9.KA5BAqPIWuEx3L_4hjAIQMGlUirmrxFvIIUcyk6i3eg'
        },
        {
          accountType: 'employer',
          "id": 1,
          "email": "cagri@yopaat.com",
          "first_name": "Çagrı",
          "middle_name": null,
          "last_name": "Employer",
          "username": "employer_cagri",
          "token": 'test'
        }
      ]
    };
  },
  methods: {
    joinRoom(id) {
      this.activeRoom = id
      socket.emit("join-room", id);
      socket.emit("room-history", id);
      socket.on('receive-message', (data) => {
        console.log(data)
      })
    },
    sendMessage() {
      socket.emit("send-message", {
        sender: this.sender,
        content: this.message,
        room: this.activeRoom
      });
    },
    userDisconnect() {
      socket.disconnect()
    },
    userConnect(user) {
      socket.auth = {user};
      this.sender = user.id
      socket.connect();

      socket.on('rooms', (rooms) => {
        this.rooms = rooms
      })

      socket.on('room-history', (data) => {
        console.log(data)
        this.roomHistory = data
      })

      socket.on('receive-message', (data) => {
        console.log('message received')
        this.roomHistory.push(data)
      })

      socket.on("session", ({rooms, id}) => {
        console.log('session live')
        console.log({rooms, id})
        // attach the session ID to the next reconnection attempts
        // socket.auth = {sessionID, user};
        // save the ID of the user
        // socket.userID = userID;
      });

      socket.on("connect_error", (err) => {
        console.log(err.message); // prints the message associated with the error
      });
    },
    onUsernameSelection(username) {
      this.usernameAlreadySelected = true;
      socket.auth = {username};
      socket.connect();
    },
  },
  unmounted() {
    socket.off("connect_error");
  },
};
</script>

<style>
body {
  margin: 0;
}

@font-face {
  font-family: Lato;
}

#app {
  font-family: Lato, Arial, sans-serif;
  font-size: 14px;
}
</style>
