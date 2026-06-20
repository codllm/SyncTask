# SyncTask - Complete System Feature & Action Directory

SyncTask is a collaborative project and task management system designed to streamline team collaboration. It is built as a full-stack system consisting of a universal mobile client (Expo/React Native) and a robust REST API backend (Node.js/Express/TypeScript) with MongoDB and real-time Socket.io synchronization.

This document serves as a complete directory of the project's technical architecture, database schemas, frontend screens, core features, and a permission-based user action matrix.

---

## 📁 1. Project Architecture & Technical Stack

The codebase is split into two primary directories: `BACKEND` and `FRONTED` (the mobile client).

```
task-project-management/
├── BACKEND/                    # Node.js Express server codebase
│   └── src/
│       ├── config/             # DB & Cloudinary configurations
│       ├── controllers/        # Express endpoints controllers
│       ├── middleware/         # Authentication and role guards
│       ├── model/              # MongoDB Mongoose schemas
│       ├── routes/             # API routing
│       ├── services/           # Business logic, seeding, Socket.io, cron scheduler
│       ├── app.ts              # Express setup
│       └── server.ts           # Server start & Socket.io server
│
└── FRONTED/                    # Expo React Native mobile client
    └── src/
        ├── api/                # API client services (Axios wrappers)
        ├── app/                # Expo Router structure (screens & layouts)
        ├── context/            # Global AppContext (Theme, Auth state, Socket sync)
        └── utils/              # Offline sync queue manager
```

### Technical Stack
* **Frontend**:
  * **Framework**: Expo (SDK 56) with React Native & Expo Router (file-based navigation).
  * **Styling**: NativeWind (Tailwind CSS) & Custom Theme-driven CSS.
  * **Global State**: React Context API (`AppContext.tsx`) managing user sessions, themes, and workspace data.
  * **Local Storage**: `expo-secure-store` (for JWT credentials) & `@react-native-async-storage/async-storage` (for offline caches).
  * **Offline Management**: Custom queue (`offlineManager.ts`) for caching mutations and replaying them when connectivity returns.
* **Backend**:
  * **Server**: Node.js, Express, and TypeScript.
  * **Database**: MongoDB (via Mongoose ODM).
  * **Real-Time Sync**: Socket.io for immediate notification and event dispatching.
  * **Asset Management**: Multer with Cloudinary for file attachments and avatars.
  * **Automation**: Custom scheduler (`scheduler.ts`) running a 60s cron interval checking due dates and sending recurring task runs.

---

## 🗄️ 2. Database Models & Schema Definitions

The backend maintains 8 collection schemas in MongoDB:

### 1. User (`User`)
* **Properties**:
  * `username`: Object containing `firstname` (String, required) and `lastname` (String, required).
  * `email`: String (required, unique, lowercase).
  * `password`: String (required, hashed using bcrypt).
  * `age`: Number (optional).
  * `gender`: String (required).
  * `usertype`: String (required, enum: `["individual", "team", "admin"]`).
  * `phone`: Number (optional).
  * `avatarUrl`: String (Cloudinary avatar URL).
  * `notificationPreferences`: Object toggling email/app alerts for `comments`, `assignments`, `mentions`, and `reminders`.
  * `pinnedProjects`: Array of ObjectIds referencing `Project`.
  * `pinnedTasks`: Array of ObjectIds referencing `Task`.
  * `savedFilters`: Array of saved queries containing `name`, `project`, and `query` parameters (assignee, priority, dueDate, label, sortBy, sortOrder).

### 2. Workspace (`Workspace`)
* **Properties**:
  * `name`: String (required, minlength 3).
  * `description`: String (optional).
  * `owner`: ObjectId referencing `User` (required).
  * `logoUrl`: String (optional).
  * `members`: Array of objects:
    * `user`: ObjectId referencing `User` (required).
    * `role`: String (enum: `["owner", "admin", "member", "viewer"]`, default `"member"`).

