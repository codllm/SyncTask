import { Request, Response } from 'express';
import {
  searchUsersService,
  searchWorkspacesService,
  searchProjectsService,
  searchTasksService
} from "../services/searchUser.service";

export const searchUsersController = async (req: Request, res: Response) => {
  try {
    const query = req.params.query || req.query.q as string;
    const searchResult = await searchUsersService(query);
    res.status(200).json({ success: true, users: searchResult });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const searchWorkspacesController = async (req: Request, res: Response) => {
  try {
    const query = req.params.query || req.query.q as string;
    const user = (req as any).user;
    const searchResult = await searchWorkspacesService(query, user._id);
    res.status(200).json({ success: true, workspaces: searchResult });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const searchProjectsController = async (req: Request, res: Response) => {
  try {
    const query = req.params.query || req.query.q as string;
    const user = (req as any).user;
    const searchResult = await searchProjectsService(query, user._id);
    res.status(200).json({ success: true, projects: searchResult });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const searchTasksController = async (req: Request, res: Response) => {
  try {
    const query = req.params.query || req.query.q as string;
    const user = (req as any).user;
    const searchResult = await searchTasksService(query, user._id);
    res.status(200).json({ success: true, tasks: searchResult });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Global unified search controller
export const globalSearchController = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ success: false, message: "Query parameter 'q' is required" });
    }

    const user = (req as any).user;
    const userId = user._id;

    // Run all searches concurrently for maximum performance
    const [users, workspaces, projects, tasks] = await Promise.all([
      searchUsersService(query),
      searchWorkspacesService(query, userId),
      searchProjectsService(query, userId),
      searchTasksService(query, userId)
    ]);

    res.status(200).json({
      success: true,
      results: {
        users,
        workspaces,
        projects,
        tasks
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};