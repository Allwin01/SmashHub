<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SmashHub Club Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
    </style>
  </head>
  <body class="bg-blue-100 text-gray-900 min-h-screen">
    <div class="flex flex-col min-h-screen overflow-x-hidden">
      <!-- Header -->
      <header class="flex items-center justify-between border-b border-gray-300 px-10 py-4 bg-white shadow">
        <div class="flex items-center gap-4">
          <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" />
          </svg>
          <h1 class="text-lg font-bold text-blue-600">Club Admin</h1>
        </div>
        <nav class="flex gap-8">
          <a href="#" class="text-sm font-medium text-blue-700 hover:underline">Dashboard</a>
          <a href="#" class="text-sm font-medium text-blue-700 hover:underline">Players</a>
          <a href="#" class="text-sm font-medium text-blue-700 hover:underline">Tournaments</a>
          <a href="#" class="text-sm font-medium text-blue-700 hover:underline">Coaching</a>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="flex-1 px-6 md:px-20 py-10">
        <h2 class="text-3xl font-bold mb-6 text-blue-800">Dashboard</h2>

        <section>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <a href="/skill-tracking" class="bg-white border border-blue-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105 flex flex-col items-center text-center">
              <img src="/icons/skill-tracking.svg" alt="Skill Tracking" class="w-16 h-16 mb-3">
              <h4 class="font-semibold text-lg text-blue-700 mb-1">Skill Tracking</h4>
              <p class="text-sm text-gray-600">View and monitor player skill progress</p>
            </a>

            <a href="/pegboard" class="bg-white border border-blue-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105 flex flex-col items-center text-center">
              <img src="/icons/pegboard.svg" alt="Smart Peg Board" class="w-16 h-16 mb-3">
              <h4 class="font-semibold text-lg text-blue-700 mb-1">Smart Peg Board</h4>
              <p class="text-sm text-gray-600">Assign courts and manage court-side activity</p>
            </a>

            <a href="/tournaments" class="bg-white border border-blue-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105 flex flex-col items-center text-center">
              <img src="/icons/tournaments.svg" alt="Tournaments" class="w-16 h-16 mb-3">
              <h4 class="font-semibold text-lg text-blue-700 mb-1">Tournaments</h4>
              <p class="text-sm text-gray-600">Organize and monitor tournament events</p>
            </a>

            <a href="/player-cards" class="bg-white border border-blue-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105 flex flex-col items-center text-center">
              <img src="/icons/player-card.svg" alt="Player Card" class="w-16 h-16 mb-3">
              <h4 class="font-semibold text-lg text-blue-700 mb-1">Player Card</h4>
              <p class="text-sm text-gray-600">View individual player profiles and stats</p>
            </a>
          </div>
        </section>
      </main>
    </div>
  </body>
</html>
