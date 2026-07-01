import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { createUser, forgetPassword } from "../services/user.service"; // Named import
import usermodel from "../model/user.model";
import cloudinary from "../config/cloudinary";
import fs from "fs";
import jwt from "jsonwebtoken";

export const signup = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    username: { firstname, lastname },
    email,
    password,
    gender,
    usertype,
    phone
  } = req.body;

  try {

    const newUser = await createUser({ firstname, lastname, email, password, gender,usertype,phone });
    
    const token = newUser.generateToken();

    console.log("New user created:", newUser); // Debugging log
    return res.status(201).json({success:true, user: newUser, token });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;

  const user = await usermodel.findOne({ email });

if (!user) {
  return res.status(401).json({
    message: "Invalid credentials"
  });
}

const passwordMatch = await user.comparePassword(password);
console.log("Password Match:", passwordMatch);
  if(!passwordMatch){
    return res.status(401).json({ message: "Incorrect Password" });
  }
  //match found, generate token now
  const token = user.generateToken();
  return res.status(200).json({ success: true, user, token });
};

export const profile = async (req:Request, res:Response) => {
  try {
    return res.status(200).json({
      user: (req as any).user,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    const { username, firstname, lastname, phone, age, gender } = req.body;

    const update: Record<string, any> = {};

    const nextFirstname = username?.firstname ?? firstname;
    const nextLastname = username?.lastname ?? lastname;

    if (nextFirstname !== undefined) update["username.firstname"] = String(nextFirstname).trim();
    if (nextLastname !== undefined) update["username.lastname"] = String(nextLastname).trim();
    if (age !== undefined) update.age = age;
    if (gender !== undefined) update.gender = gender;
    if (phone !== undefined) {
      const parsedPhone = Number(phone);
      if (Number.isNaN(parsedPhone)) {
        return res.status(400).json({ success: false, message: "Phone must be a number" });
      }
      update.phone = parsedPhone;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "No profile fields provided" });
    }

    const updatedUser = await usermodel.findByIdAndUpdate(userId, { $set: update }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export const forgetPass = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email,newPassword } = req.body;
  // Implment password reset logic here (e.g., send reset email)
  const userforget = await forgetPassword(email,newPassword); // Example new password, replace with actual logic
  return res.status(200).json({ message: `Password reset link sent to ${email}` });
}
export const logout = async (req: Request, res: Response) => {

  const token = req.headers.authorization?.split(" ")[1]; // Extract token from header
  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required for logout" });
  }
  console.log("Logout token:", token); // Debugging log
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { comments, assignments, mentions, reminders } = req.body;

    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.notificationPreferences = {
      comments: comments !== undefined ? comments : (user.notificationPreferences?.comments ?? true),
      assignments: assignments !== undefined ? assignments : (user.notificationPreferences?.assignments ?? true),
      mentions: mentions !== undefined ? mentions : (user.notificationPreferences?.mentions ?? true),
      reminders: reminders !== undefined ? reminders : (user.notificationPreferences?.reminders ?? true),
    };

    await user.save();

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update notification preferences",
    });
  }
};

export const togglePinProjectController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { projectId } = req.params;

    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.pinnedProjects) {
      user.pinnedProjects = [];
    }

    const index = user.pinnedProjects.indexOf(projectId as any);
    if (index > -1) {
      user.pinnedProjects.splice(index, 1);
    } else {
      user.pinnedProjects.push(projectId as any);
    }

    await user.save();
    return res.status(200).json({ success: true, pinnedProjects: user.pinnedProjects });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to toggle pin project" });
  }
};

export const togglePinTaskController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { taskId } = req.params;

    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.pinnedTasks) {
      user.pinnedTasks = [];
    }

    const index = user.pinnedTasks.indexOf(taskId as any);
    if (index > -1) {
      user.pinnedTasks.splice(index, 1);
    } else {
      user.pinnedTasks.push(taskId as any);
    }

    await user.save();
    return res.status(200).json({ success: true, pinnedTasks: user.pinnedTasks });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to toggle pin task" });
  }
};

