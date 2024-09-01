document.addEventListener('DOMContentLoaded', function() {
    const addProjectButton = document.getElementById('add-project');
    const projectNameInput = document.getElementById('project-name');
    const projectsContainer = document.getElementById('projects-container');
    const kanbanContainer = document.getElementById('kanban-container');
    const addTaskButton = document.getElementById('add-task-button');
    const taskNameInput = document.getElementById('task-name');

    let projects = {}; // Store projects and their tasks

    // Function to create a new project
    function createProject(projectName) {
        const projectLinkContainer = document.createElement('div');
        projectLinkContainer.className = 'project-link-container';

        const projectAnchor = document.createElement('a');
        projectAnchor.href = '#';
        projectAnchor.textContent = projectName;
        projectAnchor.className = 'project-link';
        projectAnchor.addEventListener('click', function() {
            showProject(projectName);
        });

        const deleteButton = document.createElement('span');
        deleteButton.innerHTML = '🗑️';
        deleteButton.className = 'delete-project-icon';
        deleteButton.style.cursor = 'pointer';
        deleteButton.addEventListener('click', function() {
            deleteProject(projectName);
        });

        const renameButton = document.createElement('span');
        renameButton.innerHTML = '✎';
        renameButton.className = 'rename-project-icon';
        renameButton.style.cursor = 'pointer';
        renameButton.addEventListener('click', function() {
            renameProject(projectName);
        });

        projectLinkContainer.appendChild(projectAnchor);
        projectLinkContainer.appendChild(renameButton);
        projectLinkContainer.appendChild(deleteButton);

        projectsContainer.appendChild(projectLinkContainer);

        // Initialize project with empty tasks
        projects[projectName] = { tasks: { 'to-do': [], 'in-progress': [], 'done': [] } };
        saveProjects();
    }

    // Function to rename a project
    function renameProject(oldName) {
        const newName = prompt('Enter the new project name:', oldName);
        if (newName && !projects[newName]) {
            projects[newName] = projects[oldName];
            delete projects[oldName];

            document.querySelectorAll('.project-link-container').forEach(linkContainer => {
                const link = linkContainer.querySelector('.project-link');
                if (link.textContent === oldName) {
                    link.textContent = newName;
                }
            });

            saveProjects();
            showProject(newName);
        } else {
            alert('Project name is empty or already exists!');
        }
    }

    // Function to show the selected project and its tasks
    function showProject(projectName) {
        createKanbanBoard(); // Create fixed columns each time

        document.querySelectorAll('.project-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = Array.from(projectsContainer.children).find(link => link.querySelector('.project-link').textContent === projectName);
        if (activeLink) {
            activeLink.querySelector('.project-link').classList.add('active');
        }

        const projectTasks = projects[projectName].tasks;
        ['to-do', 'in-progress', 'done'].forEach(column => {
            const columnItems = document.getElementById(`${column}-items`);
            if (columnItems) {
                columnItems.innerHTML = ''; // Clear existing tasks
                projectTasks[column].forEach(task => {
                    const taskDiv = createTaskElement(task.name, task.id, column);
                    columnItems.appendChild(taskDiv);
                });
            }
        });
    }

    // Function to create fixed Kanban columns
    function createKanbanBoard() {
        kanbanContainer.innerHTML = ''; // Clear existing board

        const columns = ['To Do', 'In Progress', 'Done'];
        const kanbanBoard = document.createElement('div');
        kanbanBoard.className = 'kanban-board';

        columns.forEach(column => {
            const columnDiv = document.createElement('div');
            columnDiv.className = 'kanban-column';
            columnDiv.id = column.toLowerCase().replace(/ /g, '-');

            const columnHeader = document.createElement('h2');
            columnHeader.textContent = column;

            const columnItems = document.createElement('div');
            columnItems.className = 'kanban-items';
            columnItems.id = `${column.toLowerCase().replace(/ /g, '-')}-items`;

            columnDiv.appendChild(columnHeader);
            columnDiv.appendChild(columnItems);

            kanbanBoard.appendChild(columnDiv);
        });

        kanbanContainer.appendChild(kanbanBoard);

        addDragAndDrop(); // Initialize drag-and-drop functionality
    }

    // Function to handle adding a new project
    function addProject() {
        const projectName = projectNameInput.value.trim();
        if (projectName && !projects[projectName]) {
            createProject(projectName);
            showProject(projectName);
            projectNameInput.value = '';
        } else {
            alert("Project already exists or input is empty!");
        }
    }

    // Function to handle adding a task
    function addTask() {
        const taskName = taskNameInput.value.trim();
        const activeProject = document.querySelector('.project-link.active');
        if (taskName && activeProject) {
            const projectName = activeProject.textContent;
            const taskId = 'task-' + new Date().getTime();
            const taskDiv = createTaskElement(taskName, taskId, 'to-do');
            const todoItems = document.getElementById('to-do-items');
            todoItems.appendChild(taskDiv);

            // Add task to projects object
            projects[projectName].tasks['to-do'].push({ name: taskName, id: taskId });
            saveProjects(); // Save changes
            taskNameInput.value = '';
        } else {
            alert("Please enter a task and select a project!");
        }
    }

    // Function to create a task element
    function createTaskElement(taskName, taskId, column) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'kanban-item';
        taskDiv.textContent = taskName;
        taskDiv.draggable = true;
        taskDiv.id = taskId;

        // Removed rename button
        const deleteTaskButton = document.createElement('span');
        deleteTaskButton.innerHTML = '🗑️';
        deleteTaskButton.className = 'delete-task-icon';
        deleteTaskButton.style.cursor = 'pointer';
        deleteTaskButton.addEventListener('click', function() {
            taskDiv.remove();
            removeTaskFromProject(taskId, column);
        });

        taskDiv.appendChild(deleteTaskButton);
        return taskDiv;
    }

    // Function to remove task from the current project's data
    function removeTaskFromProject(taskId, column) {
        const activeProject = document.querySelector('.project-link.active');
        if (activeProject) {
            const projectName = activeProject.textContent;
            projects[projectName].tasks[column] = projects[projectName].tasks[column].filter(task => task.id !== taskId);
            saveProjects(); // Save changes
        }
    }

    // Function to delete a project
    function deleteProject(projectName) {
        delete projects[projectName];
        document.querySelectorAll('.project-link-container').forEach(linkContainer => {
            if (linkContainer.querySelector('.project-link').textContent === projectName) {
                linkContainer.remove();
            }
        });
        saveProjects();
        kanbanContainer.innerHTML = ''; // Clear Kanban board
    }

    // Function to add drag-and-drop functionality
    function addDragAndDrop() {
        const items = document.querySelectorAll('.kanban-item');
        const columns = document.querySelectorAll('.kanban-column');

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.id);
                e.target.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });
        });

        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.target.classList.add('drag-over');
            });

            column.addEventListener('dragleave', (e) => {
                e.target.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                e.target.classList.remove('drag-over');

                const taskId = e.dataTransfer.getData('text/plain');
                const taskElement = document.getElementById(taskId);

                if (taskElement) {
                    const columnItems = e.target.closest('.kanban-column').querySelector('.kanban-items');
                    if (columnItems) {
                        taskElement.parentElement.removeChild(taskElement);
                        columnItems.appendChild(taskElement);

                        const newColumnId = columnItems.id.split('-items')[0];
                        const oldColumnId = Object.keys(projects[document.querySelector('.project-link.active').textContent].tasks)
                                                .find(col => projects[document.querySelector('.project-link.active').textContent].tasks[col].some(task => task.id === taskId));

                        removeTaskFromProject(taskId, oldColumnId);
                        projects[document.querySelector('.project-link.active').textContent].tasks[newColumnId].push({ name: taskElement.textContent, id: taskId });
                        saveProjects();
                    }
                }
                addDragAndDrop(); // Reinitialize drag-and-drop
            });
        });
    }

    // Function to save projects and tasks to localStorage
    function saveProjects() {
        console.log('Saving projects:', projects); // Log to check if projects are being updated
        localStorage.setItem('kanbanProjects', JSON.stringify(projects));
    }

    // Function to load projects and tasks from localStorage
    function loadProjects() {
        const savedProjects = JSON.parse(localStorage.getItem('kanbanProjects'));
        if (savedProjects) {
            projects = savedProjects;
            console.log('Loaded projects:', projects); // Log to check if tasks are being loaded
            Object.keys(projects).forEach(projectName => {
                createProject(projectName);
                showProject(projectName); // Show the project to initialize the Kanban board

                const projectTasks = projects[projectName].tasks;
                ['to-do', 'in-progress', 'done'].forEach(column => {
                    const columnItems = document.getElementById(`${column}-items`);
                    if (columnItems) {
                        columnItems.innerHTML = ''; // Clear existing tasks
                        projectTasks[column].forEach(task => {
                            const taskDiv = createTaskElement(task.name, task.id, column);
                            columnItems.appendChild(taskDiv);
                        });
                    }
                });
            });
            if (Object.keys(projects).length > 0) {
                // Optionally, show the first project by default
                showProject(Object.keys(projects)[0]);
            }
        }
    }

    // Event listeners for buttons
    addProjectButton.addEventListener('click', addProject);
    addTaskButton.addEventListener('click', addTask);

    // Initial load
    loadProjects();
});