### 3. Project (`Project`)
* **Properties**:
  * `name`: String (required, minlength 3).
  * `description`: String (optional).
  * `color`: String (theme hex, default `#6C63FF`).
  * `coverImageUrl`: String (optional, Cloudinary URL).
  * `workspace`: ObjectId referencing `Workspace` (required).
  * `createdBy`: ObjectId referencing `User` (required).
  * `status`: String (enum: `["ACTIVE", "COMPLETED", "ARCHIVED"]`, default `"ACTIVE"`).
  * `deadline`: Date (optional).
  * `isDeleted`: Boolean (soft-deleted tag, default `false`).
  * `deletedAt`: Date (optional).
  * `columns`: Array of task boards custom columns (id, label, color).
  * `customFields`: Array of dynamic user-defined fields (name, type: `text`/`number`/`date`/`boolean`, required).
  * `members`: Array of objects:
    * `user`: ObjectId referencing `User` (required).
    * `role`: String (enum: `["admin", "member", "viewer"]`, default `"member"`).

### 4. Task (`Task`)
* **Properties**:
  * `title`: String (required).
  * `description`: String (optional).
  * `status`: String (default `"todo"`).
  * `priority`: String (enum: `["low", "medium", "high"]`, default `"medium"`).
  * `startDate`: Date (default now).
  * `dueDate`: Date (optional).
  * `project`: ObjectId referencing `Project` (required).
  * `createdBy`: ObjectId referencing `User` (required).
  * `assignedTo`: Array of ObjectIds referencing `User`.
  * `subtasks`: Array of checklist items (`title`, `completed`).
  * `labels`: Array of Strings (tags).
  * `attachments`: Array of Cloudinary objects (`name`, `url`, `publicId`, `fileType`, `uploadedBy`, `description`, `createdAt`).
  * `dependencies`: Array of ObjectIds referencing pre-requisite `Task` cards.
  * `recurring`: Object tracking recurring schedules (`isRecurring`, frequency: `daily`/`weekly`/`monthly`/`none`, `nextRun`).
  * `milestone`: ObjectId referencing `Milestone` (optional).
  * `position`: Number (order index in Kanban columns).
  * `isArchived`: Boolean (default `false`).
  * `isDeleted`: Boolean (soft-deleted tag, default `false`).
  * `deletedAt`: Date (optional).
  * `estimatedHours`: Number (default `0`).
  * `actualHours`: Number (default `0`).
  * `timeLogs`: Array of logged entries (`loggedBy`, `hours`, `description`, `date`, `createdAt`).
  * `customFields`: Array of dynamic values matching the project schema (`name`, `value` as Schema.Types.Mixed).

### 5. Milestone (`Milestone`)
* **Properties**:
  * `title`: String (required).
  * `description`: String (optional).
  * `project`: ObjectId referencing `Project` (required).
  * `dueDate`: Date (optional).
  * `status`: String (enum: `["active", "completed"]`, default `"active"`).
  * `tasks`: Array of ObjectIds referencing `Task`.

### 6. Comment (`Comment`)
* **Properties**:
  * `content`: String (required, supports rich-text markdown).
  * `task`: ObjectId referencing `Task` (required).
  * `user`: ObjectId referencing `User` (required).
  * `reactions`: Array of objects storing emoji responses:
    * `user`: ObjectId referencing `User` (required).
    * `emoji`: String (emoji character, required).

### 7. Notification (`Notification`)
* **Properties**:
  * `recipient`: ObjectId referencing `User` (required, indexed).
  * `sender`: ObjectId referencing `User` (optional).
  * `type`: String (enum: `["TASK_ASSIGNED", "TASK_UPDATED", "PROJECT_ADDED", "WORKSPACE_INVITE", "COMMENT_ADDED"]`).
  * `title`: String (required).
  * `message`: String (required).
  * `read`: Boolean (default `false`).
  * `link`: String (redirect deep-link schema, e.g. path to screen).

### 8. Activity (`Activity`)
* **Properties**:
  * `workspace`: ObjectId referencing `Workspace` (required).
  * `project`: ObjectId referencing `Project` (optional).
  * `task`: ObjectId referencing `Task` (optional).
  * `user`: ObjectId referencing `User` (required).
  * `action`: String (action summary).
  * `details`: String (long-form details of the change).

---

## 🚀 3. Features & Capabilities

### 1. Collaboration & Multi-Tenancy
* **Multi-User Workspaces**: Workspaces isolate projects and members. Users can invite colleagues, designate workspace administrators, leave workspaces, or delete workspaces entirely.
* **Granular Project Boards**: Individual projects represent single codebases, client workloads, or sprints. Projects are visually customized with distinct hex colors and background cover photos.