export const getPinnedItemsController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const user = await usermodel.findById(userId)
      .populate({
        path: "pinnedProjects",
        match: { isDeleted: { $ne: true } }
      })
      .populate({
        path: "pinnedTasks",
        match: { isDeleted: { $ne: true } },
        populate: [
          { path: "assignedTo", select: "username email" },
          { path: "createdBy", select: "username email" }
        ]
      });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const populatedProjects = (user.pinnedProjects || []) as any[];
    const populatedTasks = (user.pinnedTasks || []) as any[];

    const pinnedProjectsFiltered = populatedProjects.filter(p => p !== null);
    const pinnedTasksFiltered = populatedTasks.filter(t => t !== null);

    // Self-healing: if any pinned items were deleted and populated as null, clean up DB
    let needsUpdate = false;
    if (pinnedProjectsFiltered.length !== populatedProjects.length) {
      user.pinnedProjects = pinnedProjectsFiltered.map((p: any) => p._id);
      needsUpdate = true;
    }
    if (pinnedTasksFiltered.length !== populatedTasks.length) {
      user.pinnedTasks = pinnedTasksFiltered.map((t: any) => t._id);
      needsUpdate = true;
    }
    if (needsUpdate) {
      await user.save();
    }

    return res.status(200).json({
      success: true,
      pinnedProjects: pinnedProjectsFiltered,
      pinnedTasks: pinnedTasksFiltered,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch pinned items" });
  }
};

export const updateAvatarController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "user-avatars",
      resource_type: "image",
    });

    // Remove local temp file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete local temp avatar file:", err);
    });

    // Update user avatarUrl in database
    const user = await usermodel.findByIdAndUpdate(
      userId,
      { avatarUrl: result.secure_url },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        pinnedProjects: user.pinnedProjects,
        pinnedTasks: user.pinnedTasks,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ success: false, message: error.message || "Failed to update avatar" });
  }
};

export const saveFilterController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { projectId, filterName, query } = req.body;

    if (!projectId || !filterName || !query) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.savedFilters) user.savedFilters = [];
    user.savedFilters.push({
      name: filterName,
      project: projectId,
      query
    } as any);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Filter saved successfully",
      savedFilters: user.savedFilters
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to save filter" });
  }
};

export const getSavedFiltersController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const filters = (user.savedFilters || []).filter(f => f.project.toString() === projectId);

    return res.status(200).json({
      success: true,
      savedFilters: filters
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch saved filters" });
  }
};

