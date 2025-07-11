# Stream Credits

Twitch stream analytics and credits system for PSP1G's streams. This project automatically tracks stream data, chat statistics, user attendance, and generates beautiful end-of-stream credits available either as an OBS browser source or to be viewed in the browser where you can look at all past logs.

## Features

- Real-time message counting and chat statistics
- Automatically detects if streamer went live
- Top chatters tracking with message counts
- Moderation action logging (timeouts, bans, deleted messages)
- Emote usage tracking and top emotes display
- First-time chatter detection
- Automatic tracking of users present during streams
- Consecutive attendance streak calculation
- Stream title and category change history
- Special guests and featured streamers 
- Raid statistics 
- Moderator activity and rankings
- Support tracking (subscriptions, cheers, gifts)






## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Twitch account for chat integration

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd stream-credits
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**

   Create a `.env` file in the root directory or use the provided template. Example:
      ```env
      TWITCH_CLIENT_ID=<your client id here>
      TWITCH_CLIENT_SECRET=<your client secret here>
      WEBHOOKS_SECRET=<randomly generated string>
      PORT=3000
      TWITCH_CHANNEL_NAME=<your channel name here>
      TWITCH_CHANNEL_ID=<your channel id here>
      EXCLUDED_USERS=Nightbot,StreamElements,...
      ```

4. **Authorize Twitch EventSub:**

   Check out the file `auth link`, where you will need to replace the client_id with your own and follow it to authorize the application.

5. **Run the application:**
   ```bash
   npm start
   ```

---

### Docker Installation

1. **Build the Docker image:**
   ```bash
   docker build -t stream-credits .
   ```

2. **Run the container:**
   ```bash
   docker run --env-file .env -p 3000:3000 stream-credits
   ```

Refer to the steps 3 and 4 above for proper configuration.

## Usage

### Viewing Credits
Access the web interface at `http://localhost:3000` to view:
- Live stream statistics
- Generated credits with all tracked data
- Historical log data from previous streams
- Top chatters, emotes, and attendance streaks


## Configuration

### Default Settings
The `src/data/default.json` file contains the default structure for:
- Cast member roles
- Artists, editor and programmer credits
- Moderator categorization
- Empty data structures for new streams

### Custom Roles
Edit the cast, artists, programmers, and editors arrays in `default.json` to customize credits:
```json
{
  "cast": [
    { "name": "username", "role": "Custom Role" }
  ],
  "programmers": [
    { "name": "developer", "role": "Feature Description" }
  ]
}
```


## Project Structure

```
stream-credits/
├── src/
│   ├── data/
│   │   ├── credits.js       # Main data management system
│   │   ├── postprocess.js   # Data processing and analytics
│   │   └── default.json     # Default configuration and structure
│   ├── events/
│   │   ├── tmiEvents.js     # Twitch chat event handlers
│   │   └── tesEvents.js     # TES event handlers
│   ├── listeners/
│   │   ├── tmi.js           # Twitch chat client setup
│   │   └── tes.js           # TES listener setup
│   ├── public/
│   │   ├── index.ejs        # Main credits page
│   │   ├── logs.ejs         # Log viewing interface
│   │   ├── style.css        # Styling for web interface
│   │   ├── script.js        # Client-side functionality
│   │   ├── partials/        # EJS template components
│   │   └── img/             # Static images and assets
│   ├── main.js              # Application entry point
│   ├── server.js            # Web server setup
│   └── emotes.js            # Emote handling utilities
├── logs/                    # Daily stream logs storage
├── package.json             # Dependencies and scripts
└── README.md               # Project documentation
```

## License

This project is licensed under the MIT License.

## Credits

Developed for psp1g's Twitch streaming setup to provide comprehensive stream analytics and automated credits generation.