### 2. Multi-Layout Task Workspace (Six Distinct Views)
The Tasks screen features an advanced layout switcher that reorganizes active project tasks dynamically:
1. **Kanban Board**: A card-based interface displaying tasks in status columns. Tasks can be dragged and dropped to update their status.
2. **Calendar View**: A calendar plotting tasks on their respective due dates, allowing teams to coordinate milestones and deadlines.
3. **Timeline (Gantt Chart)**: A horizontal timeline displaying project schedules, task durations, and dependencies.
4. **Team Workload View**: A resource management dashboard showing active tasks assigned to each member. Members exceeding the threshold (e.g. >5 active tasks or >40 logged/estimated hours) are visually highlighted as overloaded. Includes a built-in search bar to filter assignments.
5. **Bulk Actions Grid**: A multi-select grid interface that lets users choose multiple task items simultaneously to status-update, reassign, archive, or delete them in batches.
6. **Trash Bin & Undo**: A temporary repository hosting deleted tasks and projects for up to 30 days. When an item is deleted, an undo banner appears, allowing the user to reverse the action.

### 3. Deep Task Management Capabilities
* **Checklists**: Nested checklists within task detail modals with real-time percentage completion indicators.
* **Time Logs**: Logging estimated vs. actual hours. A visual tracking bar displays green when on track, and red if the actual hours exceed the estimate. A detailed time log history records individual logs.
* **Cloudinary File Attachments**: Users upload images, PDFs, and documents directly from their mobile device's media library.
* **Dynamic Custom Fields**: Project administrators define custom task fields (e.g., text, number, date, boolean fields like "Story Points" or "QA Approved") that are generated dynamically on every task within the project.
* **Task Dependencies**: Establish links between tasks. A task can require completion of other blocker tasks.
* **Recurring Tasks**: Automate recurring routines (Daily, Weekly, Monthly). The backend scheduler generates new task iterations and sends push notifications.

### 4. Interactive Comments, Mentions & Reactions
* **Markdown Support**: Task comments support rich-text markdown styling.
* **Real-time Mentions**: Typing `@username` in task descriptions or comments highlights the mention and triggers an instant notification for the mentioned user.
* **Emoji Reactions**: Users can react to any comment with emojis, aggregating reaction counts dynamically.

### 5. Seeding, Search, & Offline Support
* **Auto-Seeding**: When a new user signs up and has no workspaces, the backend automatically seeds two complete project environments (**🚀 Apollo Space Project** and **💻 Acme Software Co.**) populated with mock projects, tasks, custom fields, milestones, comments, and logged time logs.
* **Search Center**: Search workspaces, projects, and tasks globally or individually. An autocomplete system handles user lookups for workspace invitations and comments.
* **Offline First & Cache Sync**: All network reads fall back to local AsyncStorage. Mutating commands are stored in an offline queue (`offlineManager.ts`) and synchronized when the connection is restored.
* **Optimistic UI Updates**: Updates to Kanban columns and task statuses render instantly in the UI before server confirmation.

---

## 🎭 4. User Actions & Permission Matrix

Permissions are enforced both on the client UI (elements are hidden or disabled) and validated securely in backend Express middleware.

### 1. Roles Definition
* **Individual**: General personal account type.
* **Workspace Roles**:
  * **Owner**: The workspace creator. Full administrative capabilities.
  * **Admin**: Promoted workspace manager. Can edit settings, add members, and delete projects.
  * **Member**: Standard worker. Can write tasks, projects, comments, and time logs.
  * **Viewer**: Read-only account. Restricted from making edits or additions.
* **Project Roles**:
  * **Admin**: Full administrative power on project settings (custom columns, custom fields).
  * **Member**: Standard project contributor (creates and updates tasks).
  * **Viewer**: Read-only view.

### 2. User Actions Matrix

