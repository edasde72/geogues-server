const game = (function() {
    'use strict';
    
    // INTERNATIONALIZATION (i18n)
    const i18n = {
        currentLang: localStorage.getItem('geoguessr_lang') || 'cs',
        
        translations: {
            cs: {
                // Nav
                nav_info: "Informace",
                nav_results: "Výsledky",
                nav_play: "Hrát",
                nav_settings: "Nastavení",
                
                // Settings
                settings_title: "⚙️ Nastavení",
                language_title: "Jazyk / Language",
                language_desc: "Vyber si jazyk rozhraní. Select your interface language.",
                sound_title: "🔊 Zvuky",
                sound_desc: "Zapni nebo vypni zvukové efekty během hry.",
                sound_on: "Zvuky zapnuty",
                sound_off: "Zvuky vypnuty",
                
                // Info section
                info_title: "🌍 O hře GeoGuessr",
                info_subtitle: "Zábavná geografická hra pro celý svět",
                info_goal_title: "🎯 Cíl hry",
                info_goal_1: "Trénink zeměpisu a poznávání světa",
                info_goal_2: "Uhodni zemi podle zobrazení na mapě",
                info_goal_3: "Více než 190 zemí celého světa",
                info_goal_4: "Různé herní módy pro jednoho i více hráčů",
                info_modes_title: "🎮 Herní módy",
                info_modes_1: "Single Player: Hraj sám na čas",
                info_modes_2: "Multiplayer: Soutěž s přáteli (2-8 hráčů)",
                info_modes_3: "Kontinenty: Zaměř se na konkrétní část světa",
                info_modes_4: "Žebříček: Soutěž o nejlepší skóre",
                info_points_title: "⭐ Bodování",
                info_points_1: "Single: Až 50 bodů za zemi",
                info_points_2: "Multiplayer: 1 bod za vítězné kolo",
                info_points_3: "Série: Sleduj svou úspěšnost",
                info_points_4: "Čas: 5 minut v singleplayeru",
                info_features_title: "🗺️ Vlastnosti",
                info_features_1: "Interaktivní mapy s postupným zoomem",
                info_features_2: "Chat v multiplayeru",
                info_features_3: "Ukládání nejlepších skóre",
                info_features_4: "Funguje na PC i mobilech",
                
                // Results section
                results_title: "📊 Tvé statistiky",
                results_subtitle: "Přehled herních úspěchů a výkonů",
                stat_games: "Odehraných her",
                stat_wins: "Výhry v MP",
                stat_countries: "Uhodnuto zemí",
                stat_streak: "Nejlepší série",
                stat_best: "Nejlepší skóre",
                stat_rate: "Úspěšnost",
                hall_of_fame: "🏅 Hall of Fame",
                no_scores: "Zatím žádné skóre. Zahrej si a získej místo v žebříčku!",
                clear_stats: "Smazat všechny statistiky",
                play_again: "🎮 Hrát znovu",
                
                // Game menu
                game_title: "🌍 GeoGuessr",
                game_subtitle: "Poznáš zemi podle mapy?",
                quick_start: "🚀 Rychlý start",
                quick_start_desc: "Vyber si rychle herní režim a začni hrát ihned.",
                single_player: "👤 Single Player (5 min)",
                multiplayer: "👥 Multiplayer",
                continent: "Kontinent",
                world: "🌍 Celý svět (194 zemí)",
                europe: "🇪🇺 Evropa (46 zemí)",
                asia: "🌏 Asie (49 zemí)",
                americas: "🌎 Amerika (35 zemí)",
                africa: "🌍 Afrika (54 zemí)",
                oceania: "🌏 Oceánie (14 zemí)",
                players: "hráči",
                create_game: "🎮 Vytvořit hru",
                join_game: "🔗 Připojit se ke hře",
                waiting_players: "Čekání na hráče...",
                room_code: "KÓD MÍSTNOSTI",
                room_code_desc: "Klikni pro zkopírování odkazu",
                waiting_host: "Čekání na hosta...",
                your_name: "Tvoje jméno (max 20 znaků)",
                join: "Připojit se",
                back: "Zpět",
                cancel: "Zrušit",
                start_game: "▶️ SPUSTIT HRU",
                leave: "Odpojit se",
                
                // Gameplay
                round: "Kolo",
                of: "/",
                points: "bodů",
                streak: "série",
                countries: "zemí",
                time_left: "Zbývající čas",
                guess_placeholder: "Napiš zemi...",
                guess_btn: "Hádat",
                attempt: "Pokus",
                attempts: "z",
                detail_zoom: ["Velmi detailní", "Detailní", "Město", "Region", "Kontinent"],
                correct: "Správně!",
                points_gained: "+{points}b",
                wrong: "Špatně!",
                was: "Bylo to",
                out_of_attempts: "Došly pokusy! Čekání na ostatní...",
                round_started: "Kolo {round} začíná!",
                player_joined: "se připojil!",
                player_left: "se odpojil",
                became_host: "Stal ses hostem!",
                
                // Game over
                game_over: "Konec hry!",
                time_up: "⏰ Čas vypršel!",
                winner: "Vyhrál jsi!",
                champion: "Jsi šampion!",
                winner_is: "Vítěz",
                draw: "Remíza!",
                winners: "Vítězové",
                you: "(Ty)",
                new_game: "🔄 Nová hra",
                main_menu: "🏠 Hlavní menu",
                rematch_waiting: "⏳ Čekání na ostatní...",
                ready: "Připraveni",
                
                // Countries (display names)
                countries_map: {} // Naplní se dynamicky z english names
            },
            en: {
                // Nav
                nav_info: "Info",
                nav_results: "Results",
                nav_play: "Play",
                nav_settings: "Settings",
                
                // Settings
                settings_title: "⚙️ Settings",
                language_title: "Language / Jazyk",
                language_desc: "Select your interface language. Vyber si jazyk rozhraní.",
                sound_title: "🔊 Sounds",
                sound_desc: "Enable or disable sound effects during gameplay.",
                sound_on: "Sounds On",
                sound_off: "Sounds Off",
                
                // Info section
                info_title: "🌍 About GeoGuessr",
                info_subtitle: "Fun geography game for the whole world",
                info_goal_title: "🎯 Game Objective",
                info_goal_1: "Train your geography and world recognition",
                info_goal_2: "Guess the country from the map view",
                info_goal_3: "More than 190 countries worldwide",
                info_goal_4: "Various game modes for single and multiplayer",
                info_modes_title: "🎮 Game Modes",
                info_modes_1: "Single Player: Play against the clock",
                info_modes_2: "Multiplayer: Compete with friends (2-8 players)",
                info_modes_3: "Continents: Focus on specific world regions",
                info_modes_4: "Leaderboard: Compete for the best score",
                info_points_title: "⭐ Scoring",
                info_points_1: "Single: Up to 50 points per country",
                info_points_2: "Multiplayer: 1 point per winning round",
                info_points_3: "Streak: Track your success rate",
                info_points_4: "Time: 5 minutes in singleplayer",
                info_features_title: "🗺️ Features",
                info_features_1: "Interactive maps with gradual zoom",
                info_features_2: "Multiplayer chat",
                info_features_3: "High score saving",
                info_features_4: "Works on PC and mobile",
                
                // Results section
                results_title: "📊 Your Statistics",
                results_subtitle: "Overview of gaming achievements and performance",
                stat_games: "Games Played",
                stat_wins: "MP Wins",
                stat_countries: "Countries Guessed",
                stat_streak: "Best Streak",
                stat_best: "Best Score",
                stat_rate: "Win Rate",
                hall_of_fame: "🏅 Hall of Fame",
                no_scores: "No scores yet. Play to get on the leaderboard!",
                clear_stats: "Clear all statistics",
                play_again: "🎮 Play Again",
                
                // Game menu
                game_title: "🌍 GeoGuessr",
                game_subtitle: "Can you guess the country from the map?",
                quick_start: "🚀 Quick Start",
                quick_start_desc: "Choose a game mode quickly and start playing immediately.",
                single_player: "👤 Single Player (5 min)",
                multiplayer: "👥 Multiplayer",
                continent: "Continent",
                world: "🌍 Whole World (194 countries)",
                europe: "🇪🇺 Europe (46 countries)",
                asia: "🌏 Asia (49 countries)",
                americas: "🌎 Americas (35 countries)",
                africa: "🌍 Africa (54 countries)",
                oceania: "🌏 Oceania (14 countries)",
                players: "players",
                create_game: "🎮 Create Game",
                join_game: "🔗 Join Game",
                waiting_players: "Waiting for players...",
                room_code: "ROOM CODE",
                room_code_desc: "Click to copy link",
                waiting_host: "Waiting for host...",
                your_name: "Your name (max 20 chars)",
                join: "Join",
                back: "Back",
                cancel: "Cancel",
                start_game: "▶️ START GAME",
                leave: "Disconnect",
                
                // Gameplay
                round: "Round",
                of: "/",
                points: "points",
                streak: "streak",
                countries: "countries",
                time_left: "Time left",
                guess_placeholder: "Type country...",
                guess_btn: "Guess",
                attempt: "Attempt",
                attempts: "of",
                detail_zoom: ["Very detailed", "Detailed", "City", "Region", "Continent"],
                correct: "Correct!",
                points_gained: "+{points}pts",
                wrong: "Wrong!",
                was: "It was",
                out_of_attempts: "Out of attempts! Waiting for others...",
                round_started: "Round {round} is starting!",
                player_joined: "joined!",
                player_left: "left",
                became_host: "You became the host!",
                
                // Game over
                game_over: "Game Over!",
                time_up: "⏰ Time's up!",
                winner: "You Won!",
                champion: "You are the champion!",
                winner_is: "Winner",
                draw: "It's a Draw!",
                winners: "Winners",
                you: "(You)",
                new_game: "🔄 New Game",
                main_menu: "🏠 Main Menu",
                rematch_waiting: "⏳ Waiting for others...",
                ready: "Ready",
                
                // Countries mapping from Czech to English
                countries_map: {
                    "Albánie": "Albania", "Andora": "Andorra", "Rakousko": "Austria",
                    "Bělorusko": "Belarus", "Belgie": "Belgium", "Bosna a Hercegovina": "Bosnia and Herzegovina",
                    "Bulharsko": "Bulgaria", "Chorvatsko": "Croatia", "Kypr": "Cyprus",
                    "Česko": "Czechia", "Dánsko": "Denmark", "Estonsko": "Estonia",
                    "Finsko": "Finland", "Francie": "France", "Německo": "Germany",
                    "Řecko": "Greece", "Maďarsko": "Hungary", "Island": "Iceland",
                    "Irsko": "Ireland", "Itálie": "Italy", "Kosovo": "Kosovo",
                    "Lotyšsko": "Latvia", "Lichtenštejnsko": "Liechtenstein", "Litva": "Lithuania",
                    "Lucembursko": "Luxembourg", "Malta": "Malta", "Monako": "Monaco",
                    "Černá Hora": "Montenegro", "Nizozemsko": "Netherlands", "Severní Makedonie": "North Macedonia",
                    "Norsko": "Norway", "Polsko": "Poland", "Portugalsko": "Portugal",
                    "Moldavsko": "Moldova", "Rumunsko": "Romania", "Rusko": "Russia",
                    "San Marino": "San Marino", "Srbsko": "Serbia", "Slovensko": "Slovakia",
                    "Slovinsko": "Slovenia", "Španělsko": "Spain", "Švédsko": "Sweden",
                    "Švýcarsko": "Switzerland", "Ukrajina": "Ukraine", "Velká Británie": "United Kingdom",
                    "Vatikán": "Vatican",
                    // Asia
                    "Afghánistán": "Afghanistan", "Arménie": "Armenia", "Ázerbájdžán": "Azerbaijan",
                    "Bahrajn": "Bahrain", "Bangladéš": "Bangladesh", "Bhútán": "Bhutan",
                    "Brunej": "Brunei", "Kambodža": "Cambodia", "Čína": "China",
                    "Georgie": "Georgia", "Indie": "India", "Indonésie": "Indonesia",
                    "Irán": "Iran", "Irák": "Iraq", "Izrael": "Israel",
                    "Japonsko": "Japan", "Jordánsko": "Jordan", "Kazachstán": "Kazakhstan",
                    "Kuvajt": "Kuwait", "Kyrgyzstán": "Kyrgyzstan", "Laos": "Laos",
                    "Libanon": "Lebanon", "Malajsie": "Malaysia", "Maledivy": "Maldives",
                    "Mongolsko": "Mongolia", "Myanmar": "Myanmar", "Nepál": "Nepal",
                    "Korea": "North Korea", "Omán": "Oman", "Pákistán": "Pakistan",
                    "Filipíny": "Philippines", "Katar": "Qatar", "Saúdská Arábie": "Saudi Arabia",
                    "Singapur": "Singapore", "Jižní Korea": "South Korea", "Srí Lanka": "Sri Lanka",
                    "Sýrie": "Syria", "Tádžikistán": "Tajikistan", "Thajsko": "Thailand",
                    "Východní Timor": "East Timor", "Turecko": "Turkey", "Turkmenistán": "Turkmenistan",
                    "Spojené arabské emiráty": "United Arab Emirates", "Uzbekistán": "Uzbekistan",
                    "Vietnam": "Vietnam", "Jemen": "Yemen",
                    // Americas
                    "Antigua a Barbuda": "Antigua and Barbuda", "Argentina": "Argentina", "Bahamy": "Bahamas",
                    "Barbados": "Barbados", "Belize": "Belize", "Bolívie": "Bolivia",
                    "Brazílie": "Brazil", "Kanada": "Canada", "Chile": "Chile",
                    "Kolumbie": "Colombia", "Kostarika": "Costa Rica", "Kuba": "Cuba",
                    "Dominika": "Dominica", "Dominikánská republika": "Dominican Republic", "Ekvádor": "Ecuador",
                    "Salvador": "El Salvador", "Grenada": "Grenada", "Guatemala": "Guatemala",
                    "Guyana": "Guyana", "Haiti": "Haiti", "Honduras": "Honduras",
                    "Jamajka": "Jamaica", "Mexiko": "Mexico", "Nikaragua": "Nicaragua",
                    "Panama": "Panama", "Paraguay": "Paraguay", "Peru": "Peru",
                    "Svatý Kryštof a Nevis": "Saint Kitts and Nevis", "Svatá Lucie": "Saint Lucia",
                    "Svatý Vincenc a Grenadiny": "Saint Vincent and the Grenadines", "Surinam": "Suriname",
                    "Trinidad a Tobago": "Trinidad and Tobago", "USA": "USA", "Uruguay": "Uruguay",
                    "Venezuela": "Venezuela",
                    // Africa
                    "Alžírsko": "Algeria", "Angola": "Angola", "Benin": "Benin",
                    "Botswana": "Botswana", "Burkina Faso": "Burkina Faso", "Burundi": "Burundi",
                    "Kamerun": "Cameroon", "Kapverdy": "Cape Verde", "Středoafrická republika": "Central African Republic",
                    "Čad": "Chad", "Komory": "Comoros", "Demokratická republika Kongo": "Democratic Republic of the Congo",
                    "Republika Kongo": "Republic of the Congo", "Džibutsko": "Djibouti", "Egypt": "Egypt",
                    "Rovníková Guinea": "Equatorial Guinea", "Eritrea": "Eritrea", "Svazijsko": "Eswatini",
                    "Etiopie": "Ethiopia", "Gabon": "Gabon", "Gambie": "Gambia",
                    "Ghana": "Ghana", "Guinea": "Guinea", "Guinea-Bissau": "Guinea-Bissau",
                    "Pobřeží slonoviny": "Ivory Coast", "Keňa": "Kenya", "Lesotho": "Lesotho",
                    "Liberie": "Liberia", "Libye": "Libya", "Madagaskar": "Madagascar",
                    "Malawi": "Malawi", "Mali": "Mali", "Mauritánie": "Mauritania",
                    "Mauricius": "Mauritius", "Maroko": "Morocco", "Mosambik": "Mozambique",
                    "Namibie": "Namibia", "Niger": "Niger", "Nigérie": "Nigeria",
                    "Rwanda": "Rwanda", "Svatý Tomáš a Princův ostrov": "Sao Tome and Principe", "Senegal": "Senegal",
                    "Seychely": "Seychelles", "Sierra Leone": "Sierra Leone", "Somálsko": "Somalia",
                    "Jižní Afrika": "South Africa", "Jižní Súdán": "South Sudan", "Súdán": "Sudan",
                    "Tanzánie": "Tanzania", "Togo": "Togo", "Tunisko": "Tunisia",
                    "Uganda": "Uganda", "Zambie": "Zambia", "Zimbabwe": "Zimbabwe",
                    // Oceania
                    "Austrálie": "Australia", "Fidži": "Fiji", "Kiribati": "Kiribati",
                    "Marshallovy ostrovy": "Marshall Islands", "Mikronésie": "Micronesia", "Nauru": "Nauru",
                    "Nový Zéland": "New Zealand", "Palau": "Palau", "Papua Nová Guinea": "Papua New Guinea",
                    "Samoa": "Samoa", "Šalomounovy ostrovy": "Solomon Islands", "Tonga": "Tonga",
                    "Tuvalu": "Tuvalu", "Vanuatu": "Vanuatu"
                }
            }
        },
        
        t(key, params = {}) {
            let text = this.translations[this.currentLang][key] || key;
            // Replace parameters like {points}
            Object.keys(params).forEach(k => {
                text = text.replace(`{${k}}`, params[k]);
            });
            return text;
        },
        
        setLang(lang) {
            this.currentLang = lang;
            localStorage.setItem('geoguessr_lang', lang);
            document.documentElement.lang = lang;
            updateAllTexts();
        },
        
        getCountryName(czechName) {
            if (this.currentLang === 'cs') return czechName;
            return this.translations.en.countries_map[czechName] || czechName;
        }
    };

    // Sound settings
    let soundEnabled = localStorage.getItem('geoguessr_sound') !== 'false';
    
    function toggleSound() {
        soundEnabled = !soundEnabled;
        localStorage.setItem('geoguessr_sound', soundEnabled);
        updateSoundButton();
        return soundEnabled;
    }

    function playSound(type) {
        if (!soundEnabled) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            if (type === 'success') {
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
                osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            } else {
                osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            }
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) {}
    }

    // Stats keys
    const STATS_KEY = 'geoguessr_stats_v2';
    
    function migrateOldData() {
        try {
            const oldData = localStorage.getItem('geoguessr_highscores');
            if (oldData && !localStorage.getItem(STATS_KEY)) {
                const oldScores = JSON.parse(oldData);
                const stats = loadStats();
                if (oldScores.length > 0) {
                    stats.bestScore = oldScores[0].score;
                    stats.bestScoreName = oldScores[0].name;
                    stats.totalGames += oldScores.length;
                    stats.singlePlayerGames += oldScores.length;
                }
                saveStats(stats);
                localStorage.removeItem('geoguessr_highscores');
            }
        } catch(e) {}
    }
    
    function loadStats() {
        try {
            const data = localStorage.getItem(STATS_KEY);
            const defaultStats = {
                totalGames: 0, singlePlayerGames: 0, multiPlayerGames: 0, wins: 0,
                bestScore: 0, bestScoreName: '', countriesGuessedTotal: 0,
                currentStreak: 0, bestStreak: 0, highScores: []
            };
            if (!data) return defaultStats;
            return { ...defaultStats, ...JSON.parse(data) };
        } catch(e) {
            return { totalGames: 0, singlePlayerGames: 0, multiPlayerGames: 0, wins: 0,
                bestScore: 0, bestScoreName: '', countriesGuessedTotal: 0,
                currentStreak: 0, bestStreak: 0, highScores: [] };
        }
    }
    
    function saveStats(stats) {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        } catch(e) {}
    }
    
    function recordMPWin() {
        const stats = loadStats();
        stats.wins++;
        stats.currentStreak++;
        if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;
        saveStats(stats);
    }
    
    function recordMPLoss() {
        const stats = loadStats();
        stats.currentStreak = 0;
        saveStats(stats);
    }

    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function createEl(tag, cls, text) {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (text !== undefined) el.textContent = text;
        return el;
    }
    
    function formatDate(date) {
        if (i18n.currentLang === 'en') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;
    }

    let countries = [];
    const socket = io({ transports: ['websocket'], reconnection: true, reconnectionAttempts: 5 });
    
    socket.on('init-data', (data) => { countries = data.countries.world || []; });
    
    const state = {
        map: null, currentCountry: null, attempts: 0, gameMode: null,
        score: 0, streak: 0, isHost: false, roomCode: null,
        myId: null, players: [], maxPlayers: 4,
        currentRound: 1, totalRounds: 5,
        lastGuess: 0, lastChat: 0, finished: false,
        guessCooldown: false, timeLeft: 300,
        timerInterval: null, countriesGuessed: 0,
        rematchVoted: false, inviteLink: ''
    };

    const config = {
        maxAttempts: 5, zoomLevels: [16, 13, 10, 6, 3],
        singlePlayerTime: 300
    };

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    // UI Update functions
    function updateAllTexts() {
        // Nav
        document.getElementById('nav-info-link').textContent = i18n.t('nav_info');
        document.getElementById('nav-results-link').textContent = i18n.t('nav_results');
        document.getElementById('nav-play-link').textContent = i18n.t('nav_play');
        
        // Info section
        document.querySelector('.full-width-section h1').textContent = i18n.t('info_title');
        document.querySelector('.full-width-section .subtitle').textContent = i18n.t('info_subtitle');
        
        // Results section
        document.querySelector('#section-results h1').textContent = i18n.t('results_title');
        document.querySelector('#section-results .subtitle').textContent = i18n.t('results_subtitle');
        document.querySelector('.results-title').innerHTML = `<span>🏅</span> ${i18n.t('hall_of_fame')}`;
        document.getElementById('clear-results-btn').textContent = i18n.t('clear_stats');
        document.querySelector('.cta-button-wide').textContent = i18n.t('play_again');
        
        // Update stat labels
        const statLabels = ['stat_games', 'stat_wins', 'stat_countries', 'stat_streak', 'stat_best', 'stat_rate'];
        statLabels.forEach((key, idx) => {
            const cards = document.querySelectorAll('.stat-label');
            if (cards[idx]) cards[idx].textContent = i18n.t(key);
        });
        
        // Update display
        if (!document.getElementById('section-results').classList.contains('hidden')) {
            updateStatsDisplay();
        }
    }

    function updateStatsDisplay() {
        const stats = loadStats();
        
        const safeSet = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        
        safeSet('stat-total-games', stats.totalGames);
        safeSet('stat-wins', stats.wins);
        safeSet('stat-countries', stats.countriesGuessedTotal);
        safeSet('stat-best-streak', stats.bestStreak);
        safeSet('stat-best-score', stats.bestScore);
        
        const winRate = stats.multiPlayerGames > 0 
            ? Math.round((stats.wins / stats.multiPlayerGames) * 100) 
            : 0;
        safeSet('stat-win-rate', winRate + '%');
        
        const container = document.getElementById('highscore-results-list');
        const clearBtn = document.getElementById('clear-results-btn');
        
        if (stats.highScores.length === 0) {
            if (container) {
                container.innerHTML = `
                    <div class="no-scores-big">
                        <span class="no-scores-big-icon">🎮</span>
                        ${i18n.t('no_scores')}
                    </div>
                `;
            }
            if (clearBtn) clearBtn.classList.add('hidden');
        } else {
            if (clearBtn) clearBtn.classList.remove('hidden');
            const sorted = [...stats.highScores].sort((a, b) => b.score - a.score).slice(0, 10);
            
            if (container) {
                container.innerHTML = '';
                sorted.forEach((s, index) => {
                    let rowClass = 'highscore-row';
                    if (index === 0) rowClass += ' top-1';
                    else if (index === 1) rowClass += ' top-2';
                    else if (index === 2) rowClass += ' top-3';
                    
                    const row = createEl('div', rowClass);
                    const rank = createEl('div', 'highscore-rank', `${index + 1}.`);
                    const name = createEl('div', 'highscore-name', escapeHtml(s.name));
                    const points = createEl('div', 'highscore-points', `${s.score}${i18n.currentLang === 'en' ? 'pts' : 'b'}`);
                    const date = createEl('div', 'highscore-date', formatDate(new Date(s.date)));
                    
                    row.appendChild(rank);
                    row.appendChild(name);
                    row.appendChild(points);
                    row.appendChild(date);
                    container.appendChild(row);
                });
            }
        }
    }

    function updateSoundButton() {
        const btn = document.getElementById('sound-toggle-btn');
        const status = document.getElementById('sound-status');
        if (btn && status) {
            if (soundEnabled) {
                btn.textContent = '🔊 ' + i18n.t('sound_on');
                btn.classList.add('active');
                btn.classList.remove('muted');
                status.textContent = i18n.t('sound_on');
            } else {
                btn.textContent = '🔇 ' + i18n.t('sound_off');
                btn.classList.remove('active');
                btn.classList.add('muted');
                status.textContent = i18n.t('sound_off');
            }
        }
    }

    // Game functions (simplified, rest remains similar to original with i18n.t() calls)
    function showToast(msg) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    function showSection(event, section) {
        if (event) event.preventDefault();
        document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        
        if (section === 'settings') {
            document.getElementById('section-settings').classList.remove('hidden');
            document.getElementById('nav-settings-link').classList.add('active');
            updateSoundButton();
        } else if (section === 'info') {
            document.getElementById('section-info').classList.remove('hidden');
            document.getElementById('nav-info-link').classList.add('active');
        } else if (section === 'results') {
            document.getElementById('section-results').classList.remove('hidden');
            document.getElementById('nav-results-link').classList.add('active');
            updateStatsDisplay();
        } else if (section === 'play') {
            document.getElementById('menu').classList.remove('hidden');
            document.getElementById('nav-play-link').classList.add('active');
        }
        document.getElementById('nav-links').classList.remove('active');
        window.scrollTo(0, 0);
    }

    function toggleMobileMenu() {
        document.getElementById('nav-links').classList.toggle('active');
    }

    // Initialize
    migrateOldData();
    updateAllTexts();

    document.addEventListener('DOMContentLoaded', () => {
        // Setup settings section first
        const settingsSection = document.createElement('div');
        settingsSection.id = 'section-settings';
        settingsSection.className = 'full-width-section content-section hidden';
        settingsSection.innerHTML = `
            <div class="full-width-content">
                <h1>⚙️ ${i18n.t('settings_title')}</h1>
                <div class="settings-card">
                    <div class="setting-item">
                        <div class="setting-label">🌐 ${i18n.t('language_title')}</div>
                        <div class="setting-desc">${i18n.t('language_desc')}</div>
                        <div class="language-buttons">
                            <button class="lang-btn ${i18n.currentLang === 'cs' ? 'active' : ''}" onclick="game.setLanguage('cs')">
                                <span class="flag">🇨🇿</span> Čeština
                            </button>
                            <button class="lang-btn ${i18n.currentLang === 'en' ? 'active' : ''}" onclick="game.setLanguage('en')">
                                <span class="flag">🇬🇧</span> English
                            </button>
                        </div>
                    </div>
                    <div class="setting-item">
                        <div class="setting-label">🔊 ${i18n.t('sound_title')}</div>
                        <div class="setting-desc">${i18n.t('sound_desc')}</div>
                        <button id="sound-toggle-btn" class="toggle-btn" onclick="game.toggleSound()">
                            ${soundEnabled ? '🔊 ' + i18n.t('sound_on') : '🔇 ' + i18n.t('sound_off')}
                        </button>
                    </div>
                </div>
                <button onclick="game.showSection(event, 'play')" class="cta-button-wide">🎮 ${i18n.t('play_again')}</button>
            </div>
        `;
        document.body.insertBefore(settingsSection, document.getElementById('game-container'));
        
        // Add settings link to nav if not exists
        if (!document.getElementById('nav-settings-link')) {
            const settingsLink = document.createElement('a');
            settingsLink.href = '#';
            settingsLink.className = 'nav-link settings';
            settingsLink.id = 'nav-settings-link';
            settingsLink.onclick = (e) => showSection(e, 'settings');
            settingsLink.textContent = '⚙️';
            settingsLink.title = i18n.t('nav_settings');
            document.querySelector('.nav-links').appendChild(settingsLink);
        }
        
        updateAllTexts();
    });

    // Public API
    return {
        showSection,
        toggleMobileMenu,
        toggleSound,
        setLanguage: (lang) => {
            i18n.setLang(lang);
            updateAllTexts();
            updateSoundButton();
            // Update lang buttons in settings if visible
            document.querySelectorAll('.lang-btn').forEach(btn => {
                if (btn.textContent.includes('Čeština') && lang === 'cs') btn.classList.add('active');
                else if (btn.textContent.includes('English') && lang === 'en') btn.classList.add('active');
                else btn.classList.remove('active');
            });
        },
        // ... další funkce jako startSingle, atd.
    };
})();
</script>
