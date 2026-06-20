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
import { loginApi, loginGoogleApi, loginAppleApi } from "../../api/user.api";
import { useApp } from "../../context/AppContext";

// ─── Theme (matches Home / Tasks / Notifications / Profile screens) ───────────
const T = {
  bg:            "#15171C",
  surface:       "#1D2027",
  card:          "#22252E",
  border:        "#2A2D38",
  borderLight:   "#333748",
  input:         "#1D2027",
  inputBorder:   "#2A2D38",
  inputFocused:  "#5865F2",
  textPrimary:   "#ffff",
  textSecondary: "#ffff",
  textMuted:     "#ffff",
  placeholder:   "#4B5060",
  iconMuted:     "#6B7280",
  accent:        "#5865F2",
  accentBg:      "rgba(88,101,242,0.12)",
  accentText:    "#A5AEFF",
  danger:        "#F04747",
  dangerBg:      "rgba(240,71,71,0.10)",
  dangerBorder:  "rgba(240,71,71,0.25)",
};

export default function LoginScreen() {
  const router = useRouter();
  const { setToken, setUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Social OAuth Simulator States
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProvider, setOauthProvider] = useState("");
  const [oauthEmail, setOauthEmail] = useState("");
  const [oauthFirstname, setOauthFirstname] = useState("");
  const [oauthLastname, setOauthLastname] = useState("");
  const [oauthUserId, setOauthUserId] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);

  const triggerOAuth = (provider) => {
    setOauthProvider(provider);
    setOauthEmail("");
    setOauthFirstname(provider === "Google" ? "G-User" : "A-User");
    setOauthLastname("OAuth");
    setOauthUserId(`${provider.toLowerCase()}_user_${Math.floor(Math.random() * 1000000)}`);
    setShowOAuthModal(true);
  };

  const handleOAuthSubmit = async () => {
    if (!oauthEmail.trim() || !oauthFirstname.trim() || !oauthLastname.trim() || !oauthUserId.trim()) {
      setError("Please fill in all simulation fields.");
      setShowOAuthModal(false);
      return;
    }

    setOauthLoading(true);
    setError("");
    try {
      let res;
      if (oauthProvider === "Google") {
        res = await loginGoogleApi({
          profile: {
            email: oauthEmail.trim().toLowerCase(),
            firstname: oauthFirstname.trim(),
            lastname: oauthLastname.trim(),
            googleId: oauthUserId.trim(),
            avatarUrl: "https://res.cloudinary.com/dsxhyk1qu/image/upload/v1700000000/mock_logo.png"
          }
        });
      } else {
        res = await loginAppleApi({
          profile: {
            email: oauthEmail.trim().toLowerCase(),
            firstname: oauthFirstname.trim(),
            lastname: oauthLastname.trim(),
            appleId: oauthUserId.trim(),
          }
        });
      }

      if (res.success && res.token) {
        setShowOAuthModal(false);
        await setToken(res.token);
        await setUser(res.user);
        router.replace("/(tabs)/home");
      } else {
        setError(res.message || "OAuth Authentication failed");
        setShowOAuthModal(false);
      }
    } catch (err) {
      let msg = `${oauthProvider} OAuth failed.`;
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
      setShowOAuthModal(false);
    } finally {
      setOauthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await loginApi({ email: email.trim(), password });
      if (data.success && data.token) {
        await setToken(data.token);
        await setUser(data.user);
        router.replace("/(tabs)/home");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      let msg = "Login failed. Check your connection.";
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
          <View style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}>
            {/* Logo badge */}
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

            <Text
              style={{
                color: T.textPrimary,
                fontSize: 28,
                fontWeight: "600",
                marginTop: 20,
                letterSpacing: -0.5,
              }}
            >
              Welcome back
            </Text>
            <Text style={{ color: T.textSecondary, fontSize: 14, marginTop: 6, marginBottom: 28 }}>
              Sign in to continue to SyncTask
            </Text>

            {/* Card */}
            <View
              style={{
                backgroundColor: T.surface,
                borderRadius: 22,
                borderWidth: 0.5,
                borderColor: T.border,
                padding: 20,
              }}
            >
              {/* Email */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" }}>
                  Email address
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: T.input,
                    borderWidth: 1,
                    borderColor: inputBorderColor("email"),
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    gap: 10,
                  }}
                >
                  <Ionicons name="mail-outline" size={17} color={T.iconMuted} />
                  <TextInput
                    style={{ flex: 1, color: T.textPrimary, paddingVertical: 14, fontSize: 15 }}
                    placeholder="you@example.com"
                    placeholderTextColor={T.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" }}>
                  Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: T.input,
                    borderWidth: 1,
                    borderColor: inputBorderColor("password"),
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    gap: 10,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={17} color={T.iconMuted} />
                  <TextInput
                    style={{ flex: 1, color: T.textPrimary, paddingVertical: 14, fontSize: 15 }}
                    placeholder="Min. 3 characters"
                    placeholderTextColor={T.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={17}
                      color={T.accent}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={{ alignSelf: "flex-end", marginBottom: 18, marginTop: 4 }}>
                <Text style={{ color: T.accentText, fontSize: 13, fontWeight: "600" }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

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
                onPress={handleLogin}
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
                    Sign in
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 24 }}>
              <View style={{ flex: 1, height: 0.5, backgroundColor: T.border }} />
              <Text style={{ color: T.textMuted, marginHorizontal: 14, fontSize: 12 }}>
                or continue with
              </Text>
              <View style={{ flex: 1, height: 0.5, backgroundColor: T.border }} />
            </View>

            {/* Social */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => triggerOAuth("Google")}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: T.surface,
                  borderWidth: 0.5,
                  borderColor: T.border,
                  borderRadius: 14,
                  paddingVertical: 13,
                }}
              >
                <Ionicons name="logo-google" size={16} color={T.textSecondary} />
                <Text style={{ color: T.textPrimary, fontWeight: "600", fontSize: 14 }}>
                  Google
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => triggerOAuth("Apple")}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: T.surface,
                  borderWidth: 0.5,
                  borderColor: T.border,
                  borderRadius: 14,
                  paddingVertical: 13,
                }}
              >
                <Ionicons name="logo-apple" size={17} color={T.textSecondary} />
                <Text style={{ color: T.textPrimary, fontWeight: "600", fontSize: 14 }}>
                  Apple
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer link */}
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 28 }}>
              <Text style={{ color: T.textMuted, fontSize: 14 }}>
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={{ color: T.accentText, fontWeight: "700", fontSize: 14 }}>
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OAuth Simulator Modal */}
      {showOAuthModal && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "center",
            padding: 24,
            zIndex: 9999,
          }}
        >
          <View
            style={{
              backgroundColor: T.surface,
              borderRadius: 22,
              padding: 22,
              borderWidth: 0.5,
              borderColor: T.border,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons
                  name={oauthProvider === "Google" ? "logo-google" : "logo-apple"}
                  size={20}
                  color={T.accent}
                />
                <Text style={{ fontSize: 16, fontWeight: "600", color: T.textPrimary }}>
                  {oauthProvider} sign-in simulator
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowOAuthModal(false)}>
                <Ionicons name="close-circle-outline" size={22} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: T.textSecondary, fontSize: 13, marginBottom: 20, lineHeight: 18 }}>
              Real OAuth requires provisioning certificates. This dialog simulates the authentication redirect response and logs you in.
            </Text>

            {/* Email */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: T.textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                Email
              </Text>
              <TextInput
                style={{
                  backgroundColor: T.input,
                  borderWidth: 0.5,
                  borderColor: T.inputBorder,
                  borderRadius: 12,
                  padding: 12,
                  color: T.textPrimary,
                  fontSize: 14,
                }}
                placeholder="test.oauth@example.com"
                placeholderTextColor={T.placeholder}
                value={oauthEmail}
                onChangeText={setOauthEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* First Name & Last Name */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: T.textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                  First Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: T.input,
                    borderWidth: 0.5,
                    borderColor: T.inputBorder,
                    borderRadius: 12,
                    padding: 12,
                    color: T.textPrimary,
                    fontSize: 14,
                  }}
                  placeholder="John"
                  placeholderTextColor={T.placeholder}
                  value={oauthFirstname}
                  onChangeText={setOauthFirstname}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: T.textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                  Last Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: T.input,
                    borderWidth: 0.5,
                    borderColor: T.inputBorder,
                    borderRadius: 12,
                    padding: 12,
                    color: T.textPrimary,
                    fontSize: 14,
                  }}
                  placeholder="Doe"
                  placeholderTextColor={T.placeholder}
                  value={oauthLastname}
                  onChangeText={setOauthLastname}
                />
              </View>
            </View>

            {/* Provider User ID */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: T.textMuted, marginBottom: 6, textTransform: "uppercase" }}>
                {oauthProvider} User ID
              </Text>
              <TextInput
                style={{
                  backgroundColor: T.input,
                  borderWidth: 0.5,
                  borderColor: T.inputBorder,
                  borderRadius: 12,
                  padding: 12,
                  color: T.textPrimary,
                  fontSize: 14,
                }}
                placeholder="oauth_uid_123"
                placeholderTextColor={T.placeholder}
                value={oauthUserId}
                onChangeText={setOauthUserId}
              />
            </View>

            {/* Presets */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: T.textMuted, marginBottom: 8, textTransform: "uppercase" }}>
                Quick test profiles
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[
                  { email: "alex.oauth@sync-demo.com", first: "Alex", last: "OAuth", id: `${oauthProvider.toLowerCase()}_alex` },
                  { email: "sam.oauth@sync-demo.com", first: "Sam", last: "OAuth", id: `${oauthProvider.toLowerCase()}_sam` }
                ].map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setOauthEmail(p.email);
                      setOauthFirstname(p.first);
                      setOauthLastname(p.last);
                      setOauthUserId(p.id);
                    }}
                    style={{
                      backgroundColor: T.card,
                      borderWidth: 0.5,
                      borderColor: T.border,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: T.textSecondary, fontWeight: "600" }}>
                      {p.first} ({p.email})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleOAuthSubmit}
              disabled={oauthLoading}
              activeOpacity={0.85}
              style={{
                backgroundColor: T.accent,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              {oauthLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
                  Simulate redirect & login
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}