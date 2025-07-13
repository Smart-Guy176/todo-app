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

    const deleteTask = (taskId) => {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    };

    const toggleTaskCompletion = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.isCompleted = !task.isCompleted;
            saveTasks();
            renderTasks();
        }
    };

    const renderTasks = () => {
        dailyHabitsList.innerHTML = '';
        oneTimeTasksList.innerHTML = '';

        // Sort tasks to show older, uncompleted tasks first
        tasks.sort((a, b) => a.isCompleted - b.isCompleted || new Date(a.dueDate) - new Date(b.dueDate));

        const todayString = new Date().toDateString();

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = task.isCompleted ? 'completed' : '';
            li.dataset.taskId = task.id;

            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox';
            checkbox.addEventListener('click', () => toggleTaskCompletion(task.id));

            const taskDetails = document.createElement('div');
            taskDetails.className = 'task-details';

            const taskName = document.createElement('span');
            taskName.className = 'task-name';
            taskName.textContent = task.name;
            taskDetails.appendChild(taskName);

            const today = new Date().setHours(0, 0, 0, 0);
            const taskDueDate = new Date(task.dueDate).setHours(0, 0, 0, 0);

            // Show due date if it's not for today
            if (taskDueDate < today) {
                const dueDateSpan = document.createElement('span');
                dueDateSpan.className = 'due-date';
                dueDateSpan.textContent = ` (from ${new Date(task.dueDate).toLocaleDateString()})`;
                taskDetails.appendChild(dueDateSpan);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×'; // Multiplication sign as 'x'
            deleteBtn.setAttribute('aria-label', 'Delete task');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent checkbox click
                deleteTask(task.id);
            });

            li.appendChild(checkbox);
            li.appendChild(taskDetails);
            li.appendChild(deleteBtn);

            const isTaskForToday = new Date(task.dueDate).toDateString() === todayString;

            // Route tasks to the correct list
            if (task.isDailyHabit && isTaskForToday) {
                dailyHabitsList.appendChild(li);
            } else {
                oneTimeTasksList.appendChild(li);
            }
        });
    };

    const stackDailyHabits = () => {
        const todayStr = new Date().toDateString();
        const lastStackedDate = localStorage.getItem('lastStackedDate');

        if (lastStackedDate !== todayStr) {
            // Find all unique habit names from the entire task history
            const uniqueHabitNames = [...new Set(tasks.filter(t => t.isDailyHabit).map(t => t.name))];

            uniqueHabitNames.forEach(habitName => {
                // Check if a task for this habit already exists for today
                const hasTaskForToday = tasks.some(t =>
                    t.name === habitName &&
                    t.isDailyHabit &&
                    new Date(t.dueDate).toDateString() === todayStr
                );

                if (!hasTaskForToday) {
                    tasks.push({
                        id: self.crypto.randomUUID(), // Use unique ID
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
    const addTask = () => {
        const taskName = taskInput.value.trim();
        if (taskName === '') return;

        tasks.push({
            id: self.crypto.randomUUID(), // Generate a unique ID for each new task
            name: taskName,
            isDailyHabit: isDailyHabitCheckbox.checked,
            isCompleted: false,
            dueDate: new Date().toISOString()
        });

        taskInput.value = '';
        isDailyHabitCheckbox.checked = false;

        saveTasks();
        renderTasks();
    };

    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
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

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission was not granted.');
                return;
            }

            if ('periodicSync' in registration) {
                const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                if (status.state === 'granted') {
                    await registration.periodicSync.register('task-reminder', {
                        minInterval: 12 * 60 * 60 * 1000, // 12 hours
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