export const deleteSavedFilterController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { filterId } = req.params;

    if (!filterId) {
      return res.status(400).json({ success: false, message: "Filter ID is required" });
    }

    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.savedFilters) {
      user.savedFilters = user.savedFilters.filter(f => (f as any)._id.toString() !== filterId);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Saved filter deleted successfully"
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete saved filter" });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  const { idToken, profile } = req.body;

  try {
    let email: string;
    let firstname: string;
    let lastname: string;
    let googleId: string;
    let avatarUrl: string | undefined;

    if (idToken) {
      // Real Google token verification
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
      const response = await fetch(verifyUrl);
      if (!response.ok) {
        return res.status(400).json({ success: false, message: "Invalid Google ID token" });
      }
      const tokenInfo = await response.json();
      
      email = tokenInfo.email;
      firstname = tokenInfo.given_name || "Google";
      lastname = tokenInfo.family_name || "User";
      googleId = tokenInfo.sub;
      avatarUrl = tokenInfo.picture;
    } else if (profile) {
      // Simulated profile (for development/testing/simulator)
      if (process.env.NODE_ENV === "production") {
        return res.status(400).json({ success: false, message: "Simulated profiles are not allowed in production mode. A valid token is required." });
      }
      email = profile.email;
      firstname = profile.firstname || "Google";
      lastname = profile.lastname || "User";
      googleId = profile.googleId;
      avatarUrl = profile.avatarUrl;
    } else {
      return res.status(400).json({ success: false, message: "Missing Google authentication data" });
    }

    if (!email || !googleId) {
      return res.status(400).json({ success: false, message: "Required user info not found in Google profile" });
    }

    // Find or create user
    let user = await usermodel.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (!user) {
      // Create new user
      user = new usermodel({
        username: { firstname, lastname },
        email: email.toLowerCase(),
        gender: "not_specified",
        usertype: "individual",
        googleId,
        avatarUrl: avatarUrl || "",
        phone: 1234567890 // Temporary dummy phone number
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing email account
      user.googleId = googleId;
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      await user.save();
    }

    const token = user.generateToken();
    return res.status(200).json({ success: true, user, token });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const appleAuth = async (req: Request, res: Response) => {
  const { identityToken, profile } = req.body;

  try {
    let email: string;
    let firstname: string;
    let lastname: string;
    let appleId: string;

    if (identityToken) {
      // Decode Apple ID Token
      const decoded: any = jwt.decode(identityToken);
      if (!decoded) {
        return res.status(400).json({ success: false, message: "Invalid Apple identity token" });
      }
      email = decoded.email;
      appleId = decoded.sub;
      firstname = "Apple";
      lastname = "User";

      // If user profile is sent (Apple only sends name on the very first authentication)
      if (profile && profile.username) {
        firstname = profile.username.firstname || firstname;
        lastname = profile.username.lastname || lastname;
      }
    } else if (profile) {
      // Simulated profile (for development/testing/simulator)
      if (process.env.NODE_ENV === "production") {
        return res.status(400).json({ success: false, message: "Simulated profiles are not allowed in production mode. A valid token is required." });
      }
      email = profile.email;
      firstname = profile.firstname || "Apple";
      lastname = profile.lastname || "User";
      appleId = profile.appleId;
    } else {
      return res.status(400).json({ success: false, message: "Missing Apple authentication data" });
    }

    if (!email || !appleId) {
      return res.status(400).json({ success: false, message: "Required user info not found in Apple profile" });
    }

    // Find or create user
    let user = await usermodel.findOne({ $or: [{ appleId }, { email: email.toLowerCase() }] });

    if (!user) {
      // Create new user
      user = new usermodel({
        username: { firstname, lastname },
        email: email.toLowerCase(),
        gender: "not_specified",
        usertype: "individual",
        appleId,
        avatarUrl: "",
        phone: 1234567890 // Temporary dummy phone number
      });
      await user.save();
    } else if (!user.appleId) {
      // Link Apple account to existing email account
      user.appleId = appleId;
      await user.save();
    }

    const token = user.generateToken();
    return res.status(200).json({ success: true, user, token });
  } catch (error: any) {
    console.error("Apple Auth Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const registerPushTokenController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ success: false, message: "Push token is required" });
    }

    if (!user.pushTokens) {
      user.pushTokens = [];
    }

    if (!user.pushTokens.includes(pushToken)) {
      user.pushTokens.push(pushToken);
      await user.save();
    }

    return res.status(200).json({ success: true, message: "Push token registered successfully" });
  } catch (error: any) {
    console.error("Register Push Token Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const removePushTokenController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ success: false, message: "Push token is required" });
    }

    if (user.pushTokens) {
      user.pushTokens = user.pushTokens.filter((token: string) => token !== pushToken);
      await user.save();
    }

    return res.status(200).json({ success: true, message: "Push token removed successfully" });
  } catch (error: any) {
    console.error("Remove Push Token Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const updateThemeColorController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { themeColor } = req.body;

    if (!themeColor) {
      return res.status(400).json({ success: false, message: "themeColor is required" });
    }

    const updatedUser = await usermodel.findByIdAndUpdate(
      userId,
      { $set: { themeColor } },
      { new: true }
    );

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Update Theme Color Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};
