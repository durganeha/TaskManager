class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentSection = 'dashboard';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedDate = null;
        this.editingTask = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderDashboard();
        this.renderCalendar();
        this.renderAnalytics();
        this.updateStats();
    }

    bindEvents() {
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // Modal controls
        document.getElementById('modalClose').addEventListener('click', this.closeTaskModal);
        document.getElementById('cancelBtn').addEventListener('click', this.closeTaskModal);
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Filters
        document.getElementById('statusFilter').addEventListener('change', this.renderTasks);
        document.getElementById('priorityFilter').addEventListener('change', this.renderTasks);

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendar();
        });

        // Analytics timeframe
        document.getElementById('analyticsTimeframe').addEventListener('change', this.renderAnalytics);

        // Close modal when clicking outside
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeTaskModal();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            tasks: 'Task Tracker',
            calendar: 'Calendar',
            analytics: 'Analytics'
        };
        document.getElementById('pageTitle').textContent = titles[section];

        this.currentSection = section;

        // Render section-specific content
        if (section === 'tasks') {
            this.renderTasks();
        } else if (section === 'calendar') {
            this.renderCalendar();
        } else if (section === 'analytics') {
            this.renderAnalytics();
        } else if (section === 'dashboard') {
            this.renderDashboard();
        }
    }

    openTaskModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                this.editingTask = task;
                modalTitle.textContent = 'Edit Task';
                this.populateTaskForm(task);
            }
        } else {
            this.editingTask = null;
            modalTitle.textContent = 'Add New Task';
            this.resetTaskForm();
        }
        
        modal.classList.add('active');
    }

    closeTaskModal = () => {
        document.getElementById('taskModal').classList.remove('active');
        this.editingTask = null;
        this.resetTaskForm();
    }

    populateTaskForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
        document.getElementById('taskCategory').value = task.category || '';
    }

    resetTaskForm() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskStatus').value = 'pending';
    }

    saveTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const status = document.getElementById('taskStatus').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const category = document.getElementById('taskCategory').value.trim();

        if (!title) {
            alert('Please enter a task title');
            return;
        }

        const taskData = {
            title,
            description,
            priority,
            status,
            dueDate: dueDate ? dueDate + 'T00:00:00.000Z' : null,
            category,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingTask) {
            // Update existing task
            const index = this.tasks.findIndex(t => t.id === this.editingTask.id);
            this.tasks[index] = { ...this.editingTask, ...taskData, updatedAt: new Date().toISOString() };
        } else {
            // Create new task
            const newTask = {
                id: Date.now().toString(),
                ...taskData
            };
            this.tasks.push(newTask);
        }

        this.saveToStorage();
        this.closeTaskModal();
        this.updateStats();
        this.renderTasks();
        this.renderDashboard();
        this.renderCalendar();
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveToStorage();
            this.updateStats();
            this.renderTasks();
            this.renderDashboard();
            this.renderCalendar();
        }
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            task.updatedAt = new Date().toISOString();
            this.saveToStorage();
            this.updateStats();
            this.renderTasks();
            this.renderDashboard();
            this.renderCalendar();
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('inProgressTasks').textContent = inProgress;
    }

    renderDashboard() {
        const recentTasks = this.tasks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        const recentTasksList = document.getElementById('recentTasksList');
        
        if (recentTasks.length === 0) {
            recentTasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No tasks yet. Create your first task to get started!</p>
                </div>
            `;
            return;
        }

        recentTasksList.innerHTML = recentTasks.map(task => `
            <div class="task-item priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}">
                <div class="task-header-row">
                    <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                         onclick="taskManager.toggleTaskComplete('${task.id}')">
                        ${task.status === 'completed' ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="task-content">
                        <h3 class="task-title ${task.status === 'completed' ? 'completed' : ''}">${task.title}</h3>
                        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                    </div>
                </div>
                <div class="task-meta">
                    <div class="task-tags">
                        <span class="task-tag priority ${task.priority}">${task.priority}</span>
                        <span class="task-tag status">${task.status.replace('-', ' ')}</span>
                        ${task.category ? `<span class="task-tag category">${task.category}</span>` : ''}
                        ${task.dueDate ? `<span class="task-tag">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="task-btn" onclick="taskManager.openTaskModal('${task.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-btn delete" onclick="taskManager.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTasks = () => {
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;

        let filteredTasks = this.tasks;

        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
        }

        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }

        const tasksList = document.getElementById('tasksList');

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No tasks found matching your filters.</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => `
            <div class="task-item priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}">
                <div class="task-header-row">
                    <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                         onclick="taskManager.toggleTaskComplete('${task.id}')">
                        ${task.status === 'completed' ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="task-content">
                        <h3 class="task-title ${task.status === 'completed' ? 'completed' : ''}">${task.title}</h3>
                        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                    </div>
                </div>
                <div class="task-meta">
                    <div class="task-tags">
                        <span class="task-tag priority ${task.priority}">${task.priority}</span>
                        <span class="task-tag status">${task.status.replace('-', ' ')}</span>
                        ${task.category ? `<span class="task-tag category">${task.category}</span>` : ''}
                        ${task.dueDate ? `<span class="task-tag">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="task-btn" onclick="taskManager.openTaskModal('${task.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-btn delete" onclick="taskManager.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderCalendar() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

        let calendarHTML = '<div class="calendar-weekdays">';
        dayNames.forEach(day => {
            calendarHTML += `<div class="calendar-weekday">${day}</div>`;
        });
        calendarHTML += '</div><div class="calendar-days">';

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            calendarHTML += `<div class="calendar-day other-month">${day}</div>`;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            // Create date string in YYYY-MM-DD format without timezone conversion
            const dateString = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const tasksOnDate = this.tasks.filter(task => 
                task.dueDate && task.dueDate.split('T')[0] === dateString
            );
            
            let classes = 'calendar-day';
            if (tasksOnDate.length > 0) classes += ' has-tasks';
            if (this.selectedDate === dateString) classes += ' selected';

            let tasksHTML = '';
            if (tasksOnDate.length > 0) {
                tasksHTML = tasksOnDate.slice(0, 3).map(task => `
                    <div class="calendar-task ${task.status === 'completed' ? 'completed' : ''} priority-${task.priority}">
                        ${task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                    </div>
                `).join('');
                if (tasksOnDate.length > 3) {
                    tasksHTML += `<div class="calendar-task-more">+${tasksOnDate.length - 3} more</div>`;
                }
            }

            calendarHTML += `
                <div class="${classes}" onclick="taskManager.selectDate('${dateString}')">
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-tasks">${tasksHTML}</div>
                </div>
            `;
        }

        // Next month days
        const remainingDays = 42 - (firstDay + daysInMonth);
        for (let day = 1; day <= remainingDays; day++) {
            calendarHTML += `<div class="calendar-day other-month">${day}</div>`;
        }

        calendarHTML += '</div>';
        document.getElementById('calendarGrid').innerHTML = calendarHTML;
    }

    selectDate(dateString) {
        this.selectedDate = dateString;
        this.renderCalendar();

        const tasksOnDate = this.tasks.filter(task => 
            task.dueDate && task.dueDate.split('T')[0] === dateString
        );

        const selectedDateEl = document.getElementById('selectedDate');
        const dateTasksEl = document.getElementById('dateTasks');

        selectedDateEl.textContent = `Tasks for ${new Date(dateString).toLocaleDateString()}`;

        if (tasksOnDate.length === 0) {
            dateTasksEl.innerHTML = '<p>No tasks scheduled for this date.</p>';
            return;
        }

        dateTasksEl.innerHTML = tasksOnDate.map(task => `
            <div class="task-item priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}">
                <div class="task-header-row">
                    <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                         onclick="taskManager.toggleTaskComplete('${task.id}')">
                        ${task.status === 'completed' ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="task-content">
                        <h3 class="task-title ${task.status === 'completed' ? 'completed' : ''}">${task.title}</h3>
                        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                    </div>
                </div>
                <div class="task-meta">
                    <div class="task-tags">
                        <span class="task-tag priority ${task.priority}">${task.priority}</span>
                        <span class="task-tag status">${task.status.replace('-', ' ')}</span>
                        ${task.category ? `<span class="task-tag category">${task.category}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderAnalytics = () => {
        const timeframe = document.getElementById('analyticsTimeframe').value;
        
        this.renderStatusChart();
        this.renderPriorityChart();
        this.renderProgressChart(timeframe);
    }

    renderStatusChart() {
        const ctx = document.getElementById('statusChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.statusChart) {
            this.statusChart.destroy();
        }

        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;

        this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending', 'In Progress'],
                datasets: [{
                    data: [completed, pending, inProgress],
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#3b82f6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderPriorityChart() {
        const ctx = document.getElementById('priorityChart').getContext('2d');
        
        if (this.priorityChart) {
            this.priorityChart.destroy();
        }

        const high = this.tasks.filter(t => t.priority === 'high').length;
        const medium = this.tasks.filter(t => t.priority === 'medium').length;
        const low = this.tasks.filter(t => t.priority === 'low').length;

        this.priorityChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    data: [high, medium, low],
                    backgroundColor: [
                        '#ef4444',
                        '#f59e0b',
                        '#10b981'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderProgressChart(timeframe) {
        const ctx = document.getElementById('progressChart').getContext('2d');
        
        if (this.progressChart) {
            this.progressChart.destroy();
        }

        let data = [];
        let labels = [];

        const now = new Date();
        
        if (timeframe === 'weekly') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                
                const completedOnDate = this.tasks.filter(task => 
                    task.status === 'completed' && 
                    task.updatedAt && 
                    task.updatedAt.split('T')[0] === dateString
                ).length;
                
                labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
                data.push(completedOnDate);
            }
        } else if (timeframe === 'monthly') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const year = date.getFullYear();
                const month = date.getMonth();
                
                const completedInMonth = this.tasks.filter(task => {
                    if (!task.updatedAt || task.status !== 'completed') return false;
                    const taskDate = new Date(task.updatedAt);
                    return taskDate.getFullYear() === year && taskDate.getMonth() === month;
                }).length;
                
                labels.push(date.toLocaleDateString('en', { month: 'short' }));
                data.push(completedInMonth);
            }
        } else {
            // Last 5 years
            for (let i = 4; i >= 0; i--) {
                const year = now.getFullYear() - i;
                
                const completedInYear = this.tasks.filter(task => {
                    if (!task.updatedAt || task.status !== 'completed') return false;
                    return new Date(task.updatedAt).getFullYear() === year;
                }).length;
                
                labels.push(year.toString());
                data.push(completedInYear);
            }
        }

        this.progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Completed Tasks',
                    data: data,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    saveToStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Initialize the application
window.taskManager = null;

document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});