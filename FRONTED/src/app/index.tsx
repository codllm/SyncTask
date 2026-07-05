import { View, ActivityIndicator, Image, Text } from "react-native";

export default function IndexScreen() {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: "#0B0F19" }}
    >

      <Image
        source={require("../../assets/management_q13ckg.png")}
        style={{
          width: 150,
          height: 150,
          marginBottom: 20
        }}
        resizeMode="contain"
      />

      <Text
        style={{
          color: "white",
          fontSize: 28,
          fontWeight: "bold"
        }}
      >
        SyncTask
      </Text>

      <ActivityIndicator
        size="large"
        color="#5865F2"
        style={{ marginTop: 30 }}
      />

    </View>
  );
}