import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useRouter } from "expo-router";
import { Todo } from "../api/todo.api";

// ─── TODO MODE HOME VIEW ──────────────────────────────────────────────────────
export function TodoModeHomeView() {
  const router = useRouter();
  const { user, themeColor, setTodoMode, todoTasks, addTodoTask, toggleTodoTask, deleteTodoTask } = useApp();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return;
    setAdding(true);
    try {
      await addTodoTask(newTodoTitle.trim());
      setNewTodoTitle("");
    } catch (err) {
      console.error("Error adding todo:", err);
      Alert.alert("Error", "Could not create todo.");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTodo = async (task: Todo) => {
    try {
      await toggleTodoTask(task);
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const handleDeleteTodo = async (taskId: string) => {
    try {
      await deleteTodoTask(taskId);
    } catch (err) {
      console.error("Error deleting todo:", err);
      Alert.alert("Delete Error", "Could not reach the server to delete the task.");
    }
  };

  const pendingTasks = todoTasks.filter(t => t.status !== "completed");
  const completedTasks = todoTasks.filter(t => t.status === "completed");
  const completionRate = todoTasks.length > 0 ? completedTasks.length / todoTasks.length : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <View>
            <Text style={{ color: "#F0F6FC", fontSize: 16, fontWeight: "700", marginTop: 4 }}>
              Hey, {user?.username?.firstname || "there"}! 
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setTodoMode(false)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: "rgba(94,106,210,0.15)",
              borderWidth: 0.5,
              borderColor: "rgba(94,106,210,0.3)",
            }}
          >
            <Text style={{ color: "#A7B3FF", fontSize: 11, fontWeight: "600" }}>Workspace Mode ➔</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: "#161B22",
            borderWidth: 0.5,
            borderColor: "#30363D",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#F0F6FC", fontSize: 16, fontWeight: "600" }}>Your progress today</Text>
              <Text style={{ color: "#8B949E", fontSize: 12, marginTop: 4 }}>
                {completedTasks.length} of {todoTasks.length} tasks completed
              </Text>
            </View>
            <Text style={{ color: themeColor, fontSize: 32, fontWeight: "700" }}>
              {Math.round(completionRate * 100)}%
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: "#21262D", borderRadius: 3, marginTop: 16, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${completionRate * 100}%`, backgroundColor: themeColor, borderRadius: 3 }} />
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#161B22",
            borderWidth: 0.5,
            borderColor: "#30363D",
            borderRadius: 12,
            paddingHorizontal: 14,
            alignItems: "center",
            height: 52,
            marginBottom: 24,
          }}
        >
          <TextInput
            placeholder="Add a new task..."
            placeholderTextColor="#8B949E"
            value={newTodoTitle}
            onChangeText={setNewTodoTitle}
            onSubmitEditing={handleAddTodo}
            style={{ flex: 1, color: "#F0F6FC", fontSize: 14, paddingVertical: 10 }}
          />
          {adding ? (
            <ActivityIndicator size="small" color={themeColor} />
          ) : (
            <TouchableOpacity
              onPress={handleAddTodo}
              disabled={!newTodoTitle.trim()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: newTodoTitle.trim() ? themeColor : "#21262D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={18} color="#0D1117" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ color: "#F0F6FC", fontSize: 16, fontWeight: "600" }}>Pending Tasks</Text>
          <View style={{ backgroundColor: "#21262D", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ color: "#8B949E", fontSize: 11, fontWeight: "600" }}>{pendingTasks.length}</Text>
          </View>
        </View>

        {pendingTasks.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Ionicons name="checkmark-done" size={40} color="#3FB950" style={{ opacity: 0.3, marginBottom: 12 }} />
            <Text style={{ color: "#8B949E", fontSize: 13, textAlign: "center" }}>No pending tasks! All caught up.</Text>
          </View>
        ) : (
          pendingTasks.map((t) => (
            <View
              key={t._id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#161B22",
                borderWidth: 0.5,
                borderColor: "#30363D",
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <TouchableOpacity onPress={() => handleToggleTodo(t)} style={{ marginRight: 12 }}>
                <Ionicons name="ellipse-outline" size={20} color="#8B949E" />
              </TouchableOpacity>
              <Text style={{ flex: 1, color: "#F0F6FC", fontSize: 14 }}>{t.title}</Text>
              <TouchableOpacity onPress={() => handleDeleteTodo(t._id)} style={{ padding: 4 }}>
                <Ionicons name="trash-outline" size={16} color="#F85149" style={{ opacity: 0.7 }} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {completedTasks.length > 0 && (
          <>
            <Text style={{ color: "#8B949E", fontSize: 14, fontWeight: "600", marginTop: 24, marginBottom: 12 }}>Completed Tasks</Text>
            {completedTasks.map((t) => (
              <View
                key={t._id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#161B22",
                  borderWidth: 0.5,
                  borderColor: "#30363D",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  opacity: 0.6,
                }}
              >
                <TouchableOpacity onPress={() => handleToggleTodo(t)} style={{ marginRight: 12 }}>
                  <Ionicons name="checkmark-circle" size={20} color="#3FB950" />
                </TouchableOpacity>
                <Text style={{ flex: 1, color: "#8B949E", fontSize: 14, textDecorationLine: "line-through" }}>{t.title}</Text>
                <TouchableOpacity onPress={() => handleDeleteTodo(t._id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={16} color="#F85149" style={{ opacity: 0.7 }} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TODO MODE TASKS VIEW ─────────────────────────────────────────────────────
export function TodoModeTasksView() {
  const { themeColor, todoTasks, addTodoTask, toggleTodoTask, deleteTodoTask, updateTodoTask } = useApp();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  
  // Detail Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("low");
  const [updatingTask, setUpdatingTask] = useState(false);

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return;
    setAdding(true);
    try {
      await addTodoTask(newTodoTitle.trim());
      setNewTodoTitle("");
    } catch (err) {
      console.error("Error adding todo:", err);
      Alert.alert("Error", "Could not create task.");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTodo = async (task: Todo) => {
    try {
      await toggleTodoTask(task);
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const handleCyclePriority = async (task: Todo) => {
    const priorities: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
    const currentIndex = priorities.indexOf(task.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    try {
      await updateTodoTask(task._id, { priority: nextPriority });
    } catch (err) {
      console.error("Error updating priority:", err);
    }
  };

  const handleDeleteTodo = async (taskId: string) => {
    try {
      await deleteTodoTask(taskId);
    } catch (err) {
      console.error("Error deleting todo:", err);
      Alert.alert("Delete Error", "Could not reach the server to delete the task.");
    }
  };

  const handleOpenDetail = (task: Todo) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditPriority(task.priority);
    setDetailModalVisible(true);
  };

  const handleSaveDetail = async () => {
    if (!selectedTask || !editTitle.trim()) return;
    setUpdatingTask(true);
    try {
      await updateTodoTask(selectedTask._id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
      });
      setDetailModalVisible(false);
    } catch (err) {
      console.error("Error updating task details:", err);
      Alert.alert("Error", "Could not save task details.");
    } finally {
      setUpdatingTask(false);
    }
  };

  const filteredTasks = todoTasks.filter(t => {
    if (filter === "pending") return t.status !== "completed";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const getPriorityStyle = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return { color: "#F85149", bg: "rgba(248,81,73,0.12)", border: "rgba(248,81,73,0.28)" };
      case "medium":
        return { color: "#58A6FF", bg: "rgba(88,166,255,0.12)", border: "rgba(88,166,255,0.28)" };
      default:
        return { color: "#3FB950", bg: "rgba(63,185,80,0.12)", border: "rgba(63,185,80,0.28)" };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
        <Text style={{ color: "#F0F6FC", fontSize: 24, fontWeight: "700" }}>My Tasks</Text>
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: 20, marginVertical: 14, gap: 10 }}>
        {(["all", "pending", "completed"] as const).map((tab) => {
          const isActive = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive ? themeColor : "#161B22",
                borderWidth: 0.5,
                borderColor: isActive ? themeColor : "#30363D",
              }}
            >
              <Text
                style={{
                  color: isActive ? "#0D1117" : "#C9D1D9",
                  fontSize: 12,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#161B22",
          borderWidth: 0.5,
          borderColor: "#30363D",
          borderRadius: 12,
          paddingHorizontal: 14,
          alignItems: "center",
          height: 52,
          marginHorizontal: 20,
          marginBottom: 16,
        }}
      >
        <TextInput
          placeholder="Add a new task..."
          placeholderTextColor="#8B949E"
          value={newTodoTitle}
          onChangeText={setNewTodoTitle}
          onSubmitEditing={handleAddTodo}
          style={{ flex: 1, color: "#F0F6FC", fontSize: 14, paddingVertical: 10 }}
        />
        {adding ? (
          <ActivityIndicator size="small" color={themeColor} />
        ) : (
          <TouchableOpacity
            onPress={handleAddTodo}
            disabled={!newTodoTitle.trim()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: newTodoTitle.trim() ? themeColor : "#21262D",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={18} color="#0D1117" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <Ionicons name="clipboard-outline" size={48} color="#8B949E" style={{ opacity: 0.3, marginBottom: 16 }} />
            <Text style={{ color: "#8B949E", fontSize: 14, textAlign: "center" }}>No tasks in this list.</Text>
          </View>
        ) : (
          filteredTasks.map((t) => {
            const isCompleted = t.status === "completed";
            const pStyle = getPriorityStyle(t.priority);
            return (
              <View
                key={t._id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#161B22",
                  borderWidth: 0.5,
                  borderColor: "#30363D",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  opacity: isCompleted ? 0.6 : 1,
                }}
              >
                <TouchableOpacity onPress={() => handleToggleTodo(t)} style={{ marginRight: 12 }}>
                  <Ionicons
                    name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={isCompleted ? "#3FB950" : "#8B949E"}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleOpenDetail(t)} style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#F0F6FC",
                      fontSize: 14,
                      textDecorationLine: isCompleted ? "line-through" : "none",
                    }}
                    numberOfLines={2}
                  >
                    {t.title}
                  </Text>
                  {t.description ? (
                    <Text style={{ color: "#8B949E", fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                      {t.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => handleCyclePriority(t)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: pStyle.bg,
                      borderWidth: 0.5,
                      borderColor: pStyle.border,
                    }}
                  >
                    <Text style={{ color: pStyle.color, fontSize: 10, fontWeight: "600", textTransform: "capitalize" }}>
                      {t.priority}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDeleteTodo(t._id)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={16} color="#F85149" style={{ opacity: 0.7 }} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={detailModalVisible} transparent animationType="fade" onRequestClose={() => setDetailModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setDetailModalVisible(false)}
          style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "center", alignItems: "center", padding: 20 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: "100%",
              backgroundColor: "#161B22",
              borderWidth: 0.5,
              borderColor: "#30363D",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: "#F0F6FC", fontSize: 18, fontWeight: "600" }}>Edit Task</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={20} color="#8B949E" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: "#8B949E", fontSize: 12, marginBottom: 6 }}>Title</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Task title..."
              placeholderTextColor="#8B949E"
              style={{
                backgroundColor: "#0D1117",
                borderWidth: 0.5,
                borderColor: "#30363D",
                borderRadius: 8,
                padding: 10,
                color: "#F0F6FC",
                fontSize: 14,
                marginBottom: 16,
              }}
            />

            <Text style={{ color: "#8B949E", fontSize: 12, marginBottom: 6 }}>Description</Text>
            <TextInput
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Add description..."
              placeholderTextColor="#8B949E"
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: "#0D1117",
                borderWidth: 0.5,
                borderColor: "#30363D",
                borderRadius: 8,
                padding: 10,
                color: "#F0F6FC",
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: "top",
                marginBottom: 16,
              }}
            />

            <Text style={{ color: "#8B949E", fontSize: 12, marginBottom: 6 }}>Priority</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
              {(["low", "medium", "high"] as const).map((p) => {
                const isSel = editPriority === p;
                const pStyle = getPriorityStyle(p);
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setEditPriority(p)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignItems: "center",
                      backgroundColor: isSel ? pStyle.bg : "#0D1117",
                      borderWidth: 0.5,
                      borderColor: isSel ? pStyle.color : "#30363D",
                    }}
                  >
                    <Text style={{ color: isSel ? pStyle.color : "#8B949E", fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleSaveDetail}
              disabled={updatingTask || !editTitle.trim()}
              style={{
                width: "100%",
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: themeColor,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {updatingTask ? (
                <ActivityIndicator size="small" color="#0D1117" />
              ) : (
                <Text style={{ color: "#0D1117", fontWeight: "600", fontSize: 14 }}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
