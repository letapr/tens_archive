# Daily Tens Clone

This project is a clone of the Daily Tens game, built using Next.js. The application allows users to engage with a series of questions and answers, providing an interactive experience.

## Project Structure

```
daily-tens-clone
├── src
│   ├── app
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── Answer.tsx
│   │   ├── GameBoard.tsx
│   │   └── Header.tsx
│   ├── constants
│   │   ├── answers.ts
│   │   └── gameData.ts
│   ├── types
│   │   └── index.ts
│   └── utils
│       └── helpers.ts
├── public
├── .env
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/daily-tens-clone.git
   ```
2. Navigate to the project directory:
   ```bash
   cd daily-tens-clone
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## Running the Application

To start the development server, run:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to view the application.

## Features

- Interactive game board displaying questions and answers.
- Header component for navigation and title display.
- Easy manipulation of questions and answers through constants.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes. 

## License

This project is licensed under the MIT License.