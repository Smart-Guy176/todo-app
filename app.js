document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const isDailyHabitCheckbox = document.getElementById('daily-habit-checkbox');
    const addTaskBtn = document.getElementById('add-task-btn');
    const dailyHabitsList = document.getElementById('daily-habits-list');
    const oneTimeTasksList = document.getElementById('one-time-tasks-list');

    let tasks = JSON.parse(localStorage.getItem('resolveTasks')) || [];

    // --- Core Logic ---
    const saveTasks = () => {
        localStorage.setItem('resolveTasks', JSON.stringify(tasks));
    };

    const renderTasks = () => {
        dailyHabitsList.innerHTML = '';
        oneTimeTasksList.innerHTML = '';

        tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = task.isCompleted ? 'completed' : '';
            
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox';
            checkbox.addEventListener('click', () => {
                tasks[index].isCompleted = !tasks[index].isCompleted;
                saveTasks();
                renderTasks();
            });

            const taskDetails = document.createElement('div');
            taskDetails.className = 'task-name';
            
            const taskName = document.createElement('span');
            taskName.textContent = task.name;
            taskDetails.appendChild(taskName);

            const today = new Date().setHours(0,0,0,0);
            const taskDueDate = new Date(task.dueDate).setHours(0,0,0,0);

            if (taskDueDate < today) {
                const dueDateSpan = document.createElement('span');
                dueDateSpan.className = 'due-date';
                dueDateSpan.textContent = ` (from ${new Date(task.dueDate).toLocaleDateString()})`;
                taskDetails.appendChild(dueDateSpan);
            }

            li.appendChild(checkbox);
            li.appendChild(taskDetails);

            if (task.isDailyHabit) {
                if(!task.isCompleted) dailyHabitsList.appendChild(li);
            } else {
                if(!task.isCompleted) oneTimeTasksList.appendChild(li);
            }
        });
    };

    const stackDailyHabits = () => {
        const todayStr = new Date().toDateString();
        const lastStackedDate = localStorage.getItem('lastStackedDate');

        if (lastStackedDate !== todayStr) {
            const uniqueHabits = [...new Set(tasks.filter(t => t.isDailyHabit).map(t => t.name))];
            
            uniqueHabits.forEach(habitName => {
                const hasTaskForToday = tasks.some(t => t.name === habitName && new Date(t.dueDate).toDateString() === todayStr);
                if (!hasTaskForToday) {
                    tasks.push({
                        name: habitName,
                        isDailyHabit: true,
                        isCompleted: false,
                        dueDate: new Date().toISOString()
                    });
                }
            });

            localStorage.setItem('lastStackedDate', todayStr);
            saveTasks();
        }
    };
    
    // --- Event Listeners ---
    addTaskBtn.addEventListener('click', () => {
        const taskName = taskInput.value.trim();
        if (taskName === '') return;

        tasks.push({
            name: taskName,
            isDailyHabit: isDailyHabitCheckbox.checked,
            isCompleted: false,
            dueDate: new Date().toISOString()
        });

        taskInput.value = '';
        isDailyHabitCheckbox.checked = false;

        saveTasks();
        renderTasks();
    });

    // --- PWA & Notification Logic ---
    const registerServiceWorkerAndPermissions = async () => {
        if (!('serviceWorker' in navigator && 'Notification' in window)) {
            console.log('Service Worker or Notifications not supported by this browser.');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered successfully.');

            // Wait for the user to grant permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission was not granted.');
                return;
            }

            // Check for Periodic Background Sync support
            if ('periodicSync' in registration) {
                const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                if (status.state === 'granted') {
                    await registration.periodicSync.register('task-reminder', {
                        minInterval: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
                    });
                    console.log('Periodic Sync registered for task reminders.');
                }
            } else {
                console.log('Periodic Background Sync is not supported on this browser.');
            }
        } catch (error) {
            console.error('Service Worker or Permission registration failed:', error);
        }
    };

    // --- Initial Load ---
    const initializeApp = async () => {
        stackDailyHabits();
        renderTasks();
        await registerServiceWorkerAndPermissions();
    };

    initializeApp();
});