| Feature Area | Action | Allowed Roles (Workspace/Project) | Restricted Roles | Effect / Result |
| :--- | :--- | :--- | :--- | :--- |
| **Workspace** | Create Workspace | Any registered user | None | Initializes new workspace |
| | Update Workspace Details | Workspace `owner`, `admin` | Workspace `member`, `viewer` | Edits name, description, logo |
| | Add / Remove Members | Workspace `owner`, `admin` | Workspace `member`, `viewer` | Manages workspace member list |
| | Change Member Role | Workspace `owner`, `admin` | Workspace `member`, `viewer` | Promotes/demotes between admin, member, viewer |
| | Leave Workspace | Workspace `admin`, `member`, `viewer` | Workspace `owner` (must transfer ownership first) | Removes self from workspace |
| | Delete Workspace | Workspace `owner` | Workspace `admin`, `member`, `viewer` | Permanently deletes workspace |
| **Project** | Create Project | Workspace `owner`, `admin`, `member` | Workspace `viewer` | Initializes project in workspace |
| | Update Project Settings | Project `admin`, Workspace `owner`/`admin` | Project `member`, `viewer` | Modifies name, color, deadline, cover image |
| | Set Custom Columns | Project `admin`, Workspace `owner`/`admin` | Project `member`, `viewer` | Creates custom status steps (e.g. "In QA") |
| | Set Custom Fields Schema | Project `admin`, Workspace `owner`/`admin` | Project `member`, `viewer` | Defines custom field names & datatypes |
| | Add / Remove Members | Project `admin`, Workspace `owner`/`admin` | Project `member`, `viewer` | Restricts project visibility to specific members |
| | Soft-Delete Project | Workspace `owner`, `admin`, Project `admin` | Project `member`, `viewer` | Moves project to Workspace Trash Bin |
| | Restore Project | Project `admin`, Workspace `owner`/`admin` | Project `member`, `viewer` | Moves project back to active list |
| | Permanent Delete | Workspace `owner`, `admin` | Project `member`, `viewer` | Wipes project and its tasks from DB |
| **Task** | Create Task | Project `admin`/`member` | Project `viewer`, Workspace `viewer` | Appends a new task card to status column |
| | Update Task Details | Project `admin`/`member` | Project `viewer` | Edits title, description, assignees, subtasks, fields |
| | Log Hours Worked | Project `admin`/`member` | Project `viewer` | Appends hour log, updates task `actualHours` |
| | Edit Custom Fields Value | Project `admin`/`member` | Project `viewer` | Inputs values for user-defined fields |
| | Import / Export CSV | Project `admin`/`member` | Project `viewer` | Downloads CSV or creates tasks from CSV bulk strings |
| | Pin/Unpin Task | Project `admin`/`member`/`viewer` | None (User-centric) | Places task on user's dashboard "Pinned Tasks" |
| | Soft-Delete Task | Project `admin`/`member` | Project `viewer` | Moves task to Project Trash Bin |
| | Restore Task | Project `admin`/`member` | Project `viewer` | Moves task back to active Kanban board |
| | Permanent Delete Task | Project `admin`/`member` | Project `viewer` | Erases task permanently |
| **Milestone** | Create / Edit Milestone | Project `admin`/`member` | Project `viewer` | Establishes project milestone |
| | Complete Milestone | Project `admin`/`member` | Project `viewer` | Toggles status to completed |
| | Delete Milestone | Project `admin`/`member` | Project `viewer` | Deletes milestone |
| **Comments** | Post Task Comment | Project `admin`/`member` | Project `viewer` | Adds comments with mentions (`@username`) |
| | Edit / Delete Comment | Author of comment, Project `admin` | Other members, Project `viewer` | Modifies or deletes comment |
| | React to Comment | Project `admin`/`member` | Project `viewer` | Toggles emoji reactions on comment |
| **Profile** | Upload Avatar | Current user | None | Uploads profile picture to Cloudinary |
| | Save Filter Presets | Current user | None | Saves reusable filter configurations |
| | Update Preferences | Current user | None | Edits account email/alert notification switches |

---

## 📱 5. Frontend Screens & Page Structures

The client application structure is mapped out under `FRONTED/src/app` as follows:

### 🌟 1. Landing Screen (`index.tsx`)
* **Behavior**: Serves as the initial entry guard. Detects whether a JWT token is stored locally. If a token is found, it directs the user to the Home dashboard; otherwise, it routes to the (auth) directory.

### 🔐 2. Authentication flow (`(auth)/`)
* **Login Screen (`login.tsx`)**: Email and password input fields. Handles validation and stores JWT tokens securely upon success.
* **Register Screen (`register.tsx`)**: Account signup wizard. Inputs firstname, lastname, email, password, gender, phone, and usertype (`individual`, `team`, or `admin`).

### 🏠 3. Tab Screens (`(tabs)/`)

