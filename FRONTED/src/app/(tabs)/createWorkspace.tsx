import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { createWorkspace } from "../../api/workspace.api";

export default function CreateWorkspaceScreen() {
  const router = useRouter();
  const { refreshWorkspaces, selectWorkspace, themeColor } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Workspace name is required.");
      return;
    }

    if (name.trim().length < 3) {
      setError("Workspace name must be at least 3 characters.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (res.success) {
        await selectWorkspace(res.workspace);
        await refreshWorkspaces();

        Alert.alert(
          "Success",
          `Workspace "${res.workspace.name}" created successfully!`
        );

        router.replace("/(tabs)/home");
      } else {
        setError("Failed to create workspace");
      }
    } catch (err: any) {
      console.error("Create Workspace Error Details:", err);

      if (err?.response) {
        console.error("Create Workspace Response Data:", err.response.data);
      }

      const msg =
        err?.response?.data?.message ||
        "Failed to create workspace. Please try again.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: "#6366F1",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                ← Back
              </Text>
            </TouchableOpacity>
          

            <View style={{ width: 50 }} />
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: "#17171C",
              borderWidth: 1,
              borderColor: "#25252B",
              borderRadius: 28,
              padding: 24,
            }}
          >
            {/* Title */}
            <Text
              style={{
                color: "#6366F1",
                fontSize: 24,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              Create Workspace
            </Text>

            <Text
              style={{
                color: "white",
                fontSize: 14,
                lineHeight: 21,
                marginBottom: 28,
              }}
            >
              Workspaces are shared areas where teams can manage projects and
              collaborate together.
            </Text>

            {/* Workspace Name */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#A1A1AA",
                  fontSize: 13,
                  fontWeight: "500",
                  marginBottom: 8,
                }}
              >
                Workspace Name *
              </Text>

              <View
                style={{
                  backgroundColor: "#141418",
                  borderWidth: 1,
                  borderColor: "#26262D",
                  borderRadius: 18,
                  paddingHorizontal: 16,
                }}
              >
                <TextInput
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  placeholder="e.g. Design Team, Marketing"
                  placeholderTextColor="#6B7280"
                  style={{
                    color: "#FCFCFD",
                    fontSize: 16,
                    paddingVertical: 16,
                  }}
                />
              </View>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: "#A1A1AA",
                  fontSize: 13,
                  fontWeight: "500",
                  marginBottom: 8,
                }}
              >
                Description (Optional)
              </Text>

              <View
                style={{
                  backgroundColor: "#141418",
                  borderWidth: 1,
                  borderColor: "#26262D",
                  borderRadius: 18,
                  minHeight: 110,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholder="What is this workspace for?"
                  placeholderTextColor="#6B7280"
                  style={{
                    color: "#FCFCFD",
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View
                style={{
                  backgroundColor: "rgba(248,81,73,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(248,81,73,0.18)",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    color: "#F85149",
                    textAlign: "center",
                    fontSize: 14,
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Button */}
            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                backgroundColor: themeColor,
                borderRadius: 18,
                paddingVertical: 16,
                alignItems: "center",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Create Workspace
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
