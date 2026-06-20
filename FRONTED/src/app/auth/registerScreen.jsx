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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { registerApi } from "../../api/user.api";
import { useApp } from "../../context/AppContext";

const USER_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "team", label: "Team" },
  { value: "admin", label: "Admin" },
];
const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

// ─── Theme (matches Home / Tasks / Notifications / Profile / Login screens) ──
const T = {
  bg:                    "#15171C",
  surface:               "#1D2027",
  card:                  "#22252E",
  border:                "#2A2D38",
  borderLight:           "#333748",
  input:                 "#1D2027",
  inputBorder:           "#2A2D38",
  inputFocused:          "#5865F2",
  textPrimary:           "#E2E4EA",
  textSecondary:         "#ffff",
  textMuted:              "#ffff",
  placeholder:           "#4B5060",
  iconMuted:             "#6B7280",
  accent:                "#5865F2",
  accentBg:              "rgba(88,101,242,0.12)",
  accentText:            "#A5AEFF",
  danger:                "#F04747",
  dangerBg:              "rgba(240,71,71,0.10)",
  dangerBorder:          "rgba(240,71,71,0.25)",
  segmentActiveBg:       "#5865F2",
  segmentInactiveBg:     "#1D2027",
  segmentInactiveBorder: "#2A2D38",
};

export default function RegisterScreen() {
  const router = useRouter();
  const { setToken, setUser } = useApp();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    phone: "",
    gender: "male",
    usertype: "individual",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    const { firstname, lastname, email, password, phone, gender, usertype } = form;

    if (!firstname || !lastname || !email || !password || !phone) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await registerApi({
        firstname,
        lastname,
        email: email.trim(),
        password,
        phone: phone.trim(),
        gender,
        usertype,
      });

      if (data.success && data.token) {
        await setToken(data.token);
        await setUser(data.user);
        router.replace("/(tabs)/home");
      } else {
        setError(data.message || "Registration failed. Try again.");
      }
    } catch (err) {
      let msg = "Registration failed. Check your connection.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        msg = err.response.data.errors.map((e) => e.msg).join(", ");
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBorderColor = (field) =>
    focusedField === field ? T.inputFocused : T.inputBorder;

  const renderInput = ({ field, label, icon, placeholder, keyboardType, secure, autoCapitalize = "sentences" }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: T.input,
          borderWidth: 1,
          borderColor: inputBorderColor(field),
          borderRadius: 14,
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        <Ionicons name={icon} size={17} color={T.iconMuted} />
        <TextInput
          style={{ flex: 1, color: T.textPrimary, paddingVertical: 14, fontSize: 15 }}
          placeholder={placeholder}
          placeholderTextColor={T.placeholder}
          value={form[field]}
          onChangeText={(v) => update(field, v)}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secure && !showPassword}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={17} color={T.accent} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSegmented = (options, field) => (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {options.map((opt) => {
        const active = form[field] === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => update(field, opt.value)}
            activeOpacity={0.85}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: active ? T.segmentActiveBg : T.segmentInactiveBg,
              borderWidth: 1,
              borderColor: active ? T.segmentActiveBg : T.segmentInactiveBorder,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: active ? "#fff" : T.textSecondary,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 18 }}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={16} color={T.textSecondary} />
              <Text style={{ color: T.textSecondary, fontSize: 14, fontWeight: "600" }}>Back</Text>
            </TouchableOpacity>

            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: T.accentBg,
                borderWidth: 0.5,
                borderColor: T.accent + "40",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="flash" size={26} color={T.accent} />
            </View>

            <Text style={{ color: T.textPrimary, fontSize: 26, fontWeight: "600", marginTop: 18, letterSpacing: -0.5 }}>
              Create account
            </Text>
            <Text style={{ color: T.textSecondary, fontSize: 14, marginTop: 6, marginBottom: 28 }}>
              Join SyncTask and manage work smarter
            </Text>

            <View
              style={{
                backgroundColor: T.surface,
                borderRadius: 22,
                borderWidth: 0.5,
                borderColor: T.border,
                padding: 20,
              }}
            >
              {/* Name row */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  {renderInput({ field: "firstname", label: "First name", icon: "person-outline", placeholder: "John" })}
                </View>
                <View style={{ flex: 1 }}>
                  {renderInput({ field: "lastname", label: "Last name", icon: "person-outline", placeholder: "Doe" })}
                </View>
              </View>

              {renderInput({
                field: "email",
                label: "Email address",
                icon: "mail-outline",
                placeholder: "you@example.com",
                keyboardType: "email-address",
                autoCapitalize: "none",
              })}

              {renderInput({
                field: "password",
                label: "Password",
                icon: "lock-closed-outline",
                placeholder: "Min. 3 characters",
                secure: true,
                autoCapitalize: "none",
              })}

              {renderInput({
                field: "phone",
                label: "Phone number",
                icon: "call-outline",
                placeholder: "e.g. 9876543210",
                keyboardType: "phone-pad",
              })}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" }}>
                  Gender
                </Text>
                {renderSegmented(GENDERS, "gender")}
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" }}>
                  Account type
                </Text>
                {renderSegmented(USER_TYPES, "usertype")}
              </View>

              {error ? (
                <View
                  style={{
                    backgroundColor: T.dangerBg,
                    borderWidth: 0.5,
                    borderColor: T.dangerBorder,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="alert-circle-outline" size={15} color={T.danger} />
                  <Text style={{ color: T.danger, fontSize: 13, flex: 1 }}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
                style={{
                  backgroundColor: T.accent,
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15, letterSpacing: 0.3 }}>
                    Create account
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 26 }}>
              <Text style={{ color: T.textMuted, fontSize: 14 }}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={{ color: T.accentText, fontWeight: "700", fontSize: 14 }}>
                  Sign in
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}