#### A. Home Screen (`home.tsx`)
* **Dashboard Widgets**:
  * **Workspace Switcher**: Dropdown selecting the active workspace context.
  * **Pinned Items**: Displays starred projects and tasks for quick navigation.
  * **Personal Analytics**: Shows task completions, overdue counts, and a velocity timeline.
  * **Workspace Metrics**: Renders statistics on total tasks, completion rates, and active team contributions.
  * **Workspace Activity Feed**: Vertical list displaying recent activity logs.

#### B. Projects Screen (`projects.tsx`)
* **Interface**:
  * **Active Grid**: Grid listing all active projects within the current workspace.
  * **Project Manager Modal**: Modal to create or edit projects (name, description, color picker, and cover image picker).
  * **Trash Bin Drawer**: Displays soft-deleted projects with quick "Restore" and "Delete Permanently" actions.

#### C. Tasks Screen (`tasks.tsx`)
* **Features**:
  * **Board Switcher**: Switcher selecting Kanban, Calendar, Timeline, Workload, Bulk Actions, or Trash layouts.
  * **Filter Panel**: Filtering by assignee, priority, due date, labels, and sorting order. Offers options to save filters.
  * **Import / Export**: Paste CSV fields to import tasks or export to CSV.
  * **Task Details Modal**: Comprehensive overlay containing descriptions, assignee dropdowns, checklists, Cloudinary uploaders, dependencies, time logging, and the markdown comments thread.

#### D. Notifications Screen (`notifications.tsx`)
* **Features**:
  * **Feed List**: Lists alerts with relative timestamps.
  * **Category Filters**: Filter alerts by types (assignments, updates, comments, etc.).
  * **Mark All as Read**: Clears all unread indicators.
  * **Quick Redirection**: Tapping an alert redirects the app context to the relevant task, project, or workspace.

#### E. Profile Settings Screen (`profile.tsx`)
* **Features**:
  * **User Avatar Uploader**: Tap the profile avatar to choose a photo from the gallery, upload to Cloudinary, and display it as your user icon.
  * **Account Info**: Modify names, age, phone number, and gender.
  * **Preferences**: Toggle email/app preferences for comments, assignments, mentions, and reminders.
  * **Theme Customizer**: Select accent colors and toggle Light/Dark Mode.

#### F. Workspace Wizard (`createWorkspace.tsx`)
* **Interface**: Step-by-step wizard creating new workspaces or joining existing ones. Includes tools to edit member roles, add new invitees, or transfer ownership.

---

## 📡 6. Backend API Routes & WebSocket Events

### REST Endpoints
* **Authentication**: `/api/users/new/register`, `/api/users/login`, `/api/users/profile`, `/api/users/preferences`, `/api/users/update`.
* **Workspace Management**: `/api/workspaces/create`, `/api/workspaces/user/:userId`, `/api/workspaces/:workspaceId/add-member`, `/api/workspaces/update/:workspaceId`, `/api/workspaces/delete/:workspaceId`.
* **Project Pipelines**: `/api/projects/create`, `/api/projects/workspace/:workspaceId`, `/api/projects/:projectId/columns`, `/api/projects/:projectId/custom-fields`, `/api/projects/delete/:projectId`, `/api/projects/restore/:projectId`.
* **Task Management**: `/api/tasks/create`, `/api/tasks/project/:projectId`, `/api/tasks/:taskId/time-log`, `/api/tasks/bulk-update`, `/api/tasks/:taskId/restore`, `/api/tasks/:taskId/permanent`.
* **Milestones**: `/api/milestones/`, `/api/milestones/project/:projectId`, `/api/milestones/:milestoneId`.
* **Comments & Reactions**: `/api/comments/task/:taskId`, `/api/comments/:commentId/react`, `/api/comments/:commentId`.
* **Global Search**: `/api/search/global`, `/api/search/users`, `/api/search/user/suggestion/:query`.
* **Notifications**: `/api/notifications/`, `/api/notifications/:notificationId/read`, `/api/notifications/read-all`.
* **Analytics**: `/api/analytics/workspace/:workspaceId`, `/api/activities/workspace/:workspaceId`.

### WebSocket Events (`Socket.io`)
* **`connection`**: Initiates live session sync.
* **`joinWorkspace`**: Restricts messaging to relevant workspace members.
* **`notification`**: Dispatches real-time alerts to logged-in users when task assignments, updates, or comment mentions occur.
* **`activity`**: Broadcasts project updates to workspace activity boards in real time.
