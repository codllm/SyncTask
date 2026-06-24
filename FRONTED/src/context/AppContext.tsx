import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as storage from "../utils/storage";
import { getProfileApi, updateThemeColorApi } from "../api/user.api";
import { getUserWorkspace, Workspace, createWorkspace } from "../api/workspace.api";
import { getWorkspaceProjects, Project, createProject } from "../api/project.api";
import { getNotifications } from "../api/notification.api";
import { Todo, getTodos, createTodo, updateTodo, deleteTodo } from "../api/todo.api";

interface AppContextType {
  user: any | null;
  setUser: (user: any | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  loading: boolean;
  themeColor: string;
  setThemeColor: (color: string) => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => Promise<void>;
  C: any;
  todoMode: boolean;
  setTodoMode: (enabled: boolean) => Promise<void>;
  
  // Simple Todo Actions
  todoTasks: Todo[];
  fetchTodoTasks: () => Promise<void>;
  addTodoTask: (title: string) => Promise<void>;
  toggleTodoTask: (todo: Todo) => Promise<void>;
  deleteTodoTask: (todoId: string) => Promise<void>;
  updateTodoTask: (todoId: string, updates: { title?: string; description?: string; priority?: "low" | "medium" | "high" }) => Promise<void>;
  
  // Handlers
  refreshData: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  refreshProjects: (workspaceId?: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  selectWorkspace: (workspace: Workspace | null) => Promise<void>;
  selectProject: (project: Project | null) => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<any | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [themeColor, setThemeColorState] = useState<string>("#6366F1");
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(true);
  const [todoMode, setTodoModeState] = useState<boolean>(false);
  const [todoTasks, setTodoTasks] = useState<Todo[]>([]);
  // ── NEW: flips to true only after SecureStore bootstrap finishes,
  //         so refreshData never fires before the token is loaded.
  const [tokenReady, setTokenReady] = useState<boolean>(false);

  // Themes
  const darkTheme = {
    // Backgrounds
    bg: "#0D1117",          // Main background
    card: "#161B22",        // Card background
    cardBorder: "#30363D",
    border: "#30363D",
    borderSubtle: "#242A32",
    cardUnread: "#1A1F28",
    divider: "#21262D",
  
    // Inputs
    input: "#161B22",
    inputBorder: "#30363D",
  
    // Text
    textPrimary: "#F0F6FC",     // Main white
    textSecondary: "#C9D1D9",   // Secondary text
    textMuted: "#8B949E",       // Descriptions / labels
    textLabel: "#A5B0BB",
    tagText: "#8B949E",
  
    // Accent
    accent: "#6366F1",          // Linear purple
    onAccent: "#FFFFFF",
  
    // Status
    success: "#3FB950",
    warning: "#D29922",
    danger: "#F85149",
  
    dangerBg: "rgba(248,81,73,0.08)",
    dangerBorder: "rgba(248,81,73,0.18)",
  
    // Tags
    tagBg: "#21262D",
  };

  const lightTheme = {
    bg: "#F8F9FA",
    card: "#FFFFFF",
    cardBorder: "#E9ECEF",
    border: "#E9ECEF",
    cardUnread: "#EDF2FF",
    divider: "#DEE2E6",
    input: "#F1F3F5",
    inputBorder: "#CED4DA",
    textPrimary: "#1A1D20",
    textSecondary: "#495057",
    textMuted: "#868E96",
    textLabel: "#7A86A0",
    accent: "#6366F1",
    onAccent: "#0D2A30",
    danger: "#FA5252",
    dangerBg: "rgba(250,82,82,0.1)",
    dangerBorder: "rgba(250,82,82,0.2)",
    tagBg: "#E9ECEF",
    tagText: "#495057",
  };

  const C = isDarkMode ? darkTheme : lightTheme;

  // Custom setters that persist to storage if needed
  const setUser = async (u: any | null) => {
    setUserState(u);
    if (u) {
      await storage.setItemAsync("User", JSON.stringify(u));
      if (u.themeColor) {
        setThemeColorState(u.themeColor);
        await storage.setItemAsync("themeColor", u.themeColor);
      }
    } else {
      await storage.deleteItemAsync("User");
    }
  };

  const setToken = async (t: string | null) => {
    setTokenState(t);
    if (t) {
      await storage.setItemAsync("token", t);
    } else {
      await storage.deleteItemAsync("token");
    }
  };

  const setThemeColor = async (color: string) => {
    setThemeColorState(color);
    await storage.setItemAsync("themeColor", color);
    try {
      const storedToken = await storage.getItemAsync("token");
      if (storedToken) {
        await updateThemeColorApi(color);
      }
    } catch (err) {
      console.error("Failed to sync themeColor with backend:", err);
    }
  };

  const setIsDarkMode = async (val: boolean) => {
    setIsDarkModeState(val);
    await storage.setItemAsync("isDarkMode", val ? "true" : "false");
  };

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await storage.getItemAsync("token");
        const storedUser = await storage.getItemAsync("User");
        const storedTheme = await storage.getItemAsync("themeColor");
        const storedDarkMode = await storage.getItemAsync("isDarkMode");
        const storedTodoMode = await storage.getItemAsync("todoMode");
        
        if (storedDarkMode) {
          setIsDarkModeState(storedDarkMode === "true");
        }
        
        if (storedTheme) {
          setThemeColorState(storedTheme);
        }

        if (storedTodoMode) {
          setTodoModeState(storedTodoMode === "true");
        }
        
        if (storedToken) {
          setTokenState(storedToken);
          if (storedUser) {
            setUserState(JSON.parse(storedUser));
          } else {
            // Fetch profile if user data is missing but token exists
            const profileRes = await getProfileApi();
            if (profileRes.success) {
              await setUser(profileRes.user);
            }
          }
        }
      } catch (err) {
        console.error("AppContext: error during bootstrap:", err);
      } finally {
        setLoading(false);
        // ── NEW: mark bootstrap done so the data-fetch effect can run
        setTokenReady(true);
      }
    })();
  }, []);

  const refreshWorkspaces = async () => {
    if (!user) return;
    try {
      const res = await getUserWorkspace(user._id);
      if (res.success) {
        setWorkspaces(res.workspaces);
        

        // Auto-select active workspace if not set or doesn't exist in new list
        if (res.workspaces.length > 0) {
          const currentActiveExists = activeWorkspace && res.workspaces.some((w: Workspace) => w._id === activeWorkspace._id);
          if (!currentActiveExists) {
            await selectWorkspace(res.workspaces[0]);
          } else {
            // Update current active workspace details
            const updatedActive = res.workspaces.find((w: Workspace) => w._id === activeWorkspace?._id);
            if (updatedActive) setActiveWorkspaceState(updatedActive);
          }
        } else {
          setActiveWorkspaceState(null);
          setProjects([]);
          setActiveProject(null);
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.warn("AppContext: session expired (401), logging out...");
        await logout();
      } else {
        console.error("AppContext: error fetching workspaces:", err);
      }
    }
  };

  const refreshProjects = async (workspaceId?: string) => {
    const wId = workspaceId || activeWorkspace?._id;
    if (!wId) {
      setProjects([]);
      setActiveProject(null);
      return;
    }
    try {
      const res = await getWorkspaceProjects(wId);
      if (res.success) {
        setProjects(res.projects);
        
        // Sync active project
        if (res.projects.length > 0) {
          const currentProjectExists = activeProject && res.projects.some(p => p._id === activeProject._id);
          if (currentProjectExists) {
            const updatedActive = res.projects.find(p => p._id === activeProject?._id);
            if (updatedActive) {
              setActiveProject(updatedActive);
            }
          } else {
            setActiveProject(res.projects[0]);
          }
        } else {
          setActiveProject(null);
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logout();
      } else {
        console.error("AppContext: error fetching projects:", err);
      }
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.success) {
        const unread = res.notifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logout();
      } else {
        console.error("AppContext: error fetching notifications:", err);
      }
    }
  };

  const fetchTodoTasks = async () => {
    try {
      const res = await getTodos();
      if (res.success) {
        setTodoTasks(res.todos);
      }
    } catch (err) {
      console.error("AppContext: error fetching todos:", err);
    }
  };

  const addTodoTask = async (title: string) => {
    try {
      const res = await createTodo({ title });
      if (res.success) {
        setTodoTasks(prev => [res.todo, ...prev]);
      }
    } catch (err) {
      console.error("AppContext: error creating todo:", err);
      throw err;
    }
  };

  const toggleTodoTask = async (todo: Todo) => {
    const nextStatus = todo.status === "completed" ? "todo" : "completed";
    setTodoTasks(prev => prev.map(t => t._id === todo._id ? { ...t, status: nextStatus } : t));
    try {
      await updateTodo(todo._id, { status: nextStatus });
    } catch (err) {
      console.error("AppContext: error toggling todo:", err);
      setTodoTasks(prev => prev.map(t => t._id === todo._id ? todo : t));
      throw err;
    }
  };

  const deleteTodoTask = async (todoId: string) => {
    const original = [...todoTasks];
    setTodoTasks(prev => prev.filter(t => t._id !== todoId));
    try {
      await deleteTodo(todoId);
    } catch (err) {
      console.error("AppContext: error deleting todo:", err);
      setTodoTasks(original);
      throw err;
    }
  };

  const updateTodoTask = async (todoId: string, updates: { title?: string; description?: string; priority?: "low" | "medium" | "high" }) => {
    try {
      const res = await updateTodo(todoId, updates);
      if (res.success) {
        setTodoTasks(prev => prev.map(t => t._id === todoId ? res.todo : t));
      }
    } catch (err) {
      console.error("AppContext: error updating todo details:", err);
      throw err;
    }
  };

  const refreshData = async () => {
    if (!user) return;
    await Promise.all([
      refreshWorkspaces(),
      refreshNotifications(),
      fetchTodoTasks()
    ]);
  };

  // ── CHANGED: depend on tokenReady so this never fires before
  //    SecureStore has been read and the token set in state.
  useEffect(() => {
    if (!tokenReady) return;
    if (user && token) {
      refreshData();
    } else {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setProjects([]);
      setActiveProject(null);
      setUnreadCount(0);
    }
  }, [user, token, tokenReady]);

  const selectWorkspace = async (workspace: Workspace | null) => {
    setActiveWorkspaceState(workspace);
    setActiveProject(null);
    const storedTheme = await storage.getItemAsync("themeColor");
    setThemeColorState(storedTheme || "#6366F1");
    if (workspace) {
      await refreshProjects(workspace._id);
    } else {
      setProjects([]);
    }
  };

  const selectProject = (project: Project | null) => {
    setActiveProject(project);
    storage.getItemAsync("themeColor").then((storedTheme) => {
      setThemeColorState(storedTheme || "#6366F1");
    });
  };


  const setTodoMode = async (enabled: boolean) => {
    setTodoModeState(enabled);
    await storage.setItemAsync("todoMode", enabled ? "true" : "false");
  };

  const logout = async () => {
    try {
      // Clear storage
      await storage.deleteItemAsync("token");
      await storage.deleteItemAsync("User");
    } catch (err) {
      console.error("AppContext: logout storage cleanup error:", err);
    } finally {
      setUserState(null);
      setTokenState(null);
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setProjects([]);
      setActiveProject(null);
      setUnreadCount(0);
      setTodoTasks([]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        workspaces,
        setWorkspaces,
        activeWorkspace,
        setActiveWorkspace: setActiveWorkspaceState,
        projects,
        setProjects,
        activeProject,
        setActiveProject,
        unreadCount,
        setUnreadCount,
        loading,
        themeColor,
        setThemeColor,
        isDarkMode,
        setIsDarkMode,
        C,
        todoMode,
        setTodoMode,
        todoTasks,
        fetchTodoTasks,
        addTodoTask,
        toggleTodoTask,
        deleteTodoTask,
        updateTodoTask,
        refreshData,
        refreshWorkspaces,
        refreshProjects,
        refreshNotifications,
        selectWorkspace,
        selectProject,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}