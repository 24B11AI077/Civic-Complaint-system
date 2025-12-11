import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertComplaintSchema, insertReviewSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all complaints
  app.get("/api/complaints", async (req, res) => {
    try {
      const complaints = await storage.getAllComplaints();
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  // Get single complaint
  app.get("/api/complaints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const complaint = await storage.getComplaint(id);
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch complaint" });
    }
  });

  // Create new complaint
  app.post("/api/complaints", async (req, res) => {
    try {
      const result = insertComplaintSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const complaint = await storage.createComplaint(result.data);
      res.status(201).json(complaint);
    } catch (error) {
      res.status(500).json({ error: "Failed to create complaint" });
    }
  });

  // Update complaint status
  app.patch("/api/complaints/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, officerId } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const complaint = await storage.updateComplaintStatus(id, status, officerId);
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ error: "Failed to update complaint" });
    }
  });

  // Create review for complaint
  app.post("/api/reviews", async (req, res) => {
    try {
      const result = insertReviewSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const review = await storage.createReview(result.data);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Get reviews for complaint
  app.get("/api/complaints/:id/reviews", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reviews = await storage.getReviewsByComplaint(id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Get officer stats
  app.get("/api/officers/:id/stats", async (req, res) => {
    try {
      const officerId = req.params.id;
      const stats = await storage.getOfficerStats(officerId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch officer stats" });
    }
  });

  return httpServer;
}
