# Twitch Logger

This project is a simple Twitch chat logger that connects to a specified Twitch channel and logs messages into a JSON file.

## Project Structure

```
twitch-logger
├── src
│   ├── tmitest.js        # Initializes the Twitch chat client and logs messages
│   └── tmi.min.js       # Minified version of the TMI.js library
├── package.json          # npm configuration file
└── README.md             # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd twitch-logger
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the application:**
   ```
   node src/tmitest.js
   ```

## Usage

- The application connects to the specified Twitch channel and listens for messages.
- Each message received is logged into a JSON file with relevant metadata, including the username and timestamp.

## License

This project is licensed under the MIT License.