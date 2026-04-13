// Получаем холст (canvas) из HTML и контекст для рисования на нём
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Делаем так, чтобы игра занимала весь экран
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Создаем нашего персонажа
const player = {
    x: canvas.width / 2, // В центре по горизонтали
    y: canvas.height / 2, // В центре по вертикали
    radius: 20, // Размер
    color: '#3498db', // Цвет (синий)
    speed: 5, // Скорость передвижения
    isDead: false, // Жив ли он
    hasWon: false  // Победил ли он
};

// Эффект от удара и перезарядка (кулдаун)
const attackEffect = {
    active: false,
    radius: 0,
    maxRadius: 120, // На каком расстоянии монстры получают урон
    lastAttackTime: 0, // Когда был нанесён последний удар
    cooldownMs: 620  // Задержка между ударами
};

// Объект, в котором мы будем хранить, какие кнопки нажаты
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    ц: false, // для русской раскладки (клавиша W)
    ф: false, // клаивша A
    ы: false, // клавиша S
    в: false  // клавиша D
};

// Когда кнопка нажимается, мы запоминаем это
window.addEventListener('keydown', (e) => {
    // Если мы умерли ИЛИ победили и нажали Пробел — перезапускаем игру
    if ((player.isDead || player.hasWon) && e.code === 'Space') {
        location.reload(); // Самый простой способ начать заново — обновить страницу
        return;
    }

    // Если игра идет и мы нажали Пробел, то бьем монстров!
    if (!player.isDead && !player.hasWon && e.code === 'Space') {
        attack();
    }

    // Приводим букву к нижнему регистру, чтобы работало и с нажатым Shift или Caps Lock
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
});

// Когда кнопка отпускается, мы тоже запоминаем это
window.addEventListener('keyup', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// Функция кругового удара по монстрам
function attack() {
    // 1. Проверяем, успел ли удар "перезарядиться" (прошло ли 1.5 секунды)
    const now = Date.now(); // Получаем текущее время
    if (now - attackEffect.lastAttackTime < attackEffect.cooldownMs) {
        return; // Если прошло меньше времени, прерываем функцию (удар не срабатывает)
    }

    // 2. Если можно бить, запоминаем время этого удара
    attackEffect.lastAttackTime = now;

    if (attackEffect.active) return; // Ждем пока закончится анимация прошлого удара

    attackEffect.active = true;
    attackEffect.radius = player.radius; // Волна начинается от краев игрока

    // Идем с конца списка врагов, чтобы можно было безопасно удалять монстров
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        // Если монстр попал в радиус поражения
        if (dist <= attackEffect.maxRadius) {
            enemies.splice(i, 1); // Удаляем монстра (убиваем)
        }
    }

    // Если никого не осталось, мы победили!
    if (enemies.length === 0) {
        player.hasWon = true;
    }
}

// Создаем врагов
const enemies = [];
const numEnemies = 3; // Количество монстров

for (let i = 0; i < numEnemies; i++) {
    // Выбираем случайное направление (угол) для спауна
    const spawnAngle = Math.random() * Math.PI * 2;
    // Спауним их на расстоянии от 300 до 500 пикселей от центра
    const spawnDistance = 300 + Math.random() * 200;

    enemies.push({
        x: player.x + Math.cos(spawnAngle) * spawnDistance,
        y: player.y + Math.sin(spawnAngle) * spawnDistance,
        radius: 15, // Они чуть меньше персонажа
        color: '#e74c3c', // Цвет (красный)
        speed: 2.5 + Math.random() // Скорость чуть меньше, чтобы можно было убежать
    });
}

// Главная функция, которая обновляет логику игры: движение и столкновения
function update() {
    if (player.isDead || player.hasWon) return; // Если игра окончена, ничего не двигается

    // Обновляем позицию персонажа в зависимости от нажатых кнопок (учитываем обе раскладки)
    if (keys.ArrowUp || keys.w || keys.ц) player.y -= player.speed;
    if (keys.ArrowDown || keys.s || keys.ы) player.y += player.speed;
    if (keys.ArrowLeft || keys.a || keys.ф) player.x -= player.speed;
    if (keys.ArrowRight || keys.d || keys.в) player.x += player.speed;

    // Не даем персонажу выйти за края экрана
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Движение врагов
    for (let enemy of enemies) {
        // Вычисляем разницу между позициями монстра и игрока
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        // Вычисляем расстояние между ними
        const dist = Math.hypot(dx, dy);

        // Монстр бежит в сторону игрока (вычисляем вектор направления)
        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        // Проверяем, догнал ли монстр игрока
        if (dist < player.radius + enemy.radius) {
            player.isDead = true; // Конец игры!
        }
    }
}

// Главная функция, которая рисует всё на экране
function draw() {
    // 1. Очищаем экран и заливаем его темным фоном
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Если игрок умер, рисуем экран поражения
    if (player.isDead) {
        ctx.fillStyle = '#e74c3c';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ИГРА ОКОНЧЕНА', canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Нажмите ПРОБЕЛ, чтобы начать заново', canvas.width / 2, canvas.height / 2 + 50);
        return;
    }

    // Если игрок победил, рисуем экран победы
    if (player.hasWon) {
        ctx.fillStyle = '#f1c40f'; // Золотой цвет
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ВЫ ПОБЕДИЛИ!', canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Нажмите ПРОБЕЛ, чтобы начать заново', canvas.width / 2, canvas.height / 2 + 50);
        return;
    }

    // Рисуем волну от удара (если она активна)
    if (attackEffect.active) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, attackEffect.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#f1c40f'; // Золотая волна
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.closePath();

        // Волна разлетается вширь
        attackEffect.radius += 8;
        if (attackEffect.radius >= attackEffect.maxRadius) {
            attackEffect.active = false; // Волна рассеялась
        }
    }

    // 2. Рисуем всех врагов
    for (let enemy of enemies) {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.closePath();
    }

    // 3. Рисуем нашего персонажа
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
}

// Главный цикл: Обновить -> Нарисовать -> Повторить
function gameLoop() {
    update();
    draw();
    // Просим браузер вызвать эту функцию снова перед следующим кадром (примерно 60 раз в секунду)
    requestAnimationFrame(gameLoop);
}

// Если размер окна изменится, подстраиваем холст
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Запускаем игру!
gameLoop();
