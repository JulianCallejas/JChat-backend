# Jchat

## Public and private chatrooms
Welcome to our chatrooms project! This allows both public and private chatrooms.

The public chatroom is available to everyone. Users can join the public chatroom and start chatting right away without the need for registration or login.

However, this project also allows private chatrooms for users who want more privacy in their conversations. Users need to register and login in order to access private chatrooms . This is to ensure the safety and security.

## Stack
This is the Backend of the project, made with Express, Socket.io and MySql database, it also includes jsonwebtoken and bcrypt to secure the sessions and Register and Login with Google account.

The Frontend was made with Angular 15.2, rxjs and socket.io-client. All the services for the socket.io-client were self-coded.. You need to install it to make it work.

## Installation

1. Clone the repository
2. Create the MySQL Database
3. Create the `users` table

    ```sql
    CREATE TABLE `users` (
    `email` varchar(60) NOT NULL,
    `username` varchar(45) NOT NULL,
    `password` varchar(100) NOT NULL,
    `userState` varchar(100) DEFAULT 'Available',
    `avatar` varchar(200) DEFAULT '../../../assets/imgs/avatar/guest.png',
    `creatingDate` datetime DEFAULT CURRENT_TIMESTAMP,
    `active` tinyint DEFAULT '1',
    PRIMARY KEY (`email`),
    UNIQUE KEY `email_UNIQUE` (`email`),
    UNIQUE KEY `username_UNIQUE` (`username`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    ```
4. Create the `.env` file. See .env.template for more information.
5. Install dependencies

    ```bash
    npm install
    ```

6. Start development mode

    ```bash
    npm run dev
    ```